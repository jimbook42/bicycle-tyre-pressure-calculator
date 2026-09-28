import { describe, expect, it } from 'vitest'
import {
  calculateForSurface,
  calculatePressure,
  systemWeightKg,
} from './pressureEngine'
import { effectiveTyreWidthMm } from '../data/pressureModel'
import { formatPressure, kpaToBar, kpaToPsi, psiToKpa } from './units'
import type { CalculatorInput } from '../types'

function baseInput(overrides: Partial<CalculatorInput> = {}): CalculatorInput {
  return {
    rider: { weightKg: 75 },
    bike: { weightKg: 9 },
    ride: { type: 'road', gravelPercent: 0, packWeightKg: 0 },
    tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'tubeless' },
    ...overrides,
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
    const narrow = calculateForSurface(baseInput(), 'road')
    const wide = calculateForSurface(
      baseInput({ tyres: { frontWidthMm: 40, rearWidthMm: 40, tubeType: 'tubeless' } }),
      'road',
    )
    expect(wide.front.targetKpa).toBeLessThan(narrow.front.targetKpa)
    expect(wide.rear.targetKpa).toBeLessThan(narrow.rear.targetKpa)
  })

  it('rear pressure exceeds front with default 40/60 load split', () => {
    const result = calculatePressure(baseInput())
    expect(result.rear.clampedKpa).toBeGreaterThan(result.front.clampedKpa)
  })

  it('mixed interpolation blends road and gravel', () => {
    const input = baseInput({ ride: { type: 'mixed', gravelPercent: 50, packWeightKg: 0 } })
    const mixed = calculatePressure(input)
    const road = calculateForSurface(input, 'road')
    const gravel = calculateForSurface(input, 'gravel')
    expect(mixed.front.targetKpa).toBeCloseTo(
      (road.front.targetKpa + gravel.front.targetKpa) / 2,
      5,
    )
  })

  it('0% gravel mixed equals road', () => {
    const input = baseInput({ ride: { type: 'mixed', gravelPercent: 0, packWeightKg: 0 } })
    const mixed = calculatePressure(input)
    const road = calculateForSurface(input, 'road')
    expect(mixed.front.targetKpa).toBeCloseTo(road.front.targetKpa, 5)
    expect(mixed.rear.targetKpa).toBeCloseTo(road.rear.targetKpa, 5)
  })

  it('100% gravel mixed equals gravel', () => {
    const input = baseInput({ ride: { type: 'mixed', gravelPercent: 100, packWeightKg: 0 } })
    const mixed = calculatePressure(input)
    const gravel = calculateForSurface(input, 'gravel')
    expect(mixed.front.targetKpa).toBeCloseTo(gravel.front.targetKpa, 5)
    expect(mixed.rear.targetKpa).toBeCloseTo(gravel.rear.targetKpa, 5)
  })

  it('commute includes mandatory pack weight in system mass', () => {
    const commute = baseInput({
      ride: { type: 'commute', gravelPercent: 0, packWeightKg: 5 },
    })
    const roadNoPack = baseInput({
      ride: { type: 'road', gravelPercent: 0, packWeightKg: 0 },
    })
    expect(systemWeightKg(commute)).toBe(75 + 9 + 5)
    expect(systemWeightKg(roadNoPack)).toBe(75 + 9)
    expect(calculatePressure(commute).front.clampedKpa).toBeGreaterThan(
      calculatePressure(roadNoPack).front.clampedKpa,
    )
  })

  it('road and gravel default pack weight to zero', () => {
    const road = baseInput({ ride: { type: 'road', gravelPercent: 0, packWeightKg: 0 } })
    const gravel = baseInput({ ride: { type: 'gravel', gravelPercent: 0, packWeightKg: 0 } })
    expect(systemWeightKg(road)).toBe(84)
    expect(systemWeightKg(gravel)).toBe(84)
  })

  it('respects manufacturer min and max limits', () => {
    const input = baseInput({
      advanced: {
        frontManufacturerLimits: { minKpa: psiToKpa(80), maxKpa: psiToKpa(85) },
        rearManufacturerLimits: { minKpa: psiToKpa(80), maxKpa: psiToKpa(120) },
      },
    })
    const result = calculatePressure(input)
    expect(result.front.clampedKpa).toBeLessThanOrEqual(psiToKpa(85))
    expect(result.front.clampedKpa).toBeGreaterThanOrEqual(psiToKpa(80))
  })

  it('measured width overrides nominal width', () => {
    const nominal = effectiveTyreWidthMm(28, undefined, undefined)
    const measured = effectiveTyreWidthMm(28, 32, undefined)
    expect(measured).toBe(32)
    expect(nominal).toBe(28)

    const withMeasured = calculatePressure(
      baseInput({ advanced: { frontMeasuredWidthMm: 35 } }),
    )
    const nominalOnly = calculatePressure(baseInput())
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

  it('104 kg on 35 mm tyres at 40/60 is the Berto-fit result, about 44 and 70 PSI', () => {
    const result = calculatePressure(
      baseInput({
        rider: { weightKg: 95 },
        bike: { weightKg: 9 },
        ride: { type: 'road', gravelPercent: 0, packWeightKg: 0 },
        tyres: { frontWidthMm: 35, rearWidthMm: 35, tubeType: 'tubeless' },
      }),
    )
    expect(result.systemWeightKg).toBe(104)
    expect(result.frontLoadPercent).toBe(40)
    expect(result.rearLoadPercent).toBe(60)
    expect(result.front.wheelLoadKg).toBeCloseTo(41.6, 5)
    expect(result.rear.wheelLoadKg).toBeCloseTo(62.4, 5)
    const widthPow = 35 ** 1.5785
    const frontPsi =
      (153.6 * (41.6 * 2.2046226218)) / widthPow - 7.1685
    const rearPsi =
      (153.6 * (62.4 * 2.2046226218)) / widthPow - 7.1685
    expect(kpaToPsi(result.front.clampedKpa)).toBeCloseTo(frontPsi, 4)
    expect(kpaToPsi(result.rear.clampedKpa)).toBeCloseTo(rearPsi, 4)
    expect(formatPressure(result.front.clampedKpa, 'psi')).toBe('44')
    expect(formatPressure(result.rear.clampedKpa, 'psi')).toBe('70')
    expect(result.rear.clampedKpa / result.front.clampedKpa).toBeGreaterThan(1.5)
  })
})
