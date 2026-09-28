import type { FetchLike, GeoPlace } from './weatherProvider'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

export async function searchLocations(
  query: string,
  fetchImpl: FetchLike = fetch.bind(globalThis),
  limit = 5,
): Promise<GeoPlace[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(trimmed)}&count=${limit}&language=en&format=json`
  const response = await fetchImpl(url)
  if (!response.ok) throw new Error('Geocoding request failed')
  const data = (await response.json()) as {
    results?: Array<{
      name: string
      latitude: number
      longitude: number
      country?: string
      admin1?: string
    }>
  }
  return (data.results ?? []).map((row) => ({
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    country: row.country,
    admin1: row.admin1,
  }))
}

export function formatPlaceLabel(place: GeoPlace): string {
  const parts = [place.name, place.admin1, place.country].filter(Boolean)
  return parts.join(', ')
}
