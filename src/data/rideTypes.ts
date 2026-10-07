import type { RideType } from '../types'

export const RIDE_TYPES: readonly RideType[] = [
  'road',
  'road-smooth',
  'road-rough',
  'gravel',
  'gravel-hardpack',
  'gravel-rough',
  'gravel-very-rough',
  'commute',
  'mixed',
]

export function isRideType(value: unknown): value is RideType {
  return typeof value === 'string' && (RIDE_TYPES as readonly string[]).includes(value)
}
