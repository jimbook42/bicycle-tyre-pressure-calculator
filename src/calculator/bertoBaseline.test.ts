import { describe, expect, it } from 'vitest'
import {
  bertoBaseline,
  bertoRegressionPsi,
  WIDTH_MILD_EXTRAPOLATION_MESSAGE,
} from './bertoBaseline'

describe('tyre width extrapolation warnings', () => {
  const loadKg = 50

  it('does not flag widths within the approximate 19–37 mm source range', () => {
    for (const width of [28, 36, 37]) {
      const baseline = bertoBaseline(loadKg, width)
      expect(baseline.extrapolated).toBe(false)
      expect(baseline.reasons).toHaveLength(0)
    }
  })

  it('uses a mild note just above 37 mm through 40 mm', () => {
    for (const width of [37.5, 40]) {
      const baseline = bertoBaseline(loadKg, width)
      expect(baseline.extrapolated).toBe(true)
      expect(baseline.reasons).toEqual([WIDTH_MILD_EXTRAPOLATION_MESSAGE])
    }
  })

  it('uses a stronger note above 40 mm and below 19 mm', () => {
    const wide = bertoBaseline(loadKg, 40.1)
    expect(wide.reasons[0]).toMatch(/outside the chart’s measured widths/)

    const narrow = bertoBaseline(loadKg, 18)
    expect(narrow.reasons[0]).toMatch(/outside the chart’s measured widths/)
  })

  it('still evaluates the regression for mild-band widths', () => {
    const width = 37.5
    const baseline = bertoBaseline(loadKg, width)
    expect(baseline.psi).toBeCloseTo(bertoRegressionPsi(loadKg, width), 6)
  })
})
