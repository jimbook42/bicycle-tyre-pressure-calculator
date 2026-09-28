/** @vitest-environment jsdom */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { PressureResultDial } from './PressureResultDial'
import { RiderWeightDial } from './RiderWeightDial'

describe('soft UI layout', () => {
  let root: Root | null = null
  let host: HTMLDivElement | null = null

  afterEach(() => {
    act(() => root?.unmount())
    host?.remove()
    root = null
    host = null
  })

  it('keeps pressure dials within a narrow mobile column without horizontal overflow', () => {
    host = document.createElement('div')
    host.style.width = '320px'
    document.body.appendChild(host)
    root = createRoot(host)
    act(() => {
      root?.render(
        createElement(
          'div',
          { className: 'grid max-w-[320px] grid-cols-2 gap-2' },
          createElement(PressureResultDial, { label: 'Front', value: '72', unit: 'PSI' }),
          createElement(PressureResultDial, { label: 'Rear', value: '78', unit: 'PSI' }),
        ),
      )
    })
    expect(host.scrollWidth).toBeLessThanOrEqual(320)
  })

  it('renders rider weight dial with accessible range control', () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    act(() => {
      root?.render(createElement(RiderWeightDial, { kg: 78, min: 40, max: 120, onChange: () => {} }))
    })
    const slider = host.querySelector('input[type="range"]')
    expect(slider).toBeTruthy()
    expect(host.textContent).toContain('78')
  })
})
