import { STANDARD_ATMOSPHERIC_KPA } from '../data/weatherConstants'

/**
 * International Standard Atmosphere troposphere pressure. [P]
 * Used when the forecast includes elevation. Otherwise sea-level pressure.
 */
export function atmosphericPressureKpa(elevationM: number | undefined): number {
  if (elevationM === undefined || !Number.isFinite(elevationM)) return STANDARD_ATMOSPHERIC_KPA
  if (elevationM < -500 || elevationM > 11000) return STANDARD_ATMOSPHERIC_KPA
  const temperatureK = 288.15 - 0.0065 * elevationM
  return STANDARD_ATMOSPHERIC_KPA * (temperatureK / 288.15) ** 5.25588
}

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
