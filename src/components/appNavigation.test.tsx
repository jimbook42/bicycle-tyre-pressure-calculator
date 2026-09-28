/** @vitest-environment jsdom */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { BottomTabs } from './BottomTabs'

describe('BottomTabs navigation', () => {
  let root: Root | null = null
  let host: HTMLDivElement | null = null

  afterEach(() => {
    act(() => root?.unmount())
    host?.remove()
    root = null
    host = null
  })

  it('lists calculate as the primary tab label', () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    act(() => {
      root?.render(createElement(BottomTabs, { active: 'calculate', feedbackCount: 0, onChange: () => {} }))
    })
    const buttons = Array.from(host.querySelectorAll('button')).map((b) => b.textContent?.trim())
    expect(buttons[0]).toMatch(/^Calculate/)
    expect(buttons).toContain('Bikes')
    expect(buttons).toContain('Rider')
    expect(buttons.some((t) => t?.startsWith('Feedback'))).toBe(true)
    expect(buttons).toContain('Settings')
  })
})
