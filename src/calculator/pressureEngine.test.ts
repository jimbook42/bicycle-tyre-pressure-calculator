import { describe, expect, it } from 'vitest'
import { calculatePressure, systemWeightKg } from './pressureEngine'
import { formatPressure, kpaToBar, kpaToPsi, psiToKpa } from './units'
import type { CalculatorInput } from '../types'

function baseInput(overrides: Partial<CalculatorInput> = {}): CalculatorInput {
  return {
    rider: { weightKg: 75, ...overrides.rider },
    bike: { weightKg: 9, ...overrides.bike },
    ride: { type: 'road', gravelPercent: 0, packWeightKg: 0, ...overrides.ride },
    tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'tubeless', ...overrides.tyres },
    advanced: {
      rimType: 'hooked',
      wheelDiameterInches: 28,
      rimInternalWidthMm: 19,
      ...overrides.advanced,
    },
  }
}

describe('pressureEngine', () => {
  it('heavier system increases pressure', () => {
    const light = calculatePressure(baseInput())
    const heavy = calculatePressure(
      baseInput({ rider: { weightKg: 95 }, bike: { weightKg: 12 } }),
    )
    expect(heavy.front.clampedKpa).toBeGreaterThan(light.front.clampedKpa)
    expect(heavy.rear.clampedKpa).toBeGreaterThan(light.rear.clampedKpa)
  })

  it('wider tyre lowers pressure for same load', () => {
    const narrow = calculatePressure(baseInput())
    const wide = calculatePressure(
      baseInput({ tyres: { frontWidthMm: 40, rearWidthMm: 40, tubeType: 'tubeless' } }),
    )
    expect(wide.front.targetKpa).toBeLessThan(narrow.front.targetKpa)
    expect(wide.rear.targetKpa).toBeLessThan(narrow.rear.targetKpa)
  })

  it('rear pressure exceeds front with default 40/60 load split', () => {
    const result = calculatePressure(baseInput())
    expect(result.rear.clampedKpa).toBeGreaterThan(result.front.clampedKpa)
  })

  it('mixed condition sits on the gravel-percentage blend of normal road and typical gravel', () => {
    const mixed = calculatePressure(
      baseInput({ ride: { type: 'mixed', gravelPercent: 50, packWeightKg: 0 } }),
    )
    const road = calculatePressure(baseInput())
    const gravel = calculatePressure(
      baseInput({ ride: { type: 'gravel', gravelPercent: 0, packWeightKg: 0 } }),
    )
    expect(mixed.front.targetKpa).toBeLessThan(road.front.targetKpa)
    expect(mixed.front.targetKpa).toBeGreaterThan(gravel.front.targetKpa)
    expect(mixed.front.targetKpa).toBeCloseTo((road.front.targetKpa + gravel.front.targetKpa) / 2, 4)
  })

  it('0% gravel mixed matches the road roughness', () => {
    const mixed = calculatePressure(
      baseInput({ ride: { type: 'mixed', gravelPercent: 0, packWeightKg: 0 } }),
    )
    const road = calculatePressure(baseInput())
    expect(mixed.front.targetKpa).toBeCloseTo(road.front.targetKpa, 5)
    expect(mixed.rear.targetKpa).toBeCloseTo(road.rear.targetKpa, 5)
  })

  it('100% gravel mixed matches gravel roughness', () => {
    const mixed = calculatePressure(
      baseInput({ ride: { type: 'mixed', gravelPercent: 100, packWeightKg: 0 } }),
    )
    const gravel = calculatePressure(
      baseInput({ ride: { type: 'gravel', gravelPercent: 0, packWeightKg: 0 } }),
    )
    expect(mixed.front.targetKpa).toBeCloseTo(gravel.front.targetKpa, 5)
    expect(mixed.rear.targetKpa).toBeCloseTo(gravel.rear.targetKpa, 5)
  })

  it('commute includes pack weight in system mass', () => {
    const commute = baseInput({
      ride: { type: 'commute', gravelPercent: 0, packWeightKg: 5 },
    })
    const commuteWithoutPack = baseInput({
      ride: { type: 'commute', gravelPercent: 0, packWeightKg: 0 },
    })
    expect(systemWeightKg(commute)).toBe(75 + 9 + 5)
    expect(calculatePressure(commute).front.targetKpa).toBeGreaterThan(
      calculatePressure(commuteWithoutPack).front.targetKpa,
    )
  })

  it('road and gravel default pack weight to zero', () => {
    const road = baseInput({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0 } })
    const gravel = baseInput({ ride: { type: 'gravel', gravelPercent: 0, packWeightKg: 0 } })
    expect(systemWeightKg(road)).toBe(84)
    expect(systemWeightKg(gravel)).toBe(84)
  })

  it('respects manufacturer min and max limits', () => {
    const result = calculatePressure(
      baseInput({
        advanced: {
          frontManufacturerLimits: { minKpa: psiToKpa(80), maxKpa: psiToKpa(85) },
          rearManufacturerLimits: { minKpa: psiToKpa(80), maxKpa: psiToKpa(120) },
        },
      }),
    )
    expect(result.front.clampedKpa).toBeLessThanOrEqual(psiToKpa(85) + 0.01)
    expect(result.front.clampedKpa).toBeGreaterThanOrEqual(psiToKpa(80) - 0.01)
  })

  it('measured width overrides nominal width', () => {
    const withMeasured = calculatePressure(baseInput({ advanced: { frontMeasuredWidthMm: 35 } }))
    const nominalOnly = calculatePressure(baseInput())
    expect(withMeasured.front.effectiveWidthMm).toBe(35)
    expect(nominalOnly.front.effectiveWidthMm).toBe(28)
    expect(withMeasured.front.targetKpa).toBeLessThan(nominalOnly.front.targetKpa)
  })

  it('unit conversions format correctly', () => {
    const kpa = psiToKpa(100)
    expect(kpaToPsi(kpa)).toBeCloseTo(100, 5)
    expect(kpaToBar(kpa)).toBeCloseTo(6.9, 1)
    expect(formatPressure(kpa, 'psi')).toBe('100')
    expect(formatPressure(kpa, 'kPa')).toBe(String(Math.round(kpa)))
    expect(formatPressure(kpa, 'bar')).toMatch(/^\d+\.\d$/)
  })
})
