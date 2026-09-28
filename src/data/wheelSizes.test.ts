import { describe, expect, it } from 'vitest'
import {
  parseStoredWheelDiameterInches,
  wheelSizeIdForInches,
  inchesFromWheelSizeId,
} from './wheelSizes'

describe('wheelSizes', () => {
  it('maps stored 700C-style inch values to selector ids', () => {
    expect(wheelSizeIdForInches(28)).toBe('700c')
    expect(parseStoredWheelDiameterInches('28').selectId).toBe('700c')
  })

  it('loads legacy numeric diameters without clearing', () => {
    const legacy = parseStoredWheelDiameterInches('27.5')
    expect(legacy.selectId).toBe('650b')
    expect(legacy.customInches).toBe('27.5')
  })

  it('round-trips selector id to stored inches', () => {
    expect(inchesFromWheelSizeId('29')).toBe('29')
    expect(inchesFromWheelSizeId('700c')).toBe('28')
  })

  it('preserves unknown custom values', () => {
    const parsed = parseStoredWheelDiameterInches('22')
    expect(parsed.selectId).toBe('custom')
    expect(parsed.customInches).toBe('22')
  })
})
