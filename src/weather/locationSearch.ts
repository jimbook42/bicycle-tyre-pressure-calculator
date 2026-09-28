import type { GeoPlace } from './weatherProvider'

/** Wait this long after typing before calling the geocoder. */
export const LOCATION_SEARCH_DEBOUNCE_MS = 300

/** Return a query worth searching, or null when the field is too short or already selected. */
export function nextLocationQuery(query: string, selectedLabel: string | null): string | null {
  const trimmed = query.trim()
  if (trimmed.length < 2) return null
  if (selectedLabel && trimmed === selectedLabel) return null
  return trimmed
}

export function scheduleLocationSearch(
  query: string,
  selectedLabel: string | null,
  search: (query: string, limit?: number) => Promise<GeoPlace[]>,
  handlers: {
    onLoading: () => void
    onResults: (places: GeoPlace[]) => void
    onEmpty: () => void
    onError: () => void
    onClear: () => void
  },
  delayMs = LOCATION_SEARCH_DEBOUNCE_MS,
): () => void {
  const next = nextLocationQuery(query, selectedLabel)
  if (!next) {
    handlers.onClear()
    return () => {}
  }
  handlers.onLoading()
  let cancelled = false
  const timer = setTimeout(() => {
    search(next, 5)
      .then((places) => {
        if (cancelled) return
        if (places.length > 0) handlers.onResults(places)
        else handlers.onEmpty()
      })
      .catch(() => {
        if (!cancelled) handlers.onError()
      })
  }, delayMs)
  return () => {
    cancelled = true
    clearTimeout(timer)
  }
}

