import { describe, expect, it } from 'vitest'
import { weatherIconForCode } from './weatherIcons'

describe('weatherIconForCode', () => {
  it('maps clear and rain codes', () => {
    expect(weatherIconForCode(0)).toBe('☀️')
    expect(weatherIconForCode(61)).toBe('🌧️')
    expect(weatherIconForCode(95)).toBe('⛈️')
  })
})
