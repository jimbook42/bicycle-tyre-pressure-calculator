import { RENART_ALPHA } from '../data/v2ModelConstants'

export interface RenartGeometry {
  valid: boolean
  reason?: string
  /** Tyre section radius R_T0, metres. */
  rT0M: number
  /** Rim internal width W_L, metres. */
  rimWidthM: number
  /** Contact angle φ0, radians. */
  phi0Rad: number
  /** Bead-seat radius R_L, metres. */
  rLM: number
  /** Torus centreline radius R_W, metres. */
  rWM: number
  /**
   * Unloaded tyre height H0 = R_W + R_T0 − R_L.
   * Deflection fractions in V2 are fractions of this height.
   */
  sectionHeightM: number
}

/**
 * Renart & Roura-Grabulosa unloaded toroid geometry.
 * Requires W_L < 2 R_T0 so φ0 is real.
 */
export function renartGeometry(
  tyreWidthM: number,
  rimInternalWidthM: number,
  beadSeatDiameterM: number,
): RenartGeometry {
  const rT0M = tyreWidthM / 2
  const rLM = beadSeatDiameterM / 2
  if (!(rT0M > 0) || !(rimInternalWidthM > 0) || !(rLM > 0)) {
    return invalid(rT0M, rimInternalWidthM, rLM, 'Tyre, rim, and wheel size must be positive.')
  }
  const cosArg = rimInternalWidthM / (2 * rT0M)
  if (!(cosArg < 1) || !(cosArg > 0)) {
    return invalid(
      rT0M,
      rimInternalWidthM,
      rLM,
      'Rim internal width must be narrower than the tyre width.',
    )
  }
  const phi0Rad = Math.acos(cosArg)
  const rWM = rLM + rT0M * Math.sin(phi0Rad)
  const sectionHeightM = rWM + rT0M - rLM
  if (!(sectionHeightM > 0)) {
    return invalid(rT0M, rimInternalWidthM, rLM, 'Tyre section height is not positive.')
  }
  return {
    valid: true,
    rT0M,
    rimWidthM: rimInternalWidthM,
    phi0Rad,
    rLM,
    rWM,
    sectionHeightM,
  }
}

function invalid(
  rT0M: number,
  rimWidthM: number,
  rLM: number,
  reason: string,
): RenartGeometry {
  return {
    valid: false,
    reason,
    rT0M,
    rimWidthM,
    phi0Rad: Number.NaN,
    rLM,
    rWM: Number.NaN,
    sectionHeightM: Number.NaN,
  }
}

/** b/a from Renart & Roura-Grabulosa 2019, equation (25). Dimensionless. [P] */
export function renartCrossSectionRatio(phi0Rad: number): number {
  const c = Math.cos(phi0Rad)
  const s = Math.sin(phi0Rad)
  const numerator = Math.PI + 2 * phi0Rad - 2 * c
  const denominator = c * (Math.PI + 2 * phi0Rad) - 4 * (1 + s)
  return (2 * c) / (1 + s) - (2 * numerator) / denominator
}

/**
 * K in F = K P d^1.5, with the paper's R_L / (R_W + R_T0) correction.
 * Lengths in metres. K has units m^0.5. [P]
 */
export function renartK(geometry: RenartGeometry): number {
  const beta =
    Math.sqrt(2 * (geometry.rWM + geometry.rT0M)) * renartCrossSectionRatio(geometry.phi0Rad)
  return RENART_ALPHA * beta * (geometry.rLM / (geometry.rWM + geometry.rT0M))
}

/**
 * Gauge pressure (Pa) for a wheel load and absolute deflection.
 * P here is the membrane overpressure, which a tyre gauge reads as gauge pressure.
 */
export function renartGaugePressurePa(
  forceN: number,
  geometry: RenartGeometry,
  deflectionM: number,
  kScale = 1,
): number {
  const k = renartK(geometry) * kScale
  return forceN / (k * Math.pow(deflectionM, 1.5))
}

export interface RenartPaperExample {
  /** F(N) = coefficient × d(mm)^1.5 at the paper's stated pressure. */
  coefficientNPerMm15: number
}

/**
 * Figure 4a road-wheel example from Renart & Roura-Grabulosa 2019.
 * The paper reports F(N) = 44.16 d(mm)^1.5. A direct evaluation of the
 * published power-law constants reproduces a nearby coefficient. The gap is a
 * formula-reproduction difference, not a stated model-accuracy band.
 */
export function renartPaperExampleCoefficient(): RenartPaperExample {
  const rT0M = 15.8 / 1000
  const rimM = 19.04 / 1000
  const rWM = 296.8 / 1000
  const rLM = 282.5 / 1000
  const pressurePa = 0.6e6
  const phi0Rad = Math.acos(rimM / (2 * rT0M))
  const geometry: RenartGeometry = {
    valid: true,
    rT0M,
    rimWidthM: rimM,
    phi0Rad,
    rLM,
    rWM,
    sectionHeightM: rWM + rT0M - rLM,
  }
  const k = renartK(geometry)
  const coefficientNPerMm15 = (k * pressurePa) / Math.pow(1000, 1.5)
  return { coefficientNPerMm15 }
}
