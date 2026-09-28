import {
  DEFAULT_ASSUMED_INFLATION_TEMP_C,
  WET_SURFACE_PRESSURE_FACTOR,
} from '../data/weatherConstants'
import { applyManufacturerLimits } from './safetyLimits'
import { coldInflationGaugeKpa } from '../weather/temperaturePhysics'
import type { ProcessedRideWeather } from '../weather/weatherProvider'

export type WetMode = 'auto' | 'dry' | 'wet'

export interface WheelWeatherPressure {
  baselineGaugeKpa: number
  targetRidingGaugeKpa: number
  coldInflationGaugeKpa: number
  displayGaugeKpa: number
  wetApplied: boolean
  ridingClamped: boolean
  coldClamped: boolean
}

export interface WeatherPressureOutcome {
  active: boolean
  unavailableMessage?: string
  rideTempC?: number
  inflationTempC?: number
  inflationAssumed?: boolean
  wetApplied?: boolean
  wetLabel?: string
  compactLine?: string
  front?: WheelWeatherPressure
  rear?: WheelWeatherPressure
  notes: string[]
  warnings: string[]
  attribution?: string
}

function resolveWet(isWetForecast: boolean, wetMode: WetMode): boolean {
  if (wetMode === 'dry') return false
  if (wetMode === 'wet') return true
  return isWetForecast
}

function adjustWheel(
  baselineGaugeKpa: number,
  wet: boolean,
  rideTempC: number,
  inflationTempC: number,
  minKpa?: number,
  maxKpa?: number,
): WheelWeatherPressure {
  let targetRiding = baselineGaugeKpa
  let wetApplied = false
  if (wet) {
    targetRiding = baselineGaugeKpa * WET_SURFACE_PRESSURE_FACTOR
    wetApplied = true
  }
  const ridingSafety = applyManufacturerLimits(targetRiding, { minKpa, maxKpa })
  const ridingGauge = ridingSafety.clampedKpa
  const coldRaw = coldInflationGaugeKpa(ridingGauge, rideTempC, inflationTempC)
  const coldSafety = applyManufacturerLimits(coldRaw, { minKpa, maxKpa })
  return {
    baselineGaugeKpa,
    targetRidingGaugeKpa: ridingGauge,
    coldInflationGaugeKpa: coldSafety.clampedKpa,
    displayGaugeKpa: coldSafety.clampedKpa,
    wetApplied,
    ridingClamped: ridingSafety.clampedToMin || ridingSafety.clampedToMax,
    coldClamped: coldSafety.clampedToMin || coldSafety.clampedToMax,
  }
}

export interface ApplyWeatherInput {
  frontBaselineKpa: number
  rearBaselineKpa: number
  frontMinKpa?: number
  frontMaxKpa?: number
  rearMinKpa?: number
  rearMaxKpa?: number
  weather: ProcessedRideWeather | null
  wetMode: WetMode
  inflationTempC: number | null
  inflationAssumed: boolean
}

export function applyWeatherPressureAdjustments(input: ApplyWeatherInput): WeatherPressureOutcome {
  if (!input.weather?.available) {
    return {
      active: false,
      unavailableMessage: 'Weather unavailable — using standard pressure calculation.',
      notes: [],
      warnings: [],
    }
  }

  const wet = resolveWet(input.weather.isWetForecast, input.wetMode)
  const inflationTempC =
    input.inflationTempC ??
    input.weather.currentAmbientTempC ??
    DEFAULT_ASSUMED_INFLATION_TEMP_C
  const inflationAssumed =
    input.inflationAssumed ||
    (input.inflationTempC === null && input.weather.currentAmbientTempC === undefined)

  const front = adjustWheel(
    input.frontBaselineKpa,
    wet,
    input.weather.rideTempC,
    inflationTempC,
    input.frontMinKpa,
    input.frontMaxKpa,
  )
  const rear = adjustWheel(
    input.rearBaselineKpa,
    wet,
    input.weather.rideTempC,
    inflationTempC,
    input.rearMinKpa,
    input.rearMaxKpa,
  )

  const warnings: string[] = []
  if (front.ridingClamped || front.coldClamped) {
    warnings.push('Front pressure adjusted to manufacturer limit after weather correction.')
  }
  if (rear.ridingClamped || rear.coldClamped) {
    warnings.push('Rear pressure adjusted to manufacturer limit after weather correction.')
  }

  const wetLabel = wet ? 'Wet conditions' : 'Dry conditions'
  const compactLine = `Ride: ${input.weather.rideTempC.toFixed(0)}°C average • ${wetLabel}`

  const notes = [
    'Target riding pressure is what you want on the tyre while riding.',
    'Inflate to approximately is the gauge reading when you pump up (ideal-gas approximation).',
    wet
      ? `Weather adjustment: ${wetLabel} (×${WET_SURFACE_PRESSURE_FACTOR} on riding target).`
      : 'No wet-surface riding adjustment applied.',
  ]
  if (inflationAssumed) {
    notes.push(`Inflation temperature assumed ${inflationTempC.toFixed(0)}°C (not measured).`)
  }

  return {
    active: true,
    rideTempC: input.weather.rideTempC,
    inflationTempC,
    inflationAssumed,
    wetApplied: wet,
    wetLabel,
    compactLine,
    front,
    rear,
    notes,
    warnings,
    attribution: input.weather.attribution,
  }
}

export function resolveInflationTemperature(
  manualC: number | null,
  ambientC: number | undefined,
): { tempC: number; assumed: boolean } {
  if (manualC !== null && Number.isFinite(manualC)) {
    return { tempC: manualC, assumed: false }
  }
  if (ambientC !== undefined && Number.isFinite(ambientC)) {
    return { tempC: ambientC, assumed: false }
  }
  return { tempC: DEFAULT_ASSUMED_INFLATION_TEMP_C, assumed: true }
}
