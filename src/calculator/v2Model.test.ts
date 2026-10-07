import { describe, expect, it } from 'vitest'
import { calculatePressure, systemWeightKg } from './pressureEngine'
import { bertoBaseline, bertoRegressionPsi, LB_PER_KG } from './bertoBaseline'
import { formatFactorPercent, surfaceCondition, wetPressureFactor } from './conditionModel'
import { hooklessMaxKpa } from './safetyEnvelope'
import { coldInflationGaugeKpa } from '../weather/temperaturePhysics'
import { applyWeatherPressureAdjustments } from './weatherAdjustment'
import { personalisePressure } from './personalisation'
import { kpaToPsi, psiToKpa } from './units'
import { KPA_PER_PSI } from '../data/constants'
import {
  SURFACE_FACTOR_BOUND,
  SURFACE_FACTOR_HARDPACK,
  SURFACE_FACTOR_NORMAL_ROAD,
  SURFACE_FACTOR_ROUGH_GRAVEL,
  SURFACE_FACTOR_ROUGH_ROAD,
  SURFACE_FACTOR_SMOOTH_ROAD,
  SURFACE_FACTOR_TYPICAL_GRAVEL,
  SURFACE_FACTOR_VERY_ROUGH_GRAVEL,
  WET_FACTOR_BOUND,
  WET_PRESSURE_FACTOR,
} from '../data/v21ModelConstants'
import { RENART_ALPHA, TUBE_COEFFICIENTS } from '../data/v2ModelConstants'
import { renartGaugePressurePa, renartGeometry } from './renart'
import type { CalculatorInput, RideFeedback, RideFeel, RideType } from '../types'

function input(overrides: Partial<CalculatorInput> = {}): CalculatorInput {
  const base: CalculatorInput = {
    rider: { weightKg: 75 },
    bike: { weightKg: 9 },
    ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, moisture: 'dry' },
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

function at(type: RideType, moisture: 'dry' | 'wet' | 'damp' = 'dry') {
  return calculatePressure(
    input({ ride: { type, gravelPercent: type === 'mixed' ? 40 : 0, packWeightKg: 0, moisture } }),
  )
}

describe('V2.1 Berto baseline', () => {
  it('uses the Adams regression, not a claim that the formula is Berto’s', () => {
    const psi = bertoRegressionPsi(45, 20)
    expect(psi).toBeCloseTo((153.6 * (45 * LB_PER_KG)) / 20 ** 1.5785 - 7.1685, 6)
  })

  it('stays near the published Bicycle Quarterly worked examples', () => {
    const anchors = [
      { kg: 45, mm: 20, psi: 125 },
      { kg: 55, mm: 20, psi: 155 },
      { kg: 45, mm: 37, psi: 45 },
      { kg: 55, mm: 37, psi: 53 },
    ]
    for (const anchor of anchors) {
      expect(Math.abs(bertoRegressionPsi(anchor.kg, anchor.mm) - anchor.psi)).toBeLessThan(4)
    }
  })

  it('stays in the approximate 100 lb chart region', () => {
    const table = [
      [20, 126],
      [23, 106],
      [25, 88],
      [28, 76],
      [32, 60],
      [37, 46],
    ] as const
    const loadKg = 100 / LB_PER_KG
    for (const [width, psi] of table) {
      expect(Math.abs(bertoRegressionPsi(loadKg, width) - psi)).toBeLessThan(6)
    }
  })

  it('places the 37.5 mm, 100 lb audit case in the empirical region rather than the Renart result', () => {
    const loadKg = 100 / LB_PER_KG
    const bertoPsi = bertoRegressionPsi(loadKg, 37.5)
    expect(bertoPsi).toBeGreaterThan(38)
    expect(bertoPsi).toBeLessThan(52)

    const geometry = renartGeometry(0.0375, 0.019, 0.622)
    expect(geometry.valid).toBe(true)
    const renartPsi =
      renartGaugePressurePa(loadKg * 9.80665, geometry, 0.15 * geometry.sectionHeightM) /
      1000 /
      KPA_PER_PSI
    expect(Math.abs(bertoPsi - renartPsi)).toBeGreaterThan(8)

    const result = calculatePressure(
      input({
        rider: { weightKg: loadKg },
        bike: { weightKg: 0 },
        tyres: { frontWidthMm: 37.5, rearWidthMm: 37.5, tubeType: 'tubeless' },
        advanced: { rimType: 'hooked', frontLoadPercent: 100 },
      }),
    )
    expect(kpaToPsi(result.front.bertoBaselineKpa)).toBeCloseTo(bertoPsi, 4)
    expect(result.front.extrapolated).toBe(true)
    expect(kpaToPsi(result.front.targetKpa)).toBeCloseTo(bertoPsi, 4)
  })

  it('raises pressure with wheel load and lowers it with width', () => {
    const light = calculatePressure(input())
    const heavy = calculatePressure(input({ rider: { weightKg: 95 } }))
    expect(heavy.front.bertoBaselineKpa).toBeGreaterThan(light.front.bertoBaselineKpa)
    expect(heavy.rear.bertoBaselineKpa).toBeGreaterThan(light.rear.bertoBaselineKpa)

    const wide = calculatePressure(
      input({ tyres: { frontWidthMm: 32, rearWidthMm: 32, tubeType: 'tubeless' } }),
    )
    expect(wide.front.bertoBaselineKpa).toBeLessThan(light.front.bertoBaselineKpa)
  })

  it('calculates front and rear independently and does not force the load ratio', () => {
    const result = calculatePressure(input())
    const pressureRatio = result.front.bertoBaselineKpa / result.rear.bertoBaselineKpa
    const loadRatio = result.front.wheelLoadKg / result.rear.wheelLoadKg
    expect(pressureRatio).not.toBeCloseTo(loadRatio, 2)
    expect(result.rear.bertoBaselineKpa).toBeGreaterThan(result.front.bertoBaselineKpa)

    const widerRear = calculatePressure(
      input({ tyres: { frontWidthMm: 28, rearWidthMm: 32, tubeType: 'tubeless' } }),
    )
    expect(widerRear.front.bertoBaselineKpa).toBeCloseTo(result.front.bertoBaselineKpa, 5)
    expect(widerRear.rear.bertoBaselineKpa).toBeLessThan(result.rear.bertoBaselineKpa)
  })

  it('prefers measured width over the labelled width', () => {
    const labelled = calculatePressure(input())
    const measured = calculatePressure(input({ advanced: { frontMeasuredWidthMm: 32 } }))
    expect(measured.front.widthMeasured).toBe(true)
    expect(measured.front.effectiveWidthMm).toBe(32)
    expect(labelled.front.widthMeasured).toBe(false)
    expect(measured.front.bertoBaselineKpa).toBeLessThan(labelled.front.bertoBaselineKpa)
    expect(measured.rear.bertoBaselineKpa).toBeCloseTo(labelled.rear.bertoBaselineKpa, 5)
  })

  it('does not let rim width, wheel size, speed, casing, or tube type change PSI', () => {
    const base = calculatePressure(input())
    const otherRim = calculatePressure(input({ advanced: { rimInternalWidthMm: 25 } }))
    const otherWheel = calculatePressure(input({ advanced: { wheelDiameterInches: 26 } }))
    const slow = calculatePressure(
      input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, expectedSpeedKmh: 5 } }),
    )
    const fast = calculatePressure(
      input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, expectedSpeedKmh: 45 } }),
    )
    expect(otherRim.front.targetKpa).toBeCloseTo(base.front.targetKpa, 6)
    expect(otherWheel.front.targetKpa).toBeCloseTo(base.front.targetKpa, 6)
    expect(slow.front.targetKpa).toBeCloseTo(fast.front.targetKpa, 6)
    expect(slow.speedApplied).toBe(false)

    for (const tubeType of ['butyl', 'tpu', 'latex'] as const) {
      const other = calculatePressure(input({ tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType } }))
      expect(other.front.targetKpa).toBeCloseTo(base.front.targetKpa, 6)
      expect(TUBE_COEFFICIENTS[tubeType]).toBe(1)
    }
    const race = calculatePressure(
      input({ tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'tubeless', casing: 'race' } }),
    )
    expect(race.front.targetKpa).toBeCloseTo(base.front.targetKpa, 6)
    expect(RENART_ALPHA).toBe(1.259)
  })
})

describe('V2.1 surface and wet adjustments', () => {
  it('orders road and gravel conditions and keeps the adjustment bounded', () => {
    const smooth = at('road-smooth').front.targetKpa
    const normal = at('road').front.targetKpa
    const rough = at('road-rough').front.targetKpa
    const hardpack = at('gravel-hardpack').front.targetKpa
    const typical = at('gravel').front.targetKpa
    const roughGravel = at('gravel-rough').front.targetKpa
    const veryRough = at('gravel-very-rough').front.targetKpa

    expect(smooth).toBeGreaterThan(normal)
    expect(normal).toBeGreaterThan(rough)
    expect(hardpack).toBeLessThan(normal)
    expect(typical).toBeLessThan(hardpack)
    expect(roughGravel).toBeLessThan(typical)
    expect(veryRough).toBeLessThan(roughGravel)

    for (const factor of [
      SURFACE_FACTOR_SMOOTH_ROAD,
      SURFACE_FACTOR_NORMAL_ROAD,
      SURFACE_FACTOR_ROUGH_ROAD,
      SURFACE_FACTOR_HARDPACK,
      SURFACE_FACTOR_TYPICAL_GRAVEL,
      SURFACE_FACTOR_ROUGH_GRAVEL,
      SURFACE_FACTOR_VERY_ROUGH_GRAVEL,
    ]) {
      expect(Math.abs(factor - 1)).toBeLessThanOrEqual(SURFACE_FACTOR_BOUND)
    }
    expect(at('commute').front.targetKpa).toBeCloseTo(rough, 5)
  })

  it('weights a mixed ride between normal road and typical gravel', () => {
    const mixed = calculatePressure(
      input({ ride: { type: 'mixed', gravelPercent: 50, packWeightKg: 0 } }),
    )
    const road = at('road').front.targetKpa
    const gravel = at('gravel').front.targetKpa
    expect(mixed.front.targetKpa).toBeCloseTo((road + gravel) / 2, 4)
    expect(mixed.surfaceFactor).toBeCloseTo(
      0.5 * SURFACE_FACTOR_NORMAL_ROAD + 0.5 * SURFACE_FACTOR_TYPICAL_GRAVEL,
      6,
    )
    expect(formatFactorPercent(1)).toBe('0%')
  })

  it('lowers wet pressure by the bounded calibration and does not bypass safety limits', () => {
    const dry = at('road', 'dry')
    const wet = at('road', 'wet')
    const damp = at('road', 'damp')
    expect(wet.front.targetKpa).toBeLessThan(dry.front.targetKpa)
    expect(wet.front.targetKpa / dry.front.targetKpa).toBeCloseTo(WET_PRESSURE_FACTOR, 5)
    expect(damp.front.targetKpa).toBeCloseTo(wet.front.targetKpa, 5)
    expect(Math.abs(WET_PRESSURE_FACTOR - 1)).toBeLessThanOrEqual(WET_FACTOR_BOUND + 1e-9)
    expect(wetPressureFactor('dry')).toBe(1)

    const capped = calculatePressure(
      input({
        ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, moisture: 'wet' },
        advanced: {
          rimType: 'hooked',
          frontManufacturerLimits: { minKpa: psiToKpa(90) },
          rearManufacturerLimits: { minKpa: psiToKpa(90) },
        },
      }),
    )
    expect(capped.front.clampedKpa).toBeGreaterThanOrEqual(psiToKpa(90) - 0.01)
    expect(capped.front.clampedToMin).toBe(true)
    expect(capped.front.targetKpa).toBeLessThan(capped.front.clampedKpa)
  })
})

describe('V2.1 safety, temperature, and personalisation', () => {
  it('caps at a manufacturer maximum without pretending the cap was the target', () => {
    const result = calculatePressure(
      input({
        advanced: { rimType: 'hooked', frontManufacturerLimits: { maxKpa: psiToKpa(40) } },
      }),
    )
    expect(result.front.clampedToMax).toBe(true)
    expect(result.front.clampedKpa).toBeLessThanOrEqual(psiToKpa(40) + 0.01)
    expect(result.front.targetKpa).toBeGreaterThan(result.front.clampedKpa)
    expect(result.front.bertoBaselineKpa).toBeGreaterThan(result.front.clampedKpa)
  })

  it('raises pressure to a manufacturer minimum and does not invent a Renart floor', () => {
    const soft = calculatePressure(
      input({
        rider: { weightKg: 45 },
        bike: { weightKg: 8 },
        ride: { type: 'gravel-very-rough', gravelPercent: 0, packWeightKg: 0, moisture: 'wet' },
        tyres: { frontWidthMm: 40, rearWidthMm: 40, tubeType: 'tubeless' },
      }),
    )
    expect(soft.front.clampedKpa).toBeCloseTo(soft.front.targetKpa, 5)
    expect(soft.front.clampedToMin).toBe(false)

    const raised = calculatePressure(
      input({
        advanced: { frontManufacturerLimits: { minKpa: psiToKpa(100) } },
      }),
    )
    expect(raised.front.clampedKpa).toBeGreaterThanOrEqual(psiToKpa(100) - 0.01)
    expect(raised.front.clampedToMin).toBe(true)
  })

  it('applies the hookless cap and keeps an invalid minimum from exceeding it', () => {
    const hookless = calculatePressure(
      input({
        rider: { weightKg: 110 },
        bike: { weightKg: 12 },
        advanced: { rimType: 'hookless' },
      }),
    )
    expect(hooklessMaxKpa(28)).toBe(500)
    expect(hookless.rear.hooklessChecked).toBe(true)
    expect(hookless.rear.clampedKpa).toBeLessThanOrEqual(500 + 0.01)

    const conflict = calculatePressure(
      input({
        advanced: {
          rimType: 'hookless',
          frontManufacturerLimits: { minKpa: 800, maxKpa: 400 },
        },
      }),
    )
    expect(conflict.front.conflictingLimits).toBe(true)
    expect(conflict.front.clampedKpa).toBeLessThanOrEqual(400 + 0.01)
  })

  it('applies temperature once, to the riding target, and not inside the baseline', () => {
    const riding = calculatePressure(input())
    const pump = coldInflationGaugeKpa(riding.front.clampedKpa, 10, 20)
    expect(kpaToPsi(pump)).toBeGreaterThan(kpaToPsi(riding.front.clampedKpa))
    const doubled = coldInflationGaugeKpa(pump, 10, 20)
    expect(doubled).not.toBeCloseTo(pump, 1)

    const weather = applyWeatherPressureAdjustments({
      frontBaselineKpa: riding.front.clampedKpa,
      rearBaselineKpa: riding.rear.clampedKpa,
      weather: {
        available: true,
        locationLabel: 'Test',
        rideTempC: 10,
        currentAmbientTempC: 20,
        isWetForecast: false,
        moisture: 'dry',
        providerId: 'test',
        attribution: 'test',
        confidence: 'full',
      },
      wetMode: 'dry',
      moisture: 'dry',
      inflationTempC: 20,
      inflationAssumed: false,
    })
    expect(weather.front!.targetRidingGaugeKpa).toBeCloseTo(riding.front.clampedKpa, 4)
    expect(weather.front!.coldInflationGaugeKpa).toBeCloseTo(pump, 4)
    expect(riding.front.bertoBaselineKpa).toBeCloseTo(
      bertoBaseline(riding.front.wheelLoadKg, 28).kpa,
      4,
    )
  })

  it('keeps personalisation bounded and leaves the empirical baseline identifiable', () => {
    const baseline = calculatePressure(input())
    const records: RideFeedback[] = Array.from({ length: 5 }, (_, index) => ({
      id: String(index),
      createdAt: `2026-01-0${index + 1}T00:00:00.000Z`,
      bikeId: 'b',
      bikeName: 'Bike',
      setupKey: 'same',
      rideType: 'road' as const,
      gravelPercent: 0,
      systemWeightKg: baseline.systemWeightKg,
      tubeType: 'tubeless' as const,
      frontWidthMm: 28,
      rearWidthMm: 28,
      baselineFrontKpa: baseline.front.clampedKpa,
      baselineRearKpa: baseline.rear.clampedKpa,
      actualFrontKpa: baseline.front.clampedKpa - psiToKpa(12),
      actualRearKpa: baseline.rear.clampedKpa,
      result: 'good' satisfies RideFeel,
      frontFeel: 'too_soft',
      rearFeel: 'good',
      notes: '',
    }))
    const adjusted = personalisePressure(baseline, records, 'same')
    expect(Math.abs(kpaToPsi(adjusted.front.offsetKpa))).toBeLessThanOrEqual(8.01)
    expect(baseline.front.bertoBaselineKpa).toBeGreaterThan(0)
    expect(Math.abs(baseline.front.clampedKpa - baseline.front.bertoBaselineKpa)).toBeLessThan(
      baseline.front.bertoBaselineKpa * 0.15,
    )
    const before = baseline.front.bertoBaselineKpa
    personalisePressure(baseline, records, 'same')
    expect(baseline.front.bertoBaselineKpa).toBe(before)
  })

  it('keeps pack weight in system mass', () => {
    const withPack = input({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 4 } })
    expect(systemWeightKg(withPack)).toBe(88)
    expect(calculatePressure(withPack).front.targetKpa).toBeGreaterThan(at('road').front.targetKpa)
    expect(surfaceCondition('road', 0).factor).toBe(1)
  })
})
