import { useEffect, useMemo, useState } from 'react'
import { buildCalculatorInput, parseNum } from './calculator/buildInput'
import {
  personalisePressure,
  resetPersonalisation,
  setupEvidenceKey,
  type PersonalisationAdjustment,
} from './calculator/personalisation'
import { calculatePressure } from './calculator/pressureEngine'
import { displayToKpa, formatPressure, unitLabel } from './calculator/units'
import { validateForCalculation } from './calculator/validation'
import {
  applyWeatherPressureAdjustments,
  resolveInflationTemperature,
  type WeatherPressureOutcome,
} from './calculator/weatherAdjustment'
import { AppHeader } from './components/AppHeader'
import { BottomTabs, type AppTab } from './components/BottomTabs'
import { PressureResultDial } from './components/PressureResultDial'
import { RiderWeightDial } from './components/RiderWeightDial'
import { ScienceModal } from './components/ScienceModal'
import { WeatherSection } from './components/WeatherSection'
import { psiToKpa } from './calculator/units'
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
  PressureUnit,
  RideFeel,
  RideType,
  TubeType,
  WeatherSettingsStored,
} from './types'
import {
  btnPrimary,
  btnRaised,
  cardInner,
  cardOuter,
  fieldClassName,
  mutedText,
  sectionTitle,
  successPanel,
  warnBox,
  pillActive,
  pillIdle,
  pageShell,
} from './ui/softUi'

const RIDE_TYPE_OPTIONS: { value: RideType; label: string }[] = [
  { value: 'road', label: 'Road' },
  { value: 'gravel', label: 'Gravel' },
  { value: 'commute', label: 'Commute' },
  { value: 'mixed', label: 'Mixed' },
]

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
  const [activeTab, setActiveTab] = useState<AppTab>('setup')
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
    setApp((prev) => ({ ...prev, weather: { ...prev.weather, ...patch } }))
  }

  function selectPlace(place: GeoPlace) {
    const label = formatPlaceLabel(place)
    setSelectedPlace({ latitude: place.latitude, longitude: place.longitude, label })
    setSuggestions([])
    setSearchStatus('idle')
    setSearchError(null)
    setApp((prev) => ({
      ...prev,
      weather: { ...prev.weather, locationSearch: label, locationLabel: label },
    }))
  }

  useEffect(() => {
    if (!state.weather.enabled || state.weather.locationMode !== 'search') {
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
  }, [
    state.weather.enabled,
    state.weather.locationMode,
    state.weather.locationSearch,
    selectedPlace?.label,
    weatherProvider,
  ])

  useEffect(() => {
    if (!state.weather.enabled) {
      setPreview(null)
      setPreviewLoading(false)
      return
    }
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
  }, [
    state.weather,
    deviceCoords,
    selectedPlace,
    weatherProvider,
  ])

  function useMyLocation() {
    setDeviceError(null)
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
    if (state.weather.enabled) {
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
            weather: { ...prev.weather, locationLabel: processedWeather!.locationLabel },
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
      wetMode: state.weather.enabled ? state.weather.wetMode : 'auto',
      inflationTempC:
        state.weather.enabled && state.weather.inflationMode === 'manual'
          ? inflationResolved.tempC
          : null,
      inflationAssumed: state.weather.inflationMode === 'manual' ? inflationResolved.assumed : false,
    })

    setResult(baseline)
    setAdjustment(personal)
    setWeatherOutcome(state.weather.enabled ? weatherAdj : null)
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

  function evidenceKeyFor(
    app: AppPersistence,
    bike: BikeProfile,
    systemKg: number,
  ): string {
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
    if (!result) return
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
    <div className={`${pageShell} overflow-x-hidden`}>
      <AppHeader
        darkMode={state.darkMode}
        onToggleDark={() => updateApp('darkMode', !state.darkMode)}
        onOpenScience={() => setScienceOpen(true)}
      />
      <ScienceModal open={scienceOpen} onClose={() => setScienceOpen(false)} />

      {activeTab === 'history' ? (
        <section className={`space-y-3 p-4 ${cardOuter}`}>
          <h2 className={sectionTitle}>Ride history</h2>
          <ul className="space-y-3 text-sm">
            {state.feedback.length === 0 && (
              <li className={mutedText}>No ride notes yet.</li>
            )}
            {state.feedback.slice(0, 20).map((entry) => (
              <li key={entry.id} className={`border-t border-[#e8e2d8] pt-2 dark:border-[#333]`}>
                <p>
                  {new Date(entry.createdAt).toLocaleString()} · {entry.bikeName} · {entry.rideType}
                </p>
                <p className={mutedText}>
                  Recommended {formatPressure(entry.baselineFrontKpa, unit)}/
                  {formatPressure(entry.baselineRearKpa, unit)} {unitLabel(unit)} · rode{' '}
                  {formatPressure(entry.actualFrontKpa, unit)}/
                  {formatPressure(entry.actualRearKpa, unit)} ·{' '}
                  {entry.result === 'too_hard'
                    ? 'Too hard'
                    : entry.result === 'too_soft'
                      ? 'Too soft'
                      : 'Good'}
                </p>
                {entry.weatherLocationLabel && (
                  <p className={mutedText}>{entry.weatherLocationLabel}</p>
                )}
                {entry.notes && <p className={mutedText}>{entry.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      ) : (
      <form
        className={`space-y-4 p-4 ${cardOuter}`}
        onSubmit={(e) => {
          e.preventDefault()
          onCalculate()
        }}
      >
        <section className={`space-y-3 p-3 ${cardInner}`}>
          <h2 className={sectionTitle}>Rider</h2>
          <RiderWeightDial
            kg={riderKg}
            min={40}
            max={120}
            onChange={(kg) => updateApp('riderWeightKg', String(kg))}
          />
          <label className="block text-sm">
            Exact weight (kg)
            <input
              className={fieldClassName}
              inputMode="decimal"
              value={state.riderWeightKg}
              onChange={(e) => updateApp('riderWeightKg', e.target.value)}
            />
          </label>
        </section>

        <section className={`space-y-3 p-3 ${cardInner}`}>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[10rem] flex-1 text-sm">
              Bike
              <select
                className={fieldClassName}
                value={state.selectedBikeId}
                onChange={(e) => updateApp('selectedBikeId', e.target.value)}
              >
                {state.bikes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={btnRaised}
              onClick={() => setApp((prev) => addBike(prev))}
            >
              Add bike
            </button>
            <button
              type="button"
              className={`${btnRaised} text-[#a63d2a] disabled:opacity-40`}
              disabled={state.bikes.length <= 1}
              onClick={() => {
                if (
                  state.bikes.length > 1 &&
                  window.confirm(`Delete “${selectedBike.name}”?`)
                ) {
                  setApp((prev) => deleteBike(prev, selectedBike.id))
                }
              }}
            >
              Delete
            </button>
          </div>

          <label className="block text-sm">
            Bike name
            <input
              className={fieldClassName}
              value={selectedBike.name}
              onChange={(e) => patchSelectedBike({ name: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            Bike weight (kg)
            <input
              className={fieldClassName}
              inputMode="decimal"
              value={selectedBike.weightKg}
              onChange={(e) => patchSelectedBike({ weightKg: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Front tyre width (mm, nominal)
              <input
                className={fieldClassName}
                inputMode="decimal"
                value={selectedBike.frontWidthMm}
                onChange={(e) => patchSelectedBike({ frontWidthMm: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Rear tyre width (mm, nominal)
              <input
                className={fieldClassName}
                inputMode="decimal"
                value={selectedBike.rearWidthMm}
                onChange={(e) => patchSelectedBike({ rearWidthMm: e.target.value })}
              />
            </label>
          </div>

          <label className="block text-sm">
            Tube type
            <select
              className={fieldClassName}
              value={selectedBike.tubeType}
              onChange={(e) => patchSelectedBike({ tubeType: e.target.value as TubeType })}
            >
              <option value="butyl">Butyl</option>
              <option value="tpu">TPU</option>
              <option value="tubeless">Tubeless</option>
            </select>
          </label>

          <details
            open={state.advancedOpen}
            onToggle={(e) => updateApp('advancedOpen', (e.target as HTMLDetailsElement).open)}
            className={`${cardInner} p-3`}
          >
            <summary className="cursor-pointer text-sm font-medium">Advanced setup (optional)</summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Front measured width (mm)
                  <input
                    className={fieldClassName}
                    value={selectedBike.advanced.frontMeasuredWidthMm}
                    onChange={(e) =>
                      patchSelectedAdvanced({ frontMeasuredWidthMm: e.target.value })
                    }
                  />
                </label>
                <label className="text-sm">
                  Rear measured width (mm)
                  <input
                    className={fieldClassName}
                    value={selectedBike.advanced.rearMeasuredWidthMm}
                    onChange={(e) =>
                      patchSelectedAdvanced({ rearMeasuredWidthMm: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Rim internal width (mm)
                  <input
                    className={fieldClassName}
                    value={selectedBike.advanced.rimInternalWidthMm}
                    onChange={(e) =>
                      patchSelectedAdvanced({ rimInternalWidthMm: e.target.value })
                    }
                  />
                </label>
                <label className="text-sm">
                  Rim type
                  <select
                    className={fieldClassName}
                    value={selectedBike.advanced.rimType}
                    onChange={(e) =>
                      patchSelectedAdvanced({
                        rimType: e.target.value as BikeAdvancedStored['rimType'],
                      })
                    }
                  >
                    <option value="">Not specified</option>
                    <option value="hooked">Hooked</option>
                    <option value="hookless">Hookless</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                Wheel diameter (inches)
                <input
                  className={fieldClassName}
                  value={selectedBike.advanced.wheelDiameterInches}
                  onChange={(e) =>
                    patchSelectedAdvanced({ wheelDiameterInches: e.target.value })
                  }
                />
              </label>
              <label className="block text-sm">
                Front wheel load (%)
                <input
                  className={fieldClassName}
                  placeholder="Default 40"
                  value={selectedBike.advanced.frontLoadPercent}
                  onChange={(e) =>
                    patchSelectedAdvanced({ frontLoadPercent: e.target.value })
                  }
                />
              </label>
              <fieldset className="text-sm">
                <legend className="font-medium">Manufacturer limits (PSI)</legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label>
                    Front min
                    <input
                      className={fieldClassName}
                      value={selectedBike.advanced.frontMinPsi}
                      onChange={(e) => patchSelectedAdvanced({ frontMinPsi: e.target.value })}
                    />
                  </label>
                  <label>
                    Front max
                    <input
                      className={fieldClassName}
                      value={selectedBike.advanced.frontMaxPsi}
                      onChange={(e) => patchSelectedAdvanced({ frontMaxPsi: e.target.value })}
                    />
                  </label>
                  <label>
                    Rear min
                    <input
                      className={fieldClassName}
                      value={selectedBike.advanced.rearMinPsi}
                      onChange={(e) => patchSelectedAdvanced({ rearMinPsi: e.target.value })}
                    />
                  </label>
                  <label>
                    Rear max
                    <input
                      className={fieldClassName}
                      value={selectedBike.advanced.rearMaxPsi}
                      onChange={(e) => patchSelectedAdvanced({ rearMaxPsi: e.target.value })}
                    />
                  </label>
                </div>
              </fieldset>
            </div>
          </details>
        </section>

        <section className={`space-y-3 p-3 ${cardInner}`}>
          <h2 className={sectionTitle}>This ride</h2>
          <div>
            <p className="text-sm font-medium">Ride type</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RIDE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={state.rideType === opt.value ? pillActive : pillIdle}
                  onClick={() => updateApp('rideType', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {state.rideType === 'mixed' && (
            <label className="block text-sm">
              Gravel portion: {Math.min(100, Math.max(0, parseNum(state.gravelPercent, 0)))}%
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                className="soft-range mt-2 w-full"
                value={Math.min(100, Math.max(0, parseNum(state.gravelPercent, 0)))}
                onChange={(e) => updateApp('gravelPercent', e.target.value)}
              />
              <input
                className={`${fieldClassName} mt-2`}
                inputMode="numeric"
                value={state.gravelPercent}
                onChange={(e) => updateApp('gravelPercent', e.target.value)}
              />
              <span className={`mt-1 block text-xs ${mutedText}`}>
                Road portion: {Math.max(0, 100 - parseNum(state.gravelPercent, 0))}%
              </span>
            </label>
          )}

          <label className="block text-sm">
            Pack weight (kg)
            {state.rideType === 'commute' ? ' — required' : ' — optional'}
            <input
              className={fieldClassName}
              inputMode="decimal"
              value={state.packWeightKg}
              onChange={(e) => updateApp('packWeightKg', e.target.value)}
            />
          </label>
        </section>

        <WeatherSection
          weather={state.weather}
          deviceCoords={deviceCoords}
          deviceError={deviceError}
          suggestions={suggestions}
          searchStatus={searchStatus}
          searchError={searchError}
          preview={preview}
          previewLoading={previewLoading}
          onPatch={patchWeather}
          onUseMyLocation={useMyLocation}
          onSelectPlace={selectPlace}
        />

        <section className={`p-3 ${cardInner}`}>
          <h2 className={sectionTitle}>Settings</h2>
          <label className="mt-2 block text-sm">
            Pressure unit
            <select
              className={fieldClassName}
              value={state.pressureUnit}
              onChange={(e) => updateApp('pressureUnit', e.target.value as PressureUnit)}
            >
              <option value="psi">PSI (whole)</option>
              <option value="bar">bar (0.1)</option>
              <option value="kPa">kPa (whole)</option>
            </select>
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.applyPersonalisation}
              onChange={(e) => updateApp('applyPersonalisation', e.target.checked)}
            />
            Apply notes from previous rides
          </label>
        </section>

        {error && <p className="text-sm text-[#a63d2a]">{error}</p>}

        <button type="submit" disabled={calculating} className={btnPrimary}>
          {calculating ? 'Calculating…' : 'Calculate pressure'}
        </button>
      </form>
      )}

      {activeTab === 'setup' && result && adjustment && (
        <section className={successPanel}>
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
              {formatPressure(weatherOutcome.rear!.targetRidingGaugeKpa, unit)} {unitLabel(unit)}
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
            <div className={`mt-3 space-y-2 border-t border-[#e8e2d8] pt-3 text-sm dark:border-[#333]`}>
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
                <strong>Tyre widths used:</strong> front {result.front.effectiveWidthMm.toFixed(1)}{' '}
                mm, rear {result.rear.effectiveWidthMm.toFixed(1)} mm
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
                    <strong>Inflation temperature:</strong> {weatherOutcome.inflationTempC?.toFixed(0)}
                    °C
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

          <div className="mt-4 space-y-3 border-t border-[#e8e2d8] pt-3 dark:border-[#333]">
            <p className="text-sm font-medium">After the ride</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Actual front ({unitLabel(unit)})
                <input
                  className={fieldClassName}
                  inputMode="decimal"
                  value={actualFront}
                  onChange={(e) => setActualFront(e.target.value)}
                />
              </label>
              <label className="text-sm">
                Actual rear ({unitLabel(unit)})
                <input
                  className={fieldClassName}
                  inputMode="decimal"
                  value={actualRear}
                  onChange={(e) => setActualRear(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-sm">
              How did it feel?
              <select
                className={fieldClassName}
                value={rideFeel}
                onChange={(e) => setRideFeel(e.target.value as RideFeel)}
              >
                <option value="too_hard">Too hard</option>
                <option value="good">Good</option>
                <option value="too_soft">Too soft</option>
              </select>
            </label>
            <label className="block text-sm">
              Notes (optional)
              <input
                className={fieldClassName}
                value={rideNote}
                onChange={(e) => setRideNote(e.target.value)}
              />
            </label>
            {feedbackMessage && <p className={`text-sm ${mutedText}`}>{feedbackMessage}</p>}
            <button type="button" className={btnRaised} onClick={saveRideFeedback}>
              Save ride note
            </button>
          </div>
        </section>
      )}

      {activeTab === 'setup' && !result && canCalculate && (
        <p className={`mt-4 text-center text-sm ${mutedText}`}>Press Calculate to see pressures.</p>
      )}

      <BottomTabs
        active={activeTab}
        historyCount={state.feedback.length}
        onChange={setActiveTab}
      />
    </div>
  )
}
