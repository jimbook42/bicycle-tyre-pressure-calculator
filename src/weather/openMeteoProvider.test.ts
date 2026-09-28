import { describe, expect, it, vi } from 'vitest'
import { createOpenMeteoProvider } from './openMeteoProvider'
import { buildProcessedRideWeather } from './openMeteoProvider'

const mockForecast = {
  hourly: {
    time: [
      Date.parse('2026-06-01T10:00:00Z') / 1000,
      Date.parse('2026-06-01T11:00:00Z') / 1000,
      Date.parse('2026-06-01T12:00:00Z') / 1000,
    ],
    temperature_2m: [12, 14, 16],
    precipitation: [0, 0.3, 0],
    weather_code: [0, 61, 0],
  },
}

describe('openMeteoProvider', () => {
  it('parses hourly forecast from mocked response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockForecast,
    })
    const provider = createOpenMeteoProvider(fetchImpl)
    const start = new Date('2026-06-01T10:30:00')
    const window = {
      start,
      end: new Date(start.getTime() + 60 * 60_000),
      durationMinutes: 60,
    }
    const hourly = await provider.fetchHourlyForecast(-36.8, 174.7, window)
    expect(hourly).toHaveLength(3)
    expect(hourly[1].temperatureC).toBe(14)

    const processed = await buildProcessedRideWeather(
      provider,
      -36.8,
      174.7,
      'Auckland',
      {
        mode: 'now',
        durationMinutes: 60,
        referenceNow: start,
      },
    )
    expect(processed.available).toBe(true)
    expect(processed.rideTempC).toBeGreaterThan(0)
  })
})
