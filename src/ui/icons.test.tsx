/** @vitest-environment jsdom */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  BIKE_ICON_HEIGHT,
  BIKE_ICON_SIZE,
  BIKE_ICON_WIDTH,
  IconBike,
  RIDE_ICON_HEIGHT,
  RIDE_ICON_WIDTH,
  RIDE_TYPE_ICON_SIZE,
  ROAD_ICON_HEIGHT,
  ROAD_ICON_SIZE,
  ROAD_ICON_WIDTH,
  RideTypeIcon,
} from './icons'

describe('artwork icons', () => {
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

  it('draws each ride-type icon at its slot size and tints it from the image', () => {
    for (const type of ['road', 'gravel', 'commute', 'mixed'] as const) {
      renderIcon(createElement(RideTypeIcon, { type }))
      const el = host!.querySelector('img[aria-hidden]') as HTMLImageElement
      const road = type === 'road'
      expect(el.className).toContain('artwork-icon')
      expect(el.className).toContain('object-contain')
      expect(el.className).toContain(road ? ROAD_ICON_SIZE : RIDE_TYPE_ICON_SIZE)
      expect(el.width).toBe(road ? ROAD_ICON_WIDTH : RIDE_ICON_WIDTH)
      expect(el.height).toBe(road ? ROAD_ICON_HEIGHT : RIDE_ICON_HEIGHT)
      expect(el.style.width).toBe(`${road ? ROAD_ICON_WIDTH : RIDE_ICON_WIDTH}px`)
      expect(el.style.height).toBe(`${road ? ROAD_ICON_HEIGHT : RIDE_ICON_HEIGHT}px`)
      expect(el.style.imageRendering).toBe('auto')
      expect(el.src).toContain(`/icons/ride-${type}.png`)
      act(() => root?.unmount())
      host?.remove()
    }
  })

  it('draws the bike icon at 76×44 the same way', () => {
    renderIcon(createElement(IconBike, {}))
    const el = host!.querySelector('img[aria-hidden]') as HTMLImageElement
    expect(el.className).toContain('artwork-icon')
    expect(el.className).toContain(BIKE_ICON_SIZE)
    expect(el.width).toBe(BIKE_ICON_WIDTH)
    expect(el.height).toBe(BIKE_ICON_HEIGHT)
    expect(el.style.width).toBe(`${BIKE_ICON_WIDTH}px`)
    expect(el.style.height).toBe(`${BIKE_ICON_HEIGHT}px`)
    expect(el.style.imageRendering).toBe('auto')
    expect(el.src).toContain('/icons/bike-road.png')
  })
})
