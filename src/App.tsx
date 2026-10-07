import { useEffect, useMemo, useRef, useState } from 'react'
import { buildCalculatorInput, parseNum } from './calculator/buildInput'
import { casingLabel, categoryLabel, combinedFeel, tubeLabel } from './calculator/labels'
import { resolveRideMoisture } from './calculator/modifiers'
import {
  personalisePressure,
  resetPersonalisation,
  setupEvidenceKey,
  type PersonalisationAdjustment,
} from './calculator/personalisation'
import { calculatePressure } from './calculator/pressureEngine'
import { displayToKpa, formatPressure, unitLabel } from './calculator/units'
import { validateForCalculation } from './calculator/validation'
import { buildWhyLines } from './calculator/whyExplanation'
import {
  applyWeatherPressureAdjustments,
  resolveInflationTemperature,
  type WeatherPressureOutcome,
} from './calculator/weatherAdjustment'
import { AppHeader } from './components/AppHeader'
import { BikesTab } from './components/BikesTab'
import { BottomTabs, type AppTab } from './components/BottomTabs'
import { CalculateTab } from './components/CalculateTab'
import { FeedbackTab } from './components/FeedbackTab'
import { PressureResultDial } from './components/PressureResultDial'
import { RiderTab } from './components/RiderTab'
import { ScienceModal } from './components/ScienceModal'
import { SettingsPanel } from './components/SettingsPanel'
import { reverseGeocode, formatPlaceLabel } from './weather/geocoding'
import { atmosphericPressureKpa } from './weather/temperaturePhysics'
import { createRideHistoryRecord, prependRideHistory } from './storage/rideHistory'
import { fetchProcessedRideWeather, type SessionCoordinates } from './weather/rideWeatherService'
import { createOpenMeteoProvider } from './weather/openMeteoProvider'
import { scheduleLocationSearch } from './weather/locationSearch'
import { buildWeatherPreview, type WeatherPreviewModel } from './weather/weatherPreview'
import type { GeoPlace } from './weather/weatherProvider'
import {
  addBike,
  createId,
  deleteBike,
  getSelectedBike,
  loadAppPersistence,
  saveAppPersistence,
  updateSelectedBike,
} from './storage/localStore'
import type {
  AppPersistence,
  BikeAdvancedStored,
  BikeProfile,
  PressureResult,
  RideFeel,
  WeatherSettingsStored,
} from './types'
import { mutedText, pageShell, successPanel, warnBox } from './ui/softUi'

export default function App() {
  const [state, setState] = useState<AppPersistence>(() => loadAppPersistence())
  const [result, setResult] = useState<PressureResult | null>(null)
  const [adjustment, setAdjustment] = useState<PersonalisationAdjustment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [actualFront, setActualFront] = useState('')
  const [actualRear, setActualRear] = useState('')
  const [frontFeel, setFrontFeel] = useState<RideFeel>('good')
  const [rearFeel, setRearFeel] = useState<RideFeel>('good')
  const [rideNote, setRideNote] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [weatherOutcome, setWeatherOutcome] = useState<WeatherPressureOutcome | null>(null)
  const [deviceCoords, setDeviceCoords] = useState<SessionCoordinates | null>(null)
  const [deviceLocating, setDeviceLocating] = useState(false)
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<SessionCoordinates | null>(null)
  const [suggestions, setSuggestions] = useState<GeoPlace[]>([])
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'results' | 'empty' | 'error'>('idle')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [preview, setPreview] = useState<WeatherPreviewModel | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [activeTab, setActiveTab] = useState<AppTab>('calculate')
  const [scienceOpen, setScienceOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedRideHistoryId, setSelectedRideHistoryId] = useState<string | null>(null)
  const resultRef = useRef<HTMLElement | null>(null)
  const weatherProvider = useMemo(() => createOpenMeteoProvider(), [])

  const selectedBike = useMemo(() => getSelectedBike(state), [state])

  useEffect(() => {
    saveAppPersistence(state)
  }, [state])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', state.darkMode ? '#121214' : '#f3efe6')
  }, [state.darkMode])

  const unit = state.pressureUnit

  function setApp(updater: (prev: AppPersistence) => AppPersistence) {
    setState(updater)
  }

  function updateApp<K extends keyof AppPersistence>(key: K, value: AppPersistence[K]) {
    setApp((prev) => ({ ...prev, [key]: value }))
  }

  function patchSelectedBike(patch: Partial<Omit<BikeProfile, 'id' | 'advanced'>>) {
    setApp((prev) =>
      updateSelectedBike(prev, (bike) => ({
        ...bike,
        ...patch,
      })),
    )
  }

  function patchSelectedAdvanced(patch: Partial<BikeAdvancedStored>) {
    setApp((prev) =>
      updateSelectedBike(prev, (bike) => ({
        ...bike,
        advanced: { ...bike.advanced, ...patch },
      })),
    )
  }

  function patchWeather(patch: Partial<WeatherSettingsStored>) {
    if (typeof patch.locationSearch === 'string') {
      const next = patch.locationSearch.trim()
      setSelectedPlace((current) => (current && next === current.label ? current : null))
    }
    setApp((prev) => ({ ...prev, weather: { ...prev.weather, ...patch, enabled: true } }))
  }

  function selectPlace(place: GeoPlace) {
    const label = formatPlaceLabel(place)
    setSelectedPlace({ latitude: place.latitude, longitude: place.longitude, label })
    setSuggestions([])
    setSearchStatus('idle')
    setSearchError(null)
    setApp((prev) => ({
      ...prev,
      weather: {
        ...prev.weather,
        enabled: true,
        locationSearch: label,
        locationLabel: label,
      },
    }))
  }

  useEffect(() => {
    if (state.weather.locationMode !== 'search') {
      setSuggestions([])
      return
    }
    return scheduleLocationSearch(
      state.weather.locationSearch,
      selectedPlace?.label ?? null,
      (query, limit) => weatherProvider.searchPlaces(query, limit),
      {
        onLoading: () => setSearchStatus('loading'),
        onResults: (places) => {
          setSuggestions(places)
          setSearchError(null)
          setSearchStatus('results')
        },
        onEmpty: () => {
          setSuggestions([])
          setSearchError(null)
          setSearchStatus('empty')
        },
        onError: () => {
          setSuggestions([])
          setSearchStatus('error')
          setSearchError('Location search failed.')
        },
        onClear: () => {
          setSuggestions([])
          setSearchStatus('idle')
          setSearchError(null)
        },
      },
    )
  }, [state.weather.locationMode, state.weather.locationSearch, selectedPlace?.label, weatherProvider])

  useEffect(() => {
    const place = state.weather.locationMode === 'device' ? deviceCoords : selectedPlace
    if (!place) {
      setPreview(null)
      setPreviewLoading(false)
      return
    }
    let cancelled = false
    setPreviewLoading(true)
    fetchProcessedRideWeather(state.weather, deviceCoords, weatherProvider, new Date(), selectedPlace)
      .then((processed) => {
        if (cancelled) return
        setPreview(buildWeatherPreview(state.weather, processed, state.temperatureUnit))
        setPreviewLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setPreview(
          buildWeatherPreview(
            state.weather,
            {
              available: false,
              locationLabel: place.label,
              rideTempC: 0,
              isWetForecast: false,
              providerId: weatherProvider.id,
              attribution: '',
              confidence: 'none',
            },
            state.temperatureUnit,
          ),
        )
        setPreviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [state.weather, state.temperatureUnit, deviceCoords, selectedPlace, weatherProvider])

  function useMyLocation() {
    setDeviceError(null)
    patchWeather({ locationMode: 'device' })
    if (!navigator.geolocation) {
      setDeviceError('Geolocation is not available in this browser.')
      return
    }
    setDeviceLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        let label = `Location detected (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`
        try {
          const place = await reverseGeocode(latitude, longitude)
          if (place) label = formatPlaceLabel(place)
        } catch {
          // keep coordinate fallback
        }
        setDeviceCoords({ latitude, longitude, label })
        setApp((prev) => ({
          ...prev,
          weather: { ...prev.weather, enabled: true, locationLabel: label },
        }))
        setDeviceLocating(false)
      },
      () => {
        setDeviceError('Could not access your location.')
        setDeviceLocating(false)
      },
      { maximumAge: 60_000, timeout: 15_000 },
    )
  }

  function frontDisplayKpa(): number {
    if (!result || !adjustment) return 0
    if (weatherOutcome?.active && weatherOutcome.front) {
      return weatherOutcome.front.targetRidingGaugeKpa
    }
    return state.applyPersonalisation
      ? adjustment.front.personalisedKpa
      : result.front.clampedKpa
  }

  function rearDisplayKpa(): number {
    if (!result || !adjustment) return 0
    if (weatherOutcome?.active && weatherOutcome.rear) {
      return weatherOutcome.rear.targetRidingGaugeKpa
    }
    return state.applyPersonalisation
      ? adjustment.rear.personalisedKpa
      : result.rear.clampedKpa
  }

  function weatherPumpLine(): string | null {
    if (!weatherOutcome?.active || !weatherOutcome.front || !weatherOutcome.rear) return null
    const pumpF = formatPressure(weatherOutcome.front.displayGaugeKpa, unit)
    const pumpR = formatPressure(weatherOutcome.rear.displayGaugeKpa, unit)
    const targetF = formatPressure(weatherOutcome.front.targetRidingGaugeKpa, unit)
    const targetR = formatPressure(weatherOutcome.rear.targetRidingGaugeKpa, unit)
    if (pumpF === targetF && pumpR === targetR) return null
    return `Set your pump to about ${pumpF} / ${pumpR} ${unitLabel(unit)} now. Tyres should reach about ${targetF} / ${targetR} ${unitLabel(unit)} as they warm on the ride.`
  }

  async function onCalculate() {
    const bike = getSelectedBike(state)
    const validation = validateForCalculation(state, bike)
    if (!validation.ok) {
      setResult(null)
      setWeatherOutcome(null)
      setError(validation.message)
      return
    }
    setCalculating(true)
    setError(null)
    setFeedbackMessage(null)
    try {
      let processedWeather = null
      try {
        processedWeather = await fetchProcessedRideWeather(
          state.weather,
          deviceCoords,
          weatherProvider,
          new Date(),
          selectedPlace,
        )
        if (processedWeather.available && processedWeather.locationLabel) {
          setApp((prev) => ({
            ...prev,
            weather: {
              ...prev.weather,
              enabled: true,
              locationLabel: processedWeather!.locationLabel,
            },
          }))
        }
      } catch {
        processedWeather = {
          available: false,
          errorMessage: 'Weather unavailable — using standard pressure calculation.',
          locationLabel: '',
          rideTempC: 0,
          isWetForecast: false,
          moisture: 'dry' as const,
          providerId: 'open-meteo',
          attribution: '',
          confidence: 'none' as const,
        }
      }

      const moisture = resolveRideMoisture(state.weather.wetMode, processedWeather?.moisture)
      const input = {
        ...validation.input,
        ride: { ...validation.input.ride, moisture },
      }
      const baseline = calculatePressure(input)
      const key = evidenceKeyFor(state, bike, baseline.systemWeightKg)
      const personal = personalisePressure(baseline, state.feedback, key)
      const frontBase = state.applyPersonalisation
        ? personal.front.personalisedKpa
        : baseline.front.clampedKpa
      const rearBase = state.applyPersonalisation
        ? personal.rear.personalisedKpa
        : baseline.rear.clampedKpa

      const manualInflation =
        state.weather.inflationMode === 'manual' && state.weather.inflationManualC.trim()
          ? parseNum(state.weather.inflationManualC, Number.NaN)
          : null
      const inflationResolved = resolveInflationTemperature(
        manualInflation !== null && Number.isFinite(manualInflation) ? manualInflation : null,
        processedWeather?.currentAmbientTempC,
      )
      const atmosphericKpa = atmosphericPressureKpa(processedWeather?.elevationM)

      const weatherAdj = applyWeatherPressureAdjustments({
        frontBaselineKpa: frontBase,
        rearBaselineKpa: rearBase,
        frontMinKpa: baseline.front.safetyMinKpa,
        frontMaxKpa: baseline.front.safetyMaxKpa,
        rearMinKpa: baseline.rear.safetyMinKpa,
        rearMaxKpa: baseline.rear.safetyMaxKpa,
        weather: processedWeather,
        wetMode: state.weather.wetMode,
        moisture,
        atmosphericKpa,
        inflationTempC:
          state.weather.inflationMode === 'manual' ? inflationResolved.tempC : null,
        inflationAssumed: state.weather.inflationMode === 'manual' ? inflationResolved.assumed : false,
      })

      setResult(baseline)
      setAdjustment(personal)
      setWeatherOutcome(weatherAdj)
      const shownFront = weatherAdj.active ? weatherAdj.front!.targetRidingGaugeKpa : frontBase
      const shownRear = weatherAdj.active ? weatherAdj.rear!.targetRidingGaugeKpa : rearBase
      setActualFront(formatPressure(shownFront, state.pressureUnit))
      setActualRear(formatPressure(shownRear, state.pressureUnit))
      setFrontFeel('good')
      setRearFeel('good')
      setRideNote('')

      const historyRecord = createRideHistoryRecord({
        state,
        bike,
        setupKey: key,
        systemWeightKg: baseline.systemWeightKg,
        result: baseline,
        shownFrontKpa: shownFront,
        shownRearKpa: shownRear,
        locationLabel: processedWeather?.locationLabel || state.weather.locationLabel,
        preview: buildWeatherPreview(state.weather, processedWeather, state.temperatureUnit),
      })
      setApp((prev) => prependRideHistory(prev, historyRecord))
      setSelectedRideHistoryId(historyRecord.id)
    } finally {
      setCalculating(false)
    }
  }

  useEffect(() => {
    if (!result || !resultRef.current) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultRef.current.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [result])

  function evidenceKeyFor(app: AppPersistence, bike: BikeProfile, systemKg: number): string {
    const input = buildCalculatorInput(app, bike)
    return setupEvidenceKey({
      bikeId: bike.id,
      rideType: app.rideType,
      gravelPercent: input?.ride.gravelPercent ?? 0,
      frontWidthMm: parseNum(bike.frontWidthMm),
      rearWidthMm: parseNum(bike.rearWidthMm),
      frontMeasuredWidthMm: bike.advanced.frontMeasuredWidthMm.trim()
        ? parseNum(bike.advanced.frontMeasuredWidthMm)
        : undefined,
      rearMeasuredWidthMm: bike.advanced.rearMeasuredWidthMm.trim()
        ? parseNum(bike.advanced.rearMeasuredWidthMm)
        : undefined,
      tubeType: bike.tubeType,
      systemWeightKg: systemKg,
    })
  }

  function saveRideFeedback() {
    const ride =
      selectedRideHistoryId != null
        ? state.rideHistory.find((r) => r.id === selectedRideHistoryId)
        : null
    if (!ride && !result) {
      setFeedbackMessage('Select a recent ride or calculate a pressure first.')
      return
    }
    const feedbackUnit = ride?.pressureUnit ?? state.pressureUnit
    const front = parseNum(actualFront, Number.NaN)
    const rear = parseNum(actualRear, Number.NaN)
    if (!(front > 0) || !(rear > 0)) {
      setFeedbackMessage('Enter the front and rear pressures you actually rode.')
      return
    }
    const baselineFrontKpa = ride?.baselineFrontKpa ?? result!.front.clampedKpa
    const baselineRearKpa = ride?.baselineRearKpa ?? result!.rear.clampedKpa
    const recordKey = ride?.setupKey ?? evidenceKeyFor(state, selectedBike, result!.systemWeightKg)
    const record = {
      id: createId(),
      createdAt: new Date().toISOString(),
      bikeId: ride?.bikeId ?? selectedBike.id,
      bikeName: ride?.bikeName ?? selectedBike.name,
      setupKey: recordKey,
      rideType: ride?.rideType ?? state.rideType,
      gravelPercent: ride?.gravelPercent ?? parseNum(state.gravelPercent, 0),
      systemWeightKg: ride?.systemWeightKg ?? result!.systemWeightKg,
      tubeType: ride?.tubeType ?? selectedBike.tubeType,
      frontWidthMm: ride?.frontWidthMm ?? parseNum(selectedBike.frontWidthMm),
      rearWidthMm: ride?.rearWidthMm ?? parseNum(selectedBike.rearWidthMm),
      baselineFrontKpa,
      baselineRearKpa,
      actualFrontKpa: displayToKpa(front, feedbackUnit),
      actualRearKpa: displayToKpa(rear, feedbackUnit),
      result: combinedFeel(frontFeel, rearFeel),
      frontFeel,
      rearFeel,
      notes: rideNote.trim(),
      weatherLocationLabel:
        ride?.locationLabel ?? (state.weather.locationLabel || undefined),
      rideHistoryId: ride?.id,
    }
    setApp((prev) => ({
      ...prev,
      feedback: [record, ...prev.feedback],
      rideHistory: prev.rideHistory.map((r) =>
        r.id === ride?.id ? { ...r, feedbackId: record.id } : r,
      ),
    }))
    setFeedbackMessage('Ride note saved on this device.')
  }

  function openFeedbackForLatest() {
    if (state.rideHistory[0]) {
      setSelectedRideHistoryId(state.rideHistory[0].id)
      const ride = state.rideHistory[0]
      setActualFront(formatPressure(ride.recommendedFrontKpa, ride.pressureUnit))
      setActualRear(formatPressure(ride.recommendedRearKpa, ride.pressureUnit))
    }
    setActiveTab('feedback')
  }

  const canCalculate = buildCalculatorInput(state, selectedBike) !== null
  const riderKg = parseNum(state.riderWeightKg, 75)

  return (
    <div className={`${pageShell} overflow-x-hidden pb-24`}>
      <AppHeader
        darkMode={state.darkMode}
        onToggleDark={() => updateApp('darkMode', !state.darkMode)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <ScienceModal open={scienceOpen} onClose={() => setScienceOpen(false)} />
      <SettingsPanel
        open={settingsOpen}
        state={state}
        onClose={() => setSettingsOpen(false)}
        onPressureUnit={(u) => updateApp('pressureUnit', u)}
        onWeightUnit={(u) => updateApp('weightUnit', u)}
        onTemperatureUnit={(u) => updateApp('temperatureUnit', u)}
        onApplyPersonalisation={(v) => updateApp('applyPersonalisation', v)}
        onOpenScience={() => {
          setSettingsOpen(false)
          setScienceOpen(true)
        }}
      />

      {activeTab === 'calculate' && (
        <>
          <CalculateTab
            state={state}
            selectedBike={selectedBike}
            riderKg={riderKg}
            weightUnit={state.weightUnit}
            error={error}
            calculating={calculating}
            canCalculate={canCalculate}
            weather={state.weather}
            deviceCoords={deviceCoords}
            deviceLocating={deviceLocating}
            deviceError={deviceError}
            suggestions={suggestions}
            searchStatus={searchStatus}
            searchError={searchError}
            preview={preview}
            previewLoading={previewLoading}
            onNavigate={setActiveTab}
            onPackWeight={(v) => updateApp('packWeightKg', v)}
            onExpectedSpeed={(v) => updateApp('expectedSpeedKmh', v)}
            onRideType={(v) => updateApp('rideType', v)}
            onGravelPercent={(v) => updateApp('gravelPercent', v)}
            onPatchWeather={patchWeather}
            onUseMyLocation={useMyLocation}
            onSelectPlace={selectPlace}
            onCalculate={onCalculate}
          />

          {result && adjustment && (
            <section ref={resultRef} className={`mx-4 mb-4 scroll-mt-6 ${successPanel}`}>
              <p className="text-sm font-medium">
                {weatherOutcome?.active
                  ? 'Recommended riding pressure'
                  : 'Recommended starting pressure'}
              </p>
              {weatherOutcome && !weatherOutcome.active && weatherOutcome.unavailableMessage && (
                <p className={`mt-1 text-sm ${warnBox}`}>{weatherOutcome.unavailableMessage}</p>
              )}
              {weatherOutcome?.active && weatherOutcome.compactLine && (
                <p className={`mt-1 text-sm ${mutedText}`}>{weatherOutcome.compactLine}</p>
              )}
              {state.applyPersonalisation && adjustment.active && !weatherOutcome?.active && (
                <p className={`mt-1 text-sm ${mutedText}`}>{adjustment.summary}</p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <PressureResultDial
                  label="Front"
                  value={formatPressure(frontDisplayKpa(), unit)}
                  unit={unitLabel(unit)}
                />
                <PressureResultDial
                  label="Rear"
                  value={formatPressure(rearDisplayKpa(), unit)}
                  unit={unitLabel(unit)}
                />
              </div>
              {(() => {
                const pumpLine = weatherPumpLine()
                return pumpLine ? (
                  <p className={`mt-2 text-center text-sm leading-snug ${mutedText}`}>{pumpLine}</p>
                ) : null
              })()}

              {(result.warnings.length > 0 || (weatherOutcome?.warnings.length ?? 0) > 0) && (
                <ul className={`mt-3 list-disc pl-5 text-sm ${warnBox}`}>
                  {[...result.warnings, ...(weatherOutcome?.warnings ?? [])].map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                className={`mt-4 text-sm font-medium underline ${mutedText}`}
                onClick={() => setDetailsOpen((v) => !v)}
              >
                {detailsOpen ? 'Hide' : 'Why?'}
              </button>

              {detailsOpen && result && (
                <div
                  className={`mt-3 space-y-2 border-t border-[#e8e2d8] pt-3 text-sm dark:border-[#333]`}
                >
                  {buildWhyLines({
                    bikeName: selectedBike.name,
                    result,
                    formatPressure: (kpa) => formatPressure(kpa, unit),
                    unit,
                    tubeLabel: tubeLabel(selectedBike.tubeType),
                    categoryLabel: categoryLabel(selectedBike.tyreCategory),
                    casingLabel: casingLabel(selectedBike.casing),
                    tyreModel: selectedBike.tyreModel.trim() || undefined,
                    personalisation: adjustment,
                    personalisationEnabled: state.applyPersonalisation,
                    shownFront: formatPressure(frontDisplayKpa(), unit),
                    shownRear: formatPressure(rearDisplayKpa(), unit),
                    weather: weatherOutcome
                      ? {
                          active: weatherOutcome.active,
                          rideTempC: weatherOutcome.rideTempC,
                          inflationTempC: weatherOutcome.inflationTempC,
                          inflationAssumed: weatherOutcome.inflationAssumed,
                          pumpFront: weatherOutcome.front
                            ? formatPressure(weatherOutcome.front.displayGaugeKpa, unit)
                            : undefined,
                          pumpRear: weatherOutcome.rear
                            ? formatPressure(weatherOutcome.rear.displayGaugeKpa, unit)
                            : undefined,
                        }
                      : undefined,
                  }).map((line) => (
                    <p key={line.label} className="whitespace-pre-line">
                      <strong>{line.label}:</strong> {line.text}
                    </p>
                  ))}
                  {weatherOutcome?.active &&
                    weatherOutcome.notes.map((note) => (
                      <p key={note} className={mutedText}>
                        {note}
                      </p>
                    ))}
                  <p className={mutedText}>
                    Saved ride feedback stays on this device and can gently adjust future
                    suggestions for comparable setups. It does not change the physical model.
                  </p>
                  {state.applyPersonalisation && (
                    <button
                      type="button"
                      className={`text-sm font-medium underline ${mutedText}`}
                      onClick={() => {
                        const key = evidenceKeyFor(state, selectedBike, result.systemWeightKg)
                        setApp((prev) => ({
                          ...prev,
                          feedback: resetPersonalisation(prev.feedback, key),
                        }))
                        setAdjustment(
                          personalisePressure(
                            result,
                            resetPersonalisation(state.feedback, key),
                            key,
                          ),
                        )
                        setFeedbackMessage('Personalisation reset for this setup.')
                      }}
                    >
                      Reset personalisation for this setup
                    </button>
                  )}
                </div>
              )}

              <p className="mt-4 text-center">
                <button
                  type="button"
                  className={`text-sm font-medium underline ${mutedText}`}
                  onClick={openFeedbackForLatest}
                >
                  Log ride feedback
                </button>
              </p>
            </section>
          )}

          {!result && canCalculate && (
            <p className={`mx-4 text-center text-sm ${mutedText}`}>
              Press Calculate to see pressures.
            </p>
          )}
        </>
      )}

      {activeTab === 'bikes' && (
        <BikesTab
          state={state}
          selectedBike={selectedBike}
          onSelectBike={(id) => updateApp('selectedBikeId', id)}
          onAddBike={() => setApp((prev) => addBike(prev))}
          onDeleteBike={() => {
            if (
              state.bikes.length > 1 &&
              window.confirm(`Delete “${selectedBike.name}”?`)
            ) {
              setApp((prev) => deleteBike(prev, selectedBike.id))
            }
          }}
          onPatchBike={patchSelectedBike}
          onPatchAdvanced={patchSelectedAdvanced}
          onAdvancedOpenChange={(open) => updateApp('advancedOpen', open)}
        />
      )}

      {activeTab === 'rider' && (
        <RiderTab
          riderWeightKg={state.riderWeightKg}
          riderKg={riderKg}
          weightUnit={state.weightUnit}
          onChange={(v) => updateApp('riderWeightKg', v)}
        />
      )}

      {activeTab === 'feedback' && (
        <FeedbackTab
          state={state}
          unit={unit}
          selectedRideId={selectedRideHistoryId}
          actualFront={actualFront}
          actualRear={actualRear}
          frontFeel={frontFeel}
          rearFeel={rearFeel}
          rideNote={rideNote}
          feedbackMessage={feedbackMessage}
          onSelectRide={(id) => {
            setSelectedRideHistoryId(id)
            setFeedbackMessage(null)
            if (id) {
              const ride = state.rideHistory.find((r) => r.id === id)
              if (ride) {
                setActualFront(formatPressure(ride.recommendedFrontKpa, ride.pressureUnit))
                setActualRear(formatPressure(ride.recommendedRearKpa, ride.pressureUnit))
              }
            }
          }}
          onActualFront={setActualFront}
          onActualRear={setActualRear}
          onFrontFeel={setFrontFeel}
          onRearFeel={setRearFeel}
          onRideNote={setRideNote}
          onSave={saveRideFeedback}
        />
      )}

      <BottomTabs active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
