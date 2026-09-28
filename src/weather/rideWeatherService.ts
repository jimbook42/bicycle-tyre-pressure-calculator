import { DURATION_PRESET_MINUTES } from '../data/weatherConstants'
import { formatPlaceLabel } from './geocoding'
import { buildProcessedRideWeather, createOpenMeteoProvider } from './openMeteoProvider'
import { resolveRideWindow } from './forecastProcessor'
import type { ProcessedRideWeather, RideTimingRequest, WeatherProvider } from './weatherProvider'
import type { WeatherSettingsStored } from '../types'
import { parseNum } from '../calculator/buildInput'

export interface SessionCoordinates {
  latitude: number
  longitude: number
  label: string
}

export function durationMinutesFromSettings(weather: WeatherSettingsStored): number {
  if (weather.durationPreset === 'custom') {
    return Math.max(1, parseNum(weather.durationCustomMinutes, 60))
  }
  return DURATION_PRESET_MINUTES[weather.durationPreset] ?? 60
}

export function buildTimingRequest(
  weather: WeatherSettingsStored,
  referenceNow = new Date(),
): RideTimingRequest {
  return {
    mode: weather.timingMode,
    rideDate: weather.rideDate || undefined,
    startTime: weather.startTime || undefined,
    durationMinutes: durationMinutesFromSettings(weather),
    referenceNow,
  }
}

/** Use a place the user selected, or device coordinates. Do not guess from free text. */
export function resolveRideLocation(
  weather: WeatherSettingsStored,
  deviceCoords: SessionCoordinates | null,
  selectedPlace: SessionCoordinates | null = null,
): SessionCoordinates | null {
  if (weather.locationMode === 'device') return deviceCoords
  if (
    selectedPlace &&
    (weather.locationLabel === selectedPlace.label ||
      weather.locationSearch.trim() === selectedPlace.label)
  ) {
    return selectedPlace
  }
  return null
}

export async function fetchProcessedRideWeather(
  weather: WeatherSettingsStored,
  deviceCoords: SessionCoordinates | null,
  provider: WeatherProvider = createOpenMeteoProvider(),
  referenceNow = new Date(),
  selectedPlace: SessionCoordinates | null = null,
): Promise<ProcessedRideWeather> {
  const location = resolveRideLocation(weather, deviceCoords, selectedPlace)
  if (!location) {
    return {
      available: false,
      errorMessage: 'Location not available for weather lookup.',
      locationLabel: weather.locationLabel || '',
      rideTempC: 0,
      isWetForecast: false,
      providerId: provider.id,
      attribution: '',
      confidence: 'none',
    }
  }
  const timing = buildTimingRequest(weather, referenceNow)
  return buildProcessedRideWeather(
    provider,
    location.latitude,
    location.longitude,
    location.label,
    timing,
  )
}

export { createOpenMeteoProvider, resolveRideWindow, formatPlaceLabel }
