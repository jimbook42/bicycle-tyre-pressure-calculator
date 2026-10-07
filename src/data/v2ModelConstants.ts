/**
 * Renart geometry constants and neutral construction coefficients.
 *
 * V2.1 does not use Renart, IRI, speed, or these construction coefficients to
 * set production PSI. Renart remains for the diagnostic module in `renart.ts`.
 * Condition adjustments live in `v21ModelConstants.ts`.
 * Narrative: SCIENCE.md.
 */

/** Standard gravity. Used by the Renart diagnostic, not the V2.1 baseline. [P] */
export const GRAVITY_M_S2 = 9.80665

/**
 * Footprint shape factor fitted in Renart & Roura-Grabulosa 2019 for the
 * corrected small-deflection power law. Diagnostic only. [P]
 */
export const RENART_ALPHA = 1.259

/**
 * ISO 5775-1:2023 recommends that deflection in use not exceed 30% of tyre
 * section height. V2 applied this as a Renart pressure floor. V2.1 does not.
 * The constant remains so the diagnostic comparison can still name that limit.
 * [L]
 */
export const MAX_SECTION_HEIGHT_DEFLECTION = 0.3

/**
 * Reference rim internal width. Not an input to V2.1 pressure.
 * Kept so older geometry checks and the Renart diagnostic still have a default.
 * mm. [A]
 */
export const DEFAULT_RIM_INTERNAL_WIDTH_MM = 19

/** Fallback rim/tyre width ratio for the Renart diagnostic. Not used for PSI. [A] */
export const NARROW_DEFAULT_RIM_FRACTION = 0.7

/** Bead-seat diameter assumed when wheel size is omitted. mm. [A] */
export const DEFAULT_BEAD_SEAT_DIAMETER_MM = 622

/**
 * Construction coefficients. All 1. [A]
 * V2.1 does not multiply these into pressure. There is no universal
 * tube, casing, or category PSI rule in the evidence used here.
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
