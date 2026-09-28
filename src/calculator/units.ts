import { KPA_PER_BAR, KPA_PER_PSI } from '../data/constants'
import type { PressureUnit } from '../types'

export function kpaToPsi(kpa: number): number {
  return kpa / KPA_PER_PSI
}

export function psiToKpa(psi: number): number {
  return psi * KPA_PER_PSI
}

export function kpaToBar(kpa: number): number {
  return kpa / KPA_PER_BAR
}

export function formatPressure(kpa: number, unit: PressureUnit): string {
  switch (unit) {
    case 'psi':
      return String(Math.round(kpaToPsi(kpa)))
    case 'bar':
      return kpaToBar(kpa).toFixed(1)
    case 'kPa':
      return String(Math.round(kpa))
    default:
      return String(Math.round(kpaToPsi(kpa)))
  }
}

export function unitLabel(unit: PressureUnit): string {
  switch (unit) {
    case 'psi':
      return 'PSI'
    case 'bar':
      return 'bar'
    case 'kPa':
      return 'kPa'
    default:
      return 'PSI'
  }
}
