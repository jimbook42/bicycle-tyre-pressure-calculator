import { describe, expect, it } from 'vitest'
import { weatherIconKindForCode } from './weatherIcons'

describe('weatherIconKindForCode', () => {
  it('maps clear and rain codes', () => {
    expect(weatherIconKindForCode(0)).toBe('clear')
    expect(weatherIconKindForCode(61)).toBe('rain')
    expect(weatherIconKindForCode(95)).toBe('storm')
  })
})
