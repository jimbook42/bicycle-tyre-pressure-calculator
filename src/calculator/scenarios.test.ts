import { describe, expect, it } from 'vitest'
import { applyWeatherPressureAdjustments } from './weatherAdjustment'
import { calculatePressure } from './pressureEngine'
import { personalisePressure } from './personalisation'
import { kpaToPsi, psiToKpa } from './units'
import type { CalculatorInput, RideFeedback } from '../types'
import type { ProcessedRideWeather } from '../weather/weatherProvider'

function input(overrides: Partial<CalculatorInput> = {}): CalculatorInput {
  const modelAdvanced = {
    rimType: 'hooked' as const,
    wheelDiameterInches: 28,
    rimInternalWidthMm: 19,
  }
  return {
    rider: { weightKg: 75 },
    bike: { weightKg: 9 },
    ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, ...overrides.ride },
    tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'tubeless', ...overrides.tyres },
    advanced:
      overrides.advanced !== undefined ? overrides.advanced : modelAdvanced,
    ...('rider' in overrides ? { rider: overrides.rider } : {}),
    ...('bike' in overrides ? { bike: overrides.bike } : {}),
  }
}

function weather(partial: Partial<ProcessedRideWeather>): ProcessedRideWeather {
  return {
    available: true,
    locationLabel: 'Wellington',
    rideTempC: 14,
    currentAmbientTempC: 18,
    isWetForecast: false,
    providerId: 'test',
    attribution: 'test',
    confidence: 'full',
    ...partial,
  }
}

describe('representative scenarios', () => {
  it('1-4 ride types and 8-10 tube types', () => {
    const road = calculatePressure(input())
    const gravel = calculatePressure(input({ ride: { type: 'gravel', gravelPercent: 0, packWeightKg: 0 } }))
    const commute = calculatePressure(
      input({ ride: { type: 'commute', gravelPercent: 0, packWeightKg: 6 } }),
    )
    const mixed = calculatePressure(
      input({ ride: { type: 'mixed', gravelPercent: 50, packWeightKg: 0 } }),
    )
    expect(road.rear.clampedKpa).toBeGreaterThan(road.front.clampedKpa)
    expect(gravel.front.targetKpa).toBeLessThan(road.front.targetKpa)
    expect(commute.systemWeightKg).toBe(90)
    expect(commute.systemWeightKg).toBeGreaterThan(road.systemWeightKg)
    expect(mixed.front.targetKpa).toBeGreaterThan(gravel.front.targetKpa)
    expect(mixed.front.targetKpa).toBeLessThan(road.front.targetKpa)

    const butyl = calculatePressure(input({ tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'butyl' } }))
    const tpu = calculatePressure(input({ tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'tpu' } }))
    expect(butyl.front.clampedKpa).toBeCloseTo(road.front.clampedKpa, 5)
    expect(tpu.front.clampedKpa).toBeCloseTo(road.front.clampedKpa, 5)
  })

  it('5-7 blank advanced, measured width, and manufacturer limits', () => {
    const blank = calculatePressure(input({ advanced: {} }))
    const measured = calculatePressure(input({ advanced: { frontMeasuredWidthMm: 32 } }))
    const limited = calculatePressure(
      input({
        advanced: {
          frontManufacturerLimits: { minKpa: psiToKpa(40), maxKpa: psiToKpa(45) },
        },
      }),
    )
    expect(blank.front.clampedKpa).toBeGreaterThan(0)
    expect(measured.front.clampedKpa).toBeLessThan(blank.front.clampedKpa)
    expect(kpaToPsi(limited.front.clampedKpa)).toBeLessThanOrEqual(45)
    expect(blank.inputsUsed.join(' ')).not.toMatch(/Wheel diameter/)
  })

  it('11-14 weather future, failure, wet override, and manual inflation', () => {
    const base = calculatePressure(input())
    const future = applyWeatherPressureAdjustments({
      frontBaselineKpa: base.front.clampedKpa,
      rearBaselineKpa: base.rear.clampedKpa,
      weather: weather({ rideTempC: 8, currentAmbientTempC: 20 }),
      wetMode: 'auto',
      inflationTempC: 20,
      inflationAssumed: false,
    })
    expect(future.active).toBe(true)
    expect(future.front!.coldInflationGaugeKpa).toBeGreaterThan(future.front!.targetRidingGaugeKpa)

    const failed = applyWeatherPressureAdjustments({
      frontBaselineKpa: base.front.clampedKpa,
      rearBaselineKpa: base.rear.clampedKpa,
      weather: null,
      wetMode: 'auto',
      inflationTempC: null,
      inflationAssumed: false,
    })
    expect(failed.active).toBe(false)
    expect(failed.unavailableMessage).toMatch(/Weather unavailable/)

    const wetRide = calculatePressure(
      input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, moisture: 'wet' } }),
    )
    expect(wetRide.front.targetKpa).toBeLessThan(base.front.targetKpa)
    expect(wetRide.front.targetKpa / base.front.targetKpa).toBeCloseTo(0.96, 2)
  })

  it('15-16 repeated Good feedback, including a pressure different from the recommendation', () => {
    const base = calculatePressure(input())
    const key = 'bike|road|0|28|28|0|0|tubeless|84'
    const records: RideFeedback[] = Array.from({ length: 5 }, (_, index) => ({
      id: String(index),
      createdAt: `2026-09-0${index + 1}T00:00:00.000Z`,
      bikeId: 'bike',
      bikeName: 'Road',
      setupKey: key,
      rideType: 'road',
      gravelPercent: 0,
      systemWeightKg: 84,
      tubeType: 'tubeless',
      frontWidthMm: 28,
      rearWidthMm: 28,
      baselineFrontKpa: base.front.clampedKpa,
      baselineRearKpa: base.rear.clampedKpa,
      actualFrontKpa: base.front.clampedKpa - psiToKpa(4),
      actualRearKpa: base.rear.clampedKpa - psiToKpa(4),
      result: 'good',
      notes: '',
    }))
    const adjusted = personalisePressure(base, records, key)
    expect(adjusted.front.personalisedKpa).toBeLessThan(base.front.clampedKpa)
    expect(adjusted.front.personalisedKpa).toBeGreaterThan(base.front.clampedKpa - psiToKpa(8.1))
    expect(records[0].actualFrontKpa).not.toBe(records[0].baselineFrontKpa)
  })
})
