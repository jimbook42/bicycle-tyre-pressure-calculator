/** Standard sea-level atmospheric pressure (kPa) for gauge ↔ absolute conversion. */
export const STANDARD_ATMOSPHERIC_KPA = 101.325

/**
 * Conservative wet-surface target adjustment (multiply riding target gauge pressure).
 * Practical grip choice in wet conditions — not a physical law. See SCIENCE.md.
 */
export const WET_SURFACE_PRESSURE_FACTOR = 0.97

/** When inflation temperature is unknown and ambient is unavailable. */
export const DEFAULT_ASSUMED_INFLATION_TEMP_C = 20

/** Minimum hourly precipitation (mm) during the ride window to count as wet in auto mode. */
export const WET_PRECIP_THRESHOLD_MM = 0.2

export const OPEN_METEO_ATTRIBUTION =
  'Weather data by Open-Meteo.com (open-meteo.com). Non-commercial use is supported without an API key; commercial use may require separate licensing.'

export const FORECAST_CACHE_TTL_MS = 30 * 60 * 1000

export const DURATION_PRESET_MINUTES: Record<string, number> = {
  '30': 30,
  '60': 60,
  '90': 90,
  '120': 120,
  '180': 180,
  '240': 240,
  custom: 0,
}
