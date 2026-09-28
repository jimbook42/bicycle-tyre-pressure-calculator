import type { WetMode } from '../calculator/weatherAdjustment'
import { weatherIconForCode } from './weatherIcons'
import { durationMinutesFromSettings } from './rideWeatherService'
import type { ProcessedRideWeather } from './weatherProvider'
import type { WeatherSettingsStored } from '../types'

export function wetAdjustmentApplies(isWetForecast: boolean, wetMode: WetMode): boolean {
  if (wetMode === 'dry') return false
  if (wetMode === 'wet') return true
  return isWetForecast
}

export function describeRidePlan(weather: WeatherSettingsStored): string {
  const minutes = durationMinutesFromSettings(weather)
  const duration =
    minutes % 60 === 0 ? `${minutes / 60} hour${minutes === 60 ? '' : 's'}` : `${minutes} min`
  const when =
    weather.timingMode === 'now'
      ? 'Now'
      : weather.timingMode === 'today'
        ? 'Today'
        : weather.timingMode === 'tomorrow'
          ? 'Tomorrow'
          : weather.rideDate || 'Future date'
  const time =
    weather.timingMode === 'now' ? '' : ` • ${weather.startTime || 'start time not set'}`
  return `${when}${time} • ${duration}`
}

export function formatTemperatureWindow(weather: ProcessedRideWeather): string {
  const min = weather.windowTempMinC
  const max = weather.windowTempMaxC
  if (min === undefined || max === undefined) {
    return `${Math.round(weather.rideTempC)}°C`
  }
  const low = Math.round(Math.min(min, max))
  const high = Math.round(Math.max(min, max))
  if (low === high) return `${low}°C`
  return `${low}–${high}°C`
}

export interface WeatherPreviewModel {
  locationLabel: string
  plan: string
  weatherIcon: string
  temperatureLine: string
  rainLine: string
  wetLine: string
  unavailable: boolean
}

export function buildWeatherPreview(
  settings: WeatherSettingsStored,
  processed: ProcessedRideWeather | null,
): WeatherPreviewModel {
  const plan = describeRidePlan(settings)
  if (!processed?.available) {
    return {
      locationLabel: settings.locationLabel || processed?.locationLabel || 'Location not selected',
      plan,
      weatherIcon: '🌡️',
      temperatureLine: '',
      rainLine: '',
      wetLine: '',
      unavailable: true,
    }
  }
  const wet = wetAdjustmentApplies(processed.isWetForecast, settings.wetMode)
  const nowBit =
    settings.timingMode === 'now' && processed.currentAmbientTempC !== undefined
      ? `Now ${Math.round(processed.currentAmbientTempC)}°C • `
      : ''
  const code = processed.dominantWeatherCode ?? 0
  return {
    locationLabel: processed.locationLabel,
    plan,
    weatherIcon: weatherIconForCode(code),
    temperatureLine: `${nowBit}${formatTemperatureWindow(processed)}`,
    rainLine: processed.isWetForecast ? 'Rain possible' : 'No rain in this ride window',
    wetLine: wet ? 'Wet adjustment: Applied' : 'Wet adjustment: Not applied',
    unavailable: false,
  }
}
