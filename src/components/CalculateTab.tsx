import { formatWeightFromKg } from '../calculator/displayUnits'
import { parseNum } from '../calculator/buildInput'
import { tubeLabel } from '../calculator/labels'
import type { AppPersistence, BikeProfile, RideType, WeightDisplayUnit } from '../types'
import { RideTypeIcon } from '../ui/icons'
import { WeatherSection } from './WeatherSection'
import type { SessionCoordinates } from '../weather/rideWeatherService'
import type { WeatherPreviewModel } from '../weather/weatherPreview'
import type { GeoPlace } from '../weather/weatherProvider'
import type { WeatherSettingsStored } from '../types'
import {
  btnPrimary,
  cardInner,
  cardOuter,
  fieldClassName,
  mutedText,
  pillActive,
  pillIdle,
  sectionTitle,
} from '../ui/softUi'
import type { AppTab } from './BottomTabs'

const FAMILY_OPTIONS: { value: 'road' | 'gravel' | 'mixed'; label: string; icon: RideType }[] = [
  { value: 'road', label: 'Road', icon: 'road' },
  { value: 'gravel', label: 'Gravel', icon: 'gravel' },
  { value: 'mixed', label: 'Mixed', icon: 'mixed' },
]

const ROAD_CONDITIONS: { value: RideType; label: string }[] = [
  { value: 'road-smooth', label: 'Smooth' },
  { value: 'road', label: 'Normal' },
  { value: 'road-rough', label: 'Rough' },
]

const GRAVEL_CONDITIONS: { value: RideType; label: string }[] = [
  { value: 'gravel-hardpack', label: 'Hardpack' },
  { value: 'gravel', label: 'Typical' },
  { value: 'gravel-rough', label: 'Rough' },
  { value: 'gravel-very-rough', label: 'Very rough' },
]

const MIXED_GRAVEL_CONDITIONS: { value: RideType; label: string }[] = [
  { value: 'gravel-hardpack', label: 'Smooth / hardpack' },
  { value: 'gravel', label: 'Typical' },
  { value: 'gravel-rough', label: 'Rough' },
  { value: 'gravel-very-rough', label: 'Very rough / chunky' },
]

function surfaceFamily(type: RideType): 'road' | 'gravel' | 'mixed' {
  if (type === 'mixed') return 'mixed'
  if (
    type === 'gravel' ||
    type === 'gravel-hardpack' ||
    type === 'gravel-rough' ||
    type === 'gravel-very-rough'
  ) {
    return 'gravel'
  }
  return 'road'
}

interface CalculateTabProps {
  state: AppPersistence
  selectedBike: BikeProfile
  riderKg: number
  weightUnit: WeightDisplayUnit
  error: string | null
  calculating: boolean
  canCalculate: boolean
  weather: WeatherSettingsStored
  deviceCoords: SessionCoordinates | null
  deviceLocating: boolean
  deviceError: string | null
  suggestions: GeoPlace[]
  searchStatus: 'idle' | 'loading' | 'results' | 'empty' | 'error'
  searchError: string | null
  preview: WeatherPreviewModel | null
  previewLoading: boolean
  onNavigate: (tab: AppTab) => void
  onPackWeight: (v: string) => void
  onRideType: (v: RideType) => void
  onGravelPercent: (v: string) => void
  onMixedRoadType: (v: RideType) => void
  onMixedGravelType: (v: RideType) => void
  onPatchWeather: (patch: Partial<WeatherSettingsStored>) => void
  onUseMyLocation: () => void
  onSelectPlace: (place: GeoPlace) => void
  onCalculate: () => void
}

export function CalculateTab({
  state,
  selectedBike,
  riderKg,
  weightUnit,
  error,
  calculating,
  canCalculate,
  weather,
  deviceCoords,
  deviceLocating,
  deviceError,
  suggestions,
  searchStatus,
  searchError,
  preview,
  previewLoading,
  onNavigate,
  onPackWeight,
  onRideType,
  onGravelPercent,
  onMixedRoadType,
  onMixedGravelType,
  onPatchWeather,
  onUseMyLocation,
  onSelectPlace,
  onCalculate,
}: CalculateTabProps) {
  return (
    <form
      className={`mx-4 space-y-4 pb-4 ${cardOuter}`}
      onSubmit={(e) => {
        e.preventDefault()
        onCalculate()
      }}
    >
      <section className={`space-y-2 p-3 ${cardInner}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-xs font-medium uppercase tracking-wide ${mutedText}`}>Bike</p>
            <p className="truncate text-sm font-medium">{selectedBike.name}</p>
            <p className={`truncate text-sm ${mutedText}`}>
              {selectedBike.frontWidthMm} / {selectedBike.rearWidthMm} mm ·{' '}
              {tubeLabel(selectedBike.tubeType)}
            </p>
          </div>
          <button
            type="button"
            className={`shrink-0 text-sm font-medium underline ${mutedText}`}
            onClick={() => onNavigate('bikes')}
          >
            Change bike
          </button>
        </div>
      </section>

      <section className={`flex items-center justify-between gap-2 p-3 ${cardInner}`}>
        <div className="min-w-0">
          <p className={`text-xs font-medium uppercase tracking-wide ${mutedText}`}>Rider</p>
          <p className="text-sm font-medium">{formatWeightFromKg(riderKg, weightUnit)}</p>
        </div>
        <button
          type="button"
          className={`shrink-0 text-sm font-medium underline ${mutedText}`}
          onClick={() => onNavigate('rider')}
        >
          Change
        </button>
      </section>

      <section className={`space-y-3 p-3 ${cardInner}`}>
        <h2 className={sectionTitle}>This ride</h2>
        <div>
          <p className="text-sm font-medium">Surface</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {FAMILY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`flex min-w-0 flex-col items-center justify-center gap-1 px-2 py-2.5 text-xs sm:text-sm ${
                  surfaceFamily(state.rideType) === opt.value ? pillActive : pillIdle
                }`}
                onClick={() => {
                  if (opt.value === 'mixed') {
                    if (state.rideType !== 'mixed') {
                      onGravelPercent('50')
                    }
                    onRideType('mixed')
                    return
                  }
                  if (surfaceFamily(state.rideType) === opt.value) return
                  onRideType(opt.value === 'road' ? 'road' : 'gravel')
                }}
              >
                <RideTypeIcon type={opt.icon} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {surfaceFamily(state.rideType) === 'road' && (
          <div>
            <p className="text-sm font-medium">Road condition</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {ROAD_CONDITIONS.map((opt) => {
                const selected =
                  state.rideType === opt.value ||
                  (opt.value === 'road-rough' && state.rideType === 'commute')
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`px-2 py-2 text-xs sm:text-sm ${selected ? pillActive : pillIdle}`}
                    onClick={() => onRideType(opt.value)}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <p className={`mt-2 text-xs ${mutedText}`}>
              Normal road is the empirical baseline. Smooth raises it slightly. Rough lowers it slightly.
            </p>
            {state.rideType === 'commute' && (
              <p className={`mt-1 text-xs ${mutedText}`}>
                This saved commute setting uses the rough-road adjustment.
              </p>
            )}
          </div>
        )}

        {surfaceFamily(state.rideType) === 'gravel' && (
          <div>
            <p className="text-sm font-medium">Gravel condition</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {GRAVEL_CONDITIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`px-2 py-2 text-xs sm:text-sm ${
                    state.rideType === opt.value ? pillActive : pillIdle
                  }`}
                  onClick={() => onRideType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className={`mt-2 text-xs ${mutedText}`}>
              Hardpack is the smallest reduction. Rougher gravel steps down from there.
            </p>
          </div>
        )}

        {state.rideType === 'mixed' && (
          <>
            <div>
              <p className="text-sm font-medium">Road terrain</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ROAD_CONDITIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`px-2 py-2 text-xs sm:text-sm ${
                      state.mixedRoadType === opt.value ? pillActive : pillIdle
                    }`}
                    onClick={() => onMixedRoadType(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Gravel terrain</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {MIXED_GRAVEL_CONDITIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`px-2 py-2 text-xs sm:text-sm ${
                      state.mixedGravelType === opt.value ? pillActive : pillIdle
                    }`}
                    onClick={() => onMixedGravelType(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-sm">
              Gravel proportion: {Math.min(100, Math.max(0, parseNum(state.gravelPercent, 50)))}%
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                className="soft-range mt-2 w-full"
                value={Math.min(100, Math.max(0, parseNum(state.gravelPercent, 50)))}
                onChange={(e) => onGravelPercent(e.target.value)}
              />
              <input
                className={`${fieldClassName} mt-2`}
                inputMode="numeric"
                value={state.gravelPercent}
                onChange={(e) => onGravelPercent(e.target.value)}
              />
              <span className={`mt-1 block text-xs ${mutedText}`}>
                Blends the selected road and gravel terrain adjustments. Road portion:{' '}
                {Math.max(0, 100 - parseNum(state.gravelPercent, 50))}%
              </span>
            </label>
          </>
        )}

        <label className="block text-sm">
          Pack weight (kg)
          {state.rideType === 'commute' ? ' — required' : ' — optional'}
          <input
            className={fieldClassName}
            inputMode="decimal"
            value={state.packWeightKg}
            onChange={(e) => onPackWeight(e.target.value)}
          />
        </label>
      </section>

      <WeatherSection
        weather={weather}
        deviceCoords={deviceCoords}
        deviceLocating={deviceLocating}
        deviceError={deviceError}
        suggestions={suggestions}
        searchStatus={searchStatus}
        searchError={searchError}
        preview={preview}
        previewLoading={previewLoading}
        onPatch={onPatchWeather}
        onUseMyLocation={onUseMyLocation}
        onSelectPlace={onSelectPlace}
      />

      {error && <p className="text-sm text-[#a63d2a]">{error}</p>}

      <button type="submit" disabled={calculating} className={btnPrimary}>
        {calculating ? 'Calculating…' : 'Calculate pressure'}
      </button>

      {!canCalculate && (
        <p className={`text-center text-sm ${mutedText}`}>
          Add rider weight and bike details to calculate.
        </p>
      )}
    </form>
  )
}
