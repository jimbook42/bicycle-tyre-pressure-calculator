/** @vitest-environment jsdom */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WeatherSection } from './WeatherSection'
import { defaultWeatherSettings } from '../storage/localStore'

describe('WeatherSection location suggestions', () => {
  let root: Root | null = null
  let host: HTMLDivElement | null = null

  afterEach(() => {
    act(() => root?.unmount())
    host?.remove()
    root = null
    host = null
  })

  it('renders suggestions and stores the selected place without showing coordinates', () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    const onSelectPlace = vi.fn()
    const weather = defaultWeatherSettings()
    weather.enabled = true
    weather.weatherOpen = true
    weather.locationSearch = 'Chris'
    act(() => {
      root?.render(
        createElement(WeatherSection, {
          weather,
          deviceCoords: null,
          deviceError: null,
          suggestions: [
            {
              name: 'Christchurch',
              latitude: -43.53,
              longitude: 172.63,
              admin1: 'Canterbury',
              country: 'New Zealand',
            },
          ],
          searchStatus: 'results',
          searchError: null,
          preview: {
            locationLabel: 'Christchurch, Canterbury, New Zealand',
            plan: 'Now • 1 hour',
            weatherIcon: '🌧️',
            temperatureLine: 'Now 14°C • 12–14°C',
            rainLine: 'Rain possible',
            wetLine: 'Wet adjustment: Applied',
            unavailable: false,
          },
          previewLoading: false,
          onPatch: vi.fn(),
          onUseMyLocation: vi.fn(),
          onSelectPlace,
        }),
      )
    })
    const button = Array.from(host.querySelectorAll('button')).find((node) =>
      node.textContent?.includes('Christchurch'),
    )
    expect(button?.textContent).toBe('Christchurch, Canterbury, New Zealand')
    expect(host.textContent).not.toContain('-43.53')
    expect(host.textContent).toContain('Expected ride weather')
    expect(host.textContent).toContain('12–14°C')
    act(() => button?.click())
    expect(onSelectPlace).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Christchurch', admin1: 'Canterbury' }),
    )
  })
})
