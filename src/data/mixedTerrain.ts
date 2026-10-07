import type { RideType } from '../types'
import { isRideType } from './rideTypes'

export const MIXED_ROAD_TYPES: readonly RideType[] = ['road-smooth', 'road', 'road-rough']

export const MIXED_GRAVEL_TYPES: readonly RideType[] = [
  'gravel-hardpack',
  'gravel',
  'gravel-rough',
  'gravel-very-rough',
]

export function asMixedRoadType(value: unknown, fallback: RideType = 'road'): RideType {
  return isRideType(value) && MIXED_ROAD_TYPES.includes(value) ? value : fallback
}

export function asMixedGravelType(value: unknown, fallback: RideType = 'gravel'): RideType {
  return isRideType(value) && MIXED_GRAVEL_TYPES.includes(value) ? value : fallback
}
