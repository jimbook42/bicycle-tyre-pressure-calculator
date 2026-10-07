import { FORECAST_CACHE_TTL_MS, OPEN_METEO_ATTRIBUTION } from '../data/weatherConstants'
import { searchLocations } from './geocoding'
import {
  currentAmbientFromHourly,
  dominantWeatherCodeDuringRide,
  durationWeightedRideTemperatureC,
  forecastMoistureDuringRide,
  resolveRideWindow,
  temperatureRangeOverRideC,
} from './forecastProcessor'
import type {
  FetchLike,
  ForecastBundle,
  HourlyForecastPoint,
  ProcessedRideWeather,
  RideTimingRequest,
  RideWindow,
  WeatherProvider,
} from './weatherProvider'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

interface CacheEntry {
  expiresAt: number
  bundle: ForecastBundle
}

function utcDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseForecastTime(value: string | number): Date {
  if (typeof value === 'number') return new Date(value * 1000)
  return new Date(/Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`)
}

function cacheKey(lat: number, lon: number, startDay: string, endDay: string): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)},${startDay},${endDay}`
}

export function createOpenMeteoProvider(
  fetchImpl: FetchLike = fetch.bind(globalThis),
  cache = new Map<string, CacheEntry>(),
): WeatherProvider {
  return {
    id: 'open-meteo',
    async searchPlaces(query, limit) {
      return searchLocations(query, fetchImpl, limit)
    },
    async fetchHourlyForecast(latitude, longitude, window) {
      const startDate = utcDate(window.start)
      const endDate = utcDate(window.end)
      const key = cacheKey(latitude, longitude, startDate, endDate)
      const cached = cache.get(key)
      if (cached && cached.expiresAt > Date.now()) {
        return cached.bundle
      }

      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        hourly: 'temperature_2m,precipitation,weather_code',
        timezone: 'UTC',
        timeformat: 'unixtime',
        start_date: startDate,
        end_date: endDate,
      })
      const response = await fetchImpl(`${FORECAST_URL}?${params.toString()}`)
      if (!response.ok) throw new Error('Forecast request failed')
      const data = (await response.json()) as {
        elevation?: number
        hourly?: {
        time?: Array<string | number>
          temperature_2m?: number[]
          precipitation?: number[]
          weather_code?: number[]
        }
      }
      const times = data.hourly?.time ?? []
      const hourly: HourlyForecastPoint[] = times.map((time, index) => ({
        time: parseForecastTime(time),
        temperatureC: data.hourly?.temperature_2m?.[index] ?? 0,
        precipitationMm: data.hourly?.precipitation?.[index] ?? 0,
        weatherCode: data.hourly?.weather_code?.[index] ?? 0,
      }))
      const elevationM = Number.isFinite(data.elevation) ? data.elevation : undefined
      const bundle: ForecastBundle = { hourly, elevationM }
      cache.set(key, { bundle, expiresAt: Date.now() + FORECAST_CACHE_TTL_MS })
      return bundle
    },
  }
}

export async function buildProcessedRideWeather(
  provider: WeatherProvider,
  latitude: number,
  longitude: number,
  locationLabel: string,
  timing: RideTimingRequest,
): Promise<ProcessedRideWeather> {
  const window = resolveRideWindow(timing)
  const bundle = await provider.fetchHourlyForecast(latitude, longitude, window)
  const hourly = bundle.hourly
  if (hourly.length === 0) {
    return {
      available: false,
      errorMessage: 'Forecast data missing for this location.',
      locationLabel,
      rideTempC: 0,
      isWetForecast: false,
      moisture: 'dry',
      providerId: provider.id,
      attribution: OPEN_METEO_ATTRIBUTION,
      confidence: 'none',
    }
  }
  const rideTempC = durationWeightedRideTemperatureC(hourly, window)
  const { minC, maxC } = temperatureRangeOverRideC(hourly, window)
  const currentAmbientTempC = currentAmbientFromHourly(hourly, timing.referenceNow)
  const moisture = forecastMoistureDuringRide(hourly, window)
  const dominantWeatherCode = dominantWeatherCodeDuringRide(hourly, window)
  return {
    available: true,
    locationLabel,
    rideTempC,
    windowTempMinC: minC,
    windowTempMaxC: maxC,
    currentAmbientTempC,
    isWetForecast: moisture === 'wet',
    moisture,
    elevationM: bundle.elevationM,
    dominantWeatherCode,
    providerId: provider.id,
    attribution: OPEN_METEO_ATTRIBUTION,
    confidence: 'full',
  }
}

export type { RideWindow, RideTimingRequest }
