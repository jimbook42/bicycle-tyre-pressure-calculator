import {
  DEFLECTION_FRACTION_ROUGH,
  DEFLECTION_FRACTION_SMOOTH,
  IRI_COMMUTE_M_PER_KM,
  IRI_GRAVEL_M_PER_KM,
  IRI_ROAD_M_PER_KM,
  IRI_TRANSITION_START_M_PER_KM,
  IRI_TRANSITION_WIDTH_M_PER_KM,
} from '../data/v2ModelConstants'
import type { RideType } from '../types'

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** Smoothstep on 0–1. Zero slope at both ends. */
export function smoothstep(x: number): number {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}

/**
 * Effective IRI (m/km) for a ride type.
 * Mixed rides combine road and gravel by root-mean-square, not by averaging pressures.
 */
export function effectiveIri(rideType: RideType, gravelPercent: number): number {
  if (rideType === 'gravel') return IRI_GRAVEL_M_PER_KM
  if (rideType === 'commute') return IRI_COMMUTE_M_PER_KM
  if (rideType === 'road') return IRI_ROAD_M_PER_KM
  const qGravel = clamp01(gravelPercent / 100)
  const qRoad = 1 - qGravel
  return Math.sqrt(
    qRoad * IRI_ROAD_M_PER_KM ** 2 + qGravel * IRI_GRAVEL_M_PER_KM ** 2,
  )
}

/**
 * Target deflection as a fraction of unloaded tyre height H0.
 * Smooth anchor below the transition, rough anchor above it. [A] anchors.
 */
export function targetDeflectionFraction(iriMPerKm: number): number {
  const x =
    (iriMPerKm - IRI_TRANSITION_START_M_PER_KM) / IRI_TRANSITION_WIDTH_M_PER_KM
  const s = smoothstep(x)
  return (
    DEFLECTION_FRACTION_SMOOTH +
    s * (DEFLECTION_FRACTION_ROUGH - DEFLECTION_FRACTION_SMOOTH)
  )
}
