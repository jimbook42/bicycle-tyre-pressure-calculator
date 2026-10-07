import { describe, expect, it } from 'vitest'
import { REFERENCE_GROUPS } from './references'

describe('references', () => {
  it('groups the sources a reader needs and only links absolute URLs', () => {
    const blob = REFERENCE_GROUPS.flatMap((group) =>
      group.entries.map((entry) => `${entry.title} ${entry.authors}`),
    ).join(' ')
    expect(blob).toMatch(/Berto/)
    expect(blob).toMatch(/Heine/)
    expect(blob).toMatch(/Turner/)
    expect(blob).toMatch(/Buder/)
    expect(blob).toMatch(/Crenna/)
    expect(blob).toMatch(/Renart/)
    expect(blob).toMatch(/Wet grip/)
    expect(blob).toMatch(/ISO 5775/)
    for (const group of REFERENCE_GROUPS) {
      expect(group.entries.length).toBeGreaterThan(0)
      for (const entry of group.entries) {
        expect(entry.why.length).toBeGreaterThan(40)
        for (const link of [entry.url, entry.doi]) {
          if (link) expect(link).toMatch(/^https?:\/\//)
        }
      }
    }
  })
})
