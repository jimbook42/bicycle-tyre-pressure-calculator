import { formatTemperatureC, formatTemperatureRangeC } from '../calculator/displayUnits'
import type { TemperatureDisplayUnit } from '../types'
import type { WetMode } from '../calculator/weatherAdjustment'
import { weatherIconKindForCode, type WeatherIconKind } from './weatherIcons'
import { durationMinutesFromSettings } from './rideWeatherService'
import { formatLaterWhenLabel, isRideLater } from './rideTimingUi'
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

export function formatTemperatureWindow(
  weather: ProcessedRideWeather,
  temperatureUnit: TemperatureDisplayUnit = 'celsius',
): string {
  const min = weather.windowTempMinC
  const max = weather.windowTempMaxC
  if (min === undefined || max === undefined) {
    return formatTemperatureC(weather.rideTempC, temperatureUnit)
  }
  return formatTemperatureRangeC(min, max, temperatureUnit)
}

export interface WeatherPreviewModel {
  locationLabel: string
  plan: string
  weatherIconKind: WeatherIconKind
  temperatureLine: string
  rainLine: string
  wetLine: string
  compactTempCondition: string
  compactTimingLine: string
  unavailable: boolean
}

export function formatCompactWeatherSummary(
  settings: WeatherSettingsStored,
  processed: ProcessedRideWeather | null,
  temperatureUnit: TemperatureDisplayUnit = 'celsius',
): { temperatureCondition: string; timingLine: string } {
  const minutes = durationMinutesFromSettings(settings)
  const duration =
    minutes % 60 === 0
      ? `${minutes / 60} hr${minutes === 60 ? '' : ''}`
      : `${minutes} min`
  const timingLine =
    settings.timingMode === 'now'
      ? `Now · ${duration}`
      : `${describeRidePlan(settings).split(' • ')[0]} · ${duration}`

  if (!processed?.available) {
    return { temperatureCondition: '—', timingLine }
  }
  const temp = formatTemperatureWindow(processed, temperatureUnit)
  const wet = wetAdjustmentApplies(processed.isWetForecast, settings.wetMode)
  const condition =
    settings.wetMode === 'dry'
      ? 'Dry'
      : settings.wetMode === 'wet'
        ? 'Wet'
        : processed.isWetForecast
          ? 'Rain possible'
          : 'Dry'
  const tempCond = wet && settings.wetMode === 'auto' && processed.isWetForecast
    ? `${temp} · ${condition}`
    : `${temp} · ${wet ? 'Wet' : 'Dry'}`
  return { temperatureCondition: tempCond, timingLine }
}

export function buildWeatherPreview(
  settings: WeatherSettingsStored,
  processed: ProcessedRideWeather | null,
  temperatureUnit: TemperatureDisplayUnit = 'celsius',
): WeatherPreviewModel {
  const plan = describeRidePlan(settings)
  if (!processed?.available) {
    const { temperatureCondition, timingLine } = formatCompactWeatherSummary(
      settings,
      null,
      temperatureUnit,
    )
    return {
      locationLabel: settings.locationLabel || processed?.locationLabel || 'Location not selected',
      plan,
      weatherIconKind: 'unknown',
      temperatureLine: '',
      rainLine: '',
      wetLine: '',
      compactTempCondition: temperatureCondition,
      compactTimingLine: timingLine,
      unavailable: true,
    }
  }
  const wet = wetAdjustmentApplies(processed.isWetForecast, settings.wetMode)
  const nowBit =
    settings.timingMode === 'now' && processed.currentAmbientTempC !== undefined
      ? `Now ${formatTemperatureC(processed.currentAmbientTempC, temperatureUnit)} • `
      : ''
  const code = processed.dominantWeatherCode ?? 0
  const { temperatureCondition, timingLine } = formatCompactWeatherSummary(
    settings,
    processed,
    temperatureUnit,
  )
  const compactTimingLine = isRideLater(settings)
    ? `${formatLaterWhenLabel(settings)} · ${timingLine.split(' · ').slice(-1)[0]}`
    : timingLine
  return {
    locationLabel: processed.locationLabel,
    plan,
    weatherIconKind: weatherIconKindForCode(code),
    temperatureLine: `${nowBit}${formatTemperatureWindow(processed, temperatureUnit)}`,
    rainLine: processed.isWetForecast ? 'Rain possible' : 'No rain in this ride window',
    wetLine: wet ? 'Wet adjustment: Applied' : 'Wet adjustment: Not applied',
    compactTempCondition: temperatureCondition,
    compactTimingLine,
    unavailable: false,
  }
}
