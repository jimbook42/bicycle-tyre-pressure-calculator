export interface GeoPlace {
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

export interface HourlyForecastPoint {
  time: Date
  temperatureC: number
  precipitationMm: number
  weatherCode: number
}

export interface RideWindow {
  start: Date
  end: Date
  durationMinutes: number
}

export type RideTimingMode = 'now' | 'today' | 'tomorrow' | 'future'

export interface RideTimingRequest {
  mode: RideTimingMode
  /** YYYY-MM-DD when mode is future (or overrides today/tomorrow date) */
  rideDate?: string
  /** HH:mm local */
  startTime?: string
  durationMinutes: number
  referenceNow?: Date
}

export interface ProcessedRideWeather {
  available: boolean
  errorMessage?: string
  locationLabel: string
  rideTempC: number
  currentAmbientTempC?: number
  isWetForecast: boolean
  /** Dry / damp / wet over the ride window. Wet matches isWetForecast. */
  moisture?: 'dry' | 'damp' | 'wet'
  /** Metres above sea level when the forecast payload includes it. */
  elevationM?: number
  /** Dominant WMO weather code during the ride window (for display). */
  dominantWeatherCode?: number
  /** Lowest and highest ambient samples inside the ride window. */
  windowTempMinC?: number
  windowTempMaxC?: number
  providerId: string
  attribution: string
  confidence: 'full' | 'partial' | 'none'
}

export interface ForecastBundle {
  hourly: HourlyForecastPoint[]
  elevationM?: number
}

export interface WeatherProvider {
  readonly id: string
  searchPlaces(query: string, limit?: number): Promise<GeoPlace[]>
  fetchHourlyForecast(
    latitude: number,
    longitude: number,
    window: RideWindow,
  ): Promise<ForecastBundle>
}

export interface FetchLike {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>
}
