import { describe, expect, it } from 'vitest'
import {
  durationWeightedRideTemperatureC,
  forecastWetDuringRide,
  resolveRideWindow,
} from './forecastProcessor'
import type { HourlyForecastPoint } from './weatherProvider'

function hourlyAt(base: Date, temps: number[]): HourlyForecastPoint[] {
  return temps.map((temperatureC, index) => ({
    time: new Date(base.getTime() + index * 3_600_000),
    temperatureC,
    precipitationMm: 0,
    weatherCode: 0,
  }))
}

describe('forecastProcessor', () => {
  it('computes duration-weighted ride temperature over partial hours', () => {
    const start = new Date('2026-06-01T10:30:00')
    const hourly = hourlyAt(new Date('2026-06-01T10:00:00'), [10, 20])
    const window = { start, end: new Date(start.getTime() + 60 * 60_000), durationMinutes: 60 }
    const avg = durationWeightedRideTemperatureC(hourly, window)
    expect(avg).toBeGreaterThan(10)
    expect(avg).toBeLessThan(20)
  })

  it('handles future ride windows', () => {
    const ref = new Date('2026-06-01T08:00:00')
    const window = resolveRideWindow({
      mode: 'future',
      rideDate: '2026-06-05',
      startTime: '14:00',
      durationMinutes: 120,
      referenceNow: ref,
    })
    expect(window.start.getHours()).toBe(14)
    expect(window.durationMinutes).toBe(120)
  })

  it('detects wet forecast from precipitation', () => {
    const start = new Date('2026-06-01T12:00:00')
    const hourly: HourlyForecastPoint[] = [
      {
        time: start,
        temperatureC: 12,
        precipitationMm: 0.5,
        weatherCode: 61,
      },
    ]
    const window = { start, end: new Date(start.getTime() + 30 * 60_000), durationMinutes: 30 }
    expect(forecastWetDuringRide(hourly, window)).toBe(true)
  })
})
