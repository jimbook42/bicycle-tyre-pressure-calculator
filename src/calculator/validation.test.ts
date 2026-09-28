import { describe, expect, it } from 'vitest'
import { buildCalculatorInput } from './buildInput'
import { validateForCalculation } from './validation'
import { calculatePressure } from './pressureEngine'
import { defaultAppPersistence, getSelectedBike } from '../storage/localStore'
import { formatPressure, psiToKpa } from './units'

describe('buildInput and validation', () => {
  it('builds input without advanced fields filled', () => {
    const state = defaultAppPersistence()
    const bike = getSelectedBike(state)
    bike.advanced = {
      ...bike.advanced,
      frontMeasuredWidthMm: '',
      frontLoadPercent: '',
    }
    const input = buildCalculatorInput(state, bike)
    expect(input).not.toBeNull()
    expect(input!.advanced?.frontMeasuredWidthMm).toBeUndefined()
    expect(input!.advanced?.frontLoadPercent).toBeUndefined()
    const result = calculatePressure(input!)
    expect(result.front.clampedKpa).toBeGreaterThan(0)
  })

  it('rejects commute without pack weight', () => {
    const state = defaultAppPersistence()
    state.rideType = 'commute'
    state.packWeightKg = '0'
    const validation = validateForCalculation(state, getSelectedBike(state))
    expect(validation.ok).toBe(false)
    if (!validation.ok) {
      expect(validation.message).toMatch(/pack/i)
    }
  })

  it('rejects invalid manufacturer limits', () => {
    const state = defaultAppPersistence()
    const bike = getSelectedBike(state)
    bike.advanced.frontMinPsi = '90'
    bike.advanced.frontMaxPsi = '60'
    const validation = validateForCalculation(state, bike)
    expect(validation.ok).toBe(false)
  })

  it('display unit change does not change underlying kPa recommendation', () => {
    const kpa = psiToKpa(85)
    expect(formatPressure(kpa, 'psi')).toBe('85')
    expect(formatPressure(kpa, 'bar')).toBe('5.9')
    expect(formatPressure(kpa, 'kPa')).toBe(String(Math.round(kpa)))
  })
})
