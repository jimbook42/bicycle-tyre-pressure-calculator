import { DURATION_PRESET_MINUTES } from '../data/weatherConstants'
import { formatPlaceLabel, searchLocations } from './geocoding'
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

export async function resolveRideLocation(
  weather: WeatherSettingsStored,
  deviceCoords: SessionCoordinates | null,
  provider: WeatherProvider,
): Promise<{ latitude: number; longitude: number; label: string } | null> {
  if (weather.locationMode === 'device') {
    if (!deviceCoords) return null
    return deviceCoords
  }
  if (weather.locationMode === 'search') {
    const query = weather.locationSearch.trim() || weather.locationLabel.trim()
    if (query.length < 2) return null
    const places = await provider.searchPlaces(query, 1)
    if (places.length === 0) return null
    return {
      latitude: places[0].latitude,
      longitude: places[0].longitude,
      label: formatPlaceLabel(places[0]),
    }
  }
  return null
}

export async function fetchProcessedRideWeather(
  weather: WeatherSettingsStored,
  deviceCoords: SessionCoordinates | null,
  provider: WeatherProvider = createOpenMeteoProvider(),
  referenceNow = new Date(),
): Promise<ProcessedRideWeather> {
  const location = await resolveRideLocation(weather, deviceCoords, provider)
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

export { createOpenMeteoProvider, searchLocations, resolveRideWindow }
