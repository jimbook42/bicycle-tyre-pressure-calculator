import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOCATION_SEARCH_DEBOUNCE_MS, nextLocationQuery, scheduleLocationSearch } from './locationSearch'

describe('location search', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not search a short query or the already selected label', () => {
    expect(nextLocationQuery('C', null)).toBeNull()
    expect(nextLocationQuery('Christchurch, Canterbury, New Zealand', 'Christchurch, Canterbury, New Zealand')).toBeNull()
    expect(nextLocationQuery('Chris', null)).toBe('Chris')
  })

  it('debounces the geocoding call', async () => {
    vi.useFakeTimers()
    const search = vi.fn().mockResolvedValue([
      { name: 'Christchurch', latitude: 1, longitude: 2, admin1: 'Canterbury', country: 'New Zealand' },
    ])
    const onResults = vi.fn()
    const onLoading = vi.fn()
    scheduleLocationSearch('Chris', null, search, {
      onLoading,
      onResults,
      onEmpty: vi.fn(),
      onError: vi.fn(),
      onClear: vi.fn(),
    })
    expect(search).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(LOCATION_SEARCH_DEBOUNCE_MS)
    expect(search).toHaveBeenCalledWith('Chris', 5)
    expect(onResults).toHaveBeenCalled()
    expect(onLoading).toHaveBeenCalled()
  })

  it('reports an empty result and an API error', async () => {
    vi.useFakeTimers()
    const onEmpty = vi.fn()
    const onError = vi.fn()
    scheduleLocationSearch('Zz', null, vi.fn().mockResolvedValue([]), {
      onLoading: vi.fn(),
      onResults: vi.fn(),
      onEmpty,
      onError,
      onClear: vi.fn(),
    })
    await vi.advanceTimersByTimeAsync(LOCATION_SEARCH_DEBOUNCE_MS)
    expect(onEmpty).toHaveBeenCalled()

    scheduleLocationSearch('Zz', null, vi.fn().mockRejectedValue(new Error('down')), {
      onLoading: vi.fn(),
      onResults: vi.fn(),
      onEmpty: vi.fn(),
      onError,
      onClear: vi.fn(),
    })
    await vi.advanceTimersByTimeAsync(LOCATION_SEARCH_DEBOUNCE_MS)
    expect(onError).toHaveBeenCalled()
  })
})
