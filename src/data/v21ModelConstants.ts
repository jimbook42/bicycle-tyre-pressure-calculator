/**
 * V2.1 condition-model constants.
 *
 * The production baseline is the Dave Adams regression of Frank Berto’s chart,
 * in `bertoBaseline.ts`. These factors are applied after that baseline.
 *
 * Tags match SCIENCE.md:
 * - [P] taken from a cited source
 * - [L] anchored to a published finding, then applied in a stated way
 * - [A] engineering calibration. Not a published universal PSI formula.
 */

/**
 * Berto’s road-tyre drop tests, as he described them: about 19–37 mm measured
 * width, about 20–220 lb wheel load, about 40–160 PSI. Outside this box the
 * regression is an extrapolation. [L]
 */
export const BERTO_WIDTH_MIN_MM = 19
export const BERTO_WIDTH_MAX_MM = 37
export const BERTO_LOAD_MIN_LBF = 20
export const BERTO_LOAD_MAX_LBF = 220
export const BERTO_PRESSURE_MIN_PSI = 40
export const BERTO_PRESSURE_MAX_PSI = 160

/**
 * Dave Adams’s curve fit to the published Berto chart. Not Berto’s equation. [L]
 * PSI = 153.6 × load_lbf / width_mm^1.5785 − 7.1685
 */
export const BERTO_REGRESSION_COEFFICIENT = 153.6
export const BERTO_REGRESSION_EXPONENT = 1.5785
export const BERTO_REGRESSION_OFFSET_PSI = 7.1685

/**
 * Surface multipliers around the normal-road Berto baseline. [A]
 *
 * Bicycle Quarterly (the Berto chart article) says the 15% drop chart suits
 * average roads, that very smooth roads may want a slight increase, and that
 * very rough or unpaved roads may want a reduction. It does not publish
 * percentages. Turner 2024 shows roughness resistance rising with vertical
 * stiffness and IRI, and that lower stiffness can reduce those losses. Turner
 * also does not publish a universal PSI schedule; his calculated optimum often
 * sits on a pressure bound inside his own model, which this app does not copy.
 *
 * The steps below are two percentage points. That is large enough for a floor
 * pump to set (about 1–2 PSI on a typical road tyre) and small enough that the
 * load/width baseline still dominates. The whole set stays inside ±10%.
 *
 * Order, highest pressure to lowest:
 * smooth road → normal road → hardpack → rough road → typical gravel →
 * rough gravel → very rough gravel.
 */
export const SURFACE_FACTOR_SMOOTH_ROAD = 1.02
export const SURFACE_FACTOR_NORMAL_ROAD = 1
export const SURFACE_FACTOR_HARDPACK = 0.98
export const SURFACE_FACTOR_ROUGH_ROAD = 0.96
export const SURFACE_FACTOR_TYPICAL_GRAVEL = 0.94
export const SURFACE_FACTOR_ROUGH_GRAVEL = 0.92
export const SURFACE_FACTOR_VERY_ROUGH_GRAVEL = 0.9

/** Largest |factor − 1| used by a named surface. [A] */
export const SURFACE_FACTOR_BOUND = 0.1

/**
 * Wet / likely-wet multiplier, applied after the surface factor and before
 * the safety envelope. Damp forecasts use the same factor. [A]
 *
 * Bicycle Rolling Resistance measured average centre grip on three 28-622
 * tyres of 0.78, 0.74, 0.71 and 0.69 at 54, 72, 90 and 108 PSI, on a flat
 * textured ceramic plate at very low speed. Grip rose as pressure fell. The
 * adjacent step from 90 to 72 PSI is a 20% pressure drop for about a 4% rise
 * in centre grip. This app does not treat that grip change as a PSI change.
 * Four percent is one fifth of that pressure step: the same direction, a much
 * smaller move, and still inside the tested pressure span.
 */
export const WET_PRESSURE_FACTOR = 0.96

/** Largest wet reduction. Dry is 0. [A] */
export const WET_FACTOR_BOUND = 0.04
