import { WET_PRECIP_THRESHOLD_MM } from '../data/weatherConstants'
import type { HourlyForecastPoint, RideTimingMode, RideTimingRequest, RideWindow } from './weatherProvider'

const RAIN_WEATHER_CODES = new Set([
  51, 52, 53, 54, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95,
  96, 99,
])

function localDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function resolveRideWindow(timing: RideTimingRequest): RideWindow {
  const now = timing.referenceNow ?? new Date()
  const durationMinutes = Math.max(1, timing.durationMinutes)
  let start = new Date(now)

  const parseStartTime = (date: Date, time?: string): Date => {
    const base = new Date(date)
    if (time && /^\d{1,2}:\d{2}$/.test(time)) {
      const [h, m] = time.split(':').map(Number)
      base.setHours(h, m, 0, 0)
    }
    return base
  }

  switch (timing.mode) {
    case 'now':
      start = now
      break
    case 'today':
      start = parseStartTime(now, timing.startTime)
      if (start.getTime() < now.getTime()) start = now
      break
    case 'tomorrow': {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      start = parseStartTime(tomorrow, timing.startTime ?? '09:00')
      break
    }
    case 'future': {
      const dateStr = timing.rideDate?.trim() || localDateString(now)
      const [y, mo, d] = dateStr.split('-').map(Number)
      const future = new Date(y, (mo || 1) - 1, d || 1)
      if (Number.isNaN(future.getTime())) {
        start = parseStartTime(now, timing.startTime ?? '09:00')
      } else {
        start = parseStartTime(future, timing.startTime ?? '09:00')
      }
      break
    }
  }

  const end = new Date(start.getTime() + durationMinutes * 60_000)
  return { start, end, durationMinutes }
}

function interpolateAt(points: HourlyForecastPoint[], at: Date): HourlyForecastPoint {
  if (points.length === 0) {
    return { time: at, temperatureC: 15, precipitationMm: 0, weatherCode: 0 }
  }
  const t = at.getTime()
  const sorted = [...points].sort((a, b) => a.time.getTime() - b.time.getTime())
  if (t <= sorted[0].time.getTime()) return sorted[0]
  const last = sorted[sorted.length - 1]
  if (t >= last.time.getTime()) return last

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (t >= a.time.getTime() && t <= b.time.getTime()) {
      const span = b.time.getTime() - a.time.getTime()
      const ratio = span === 0 ? 0 : (t - a.time.getTime()) / span
      return {
        time: at,
        temperatureC: a.temperatureC + (b.temperatureC - a.temperatureC) * ratio,
        precipitationMm: a.precipitationMm + (b.precipitationMm - a.precipitationMm) * ratio,
        weatherCode: ratio < 0.5 ? a.weatherCode : b.weatherCode,
      }
    }
  }
  return last
}

/** Duration-weighted ambient air temperature over the ride window (not min/max daily). */
export function durationWeightedRideTemperatureC(
  hourly: HourlyForecastPoint[],
  window: RideWindow,
): number {
  const sliceMinutes = 15
  const sliceMs = sliceMinutes * 60_000
  let weighted = 0
  let totalMs = 0
  for (let t = window.start.getTime(); t < window.end.getTime(); t += sliceMs) {
    const sliceEnd = Math.min(window.end.getTime(), t + sliceMs)
    const mid = new Date((t + sliceEnd) / 2)
    const sample = interpolateAt(hourly, mid)
    const weight = sliceEnd - t
    weighted += sample.temperatureC * weight
    totalMs += weight
  }
  if (totalMs === 0) {
    return interpolateAt(hourly, window.start).temperatureC
  }
  return weighted / totalMs
}

/** Min and max ambient samples inside the ride window. Not the daily min or max. */
export function temperatureRangeOverRideC(
  hourly: HourlyForecastPoint[],
  window: RideWindow,
): { minC: number; maxC: number } {
  const sliceMs = 15 * 60_000
  let minC = Number.POSITIVE_INFINITY
  let maxC = Number.NEGATIVE_INFINITY
  for (let t = window.start.getTime(); t < window.end.getTime(); t += sliceMs) {
    const sliceEnd = Math.min(window.end.getTime(), t + sliceMs)
    const sample = interpolateAt(hourly, new Date((t + sliceEnd) / 2))
    minC = Math.min(minC, sample.temperatureC)
    maxC = Math.max(maxC, sample.temperatureC)
  }
  if (!Number.isFinite(minC) || !Number.isFinite(maxC)) {
    const fallback = interpolateAt(hourly, window.start).temperatureC
    return { minC: fallback, maxC: fallback }
  }
  return { minC, maxC }
}

/** Duration-weighted dominant WMO weather code over the ride window. */
export function dominantWeatherCodeDuringRide(
  hourly: HourlyForecastPoint[],
  window: RideWindow,
): number {
  const sliceMs = 15 * 60_000
  const weights = new Map<number, number>()
  for (let t = window.start.getTime(); t < window.end.getTime(); t += sliceMs) {
    const sliceEnd = Math.min(window.end.getTime(), t + sliceMs)
    const mid = new Date((t + sliceEnd) / 2)
    const sample = interpolateAt(hourly, mid)
    const weight = sliceEnd - t
    weights.set(sample.weatherCode, (weights.get(sample.weatherCode) ?? 0) + weight)
  }
  let bestCode = 0
  let bestWeight = -1
  for (const [code, w] of weights) {
    if (w > bestWeight) {
      bestWeight = w
      bestCode = code
    }
  }
  if (bestWeight >= 0) return bestCode
  return interpolateAt(hourly, window.start).weatherCode
}

export function forecastWetDuringRide(
  hourly: HourlyForecastPoint[],
  window: RideWindow,
): boolean {
  const sliceMinutes = 15
  const sliceMs = sliceMinutes * 60_000
  for (let t = window.start.getTime(); t < window.end.getTime(); t += sliceMs) {
    const mid = new Date((t + Math.min(window.end.getTime(), t + sliceMs)) / 2)
    const sample = interpolateAt(hourly, mid)
    if (sample.precipitationMm >= WET_PRECIP_THRESHOLD_MM) return true
    if (RAIN_WEATHER_CODES.has(sample.weatherCode)) return true
  }
  return false
}

export function currentAmbientFromHourly(
  hourly: HourlyForecastPoint[],
  referenceNow: Date = new Date(),
): number | undefined {
  if (hourly.length === 0) return undefined
  return interpolateAt(hourly, referenceNow).temperatureC
}

export function timingModeLabel(mode: RideTimingMode): string {
  switch (mode) {
    case 'now':
      return 'Now'
    case 'today':
      return 'Today'
    case 'tomorrow':
      return 'Tomorrow'
    case 'future':
      return 'Future date'
  }
}
