import { DEFAULT_ASSUMED_INFLATION_TEMP_C } from '../data/weatherConstants'
import { applyManufacturerLimits } from './safetyLimits'
import { coldInflationGaugeKpa } from '../weather/temperaturePhysics'
import type { ProcessedRideWeather } from '../weather/weatherProvider'
import type { MoistureClass } from '../types'

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
  moisture?: MoistureClass
  compactLine?: string
  front?: WheelWeatherPressure
  rear?: WheelWeatherPressure
  notes: string[]
  warnings: string[]
  attribution?: string
  atmosphericKpa?: number
}

function adjustWheel(
  baselineGaugeKpa: number,
  rideTempC: number,
  inflationTempC: number,
  atmosphericKpa: number,
  minKpa?: number,
  maxKpa?: number,
): WheelWeatherPressure {
  const ridingSafety = applyManufacturerLimits(baselineGaugeKpa, { minKpa, maxKpa })
  const ridingGauge = ridingSafety.clampedKpa
  const coldRaw = coldInflationGaugeKpa(ridingGauge, rideTempC, inflationTempC, atmosphericKpa)
  const coldSafety = applyManufacturerLimits(coldRaw, { minKpa, maxKpa })
  return {
    baselineGaugeKpa,
    targetRidingGaugeKpa: ridingGauge,
    coldInflationGaugeKpa: coldSafety.clampedKpa,
    displayGaugeKpa: coldSafety.clampedKpa,
    wetApplied: false,
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
  /** Already resolved by the pressure model. Temperature correction does not apply a wet factor. */
  moisture?: MoistureClass
  atmosphericKpa?: number
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

  const atmosphericKpa = input.atmosphericKpa ?? 101.325
  const inflationTempC =
    input.inflationTempC ??
    input.weather.currentAmbientTempC ??
    DEFAULT_ASSUMED_INFLATION_TEMP_C
  const inflationAssumed =
    input.inflationAssumed ||
    (input.inflationTempC === null && input.weather.currentAmbientTempC === undefined)

  const front = adjustWheel(
    input.frontBaselineKpa,
    input.weather.rideTempC,
    inflationTempC,
    atmosphericKpa,
    input.frontMinKpa,
    input.frontMaxKpa,
  )
  const rear = adjustWheel(
    input.rearBaselineKpa,
    input.weather.rideTempC,
    inflationTempC,
    atmosphericKpa,
    input.rearMinKpa,
    input.rearMaxKpa,
  )

  const warnings: string[] = []
  if (front.ridingClamped || front.coldClamped) {
    warnings.push('Front pressure adjusted to a safety limit after temperature correction.')
  }
  if (rear.ridingClamped || rear.coldClamped) {
    warnings.push('Rear pressure adjusted to a safety limit after temperature correction.')
  }

  const moisture =
    input.moisture ?? input.weather.moisture ?? (input.weather.isWetForecast ? 'wet' : 'dry')
  const wetLabel =
    moisture === 'wet' || moisture === 'damp' ? 'Wet / likely wet' : 'Dry conditions'
  const compactLine = `Ride: ${input.weather.rideTempC.toFixed(0)}°C average • ${wetLabel}`

  const notes = [
    'The large numbers are your target pressure on the ride.',
    'If pump-now values are shown, they account for the temperature difference between filling and riding.',
  ]
  if (inflationAssumed) {
    notes.push(`Inflation temperature assumed ${inflationTempC.toFixed(0)}°C (not measured).`)
  }

  return {
    active: true,
    rideTempC: input.weather.rideTempC,
    inflationTempC,
    inflationAssumed,
    wetApplied: moisture === 'wet' || moisture === 'damp',
    wetLabel,
    moisture,
    compactLine,
    front,
    rear,
    notes,
    warnings,
    attribution: input.weather.attribution,
    atmosphericKpa,
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
