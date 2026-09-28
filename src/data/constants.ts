/** Default front / rear load split when not overridden (percent). */
export const DEFAULT_FRONT_LOAD_PERCENT = 40
export const DEFAULT_REAR_LOAD_PERCENT = 60

/** Reference hooked rim internal width (mm) for optional rim-width adjustment. */
export const REFERENCE_RIM_INTERNAL_WIDTH_MM = 19

/**
 * Optional rim internal width adjustment to effective mounted width (mm per mm delta from reference).
 * Documented modelling choice — wider rims often spread the casing slightly.
 */
export const RIM_INTERNAL_WIDTH_EFFECT_MM_PER_MM = 0.4

/**
 * Berto chart approximation coefficients (NOT Frank Berto's original equation).
 * Empirical fit: PSI = A * load_lbf / width_mm^B + C
 * See SCIENCE.md for source discussion and validation notes.
 */
export const BERTO_APPROX_A = 153.6
export const BERTO_APPROX_B = 1.5785
export const BERTO_APPROX_C = -7.1685

/** Minimum pressure from fit validity domain (kPa). */
export const MODEL_MIN_PRESSURE_KPA = 69 // ~10 PSI

/** Surface model multipliers applied after Berto fit (road = baseline). */
export const ROAD_SURFACE_PRESSURE_FACTOR = 1
export const GRAVEL_SURFACE_PRESSURE_FACTOR = 0.9

export const KG_TO_LBF = 2.2046226218
export const KPA_PER_PSI = 6.8947572932
export const KPA_PER_BAR = 100
