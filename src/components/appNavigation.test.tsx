/** @vitest-environment jsdom */
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppHeader } from './AppHeader'
import { BottomTabs } from './BottomTabs'

describe('app navigation', () => {
  let root: Root | null = null
  let host: HTMLDivElement | null = null

  afterEach(() => {
    act(() => root?.unmount())
    host?.remove()
    root = null
    host = null
  })

  it('lists calculate as the primary tab without a settings tab', () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    act(() => {
      root?.render(createElement(BottomTabs, { active: 'calculate', onChange: () => {} }))
    })
    const buttons = Array.from(host.querySelectorAll('button')).map((b) => b.textContent?.trim())
    expect(buttons[0]).toMatch(/^Calculate/)
    expect(buttons).toContain('Bikes')
    expect(buttons).toContain('Rider')
    expect(buttons.some((t) => t?.startsWith('Feedback'))).toBe(true)
    expect(buttons).not.toContain('Settings')
  })

  it('exposes settings from the header cog', () => {
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
    act(() => {
      root?.render(
        createElement(AppHeader, {
          darkMode: false,
          onToggleDark: () => {},
          onOpenSettings: () => {},
        }),
      )
    })
    const settings = host.querySelector('button[aria-label="Settings"]')
    expect(settings).toBeTruthy()
  })
})
