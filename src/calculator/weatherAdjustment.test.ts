import { describe, expect, it } from 'vitest'
import {
  applyWeatherPressureAdjustments,
  resolveInflationTemperature,
} from './weatherAdjustment'
import { psiToKpa } from './units'
import { KPA_PER_PSI } from '../data/constants'
import type { ProcessedRideWeather } from '../weather/weatherProvider'

function weather(partial: Partial<ProcessedRideWeather>): ProcessedRideWeather {
  return {
    available: true,
    locationLabel: 'Test',
    rideTempC: 15,
    currentAmbientTempC: 10,
    isWetForecast: false,
    providerId: 'test',
    attribution: 'Test provider',
    confidence: 'full',
    ...partial,
  }
}

describe('weatherAdjustment', () => {
  const baseFront = psiToKpa(70)
  const baseRear = psiToKpa(80)

  it('falls back when weather is unavailable', () => {
    const outcome = applyWeatherPressureAdjustments({
      frontBaselineKpa: baseFront,
      rearBaselineKpa: baseRear,
      weather: { available: false, errorMessage: 'fail', locationLabel: '', rideTempC: 0, isWetForecast: false, providerId: '', attribution: '', confidence: 'none' },
      wetMode: 'auto',
      inflationTempC: null,
      inflationAssumed: false,
    })
    expect(outcome.active).toBe(false)
    expect(outcome.unavailableMessage).toMatch(/Weather unavailable/i)
  })

  it('does not apply a wet percentage inside the temperature step', () => {
    const outcome = applyWeatherPressureAdjustments({
      frontBaselineKpa: baseFront,
      rearBaselineKpa: baseRear,
      weather: weather({ isWetForecast: true, moisture: 'wet' }),
      wetMode: 'wet',
      moisture: 'wet',
      inflationTempC: 10,
      inflationAssumed: false,
    })
    expect(outcome.active).toBe(true)
    expect(outcome.front!.targetRidingGaugeKpa).toBeCloseTo(baseFront, 3)
    expect(outcome.wetLabel).toMatch(/Wet/)
  })

  it('respects manufacturer limits after correction', () => {
    const outcome = applyWeatherPressureAdjustments({
      frontBaselineKpa: baseFront,
      rearBaselineKpa: baseRear,
      frontMinKpa: psiToKpa(68),
      frontMaxKpa: psiToKpa(72),
      weather: weather({ rideTempC: 30, currentAmbientTempC: 5 }),
      wetMode: 'dry',
      inflationTempC: 5,
      inflationAssumed: false,
    })
    expect(outcome.front!.coldInflationGaugeKpa).toBeLessThanOrEqual(psiToKpa(72) + 0.01)
    expect(outcome.front!.coldInflationGaugeKpa).toBeGreaterThanOrEqual(psiToKpa(68) - 0.01)
  })

  it('dry override skips wet adjustment', () => {
    const outcome = applyWeatherPressureAdjustments({
      frontBaselineKpa: baseFront,
      rearBaselineKpa: baseRear,
      weather: weather({ isWetForecast: true }),
      wetMode: 'dry',
      inflationTempC: 10,
      inflationAssumed: false,
    })
    expect(outcome.front!.targetRidingGaugeKpa).toBeCloseTo(baseFront, 3)
  })

  it('one weather-enabled step cannot wildly change cold inflation from a single temperature delta', () => {
    const outcome = applyWeatherPressureAdjustments({
      frontBaselineKpa: baseFront,
      rearBaselineKpa: baseRear,
      weather: weather({ rideTempC: 25, currentAmbientTempC: 5 }),
      wetMode: 'dry',
      inflationTempC: 5,
      inflationAssumed: false,
    })
    const deltaPsi = (baseFront - outcome.front!.coldInflationGaugeKpa) / KPA_PER_PSI
    expect(Math.abs(deltaPsi)).toBeLessThan(8)
  })

  it('uses assumed inflation temperature when unknown', () => {
    const resolved = resolveInflationTemperature(null, undefined)
    expect(resolved.assumed).toBe(true)
  })
})
