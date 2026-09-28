export type PressureUnit = 'psi' | 'bar' | 'kPa'

export type RideType = 'road' | 'gravel' | 'commute' | 'mixed'

export type TubeType = 'butyl' | 'tpu' | 'tubeless'

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
}

export interface TyreSetup {
  frontWidthMm: number
  rearWidthMm: number
  tubeType: TubeType
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
}

export interface PressureResult {
  front: WheelPressureDetail
  rear: WheelPressureDetail
  systemWeightKg: number
  frontLoadPercent: number
  rearLoadPercent: number
  surfaceModel: SurfaceModel | 'mixed'
  mixedGravelPercent?: number
  warnings: string[]
  notes: string[]
  inputsUsed: string[]
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
  advanced: BikeAdvancedStored
}

export interface AppPersistence {
  version: 2
  riderWeightKg: string
  bikes: BikeProfile[]
  selectedBikeId: string
  rideType: RideType
  gravelPercent: string
  packWeightKg: string
  pressureUnit: PressureUnit
  advancedOpen: boolean
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
