import { psiToKpa } from './units'
import type { AppPersistence, BikeProfile, CalculatorInput } from '../types'
import { getSelectedBike } from '../storage/localStore'

export function parseNum(value: string, fallback = 0): number {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

export function buildCalculatorInput(
  state: AppPersistence,
  bike: BikeProfile = getSelectedBike(state),
): CalculatorInput | null {
  const riderWeightKg = parseNum(state.riderWeightKg)
  const bikeWeightKg = parseNum(bike.weightKg)
  const frontWidthMm = parseNum(bike.frontWidthMm)
  const rearWidthMm = parseNum(bike.rearWidthMm)
  const packWeightKg = parseNum(state.packWeightKg, 0)
  const adv = bike.advanced

  const frontMin = adv.frontMinPsi.trim() ? psiToKpa(parseNum(adv.frontMinPsi)) : undefined
  const frontMax = adv.frontMaxPsi.trim() ? psiToKpa(parseNum(adv.frontMaxPsi)) : undefined
  const rearMin = adv.rearMinPsi.trim() ? psiToKpa(parseNum(adv.rearMinPsi)) : undefined
  const rearMax = adv.rearMaxPsi.trim() ? psiToKpa(parseNum(adv.rearMaxPsi)) : undefined

  const frontMeasured = adv.frontMeasuredWidthMm.trim()
    ? parseNum(adv.frontMeasuredWidthMm)
    : undefined
  const rearMeasured = adv.rearMeasuredWidthMm.trim()
    ? parseNum(adv.rearMeasuredWidthMm)
    : undefined
  const rimInternal = adv.rimInternalWidthMm.trim()
    ? parseNum(adv.rimInternalWidthMm)
    : undefined
  const wheelDiameter = adv.wheelDiameterInches.trim()
    ? parseNum(adv.wheelDiameterInches)
    : undefined
  const frontLoad = adv.frontLoadPercent.trim() ? parseNum(adv.frontLoadPercent) : undefined
  const expectedSpeed = state.expectedSpeedKmh.trim()
    ? parseNum(state.expectedSpeedKmh)
    : undefined

  return {
    rider: { weightKg: riderWeightKg },
    bike: { weightKg: bikeWeightKg },
    ride: {
      type: state.rideType,
      gravelPercent: Math.min(100, Math.max(0, parseNum(state.gravelPercent, 0))),
      packWeightKg,
      expectedSpeedKmh: expectedSpeed,
    },
    tyres: {
      frontWidthMm,
      rearWidthMm,
      tubeType: bike.tubeType,
      category: bike.tyreCategory || undefined,
      casing: bike.casing || undefined,
      modelName: bike.tyreModel.trim() || undefined,
    },
    advanced: {
      frontMeasuredWidthMm: frontMeasured,
      rearMeasuredWidthMm: rearMeasured,
      rimInternalWidthMm: rimInternal,
      rimType: adv.rimType || undefined,
      wheelDiameterInches: wheelDiameter,
      frontManufacturerLimits:
        frontMin !== undefined || frontMax !== undefined
          ? { minKpa: frontMin, maxKpa: frontMax }
          : undefined,
      rearManufacturerLimits:
        rearMin !== undefined || rearMax !== undefined
          ? { minKpa: rearMin, maxKpa: rearMax }
          : undefined,
      frontLoadPercent: frontLoad,
    },
  }
}
