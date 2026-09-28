import type { SessionCoordinates } from '../weather/rideWeatherService'
import { formatPlaceLabel } from '../weather/geocoding'
import type { WeatherPreviewModel } from '../weather/weatherPreview'
import {
  isRideLater,
  localDateString,
  timingPatchForLaterDate,
} from '../weather/rideTimingUi'
import type { GeoPlace } from '../weather/weatherProvider'
import type { WeatherSettingsStored } from '../types'
import {
  btnRaised,
  cardInner,
  fieldClassName,
  mutedText,
  pillActive,
  pillIdle,
  sectionTitle,
  warnBox,
} from '../ui/softUi'

interface WeatherSectionProps {
  weather: WeatherSettingsStored
  deviceCoords: SessionCoordinates | null
  deviceError: string | null
  suggestions: GeoPlace[]
  searchStatus: 'idle' | 'loading' | 'results' | 'empty' | 'error'
  searchError: string | null
  preview: WeatherPreviewModel | null
  previewLoading: boolean
  onPatch: (patch: Partial<WeatherSettingsStored>) => void
  onUseMyLocation: () => void
  onSelectPlace: (place: GeoPlace) => void
}

export function WeatherSection({
  weather,
  deviceCoords,
  deviceError,
  suggestions,
  searchStatus,
  searchError,
  preview,
  previewLoading,
  onPatch,
  onUseMyLocation,
  onSelectPlace,
}: WeatherSectionProps) {
  const later = isRideLater(weather)

  return (
    <section className={`space-y-3 p-3 ${cardInner}`}>
      <h2 className={sectionTitle}>Weather</h2>

      <fieldset className="text-sm">
        <legend className="font-medium">Location</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={weather.locationMode === 'device' ? pillActive : pillIdle}
            onClick={() => onPatch({ locationMode: 'device' })}
          >
            Use my location
          </button>
          <button
            type="button"
            className={weather.locationMode === 'search' ? pillActive : pillIdle}
            onClick={() => onPatch({ locationMode: 'search' })}
          >
            Search
          </button>
        </div>
        {weather.locationMode === 'search' && (
          <div className="mt-2">
            <input
              className={fieldClassName}
              placeholder="City or place name"
              value={weather.locationSearch}
              onChange={(e) => onPatch({ locationSearch: e.target.value })}
              aria-label="Search location"
            />
            {searchStatus === 'loading' && (
              <p className={`mt-1 text-xs ${mutedText}`}>Searching…</p>
            )}
            {searchError && <p className="mt-1 text-xs text-[#a63d2a]">{searchError}</p>}
            {searchStatus === 'empty' && (
              <p className={`mt-1 text-xs ${mutedText}`}>No matching places.</p>
            )}
            {suggestions.length > 0 && (
              <ul className={`mt-2 overflow-hidden rounded-[12px] ${cardInner}`}>
                {suggestions.map((place) => (
                  <li key={`${place.name}-${place.admin1 ?? ''}-${place.country ?? ''}`}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:brightness-105"
                      onClick={() => onSelectPlace(place)}
                    >
                      {formatPlaceLabel(place)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {weather.locationMode === 'device' && (
          <div className="mt-2 space-y-1">
            <button type="button" className={btnRaised} onClick={onUseMyLocation}>
              Detect location
            </button>
            {deviceCoords && (
              <p className={`text-xs ${mutedText}`}>Using: {deviceCoords.label}</p>
            )}
            {deviceError && <p className="text-xs text-[#a63d2a]">{deviceError}</p>}
            <p className={`text-xs ${mutedText}`}>
              Coordinates are not saved — only used for this session.
            </p>
          </div>
        )}
        {weather.locationLabel && weather.locationMode === 'search' && (
          <p className={`mt-1 text-xs ${mutedText}`}>Selected: {weather.locationLabel}</p>
        )}
      </fieldset>

      <div>
        <p className="text-sm font-medium">Ride time</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={!later ? pillActive : pillIdle}
            onClick={() => onPatch({ timingMode: 'now' })}
          >
            Now
          </button>
          <button
            type="button"
            className={later ? pillActive : pillIdle}
            onClick={() => {
              const today = localDateString(new Date())
              onPatch({
                timingMode: 'today',
                rideDate: weather.rideDate.trim() || today,
                startTime: weather.startTime || '09:00',
              })
            }}
          >
            Later
          </button>
        </div>
      </div>

      {later && (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Date
            <input
              type="date"
              className={fieldClassName}
              value={rideDateForDisplay(weather)}
              onChange={(e) => {
                const patch = timingPatchForLaterDate(e.target.value)
                onPatch(patch)
              }}
            />
          </label>
          <label className="text-sm">
            Start time
            <input
              type="time"
              className={fieldClassName}
              value={weather.startTime}
              onChange={(e) => onPatch({ startTime: e.target.value })}
            />
          </label>
        </div>
      )}

      <label className="block text-sm">
        Duration
        <select
          className={fieldClassName}
          value={weather.durationPreset}
          onChange={(e) => onPatch({ durationPreset: e.target.value })}
        >
          <option value="30">30 min</option>
          <option value="60">1 hr</option>
          <option value="90">1.5 hr</option>
          <option value="120">2 hr</option>
          <option value="180">3 hr</option>
          <option value="240">4 hr</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      {weather.durationPreset === 'custom' && (
        <label className="block text-sm">
          Custom duration (minutes)
          <input
            className={fieldClassName}
            inputMode="numeric"
            value={weather.durationCustomMinutes}
            onChange={(e) => onPatch({ durationCustomMinutes: e.target.value })}
          />
        </label>
      )}

      <details className={`${cardInner} p-3`}>
        <summary className="cursor-pointer text-sm font-medium">Advanced (inflation &amp; wet)</summary>
        <div className="mt-3 space-y-3">
          <fieldset className="text-sm">
            <legend className="font-medium">Inflation temperature</legend>
            <label className="mt-2 flex items-center gap-2">
              <input
                type="radio"
                checked={weather.inflationMode === 'ambient'}
                onChange={() => onPatch({ inflationMode: 'ambient' })}
              />
              Current ambient (from forecast when available)
            </label>
            <label className="mt-1 flex items-center gap-2">
              <input
                type="radio"
                checked={weather.inflationMode === 'manual'}
                onChange={() => onPatch({ inflationMode: 'manual' })}
              />
              Manual
            </label>
            {weather.inflationMode === 'manual' && (
              <label className="mt-2 block">
                Temperature (°C)
                <input
                  className={fieldClassName}
                  inputMode="decimal"
                  value={weather.inflationManualC}
                  onChange={(e) => onPatch({ inflationManualC: e.target.value })}
                />
              </label>
            )}
          </fieldset>

          <label className="block text-sm">
            Wet conditions
            <select
              className={fieldClassName}
              value={weather.wetMode}
              onChange={(e) =>
                onPatch({ wetMode: e.target.value as WeatherSettingsStored['wetMode'] })
              }
            >
              <option value="auto">Automatic from forecast</option>
              <option value="dry">Dry</option>
              <option value="wet">Wet</option>
            </select>
          </label>
        </div>
      </details>

      <p className={`text-xs ${mutedText}`}>
        Weather data by Open-Meteo.com. Non-commercial use is supported without an API key.
      </p>

      {(previewLoading || preview) && (
        <div className={`p-3 text-sm ${cardInner}`} aria-live="polite">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#fdfaf3] text-xl shadow-[8px_8px_16px_rgba(0,0,0,0.08),_-8px_-8px_16px_rgba(255,255,255,0.7)] dark:bg-[#1e1e20] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),_-8px_-8px_16px_rgba(255,255,255,0.05)]"
              aria-hidden
            >
              {preview?.weatherIcon ?? '🌡️'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{preview?.locationLabel || weather.locationLabel || 'Location'}</p>
              {preview && !preview.unavailable && !previewLoading && (
                <>
                  <p className="mt-1 font-medium text-[#2b2825] dark:text-[#e8e6e1]">
                    {preview.compactTempCondition}
                  </p>
                  <p className={mutedText}>{preview.compactTimingLine}</p>
                </>
              )}
            </div>
          </div>
          {previewLoading && <p className={`mt-2 ${mutedText}`}>Loading forecast…</p>}
          {preview?.unavailable && !previewLoading && (
            <p className={`mt-2 ${warnBox}`}>
              Weather unavailable — using standard pressure calculation.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function rideDateForDisplay(weather: WeatherSettingsStored): string {
  if (weather.timingMode === 'future' && weather.rideDate.trim()) {
    return weather.rideDate.trim()
  }
  if (weather.timingMode === 'tomorrow') {
    const t = new Date()
    t.setDate(t.getDate() + 1)
    return localDateString(t)
  }
  return localDateString(new Date())
}
