export type PressureUnit = 'psi' | 'bar' | 'kPa'

export type WeightDisplayUnit = 'kg' | 'lb'

export type TemperatureDisplayUnit = 'celsius' | 'fahrenheit'

export type RideType = 'road' | 'gravel' | 'commute' | 'mixed'

export type TubeType = 'butyl' | 'tpu' | 'tubeless' | 'latex'

export type TyreCategory = 'road' | 'allroad' | 'gravel'

export type CasingType = 'standard' | 'endurance' | 'race' | 'reinforced'

export type MoistureClass = 'dry' | 'damp' | 'wet'

export type RimType = 'hooked' | 'hookless'

export interface RiderProfile {
  weightKg: number
}

export interface Bike {
  weightKg: number
}

export interface Ride {
  type: RideType
  /** 0–100; used when type is mixed */
  gravelPercent: number
  packWeightKg: number
  /** Omitted speed uses the documented reference. km/h. */
  expectedSpeedKmh?: number
  /** Dry when weather is unavailable and the rider has not forced wet. */
  moisture?: MoistureClass
}

export interface TyreSetup {
  frontWidthMm: number
  rearWidthMm: number
  tubeType: TubeType
  category?: TyreCategory
  casing?: CasingType
  modelName?: string
}

export interface ManufacturerLimits {
  minKpa?: number
  maxKpa?: number
}

export interface AdvancedSetup {
  frontMeasuredWidthMm?: number
  rearMeasuredWidthMm?: number
  rimInternalWidthMm?: number
  rimType?: RimType
  wheelDiameterInches?: number
  frontManufacturerLimits?: ManufacturerLimits
  rearManufacturerLimits?: ManufacturerLimits
  /** Front wheel load share, 0–100 */
  frontLoadPercent?: number
}

export interface CalculatorInput {
  rider: RiderProfile
  bike: Bike
  ride: Ride
  tyres: TyreSetup
  advanced?: AdvancedSetup
}

export type SurfaceModel = 'road' | 'gravel'

export interface WheelPressureDetail {
  targetKpa: number
  clampedKpa: number
  effectiveWidthMm: number
  wheelLoadKg: number
  manufacturerMinKpa?: number
  manufacturerMaxKpa?: number
  clampedToMin: boolean
  clampedToMax: boolean
  wheelLoadN?: number
  deflectionFraction?: number
  sectionHeightMm?: number
  rimInternalWidthMm?: number
  rimInternalAssumed?: boolean
  beadSeatDiameterMm?: number
  wheelSizeAssumed?: boolean
  wheelSizeLabel?: string
  hooklessMaxKpa?: number
  deflectionFloorKpa?: number
  safetyMinKpa?: number
  safetyMaxKpa?: number
  limitedByDeflectionEnvelope?: boolean
  geometryValid?: boolean
  geometryReason?: string
  hooklessChecked?: boolean
  conflictingLimits?: boolean
}

export interface PressureResult {
  front: WheelPressureDetail
  rear: WheelPressureDetail
  systemWeightKg: number
  frontLoadPercent: number
  rearLoadPercent: number
  surfaceModel: SurfaceModel | 'mixed'
  rideType?: RideType
  mixedGravelPercent?: number
  warnings: string[]
  notes: string[]
  inputsUsed: string[]
  effectiveIri?: number
  surfaceDeflection?: number
  appliedDeflectionModifier?: number
  moisture?: MoistureClass
  speedKmh?: number
  speedAssumed?: boolean
  tubeCoefficient?: number
  casingCoefficient?: number
  categoryCoefficient?: number
  modelVersion?: number
}

/** Optional advanced fields stored as strings in the UI / persistence layer. */
export interface BikeAdvancedStored {
  frontMeasuredWidthMm: string
  rearMeasuredWidthMm: string
  rimInternalWidthMm: string
  rimType: RimType | ''
  wheelDiameterInches: string
  frontMinPsi: string
  frontMaxPsi: string
  rearMinPsi: string
  rearMaxPsi: string
  frontLoadPercent: string
}

export interface BikeProfile {
  id: string
  name: string
  weightKg: string
  frontWidthMm: string
  rearWidthMm: string
  tubeType: TubeType
  /** Empty string means not specified. */
  tyreCategory: TyreCategory | ''
  casing: CasingType | ''
  tyreModel: string
  advanced: BikeAdvancedStored
}

export type RideFeel = 'too_hard' | 'good' | 'too_soft'

/** One saved ride note. Personal evidence only — does not replace the baseline model. */
export interface RideFeedback {
  id: string
  createdAt: string
  bikeId: string
  bikeName: string
  setupKey: string
  rideType: RideType
  gravelPercent: number
  systemWeightKg: number
  tubeType: TubeType
  frontWidthMm: number
  rearWidthMm: number
  baselineFrontKpa: number
  baselineRearKpa: number
  actualFrontKpa: number
  actualRearKpa: number
  result: RideFeel
  /** Independent wheel feedback. Falls back to `result` when absent. */
  frontFeel?: RideFeel
  rearFeel?: RideFeel
  notes: string
  /** Human-readable location when weather was used; no precise coordinates stored. */
  weatherLocationLabel?: string
  /** Links feedback to a completed calculation record when available. */
  rideHistoryId?: string
}

/** Lightweight record of a completed pressure calculation for post-ride feedback. */
export interface RideHistoryRecord {
  id: string
  calculatedAt: string
  bikeId: string
  bikeName: string
  setupKey: string
  rideType: RideType
  gravelPercent: number
  riderWeightKg: number
  packWeightKg: number
  systemWeightKg: number
  tubeType: TubeType
  frontWidthMm: number
  rearWidthMm: number
  recommendedFrontKpa: number
  recommendedRearKpa: number
  /** Scientific baseline (pre-weather display) for personalisation evidence. */
  baselineFrontKpa: number
  baselineRearKpa: number
  pressureUnit: PressureUnit
  locationLabel?: string
  rideTimingLine?: string
  temperatureSummary?: string
  weatherCondition?: string
  wetMode?: WeatherWetMode
  feedbackId?: string
}

export type WeatherLocationMode = 'search' | 'device'
export type WeatherTimingMode = 'now' | 'today' | 'tomorrow' | 'future'
export type WeatherInflationMode = 'ambient' | 'manual'
export type WeatherWetMode = 'auto' | 'dry' | 'wet'

export interface WeatherSettingsStored {
  enabled: boolean
  weatherOpen: boolean
  locationMode: WeatherLocationMode
  locationSearch: string
  locationLabel: string
  timingMode: WeatherTimingMode
  rideDate: string
  startTime: string
  durationPreset: string
  durationCustomMinutes: string
  inflationMode: WeatherInflationMode
  inflationManualC: string
  wetMode: WeatherWetMode
}

export interface AppPersistence {
  version: 3
  /** When true, `html` gets class `dark` for Soft UI dark theme. */
  darkMode: boolean
  riderWeightKg: string
  bikes: BikeProfile[]
  selectedBikeId: string
  rideType: RideType
  gravelPercent: string
  packWeightKg: string
  /** Blank means the reference speed is used. */
  expectedSpeedKmh: string
  pressureUnit: PressureUnit
  weightUnit: WeightDisplayUnit
  temperatureUnit: TemperatureDisplayUnit
  advancedOpen: boolean
  /** When false, show the scientific baseline and ignore saved ride notes. */
  applyPersonalisation: boolean
  feedback: RideFeedback[]
  rideHistory: RideHistoryRecord[]
  weather: WeatherSettingsStored
}

/** Legacy flat storage (v1) — migrated on load. */
export interface StoredAppStateV1 {
  riderWeightKg?: string
  bikeWeightKg?: string
  rideType?: RideType
  gravelPercent?: string
  packWeightKg?: string
  frontWidthMm?: string
  rearWidthMm?: string
  tubeType?: TubeType
  pressureUnit?: PressureUnit
  advancedOpen?: boolean
  frontMeasuredWidthMm?: string
  rearMeasuredWidthMm?: string
  rimInternalWidthMm?: string
  rimType?: RimType | ''
  wheelDiameterInches?: string
  frontMinPsi?: string
  frontMaxPsi?: string
  rearMinPsi?: string
  rearMaxPsi?: string
  frontLoadPercent?: string
}
