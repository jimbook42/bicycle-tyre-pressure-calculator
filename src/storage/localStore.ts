import type { StoredAppState } from '../types'

const STORAGE_KEY = 'bicycle-tyre-pressure-calculator:v1'

export const defaultStoredState = (): StoredAppState => ({
  riderWeightKg: '75',
  bikeWeightKg: '9',
  rideType: 'road',
  gravelPercent: '30',
  packWeightKg: '0',
  frontWidthMm: '28',
  rearWidthMm: '28',
  tubeType: 'tubeless',
  pressureUnit: 'psi',
  advancedOpen: false,
  frontMeasuredWidthMm: '',
  rearMeasuredWidthMm: '',
  rimInternalWidthMm: '',
  rimType: '',
  wheelDiameterInches: '',
  frontMinPsi: '',
  frontMaxPsi: '',
  rearMinPsi: '',
  rearMaxPsi: '',
  frontLoadPercent: '',
})

export function loadStoredState(): StoredAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultStoredState()
    const parsed = JSON.parse(raw) as Partial<StoredAppState>
    return { ...defaultStoredState(), ...parsed }
  } catch {
    return defaultStoredState()
  }
}

export function saveStoredState(state: StoredAppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
