/** @vitest-environment jsdom */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { BIKE_ICON_SIZE, IconBike, RIDE_TYPE_ICON_SIZE, RideTypeIcon } from './icons'

describe('line icons', () => {
  let root: Root | null = null
  let host: HTMLDivElement | null = null

  afterEach(() => {
    act(() => root?.unmount())
    host?.remove()
    root = null
    host = null
  })

  function renderIcon(el: ReturnType<typeof createElement>) {
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    act(() => {
      root?.render(el)
    })
  }

  it('draws each ride type as a currentColor line icon at the shared size', () => {
    for (const type of ['road', 'gravel', 'commute', 'mixed'] as const) {
      renderIcon(createElement(RideTypeIcon, { type }))
      const svg = host!.querySelector('svg')
      expect(svg?.className.baseVal || svg?.getAttribute('class')).toContain(RIDE_TYPE_ICON_SIZE)
      expect(svg?.getAttribute('viewBox')).toBe('0 0 72 32')
      const stroked = svg!.querySelector('[stroke="currentColor"]')
      expect(stroked).toBeTruthy()
      act(() => root?.unmount())
      host?.remove()
    }
  })

  it('draws the bike as a wider line icon', () => {
    renderIcon(createElement(IconBike, {}))
    const svg = host!.querySelector('svg')
    expect(svg?.className.baseVal || svg?.getAttribute('class')).toContain(BIKE_ICON_SIZE)
    expect(svg?.querySelectorAll('circle').length).toBeGreaterThan(1)
  })
})
