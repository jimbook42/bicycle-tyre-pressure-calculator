import { buildCalculatorInput, parseNum } from './buildInput'
import type { AppPersistence, BikeProfile } from '../types'

const MIN_TYRE_MM = 18
const MAX_TYRE_MM = 80
const MAX_WEIGHT_KG = 300
const MAX_PACK_KG = 100

function invalidLimits(minPsi: string, maxPsi: string): boolean {
  if (!minPsi.trim() && !maxPsi.trim()) return false
  const min = minPsi.trim() ? parseNum(minPsi) : undefined
  const max = maxPsi.trim() ? parseNum(maxPsi) : undefined
  if (min !== undefined && min < 0) return true
  if (max !== undefined && max <= 0) return true
  if (min !== undefined && max !== undefined && min > max) return true
  return false
}

export type ValidationResult =
  | { ok: true; input: NonNullable<ReturnType<typeof buildCalculatorInput>> }
  | { ok: false; message: string }

export function validateForCalculation(
  state: AppPersistence,
  bike: BikeProfile,
): ValidationResult {
  const riderWeightKg = parseNum(state.riderWeightKg)
  const bikeWeightKg = parseNum(bike.weightKg)
  const frontWidthMm = parseNum(bike.frontWidthMm)
  const rearWidthMm = parseNum(bike.rearWidthMm)
  const packWeightKg = parseNum(state.packWeightKg, 0)
  const gravel = parseNum(state.gravelPercent, 0)
  const adv = bike.advanced

  if (riderWeightKg <= 0 || riderWeightKg > MAX_WEIGHT_KG) {
    return { ok: false, message: 'Enter a rider weight between 0 and 300 kg.' }
  }
  if (bikeWeightKg <= 0 || bikeWeightKg > MAX_WEIGHT_KG) {
    return { ok: false, message: 'Enter a bike weight between 0 and 300 kg.' }
  }
  if (packWeightKg < 0 || packWeightKg > MAX_PACK_KG) {
    return { ok: false, message: 'Pack weight must be between 0 and 100 kg.' }
  }
  if (state.rideType === 'commute' && packWeightKg <= 0) {
    return { ok: false, message: 'Commute rides require pack weight (kg).' }
  }
  if (gravel < 0 || gravel > 100) {
    return { ok: false, message: 'Gravel percentage must be between 0 and 100.' }
  }

  for (const [label, width] of [
    ['Front tyre', frontWidthMm],
    ['Rear tyre', rearWidthMm],
  ] as const) {
    if (width < MIN_TYRE_MM || width > MAX_TYRE_MM) {
      return {
        ok: false,
        message: `${label} width must be between ${MIN_TYRE_MM} and ${MAX_TYRE_MM} mm.`,
      }
    }
  }

  if (adv.frontLoadPercent.trim()) {
    const load = parseNum(adv.frontLoadPercent)
    if (load < 0 || load > 100) {
      return { ok: false, message: 'Front wheel load must be between 0 and 100%.' }
    }
  }

  if (
    invalidLimits(adv.frontMinPsi, adv.frontMaxPsi) ||
    invalidLimits(adv.rearMinPsi, adv.rearMaxPsi)
  ) {
    return { ok: false, message: 'Check manufacturer limits (min ≤ max, positive values).' }
  }

  const input = buildCalculatorInput(state, bike)
  if (!input) {
    return { ok: false, message: 'Check weights and tyre widths are valid numbers.' }
  }

  return { ok: true, input }
}
