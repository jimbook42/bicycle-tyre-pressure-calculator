import type { TemperatureDisplayUnit, WeightDisplayUnit } from '../types'

const LB_PER_KG = 2.2046226218

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG
}

export function formatWeightFromKg(kg: number, unit: WeightDisplayUnit, digits = 1): string {
  if (unit === 'lb') return `${kgToLb(kg).toFixed(digits)} lb`
  return `${kg.toFixed(digits)} kg`
}

export function weightUnitLabel(unit: WeightDisplayUnit): string {
  return unit === 'lb' ? 'lb' : 'kg'
}

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32
}

export function formatTemperatureC(c: number, unit: TemperatureDisplayUnit): string {
  if (unit === 'fahrenheit') return `${Math.round(celsiusToFahrenheit(c))}°F`
  return `${Math.round(c)}°C`
}

/** Format a Celsius range for weather preview display. */
export function formatTemperatureRangeC(
  minC: number,
  maxC: number,
  unit: TemperatureDisplayUnit,
): string {
  const low = Math.round(Math.min(minC, maxC))
  const high = Math.round(Math.max(minC, maxC))
  if (low === high) return formatTemperatureC(low, unit)
  if (unit === 'fahrenheit') {
    return `${formatTemperatureC(low, unit).replace('°F', '')}–${formatTemperatureC(high, unit)}`
  }
  return `${low}–${high}°C`
}
