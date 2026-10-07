import { KPA_PER_PSI } from '../data/constants'
import {
  BERTO_LOAD_MAX_LBF,
  BERTO_LOAD_MIN_LBF,
  BERTO_PRESSURE_MAX_PSI,
  BERTO_PRESSURE_MIN_PSI,
  BERTO_REGRESSION_COEFFICIENT,
  BERTO_REGRESSION_EXPONENT,
  BERTO_REGRESSION_OFFSET_PSI,
  BERTO_WIDTH_MAX_MM,
  BERTO_WIDTH_MIN_MM,
} from '../data/v21ModelConstants'

/** International avoirdupois pound. 1 lb = 0.45359237 kg. */
export const LB_PER_KG = 1 / 0.45359237

export interface BertoBaseline {
  /** Gauge pressure from the Adams regression, PSI. */
  psi: number
  kpa: number
  loadLbf: number
  /** True when width, load, or pressure sits outside the chart’s measured region. */
  extrapolated: boolean
  reasons: string[]
}

/**
 * Empirical baseline from the Dave Adams regression of Berto’s 15% drop chart.
 * This is a curve fit, not Berto’s own formula. Front and rear are independent:
 * the intercept means pressure is not forced to the wheel-load ratio.
 */
export function bertoRegressionPsi(loadKg: number, widthMm: number): number {
  const loadLbf = loadKg * LB_PER_KG
  return (
    (BERTO_REGRESSION_COEFFICIENT * loadLbf) / widthMm ** BERTO_REGRESSION_EXPONENT -
    BERTO_REGRESSION_OFFSET_PSI
  )
}

export function bertoBaseline(loadKg: number, widthMm: number): BertoBaseline {
  const loadLbf = loadKg * LB_PER_KG
  const psi = bertoRegressionPsi(loadKg, widthMm)
  const reasons: string[] = []
  if (widthMm < BERTO_WIDTH_MIN_MM || widthMm > BERTO_WIDTH_MAX_MM) {
    reasons.push(
      `${widthMm.toFixed(1)} mm is outside the chart’s measured widths (about ${BERTO_WIDTH_MIN_MM}–${BERTO_WIDTH_MAX_MM} mm)`,
    )
  }
  if (loadLbf < BERTO_LOAD_MIN_LBF || loadLbf > BERTO_LOAD_MAX_LBF) {
    reasons.push(
      `${loadLbf.toFixed(0)} lb is outside the chart’s measured wheel loads (about ${BERTO_LOAD_MIN_LBF}–${BERTO_LOAD_MAX_LBF} lb)`,
    )
  }
  if (psi <= 0) {
    reasons.push('the curve fit is not a positive pressure for this load and width')
  } else if (psi < BERTO_PRESSURE_MIN_PSI || psi > BERTO_PRESSURE_MAX_PSI) {
    reasons.push(
      `${psi.toFixed(0)} PSI is outside the chart’s measured pressure span (about ${BERTO_PRESSURE_MIN_PSI}–${BERTO_PRESSURE_MAX_PSI} PSI)`,
    )
  }
  return {
    psi,
    kpa: psi * KPA_PER_PSI,
    loadLbf,
    extrapolated: reasons.length > 0,
    reasons,
  }
}
