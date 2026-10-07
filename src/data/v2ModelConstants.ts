/**
 * V2 model constants.
 * Tags: [P] physics/source-derived, [L] literature or standard, [A] product calibration.
 * Narrative and limitations: SCIENCE.md.
 */

/** Standard gravity. [P] */
export const GRAVITY_M_S2 = 9.80665

/**
 * Footprint shape factor fitted in Renart & Roura-Grabulosa 2019 for the
 * corrected small-deflection power law (between a rhomb and an ellipse). [P]
 */
export const RENART_ALPHA = 1.259

/**
 * ISO 5775-1:2023 recommends that deflection in use not exceed 30% of tyre
 * section height. Implemented on the Renart unloaded tyre height H0. [L]
 * This is a safety ceiling on deflection (a floor on pressure), not a claim
 * that 30% is an optimal target.
 */
export const MAX_SECTION_HEIGHT_DEFLECTION = 0.3

/** Smooth-road target deflection as a fraction of H0. [A] */
export const DEFLECTION_FRACTION_SMOOTH = 0.15

/** Rough-surface target deflection as a fraction of H0. [A] */
export const DEFLECTION_FRACTION_ROUGH = 0.25

/** IRI below this is treated as the smooth anchor. m/km. [A] */
export const IRI_TRANSITION_START_M_PER_KM = 5

/** Width of the smoothstep from smooth to rough. m/km. Ends at 10. [A] */
export const IRI_TRANSITION_WIDTH_M_PER_KM = 5

/** Product IRI defaults. m/km. Not measured route values. [A] */
export const IRI_ROAD_M_PER_KM = 4
export const IRI_COMMUTE_M_PER_KM = 6
export const IRI_GRAVEL_M_PER_KM = 12

/**
 * Speed at which the speed modifier is exactly 1.
 * Used when the rider omits expected average speed. km/h. [A]
 */
export const REFERENCE_SPEED_KMH = 25

/**
 * Speed offset from the reference that reaches the full speed bound. km/h. [A]
 * 5 km/h and 45 km/h are the saturation points.
 */
export const SPEED_BOUND_SPAN_KMH = 20

/**
 * Largest fractional change the speed term may apply to target deflection. [A]
 * Not a measured PSI-per-km/h coefficient.
 */
export const SPEED_DEFLECTION_BOUND = 0.04

/** Extra deflection fraction for damp grip context, before the combined cap. [A] */
export const DAMP_DEFLECTION_BUMP = 0.015

/** Extra deflection fraction for wet grip context, before the combined cap. [A] */
export const WET_DEFLECTION_BUMP = 0.03

/**
 * At and above the reference speed, the wet bump is reduced so speed and wet
 * do not stack into a large deflection change. [A]
 */
export const WET_SPEED_RELIEF = 0.5

/** Hard cap on the combined speed/wet deflection multiplier. [A] */
export const DEFLECTION_MODIFIER_MIN = 0.96
export const DEFLECTION_MODIFIER_MAX = 1.06

/**
 * Reference rim internal width when the rider omits one.
 * Historical road measuring-rim scale. mm. [A]
 * If this is not narrower than the tyre, a narrower fallback is used.
 */
export const DEFAULT_RIM_INTERNAL_WIDTH_MM = 19

/**
 * Fallback rim/tyre width ratio when 19 mm is not a valid rim for that tyre. [A]
 */
export const NARROW_DEFAULT_RIM_FRACTION = 0.7

/** Bead-seat diameter assumed when wheel size is omitted. 700C / 622. mm. [A] */
export const DEFAULT_BEAD_SEAT_DIAMETER_MM = 622

/**
 * Neutral construction coefficients. [A]
 * They multiply Renart's K. 1 means no pressure offset.
 * Not experimentally established tyre-by-tyre corrections.
 */
export const TUBE_COEFFICIENTS = {
  tubeless: 1,
  tpu: 1,
  butyl: 1,
  latex: 1,
} as const

export const CASING_COEFFICIENTS = {
  standard: 1,
  endurance: 1,
  race: 1,
  reinforced: 1,
} as const

export const CATEGORY_COEFFICIENTS = {
  road: 1,
  allroad: 1,
  gravel: 1,
} as const
