export type WeatherIconKind =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'storm'
  | 'fog'
  | 'unknown'

/** WMO weather code → icon kind (Open-Meteo). */
export function weatherIconKindForCode(code: number): WeatherIconKind {
  if (code === 0) return 'clear'
  if (code >= 1 && code <= 3) return 'partly-cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'rain'
  if (code >= 85 && code <= 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'unknown'
}

/** @deprecated use weatherIconKindForCode — kept for tests migrating from emoji. */
export function weatherIconForCode(code: number): string {
  return weatherIconKindForCode(code)
}
