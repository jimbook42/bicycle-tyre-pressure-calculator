import { describe, expect, it } from 'vitest'
import { defaultWeatherSettings } from '../storage/localStore'
import { buildWeatherPreview, describeRidePlan } from './weatherPreview'
import { resolveRideWindow } from './forecastProcessor'
import { buildTimingRequest } from './rideWeatherService'
import { calculatePressure } from '../calculator/pressureEngine'
import type { ProcessedRideWeather } from './weatherProvider'

function processed(partial: Partial<ProcessedRideWeather> = {}): ProcessedRideWeather {
  return {
    available: true,
    locationLabel: 'Christchurch, Canterbury, New Zealand',
    rideTempC: 13,
    currentAmbientTempC: 14,
    windowTempMinC: 12,
    windowTempMaxC: 14,
    isWetForecast: true,
    providerId: 'open-meteo',
    attribution: 'Open-Meteo',
    confidence: 'full',
    ...partial,
  }
}

describe('weather preview', () => {
  it('shows the ride-window temperature after a location is available', () => {
    const settings = defaultWeatherSettings()
    settings.enabled = true
    settings.timingMode = 'now'
    const preview = buildWeatherPreview(settings, processed())
    expect(preview.unavailable).toBe(false)
    expect(preview.locationLabel).toContain('Christchurch')
    expect(preview.temperatureLine).toContain('12–14°C')
    expect(preview.temperatureLine).toContain('Now 14°C')
    expect(preview.rainLine).toBe('Rain possible')
    expect(preview.wetLine).toBe('Wet adjustment: Applied')
  })

  it('uses the future ride window rather than the current moment', () => {
    const settings = defaultWeatherSettings()
    settings.timingMode = 'future'
    settings.rideDate = '2026-10-02'
    settings.startTime = '10:00'
    settings.durationPreset = '120'
    const now = new Date('2026-09-29T08:00:00')
    const window = resolveRideWindow(buildTimingRequest(settings, now))
    expect(window.start.getFullYear()).toBe(2026)
    expect(window.start.getMonth()).toBe(9)
    expect(window.start.getDate()).toBe(2)
    expect(window.start.getHours()).toBe(10)
    expect(window.durationMinutes).toBe(120)
    expect(describeRidePlan(settings)).toBe('2026-10-02 • 10:00 • 2 hours')
  })

  it('changes the described plan when duration changes', () => {
    const settings = defaultWeatherSettings()
    settings.timingMode = 'today'
    settings.startTime = '10:00'
    settings.durationPreset = '60'
    expect(describeRidePlan(settings)).toContain('1 hour')
    settings.durationPreset = '180'
    expect(describeRidePlan(settings)).toContain('3 hours')
  })

  it('shows weather unavailable without blocking a pressure result', () => {
    const settings = defaultWeatherSettings()
    const preview = buildWeatherPreview(settings, processed({ available: false }))
    expect(preview.unavailable).toBe(true)
    const pressure = calculatePressure({
      rider: { weightKg: 75 },
      bike: { weightKg: 9 },
      ride: { type: 'road', gravelPercent: 0, packWeightKg: 0 },
      tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'tubeless' },
    })
    expect(pressure.front.clampedKpa).toBeGreaterThan(0)
  })
})
