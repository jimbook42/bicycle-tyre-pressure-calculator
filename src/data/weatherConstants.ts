/** Standard sea-level atmospheric pressure (kPa) for gauge ↔ absolute conversion. */
export const STANDARD_ATMOSPHERIC_KPA = 101.325

/** When inflation temperature is unknown and ambient is unavailable. */
export const DEFAULT_ASSUMED_INFLATION_TEMP_C = 20

/**
 * Precipitation (mm in the sampled hour) at or above this counts as at least damp.
 * Heavier precipitation is classified as wet in the forecast processor.
 */
export const DAMP_PRECIP_THRESHOLD_MM = 0.2

/** Hourly precipitation (mm) at or above this counts as wet. */
export const WET_PRECIP_THRESHOLD_MM = 1

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
