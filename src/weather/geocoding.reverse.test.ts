import { describe, expect, it, vi } from 'vitest'
import { reverseGeocode } from './geocoding'

describe('reverseGeocode', () => {
  it('resolves coordinates to a place label via Open-Meteo reverse API', async () => {
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
    const place = await reverseGeocode(-43.53, 172.63, fetchImpl)
    expect(String(fetchImpl.mock.calls[0][0])).toContain('geocoding-api.open-meteo.com/v1/reverse')
    expect(place?.name).toBe('Christchurch')
  })
})
