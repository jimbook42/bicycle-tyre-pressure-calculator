import { useEffect, useMemo, useState } from 'react'
import { buildCalculatorInput, parseNum } from './calculator/buildInput'
import {
  personalisePressure,
  resetPersonalisation,
  setupEvidenceKey,
  type PersonalisationAdjustment,
} from './calculator/personalisation'
import { calculatePressure } from './calculator/pressureEngine'
import { displayToKpa, formatPressure, psiToKpa, unitLabel } from './calculator/units'
import { validateForCalculation } from './calculator/validation'
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
import { SettingsTab } from './components/SettingsTab'
import { fetchProcessedRideWeather, type SessionCoordinates } from './weather/rideWeatherService'
import { createOpenMeteoProvider } from './weather/openMeteoProvider'
import { scheduleLocationSearch } from './weather/locationSearch'
import { buildWeatherPreview, type WeatherPreviewModel } from './weather/weatherPreview'
import { formatPlaceLabel } from './weather/geocoding'
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
  const [rideFeel, setRideFeel] = useState<RideFeel>('good')
  const [rideNote, setRideNote] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [weatherOutcome, setWeatherOutcome] = useState<WeatherPressureOutcome | null>(null)
  const [deviceCoords, setDeviceCoords] = useState<SessionCoordinates | null>(null)
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
        setPreview(buildWeatherPreview(state.weather, processed))
        setPreviewLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setPreview(
          buildWeatherPreview(state.weather, {
            available: false,
            locationLabel: place.label,
            rideTempC: 0,
            isWetForecast: false,
            providerId: weatherProvider.id,
            attribution: '',
            confidence: 'none',
          }),
        )
        setPreviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [state.weather, deviceCoords, selectedPlace, weatherProvider])

  function useMyLocation() {
    setDeviceError(null)
    patchWeather({ locationMode: 'device' })
    if (!navigator.geolocation) {
      setDeviceError('Geolocation is not available in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: 'Current location',
        })
      },
      () => setDeviceError('Could not access your location.'),
      { maximumAge: 60_000, timeout: 15_000 },
    )
  }

  function frontDisplayKpa(): number {
    if (!result || !adjustment) return 0
    if (weatherOutcome?.active && weatherOutcome.front) return weatherOutcome.front.displayGaugeKpa
    return state.applyPersonalisation
      ? adjustment.front.personalisedKpa
      : result.front.clampedKpa
  }

  function rearDisplayKpa(): number {
    if (!result || !adjustment) return 0
    if (weatherOutcome?.active && weatherOutcome.rear) return weatherOutcome.rear.displayGaugeKpa
    return state.applyPersonalisation
      ? adjustment.rear.personalisedKpa
      : result.rear.clampedKpa
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
      const baseline = calculatePressure(validation.input)
      const key = evidenceKeyFor(state, bike, baseline.systemWeightKg)
      const personal = personalisePressure(baseline, state.feedback, key)
      const frontBase = state.applyPersonalisation
        ? personal.front.personalisedKpa
        : baseline.front.clampedKpa
      const rearBase = state.applyPersonalisation
        ? personal.rear.personalisedKpa
        : baseline.rear.clampedKpa

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
          providerId: 'open-meteo',
          attribution: '',
          confidence: 'none' as const,
        }
      }

      const adv = bike.advanced
      const frontMin = adv.frontMinPsi.trim() ? psiToKpa(parseNum(adv.frontMinPsi)) : undefined
      const frontMax = adv.frontMaxPsi.trim() ? psiToKpa(parseNum(adv.frontMaxPsi)) : undefined
      const rearMin = adv.rearMinPsi.trim() ? psiToKpa(parseNum(adv.rearMinPsi)) : undefined
      const rearMax = adv.rearMaxPsi.trim() ? psiToKpa(parseNum(adv.rearMaxPsi)) : undefined

      const manualInflation =
        state.weather.inflationMode === 'manual' && state.weather.inflationManualC.trim()
          ? parseNum(state.weather.inflationManualC, Number.NaN)
          : null
      const inflationResolved = resolveInflationTemperature(
        manualInflation !== null && Number.isFinite(manualInflation) ? manualInflation : null,
        processedWeather?.currentAmbientTempC,
      )

      const weatherAdj = applyWeatherPressureAdjustments({
        frontBaselineKpa: frontBase,
        rearBaselineKpa: rearBase,
        frontMinKpa: frontMin,
        frontMaxKpa: frontMax,
        rearMinKpa: rearMin,
        rearMaxKpa: rearMax,
        weather: processedWeather,
        wetMode: state.weather.wetMode,
        inflationTempC:
          state.weather.inflationMode === 'manual' ? inflationResolved.tempC : null,
        inflationAssumed: state.weather.inflationMode === 'manual' ? inflationResolved.assumed : false,
      })

      setResult(baseline)
      setAdjustment(personal)
      setWeatherOutcome(weatherAdj)
      const shownFront = weatherAdj.active ? weatherAdj.front!.displayGaugeKpa : frontBase
      const shownRear = weatherAdj.active ? weatherAdj.rear!.displayGaugeKpa : rearBase
      setActualFront(formatPressure(shownFront, state.pressureUnit))
      setActualRear(formatPressure(shownRear, state.pressureUnit))
      setRideFeel('good')
      setRideNote('')
    } finally {
      setCalculating(false)
    }
  }

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
    if (!result) {
      setFeedbackMessage('Calculate a pressure first, or open Calculate and run the calculator.')
      return
    }
    const front = parseNum(actualFront, Number.NaN)
    const rear = parseNum(actualRear, Number.NaN)
    if (!(front > 0) || !(rear > 0)) {
      setFeedbackMessage('Enter the front and rear pressures you actually rode.')
      return
    }
    const recordKey = evidenceKeyFor(state, selectedBike, result.systemWeightKg)
    const record = {
      id: createId(),
      createdAt: new Date().toISOString(),
      bikeId: selectedBike.id,
      bikeName: selectedBike.name,
      setupKey: recordKey,
      rideType: state.rideType,
      gravelPercent: parseNum(state.gravelPercent, 0),
      systemWeightKg: result.systemWeightKg,
      tubeType: selectedBike.tubeType,
      frontWidthMm: parseNum(selectedBike.frontWidthMm),
      rearWidthMm: parseNum(selectedBike.rearWidthMm),
      baselineFrontKpa: result.front.clampedKpa,
      baselineRearKpa: result.rear.clampedKpa,
      actualFrontKpa: displayToKpa(front, state.pressureUnit),
      actualRearKpa: displayToKpa(rear, state.pressureUnit),
      result: rideFeel,
      notes: rideNote.trim(),
      weatherLocationLabel: weatherOutcome?.active
        ? state.weather.locationLabel || undefined
        : undefined,
    }
    setApp((prev) => ({ ...prev, feedback: [record, ...prev.feedback] }))
    setFeedbackMessage('Ride note saved on this device.')
  }

  const canCalculate = buildCalculatorInput(state, selectedBike) !== null
  const riderKg = parseNum(state.riderWeightKg, 75)

  return (
    <div className={`${pageShell} overflow-x-hidden pb-24`}>
      <AppHeader
        darkMode={state.darkMode}
        onToggleDark={() => updateApp('darkMode', !state.darkMode)}
      />
      <ScienceModal open={scienceOpen} onClose={() => setScienceOpen(false)} />

      {activeTab === 'calculate' && (
        <>
          <CalculateTab
            state={state}
            selectedBike={selectedBike}
            riderKg={riderKg}
            error={error}
            calculating={calculating}
            canCalculate={canCalculate}
            weather={state.weather}
            deviceCoords={deviceCoords}
            deviceError={deviceError}
            suggestions={suggestions}
            searchStatus={searchStatus}
            searchError={searchError}
            preview={preview}
            previewLoading={previewLoading}
            onNavigate={setActiveTab}
            onPackWeight={(v) => updateApp('packWeightKg', v)}
            onRideType={(v) => updateApp('rideType', v)}
            onGravelPercent={(v) => updateApp('gravelPercent', v)}
            onSelectBike={(id) => updateApp('selectedBikeId', id)}
            onPatchWeather={patchWeather}
            onUseMyLocation={useMyLocation}
            onSelectPlace={selectPlace}
            onCalculate={onCalculate}
            onLogFeedback={() => setActiveTab('feedback')}
            showFeedbackLink={Boolean(result)}
          />

          {result && adjustment && (
            <section className={`mx-4 mb-4 ${successPanel}`}>
              <p className="text-sm font-medium">
                {weatherOutcome?.active
                  ? 'Inflate to approximately'
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
              {weatherOutcome?.active && (
                <p className={`mt-2 text-center text-sm ${mutedText}`}>
                  Target riding pressure: front{' '}
                  {formatPressure(weatherOutcome.front!.targetRidingGaugeKpa, unit)} / rear{' '}
                  {formatPressure(weatherOutcome.rear!.targetRidingGaugeKpa, unit)}{' '}
                  {unitLabel(unit)}
                </p>
              )}

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
                {detailsOpen ? 'Hide details' : 'Why? / Details'}
              </button>

              {detailsOpen && (
                <div
                  className={`mt-3 space-y-2 border-t border-[#e8e2d8] pt-3 text-sm dark:border-[#333]`}
                >
                  <p>
                    <strong>Bike:</strong> {selectedBike.name}
                  </p>
                  <p>
                    <strong>Baseline:</strong> front {formatPressure(result.front.clampedKpa, unit)}{' '}
                    {unitLabel(unit)}, rear {formatPressure(result.rear.clampedKpa, unit)}{' '}
                    {unitLabel(unit)}
                  </p>
                  <p>
                    <strong>System weight:</strong> {result.systemWeightKg.toFixed(1)} kg
                  </p>
                  <p>
                    <strong>Load split:</strong> front {result.frontLoadPercent}% / rear{' '}
                    {result.rearLoadPercent}%
                  </p>
                  <p>
                    <strong>Tyre widths used:</strong> front{' '}
                    {result.front.effectiveWidthMm.toFixed(1)} mm, rear{' '}
                    {result.rear.effectiveWidthMm.toFixed(1)} mm
                  </p>
                  <p>
                    <strong>Ride type:</strong>{' '}
                    {result.surfaceModel === 'mixed'
                      ? `Mixed (${result.mixedGravelPercent}% gravel blend)`
                      : state.rideType}
                  </p>
                  {(result.front.manufacturerMinKpa !== undefined ||
                    result.front.manufacturerMaxKpa !== undefined) && (
                    <p>
                      <strong>Front limits (kPa):</strong>{' '}
                      {result.front.manufacturerMinKpa?.toFixed(0) ?? '—'} –{' '}
                      {result.front.manufacturerMaxKpa?.toFixed(0) ?? '—'}
                    </p>
                  )}
                  {(result.rear.manufacturerMinKpa !== undefined ||
                    result.rear.manufacturerMaxKpa !== undefined) && (
                    <p>
                      <strong>Rear limits (kPa):</strong>{' '}
                      {result.rear.manufacturerMinKpa?.toFixed(0) ?? '—'} –{' '}
                      {result.rear.manufacturerMaxKpa?.toFixed(0) ?? '—'}
                    </p>
                  )}
                  {result.inputsUsed.length > 0 && (
                    <div>
                      <strong>Advanced values used:</strong>
                      <ul className="list-disc pl-5">
                        {result.inputsUsed.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {weatherOutcome?.active && (
                    <>
                      <p>
                        <strong>Ride temperature:</strong> {weatherOutcome.rideTempC?.toFixed(0)}°C
                        (duration-weighted air temperature)
                      </p>
                      <p>
                        <strong>Inflation temperature:</strong>{' '}
                        {weatherOutcome.inflationTempC?.toFixed(0)}°C
                        {weatherOutcome.inflationAssumed ? ' (assumed)' : ''}
                      </p>
                      {weatherOutcome.notes.map((note) => (
                        <p key={note}>{note}</p>
                      ))}
                      {weatherOutcome.attribution && (
                        <p className={`text-xs ${mutedText}`}>{weatherOutcome.attribution}</p>
                      )}
                    </>
                  )}
                  {result.notes.map((note) => (
                    <p key={note} className={mutedText}>
                      {note}
                    </p>
                  ))}
                  <p className={mutedText}>
                    Ride notes are personal evidence stored on this device. They do not change the
                    baseline model.
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
                  onClick={() => setActiveTab('feedback')}
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
          onChange={(v) => updateApp('riderWeightKg', v)}
        />
      )}

      {activeTab === 'feedback' && (
        <FeedbackTab
          state={state}
          unit={unit}
          actualFront={actualFront}
          actualRear={actualRear}
          rideFeel={rideFeel}
          rideNote={rideNote}
          feedbackMessage={feedbackMessage}
          hasResult={Boolean(result)}
          onActualFront={setActualFront}
          onActualRear={setActualRear}
          onRideFeel={setRideFeel}
          onRideNote={setRideNote}
          onSave={saveRideFeedback}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          state={state}
          onPressureUnit={(u) => updateApp('pressureUnit', u)}
          onApplyPersonalisation={(v) => updateApp('applyPersonalisation', v)}
          onOpenScience={() => setScienceOpen(true)}
        />
      )}

      <BottomTabs
        active={activeTab}
        feedbackCount={state.feedback.length}
        onChange={setActiveTab}
      />
    </div>
  )
}
