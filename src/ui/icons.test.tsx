/** @vitest-environment jsdom */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { BIKE_ICON_SIZE, IconBike, RIDE_TYPE_ICON_SIZE, RideTypeIcon } from './icons'

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

  it('tints each ride-type drawing with the button text color', () => {
    for (const type of ['road', 'gravel', 'commute', 'mixed'] as const) {
      renderIcon(createElement(RideTypeIcon, { type }))
      const el = host!.querySelector('span[aria-hidden]') as HTMLElement
      expect(el.className).toContain('bg-current')
      expect(el.className).toContain(RIDE_TYPE_ICON_SIZE)
      expect(el.style.maskImage).toContain(`/icons/ride-${type}.png`)
      expect(el.style.maskMode).toBe('alpha')
      act(() => root?.unmount())
      host?.remove()
    }
  })

  it('tints the wider bike drawing the same way', () => {
    renderIcon(createElement(IconBike, {}))
    const el = host!.querySelector('span[aria-hidden]') as HTMLElement
    expect(el.className).toContain(BIKE_ICON_SIZE)
    expect(el.style.maskImage).toContain('/icons/bike-road.png')
  })
})
