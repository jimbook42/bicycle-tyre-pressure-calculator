import { describe, expect, it } from 'vitest'
import { calculatePressure, systemWeightKg } from './pressureEngine'
import { effectiveIri, targetDeflectionFraction } from './surfaceModel'
import { deflectionModifiers } from './modifiers'
import { hooklessMaxKpa } from './safetyEnvelope'
import { coldInflationGaugeKpa, atmosphericPressureKpa } from '../weather/temperaturePhysics'
import { personalisePressure } from './personalisation'
import { kpaToPsi, psiToKpa } from './units'
import { RENART_ALPHA, TUBE_COEFFICIENTS } from '../data/v2ModelConstants'
import type { CalculatorInput, RideFeedback, RideFeel } from '../types'

function input(overrides: Partial<CalculatorInput> = {}): CalculatorInput {
  const base: CalculatorInput = {
    rider: { weightKg: 75 },
    bike: { weightKg: 9 },
    ride: { type: 'road', gravelPercent: 0, packWeightKg: 0 },
    tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'tubeless' },
    advanced: { rimType: 'hooked', wheelDiameterInches: 28, rimInternalWidthMm: 19 },
  }
  return {
    ...base,
    ...overrides,
    ride: { ...base.ride, ...overrides.ride },
    tyres: { ...base.tyres, ...overrides.tyres },
    advanced: { ...base.advanced, ...overrides.advanced },
  }
}

describe('V2 physics', () => {
  it('increases pressure when wheel load increases', () => {
    const light = calculatePressure(input())
    const heavy = calculatePressure(input({ rider: { weightKg: 95 } }))
    expect(heavy.front.targetKpa).toBeGreaterThan(light.front.targetKpa)
    expect(heavy.rear.targetKpa).toBeGreaterThan(light.rear.targetKpa)
  })

  it('decreases pressure when target deflection increases', () => {
    const smooth = calculatePressure(input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0 } }))
    const rough = calculatePressure(input({ ride: { type: 'gravel', gravelPercent: 0, packWeightKg: 0 } }))
    expect(rough.front.deflectionFraction!).toBeGreaterThan(smooth.front.deflectionFraction!)
    expect(rough.front.targetKpa).toBeLessThan(smooth.front.targetKpa)
  })

  it('keeps front/rear pressure ratio equal to the load ratio for identical tyres', () => {
    const result = calculatePressure(input())
    const pressureRatio = result.front.targetKpa / result.rear.targetKpa
    const loadRatio = result.front.wheelLoadKg / result.rear.wheelLoadKg
    expect(pressureRatio).toBeCloseTo(loadRatio, 6)
    expect(result.frontLoadPercent).toBe(40)
    expect(result.rearLoadPercent).toBe(60)
  })

  it('lowers pressure on a wider tyre', () => {
    const narrow = calculatePressure(input())
    const wide = calculatePressure(
      input({ tyres: { frontWidthMm: 40, rearWidthMm: 40, tubeType: 'tubeless' } }),
    )
    expect(wide.front.targetKpa).toBeLessThan(narrow.front.targetKpa)
    expect(wide.rear.targetKpa).toBeLessThan(narrow.rear.targetKpa)
  })

  it('changes pressure continuously with rim internal width', () => {
    const a = calculatePressure(input({ advanced: { rimInternalWidthMm: 19 } }))
    const b = calculatePressure(input({ advanced: { rimInternalWidthMm: 19.2 } }))
    const relative = Math.abs(a.front.targetKpa - b.front.targetKpa) / a.front.targetKpa
    expect(relative).toBeGreaterThan(0)
    expect(relative).toBeLessThan(0.03)
  })

  it('uses wheel diameter through the bead-seat diameter', () => {
    const road700 = calculatePressure(input({ advanced: { wheelDiameterInches: 28 } }))
    const twentySix = calculatePressure(input({ advanced: { wheelDiameterInches: 26 } }))
    expect(road700.front.beadSeatDiameterMm).toBe(622)
    expect(twentySix.front.beadSeatDiameterMm).toBe(559)
    expect(road700.front.targetKpa).not.toBeCloseTo(twentySix.front.targetKpa, 1)
  })

  it('does not use the Berto regression or a 10 PSI floor', () => {
    const result = calculatePressure(
      input({
        rider: { weightKg: 95 },
        bike: { weightKg: 9 },
        tyres: { frontWidthMm: 35, rearWidthMm: 35, tubeType: 'tubeless' },
      }),
    )
    const widthPow = 35 ** 1.5785
    const bertoFrontPsi = (153.6 * (41.6 * 2.2046226218)) / widthPow - 7.1685
    expect(Math.abs(kpaToPsi(result.front.targetKpa) - bertoFrontPsi)).toBeGreaterThan(5)
    expect(result.front.clampedKpa).not.toBeCloseTo(69, 0)
    expect(result.front.targetKpa).toBeGreaterThan(69)
  })
})

describe('V2 surface', () => {
  it('assigns higher IRI to rougher ride types', () => {
    expect(effectiveIri('road', 0)).toBeLessThan(effectiveIri('commute', 0))
    expect(effectiveIri('commute', 0)).toBeLessThan(effectiveIri('gravel', 0))
  })

  it('combines mixed surfaces by RMS and stays monotonic in gravel percentage', () => {
    const half = effectiveIri('mixed', 50)
    const expected = Math.sqrt(0.5 * 4 ** 2 + 0.5 * 12 ** 2)
    expect(half).toBeCloseTo(expected, 6)
    expect(effectiveIri('mixed', 0)).toBeCloseTo(effectiveIri('road', 0), 6)
    expect(effectiveIri('mixed', 100)).toBeCloseTo(effectiveIri('gravel', 0), 6)
    const pressures = [0, 25, 50, 75, 100].map(
      (gravelPercent) =>
        calculatePressure(input({ ride: { type: 'mixed', gravelPercent, packWeightKg: 0 } })).front
          .targetKpa,
    )
    for (let i = 1; i < pressures.length; i++) {
      expect(pressures[i]).toBeLessThanOrEqual(pressures[i - 1])
    }
    expect(pressures[2]).toBeLessThan(pressures[0])
    expect(pressures[4]).toBeCloseTo(pressures[3], 4)
    const road = calculatePressure(input()).front.targetKpa
    const gravel = calculatePressure(
      input({ ride: { type: 'gravel', gravelPercent: 0, packWeightKg: 0 } }),
    ).front.targetKpa
    const mixed = calculatePressure(
      input({ ride: { type: 'mixed', gravelPercent: 50, packWeightKg: 0 } }),
    ).front.targetKpa
    expect(mixed).toBeLessThan(road)
    expect(mixed).toBeGreaterThan(gravel)
    expect(mixed).not.toBeCloseTo((road + gravel) / 2, 0)
  })

  it('has no jump in deflection at the transition boundaries', () => {
    expect(targetDeflectionFraction(5)).toBeCloseTo(targetDeflectionFraction(4.999), 5)
    expect(targetDeflectionFraction(5)).toBeCloseTo(0.15, 6)
    expect(targetDeflectionFraction(10)).toBeCloseTo(targetDeflectionFraction(10.001), 5)
    expect(targetDeflectionFraction(10)).toBeCloseTo(0.25, 6)
    expect(targetDeflectionFraction(7.5)).toBeGreaterThan(0.15)
    expect(targetDeflectionFraction(7.5)).toBeLessThan(0.25)
  })
})

describe('V2 speed and wet', () => {
  it('uses the reference speed when speed is omitted', () => {
    const omitted = calculatePressure(input())
    const explicit = calculatePressure(
      input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, expectedSpeedKmh: 25 } }),
    )
    expect(omitted.speedAssumed).toBe(true)
    expect(omitted.speedKmh).toBe(25)
    expect(omitted.front.targetKpa).toBeCloseTo(explicit.front.targetKpa, 6)
  })

  it('moves pressure monotonically and within a bound as speed changes', () => {
    const low = calculatePressure(
      input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, expectedSpeedKmh: 5 } }),
    )
    const mid = calculatePressure(
      input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, expectedSpeedKmh: 25 } }),
    )
    const high = calculatePressure(
      input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, expectedSpeedKmh: 45 } }),
    )
    expect(low.front.targetKpa).toBeLessThan(mid.front.targetKpa)
    expect(mid.front.targetKpa).toBeLessThan(high.front.targetKpa)
    const ratio = high.front.targetKpa / mid.front.targetKpa
    expect(ratio).toBeGreaterThan(1)
    expect(ratio).toBeLessThan(1.1)
    const mods = deflectionModifiers(80, 'dry')
    expect(mods.factor).toBeGreaterThanOrEqual(0.96)
    expect(mods.factor).toBeLessThanOrEqual(1.06)
  })

  it('applies no wet change when dry and a bounded reduction when wet', () => {
    const dry = calculatePressure(input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, moisture: 'dry' } }))
    const wet = calculatePressure(input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, moisture: 'wet' } }))
    expect(dry.front.targetKpa).toBeGreaterThan(wet.front.targetKpa)
    const ratio = wet.front.targetKpa / dry.front.targetKpa
    expect(ratio).toBeGreaterThan(0.9)
    expect(ratio).toBeLessThan(1)
    expect(Math.abs(ratio - 0.97)).toBeGreaterThan(0.005)
  })

  it('keeps wet plus high speed bounded and inside the safety cap', () => {
    const dry = calculatePressure(input())
    const combined = calculatePressure(
      input({
        ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, moisture: 'wet', expectedSpeedKmh: 45 },
        advanced: { frontManufacturerLimits: { maxKpa: psiToKpa(40) }, rearManufacturerLimits: { maxKpa: psiToKpa(40) } },
      }),
    )
    expect(combined.front.clampedKpa).toBeLessThanOrEqual(psiToKpa(40) + 0.01)
    expect(combined.rear.clampedKpa).toBeLessThanOrEqual(psiToKpa(40) + 0.01)
    const uncapped = calculatePressure(
      input({
        ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, moisture: 'wet', expectedSpeedKmh: 45 },
      }),
    )
    const ratio = uncapped.front.targetKpa / dry.front.targetKpa
    expect(ratio).toBeGreaterThan(0.9)
    expect(ratio).toBeLessThan(1.1)
  })
})

describe('V2 construction and safety', () => {
  it('keeps tube and casing coefficients neutral', () => {
    const tubeless = calculatePressure(input())
    for (const tubeType of ['butyl', 'tpu', 'latex'] as const) {
      const other = calculatePressure(input({ tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType } }))
      expect(other.front.targetKpa).toBeCloseTo(tubeless.front.targetKpa, 6)
      expect(TUBE_COEFFICIENTS[tubeType]).toBe(1)
    }
    const race = calculatePressure(
      input({ tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'tubeless', casing: 'race' } }),
    )
    const endurance = calculatePressure(
      input({ tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'tubeless', casing: 'endurance' } }),
    )
    expect(race.front.targetKpa).toBeCloseTo(tubeless.front.targetKpa, 6)
    expect(endurance.front.targetKpa).toBeCloseTo(tubeless.front.targetKpa, 6)
    expect(RENART_ALPHA).toBe(1.259)
  })

  it('treats an unknown tube coefficient as neutral', () => {
    const known = calculatePressure(input())
    const unknown = calculatePressure(
      input({ tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'mystery' as 'tubeless' } }),
    )
    expect(unknown.tubeCoefficient).toBe(1)
    expect(unknown.front.targetKpa).toBeCloseTo(known.front.targetKpa, 6)
    expect(unknown.warnings.join(' ')).toMatch(/not recognised/i)
  })

  it('enforces tyre maximum, rim-compatible hookless cap, and manufacturer override', () => {
    const capped = calculatePressure(
      input({
        advanced: {
          rimType: 'hooked',
          frontManufacturerLimits: { maxKpa: psiToKpa(50) },
        },
      }),
    )
    expect(capped.front.clampedKpa).toBeLessThanOrEqual(psiToKpa(50) + 0.01)
    expect(capped.front.clampedToMax).toBe(true)

    const hookless = calculatePressure(input({ advanced: { rimType: 'hookless' } }))
    expect(hooklessMaxKpa(28)).toBe(500)
    expect(hookless.front.clampedKpa).toBeLessThanOrEqual(500 + 0.01)
    expect(hookless.front.hooklessChecked).toBe(true)

    const lowerManufacturer = calculatePressure(
      input({
        advanced: {
          rimType: 'hookless',
          frontManufacturerLimits: { maxKpa: psiToKpa(40) },
        },
      }),
    )
    expect(lowerManufacturer.front.clampedKpa).toBeLessThanOrEqual(psiToKpa(40) + 0.01)

    const unknown = calculatePressure(input({ advanced: { rimType: undefined } }))
    expect(unknown.front.hooklessChecked).toBe(true)
    expect(unknown.warnings.join(' ')).toMatch(/hookless/i)
    expect(unknown.front.clampedKpa).toBeLessThanOrEqual(500 + 0.01)
  })

  it('raises pressure to the deflection floor rather than a 10 PSI synthetic minimum', () => {
    const soft = calculatePressure(
      input({
        rider: { weightKg: 40 },
        bike: { weightKg: 8 },
        ride: { type: 'gravel', gravelPercent: 0, packWeightKg: 0, moisture: 'wet' },
        tyres: { frontWidthMm: 50, rearWidthMm: 50, tubeType: 'tubeless' },
      }),
    )
    expect(soft.front.deflectionFloorKpa).toBeDefined()
    expect(soft.front.clampedKpa).toBeGreaterThanOrEqual((soft.front.deflectionFloorKpa ?? 0) - 0.01)
    expect(soft.front.safetyMinKpa).not.toBeCloseTo(69, 0)
  })

  it('enforces an explicit manufacturer minimum', () => {
    const result = calculatePressure(
      input({
        advanced: {
          frontManufacturerLimits: { minKpa: psiToKpa(100) },
        },
      }),
    )
    expect(result.front.clampedKpa).toBeGreaterThanOrEqual(psiToKpa(100) - 0.01)
    expect(result.front.clampedToMin).toBe(true)
  })
})

describe('V2 temperature and personalisation guards', () => {
  it('reproduces the 50 PSI, 10°C ride, 20°C fill example near 52.3 PSI', () => {
    const pump = coldInflationGaugeKpa(psiToKpa(50), 10, 20)
    expect(kpaToPsi(pump)).toBeCloseTo(52.3, 1)
  })

  it('moves pump pressure monotonically as the ride gets colder', () => {
    const warmRide = coldInflationGaugeKpa(psiToKpa(50), 25, 20)
    const coldRide = coldInflationGaugeKpa(psiToKpa(50), 5, 20)
    expect(coldRide).toBeGreaterThan(warmRide)
  })

  it('lowers atmospheric pressure at altitude', () => {
    expect(atmosphericPressureKpa(undefined)).toBeCloseTo(101.325, 3)
    expect(atmosphericPressureKpa(1500)).toBeLessThan(atmosphericPressureKpa(0))
  })

  it('does not let personalisation change the Renart coefficient', () => {
    const before = RENART_ALPHA
    const baseline = calculatePressure(input())
    const records: RideFeedback[] = [
      {
        id: '1',
        createdAt: '2026-01-01T00:00:00.000Z',
        bikeId: 'b',
        bikeName: 'Bike',
        setupKey: 'same',
        rideType: 'road',
        gravelPercent: 0,
        systemWeightKg: baseline.systemWeightKg,
        tubeType: 'tubeless',
        frontWidthMm: 28,
        rearWidthMm: 28,
        baselineFrontKpa: baseline.front.clampedKpa,
        baselineRearKpa: baseline.rear.clampedKpa,
        actualFrontKpa: baseline.front.clampedKpa - psiToKpa(4),
        actualRearKpa: baseline.rear.clampedKpa,
        result: 'good' satisfies RideFeel,
        frontFeel: 'too_soft',
        rearFeel: 'good',
        notes: '',
      },
    ]
    const adjusted = personalisePressure(baseline, records, 'same')
    expect(RENART_ALPHA).toBe(before)
    expect(adjusted.front.offsetKpa).not.toBe(0)
    expect(adjusted.rear.personalisedKpa).toBeCloseTo(baseline.rear.clampedKpa, 5)
    const untouched = personalisePressure(baseline, [], 'same')
    expect(untouched.front.personalisedKpa).toBeCloseTo(baseline.front.clampedKpa, 6)
    expect(untouched.active).toBe(false)
  })

  it('includes pack weight in system mass for every ride type', () => {
    const withPack = input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 4 } })
    expect(systemWeightKg(withPack)).toBe(75 + 9 + 4)
    expect(calculatePressure(withPack).front.targetKpa).toBeGreaterThan(
      calculatePressure(input()).front.targetKpa,
    )
  })
})
