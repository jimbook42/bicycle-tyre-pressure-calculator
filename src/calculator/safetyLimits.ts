import type { ManufacturerLimits, WheelPressureDetail } from '../types'

export function applyManufacturerLimits(
  targetKpa: number,
  limits: ManufacturerLimits | undefined,
): Pick<
  WheelPressureDetail,
  'clampedKpa' | 'clampedToMin' | 'clampedToMax' | 'manufacturerMinKpa' | 'manufacturerMaxKpa'
> {
  const manufacturerMinKpa = limits?.minKpa
  const manufacturerMaxKpa = limits?.maxKpa
  let clampedKpa = targetKpa
  let clampedToMin = false
  let clampedToMax = false

  if (manufacturerMinKpa !== undefined && clampedKpa < manufacturerMinKpa) {
    clampedKpa = manufacturerMinKpa
    clampedToMin = true
  }
  if (manufacturerMaxKpa !== undefined && clampedKpa > manufacturerMaxKpa) {
    clampedKpa = manufacturerMaxKpa
    clampedToMax = true
  }

  return {
    clampedKpa,
    clampedToMin,
    clampedToMax,
    manufacturerMinKpa,
    manufacturerMaxKpa,
  }
}
