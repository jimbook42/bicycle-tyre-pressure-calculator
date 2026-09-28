import { describe, expect, it, vi } from 'vitest'
import { searchLocations } from './geocoding'

describe('searchLocations', () => {
  it('requests Open-Meteo geocoding and parses name, region, and country', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            name: 'Christchurch',
            latitude: -43.53,
            longitude: 172.63,
            admin1: 'Canterbury',
            country: 'New Zealand',
          },
        ],
      }),
    })
    const places = await searchLocations('Christchurch', fetchImpl, 5)
    const url = String(fetchImpl.mock.calls[0][0])
    expect(url).toContain('https://geocoding-api.open-meteo.com/v1/search')
    expect(url).toContain('name=Christchurch')
    expect(url).toContain('count=5')
    expect(places[0]).toMatchObject({
      name: 'Christchurch',
      admin1: 'Canterbury',
      country: 'New Zealand',
    })
  })

  it('returns no places when the API has no results', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })
    await expect(searchLocations('Nowhereville', fetchImpl)).resolves.toEqual([])
  })

  it('throws when the geocoding request fails', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false })
    await expect(searchLocations('Christchurch', fetchImpl)).rejects.toThrow(/Geocoding/)
  })
})
