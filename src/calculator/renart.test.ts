import { describe, expect, it } from 'vitest'
import { renartPaperExampleCoefficient } from './renart'
import { RENART_ALPHA } from '../data/v2ModelConstants'

/**
 * 6% is a formula-reproduction tolerance against the paper's reported
 * power-law coefficient. It is not a claim of model accuracy.
 */
const PAPER_COEFFICIENT = 44.16
const REPRODUCTION_TOLERANCE = 0.06

describe('Renart paper reproduction', () => {
  it('reproduces the Figure 4a coefficient within 6%', () => {
    const { coefficientNPerMm15 } = renartPaperExampleCoefficient()
    const relative = Math.abs(coefficientNPerMm15 - PAPER_COEFFICIENT) / PAPER_COEFFICIENT
    expect(relative).toBeLessThan(REPRODUCTION_TOLERANCE)
    expect(coefficientNPerMm15).toBeGreaterThan(40)
    expect(coefficientNPerMm15).toBeLessThan(46)
    expect(RENART_ALPHA).toBe(1.259)
  })
})
