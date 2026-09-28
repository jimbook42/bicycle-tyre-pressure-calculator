import { STANDARD_ATMOSPHERIC_KPA } from '../data/weatherConstants'

export function celsiusToKelvin(celsius: number): number {
  return celsius + 273.15
}

/**
 * Ideal-gas gauge correction: target riding gauge → cold inflation gauge.
 * P_cold_abs = P_target_abs × (T_inflate / T_ride)
 */
export function coldInflationGaugeKpa(
  targetRidingGaugeKpa: number,
  rideTempC: number,
  inflationTempC: number,
  atmosphericKpa: number = STANDARD_ATMOSPHERIC_KPA,
): number {
  const targetAbs = targetRidingGaugeKpa + atmosphericKpa
  const rideK = celsiusToKelvin(rideTempC)
  const inflateK = celsiusToKelvin(inflationTempC)
  if (rideK <= 0 || inflateK <= 0) return targetRidingGaugeKpa
  const coldAbs = targetAbs * (inflateK / rideK)
  return coldAbs - atmosphericKpa
}
