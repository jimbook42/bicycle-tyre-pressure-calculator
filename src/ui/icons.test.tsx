/** @vitest-environment jsdom */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { BIKE_ICON_SIZE, IconBike, RIDE_TYPE_ICON_SIZE, RideTypeIcon } from './icons'

describe('raster icons', () => {
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

  it('renders ride-type artwork tinted via mask and currentColor', () => {
    renderIcon(createElement(RideTypeIcon, { type: 'road' }))
    const el = host!.querySelector('span[aria-hidden]')
    expect(el?.className).toContain('bg-current')
    expect(el?.className).toContain(RIDE_TYPE_ICON_SIZE)
    expect((el as HTMLElement)?.style.maskImage).toContain('/icons/ride-road.png')
    expect((el as HTMLElement)?.style.maskMode).toBe('alpha')
  })

  it('renders bike tile artwork at the larger bike size', () => {
    renderIcon(createElement(IconBike, {}))
    const el = host!.querySelector('span[aria-hidden]')
    expect(el?.className).toContain('bg-current')
    expect(el?.className).toContain(BIKE_ICON_SIZE)
    expect((el as HTMLElement)?.style.maskImage).toContain('/icons/bike-road.png')
  })
})
