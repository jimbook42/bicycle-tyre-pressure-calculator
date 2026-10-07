import { LOAD_SPLIT_RESPONSE } from '../data/v21ModelConstants'

/** Even static split. Both wheels carry half the system mass. */
export const NEUTRAL_LOAD_FRACTION = 0.5

/**
 * Load fraction used by the empirical baseline.
 *
 * `staticFraction` is the rider’s front-wheel share of system weight, from 0 to 1.
 * The result stays at 0.5 when the static share is 0.5. Otherwise it moves
 * `LOAD_SPLIT_RESPONSE` of the way from even toward the static share.
 * With the current gain of 0.5, a 0–100% entry stays inside 25–75%.
 */
export function effectiveLoadFraction(staticFraction: number): number {
  const staticClamped = Math.min(1, Math.max(0, staticFraction))
  return NEUTRAL_LOAD_FRACTION + LOAD_SPLIT_RESPONSE * (staticClamped - NEUTRAL_LOAD_FRACTION)
}
