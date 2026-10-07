import {
  SURFACE_FACTOR_HARDPACK,
  SURFACE_FACTOR_NORMAL_ROAD,
  SURFACE_FACTOR_ROUGH_GRAVEL,
  SURFACE_FACTOR_ROUGH_ROAD,
  SURFACE_FACTOR_SMOOTH_ROAD,
  SURFACE_FACTOR_TYPICAL_GRAVEL,
  SURFACE_FACTOR_VERY_ROUGH_GRAVEL,
  WET_PRESSURE_FACTOR,
} from '../data/v21ModelConstants'
import type { MoistureClass, RideType } from '../types'

export interface SurfaceCondition {
  factor: number
  label: string
  family: 'road' | 'gravel' | 'mixed'
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/**
 * Bounded surface adjustment on the Berto baseline.
 * Mixed rides weight normal road and typical gravel by the gravel percentage.
 * They are not treated as pure gravel, and pressures are not blended through IRI.
 * Stored "commute" keeps its own ride type (so older notes still match) and uses
 * the rough-road factor, because Version 2 treated commute as rougher than the
 * road default and there is no separate commute study.
 */
export function surfaceCondition(rideType: RideType, gravelPercent: number): SurfaceCondition {
  switch (rideType) {
    case 'road-smooth':
      return { factor: SURFACE_FACTOR_SMOOTH_ROAD, label: 'Smooth road', family: 'road' }
    case 'road':
      return { factor: SURFACE_FACTOR_NORMAL_ROAD, label: 'Normal road', family: 'road' }
    case 'road-rough':
      return { factor: SURFACE_FACTOR_ROUGH_ROAD, label: 'Rough road', family: 'road' }
    case 'commute':
      return {
        factor: SURFACE_FACTOR_ROUGH_ROAD,
        label: 'Commute (rough-road adjustment)',
        family: 'road',
      }
    case 'gravel-hardpack':
      return {
        factor: SURFACE_FACTOR_HARDPACK,
        label: 'Smooth / hardpack gravel',
        family: 'gravel',
      }
    case 'gravel':
      return { factor: SURFACE_FACTOR_TYPICAL_GRAVEL, label: 'Typical gravel', family: 'gravel' }
    case 'gravel-rough':
      return { factor: SURFACE_FACTOR_ROUGH_GRAVEL, label: 'Rough gravel', family: 'gravel' }
    case 'gravel-very-rough':
      return {
        factor: SURFACE_FACTOR_VERY_ROUGH_GRAVEL,
        label: 'Very rough / chunky gravel',
        family: 'gravel',
      }
    case 'mixed': {
      const gravelShare = clamp01(gravelPercent / 100)
      const factor =
        (1 - gravelShare) * SURFACE_FACTOR_NORMAL_ROAD +
        gravelShare * SURFACE_FACTOR_TYPICAL_GRAVEL
      const percent = Math.round(gravelShare * 100)
      return {
        factor,
        label: `Mixed, ${percent}% typical gravel`,
        family: 'mixed',
      }
    }
    default: {
      const _exhaustive: never = rideType
      return _exhaustive
    }
  }
}

/**
 * Dry leaves pressure unchanged. Wet and damp share one reduction.
 * The laboratory grip test did not separate drizzle from rain, so V2.1 does
 * not invent a smaller damp coefficient.
 */
export function wetPressureFactor(moisture: MoistureClass | undefined): number {
  if (moisture === 'wet' || moisture === 'damp') return WET_PRESSURE_FACTOR
  return 1
}

export function formatFactorPercent(factor: number): string {
  const pct = Math.round((factor - 1) * 1000) / 10
  if (Math.abs(pct) < 0.05) return '0%'
  const text = Number.isInteger(pct) ? String(pct) : pct.toFixed(1)
  return pct > 0 ? `+${text}%` : `${text}%`
}
