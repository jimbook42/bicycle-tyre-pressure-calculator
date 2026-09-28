import type { SessionCoordinates } from '../weather/rideWeatherService'
import { formatPlaceLabel } from '../weather/geocoding'
import type { WeatherPreviewModel } from '../weather/weatherPreview'
import type { GeoPlace } from '../weather/weatherProvider'
import type { WeatherSettingsStored } from '../types'
import {
  btnRaised,
  cardInner,
  fieldClassName,
  mutedText,
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
  return (
    <details
      open={weather.weatherOpen}
      onToggle={(e) => onPatch({ weatherOpen: (e.target as HTMLDetailsElement).open })}
      className={`${cardInner} p-3`}
    >
      <summary className={`cursor-pointer text-sm font-medium ${sectionTitle}`}>
        Weather &amp; temperature (optional)
      </summary>
      <div className="mt-3 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={weather.enabled}
            onChange={(e) => onPatch({ enabled: e.target.checked })}
          />
          Use weather for this calculation
        </label>

        {weather.enabled && (
          <>
            <fieldset className="text-sm">
              <legend className="font-medium">Location</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={weather.locationMode === 'search'}
                    onChange={() => onPatch({ locationMode: 'search' })}
                  />
                  Search
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={weather.locationMode === 'device'}
                    onChange={() => onPatch({ locationMode: 'device' })}
                  />
                  Use my location
                </label>
              </div>
              {weather.locationMode === 'search' && (
                <div>
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
                <p className={`mt-1 text-xs ${mutedText}`}>Last used: {weather.locationLabel}</p>
              )}
            </fieldset>

            <label className="block text-sm">
              Ride timing
              <select
                className={fieldClassName}
                value={weather.timingMode}
                onChange={(e) =>
                  onPatch({
                    timingMode: e.target.value as WeatherSettingsStored['timingMode'],
                  })
                }
              >
                <option value="now">Now</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="future">Future date</option>
              </select>
            </label>

            {(weather.timingMode === 'today' ||
              weather.timingMode === 'tomorrow' ||
              weather.timingMode === 'future') && (
              <div className="grid grid-cols-2 gap-3">
                {weather.timingMode === 'future' && (
                  <label className="text-sm">
                    Date
                    <input
                      type="date"
                      className={fieldClassName}
                      value={weather.rideDate}
                      onChange={(e) => onPatch({ rideDate: e.target.value })}
                    />
                  </label>
                )}
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
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4 hours</option>
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

            <p className={`text-xs ${mutedText}`}>
              Weather data by Open-Meteo.com. Non-commercial use is supported without an API key;
              commercial use may need separate licensing.
            </p>

            {(previewLoading || preview) && (
              <div className={`p-3 text-sm ${cardInner}`}>
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#fdfaf3] text-xl shadow-[8px_8px_16px_rgba(0,0,0,0.08),_-8px_-8px_16px_rgba(255,255,255,0.7)] dark:bg-[#1e1e20] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),_-8px_-8px_16px_rgba(255,255,255,0.05)]"
                    aria-hidden
                  >
                    {preview?.weatherIcon ?? '🌡️'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{preview?.locationLabel || weather.locationLabel}</p>
                    <p className={mutedText}>{preview?.plan}</p>
                  </div>
                </div>
                {previewLoading && <p className={`mt-2 ${mutedText}`}>Loading forecast…</p>}
                {preview?.unavailable && !previewLoading && (
                  <p className={`mt-2 ${warnBox}`}>
                    Weather unavailable — using standard pressure calculation.
                  </p>
                )}
                {preview && !preview.unavailable && !previewLoading && (
                  <div className={`mt-2 space-y-0.5 ${mutedText}`}>
                    <p className="font-medium text-[#2b2825] dark:text-[#e8e6e1]">Expected ride weather</p>
                    <p>{preview.temperatureLine}</p>
                    <p>{preview.rainLine}</p>
                    <p>{preview.wetLine}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </details>
  )
}
