import { formatPressure } from '../calculator/units'
import type {
  AppPersistence,
  BikeProfile,
  PressureResult,
  PressureUnit,
  RideHistoryRecord,
  RideType,
} from '../types'
import type { WeatherPreviewModel } from '../weather/weatherPreview'
import { createId } from './localStore'

export interface RideHistoryCaptureInput {
  state: AppPersistence
  bike: BikeProfile
  setupKey: string
  systemWeightKg: number
  result: PressureResult
  shownFrontKpa: number
  shownRearKpa: number
  locationLabel?: string
  preview: WeatherPreviewModel | null
  rideTimingLine?: string
}

export function createRideHistoryRecord(input: RideHistoryCaptureInput): RideHistoryRecord {
  const { state, bike, setupKey, systemWeightKg, result, shownFrontKpa, shownRearKpa, preview } =
    input
  const packKg = parseFloat(state.packWeightKg) || 0
  const riderKg = parseFloat(state.riderWeightKg) || 0
  const gravel = parseFloat(state.gravelPercent) || 0
  const frontW = parseFloat(bike.frontWidthMm) || 0
  const rearW = parseFloat(bike.rearWidthMm) || 0

  let weatherCondition: string | undefined
  if (preview && !preview.unavailable && preview.compactTempCondition) {
    const parts = preview.compactTempCondition.split(' · ')
    weatherCondition = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  }

  return {
    id: createId(),
    calculatedAt: new Date().toISOString(),
    bikeId: bike.id,
    bikeName: bike.name,
    setupKey,
    rideType: state.rideType,
    gravelPercent: gravel,
    riderWeightKg: riderKg,
    packWeightKg: packKg,
    systemWeightKg,
    tubeType: bike.tubeType,
    frontWidthMm: frontW,
    rearWidthMm: rearW,
    recommendedFrontKpa: shownFrontKpa,
    recommendedRearKpa: shownRearKpa,
    baselineFrontKpa: result.front.clampedKpa,
    baselineRearKpa: result.rear.clampedKpa,
    pressureUnit: state.pressureUnit,
    locationLabel: input.locationLabel || preview?.locationLabel || state.weather.locationLabel,
    rideTimingLine: input.rideTimingLine || preview?.compactTimingLine,
    temperatureSummary: preview?.compactTempCondition,
    weatherCondition,
    wetMode: state.weather.wetMode,
  }
}

export function prependRideHistory(
  state: AppPersistence,
  record: RideHistoryRecord,
  maxRecords = 40,
): AppPersistence {
  const rideHistory = [record, ...state.rideHistory].slice(0, maxRecords)
  return { ...state, rideHistory }
}

export function rideTypeLabel(type: RideType): string {
  if (type === 'mixed') return 'Mixed'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function formatRecommendedPressures(
  record: RideHistoryRecord,
  unit: PressureUnit,
): string {
  return `${formatPressure(record.recommendedFrontKpa, unit)} / ${formatPressure(record.recommendedRearKpa, unit)} ${unit === 'kPa' ? 'kPa' : unit === 'bar' ? 'bar' : 'PSI'}`
}
