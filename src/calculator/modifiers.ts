import {
  DAMP_DEFLECTION_BUMP,
  DEFLECTION_MODIFIER_MAX,
  DEFLECTION_MODIFIER_MIN,
  REFERENCE_SPEED_KMH,
  SPEED_BOUND_SPAN_KMH,
  SPEED_DEFLECTION_BOUND,
  WET_DEFLECTION_BUMP,
  WET_SPEED_RELIEF,
  TUBE_COEFFICIENTS,
  CASING_COEFFICIENTS,
  CATEGORY_COEFFICIENTS,
} from '../data/v2ModelConstants'
import type { CasingType, MoistureClass, TubeType, TyreCategory } from '../types'

export interface DeflectionModifiers {
  speedKmh: number
  speedAssumed: boolean
  moisture: MoistureClass
  /** Multiplier applied to the surface deflection target. Bounded. */
  factor: number
  speedFactor: number
  wetFactor: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Bounded speed and wet-grip adjustment of the deflection target. [A]
 *
 * Higher speed slightly reduces target deflection (a firmer starting point)
 * because speed changes vibration and rolling context. Wet and damp slightly
 * increase target deflection because lower pressure can favour grip. The wet
 * term shrinks as speed rises above the reference so the two do not multiply
 * into a large change. Coefficients are calibration choices, not a universal
 * PSI law.
 */
export function deflectionModifiers(
  expectedSpeedKmh: number | undefined,
  moisture: MoistureClass | undefined,
): DeflectionModifiers {
  const speedAssumed = expectedSpeedKmh === undefined || !Number.isFinite(expectedSpeedKmh)
  const speedKmh = speedAssumed ? REFERENCE_SPEED_KMH : expectedSpeedKmh
  const wetness = moisture ?? 'dry'
  const speedUnit = clamp((speedKmh - REFERENCE_SPEED_KMH) / SPEED_BOUND_SPAN_KMH, -1, 1)
  const speedFactor = 1 - SPEED_DEFLECTION_BOUND * speedUnit
  const bump = wetness === 'wet' ? WET_DEFLECTION_BUMP : wetness === 'damp' ? DAMP_DEFLECTION_BUMP : 0
  const relief = 1 - WET_SPEED_RELIEF * Math.max(0, speedUnit)
  const wetFactor = 1 + bump * relief
  const factor = clamp(speedFactor * wetFactor, DEFLECTION_MODIFIER_MIN, DEFLECTION_MODIFIER_MAX)
  return { speedKmh, speedAssumed, moisture: wetness, factor, speedFactor, wetFactor }
}

export interface ConstructionFactors {
  tube: number
  casing: number
  category: number
  /** Product of the three. Neutral inputs stay at 1. */
  combined: number
  unknownTube: boolean
  unknownCasing: boolean
  unknownCategory: boolean
}

export function constructionFactors(
  tubeType: TubeType | string | undefined,
  casing: CasingType | '' | undefined,
  category: TyreCategory | '' | undefined,
): ConstructionFactors {
  const tubeKnown = tubeType !== undefined && tubeType in TUBE_COEFFICIENTS
  const casingKnown = !casing || casing in CASING_COEFFICIENTS
  const categoryKnown = !category || category in CATEGORY_COEFFICIENTS
  const tube = tubeKnown ? TUBE_COEFFICIENTS[tubeType as TubeType] : 1
  const casingFactor = casing && casing in CASING_COEFFICIENTS
    ? CASING_COEFFICIENTS[casing as CasingType]
    : 1
  const categoryFactor = category && category in CATEGORY_COEFFICIENTS
    ? CATEGORY_COEFFICIENTS[category as TyreCategory]
    : 1
  return {
    tube,
    casing: casingFactor,
    category: categoryFactor,
    combined: tube * casingFactor * categoryFactor,
    unknownTube: !tubeKnown,
    unknownCasing: !casingKnown,
    unknownCategory: !categoryKnown,
  }
}

export function resolveRideMoisture(
  wetMode: 'auto' | 'dry' | 'wet',
  forecast: MoistureClass | undefined,
): MoistureClass {
  if (wetMode === 'dry') return 'dry'
  if (wetMode === 'wet') return 'wet'
  return forecast ?? 'dry'
}
