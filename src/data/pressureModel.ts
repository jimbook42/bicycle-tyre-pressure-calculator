import {
  BERTO_APPROX_A,
  BERTO_APPROX_B,
  BERTO_APPROX_C,
  GRAVEL_SURFACE_PRESSURE_FACTOR,
  KG_TO_LBF,
  MODEL_MIN_PRESSURE_KPA,
  REFERENCE_RIM_INTERNAL_WIDTH_MM,
  RIM_INTERNAL_WIDTH_EFFECT_MM_PER_MM,
  ROAD_SURFACE_PRESSURE_FACTOR,
} from './constants'
import type { SurfaceModel } from '../types'

export function surfacePressureFactor(surface: SurfaceModel): number {
  return surface === 'road' ? ROAD_SURFACE_PRESSURE_FACTOR : GRAVEL_SURFACE_PRESSURE_FACTOR
}

export function effectiveTyreWidthMm(
  nominalMm: number,
  measuredMm: number | undefined,
  rimInternalWidthMm: number | undefined,
): number {
  const base = measuredMm ?? nominalMm
  if (rimInternalWidthMm === undefined || Number.isNaN(rimInternalWidthMm)) {
    return base
  }
  const delta = rimInternalWidthMm - REFERENCE_RIM_INTERNAL_WIDTH_MM
  return Math.max(1, base + delta * RIM_INTERNAL_WIDTH_EFFECT_MM_PER_MM)
}

/**
 * Baseline wheel pressure from Berto chart approximation (PSI), then converted to kPa.
 */
export function baselineWheelPressureKpa(
  wheelLoadKg: number,
  effectiveWidthMm: number,
  surface: SurfaceModel,
): number {
  const loadLbf = wheelLoadKg * KG_TO_LBF
  const width = Math.max(effectiveWidthMm, 1)
  const psi =
    (BERTO_APPROX_A * loadLbf) / Math.pow(width, BERTO_APPROX_B) + BERTO_APPROX_C
  const adjustedPsi = psi * surfacePressureFactor(surface)
  const kpa = adjustedPsi * 6.8947572932
  return Math.max(MODEL_MIN_PRESSURE_KPA, kpa)
}
