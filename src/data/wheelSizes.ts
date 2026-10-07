import { DEFAULT_BEAD_SEAT_DIAMETER_MM } from './v2ModelConstants'

/** Common wheel sizes. `diameterInches` is the stored preset. `bsdMm` is the bead-seat diameter used by the pressure model. */
export interface WheelSizeOption {
  id: string
  label: string
  diameterInches: number
  /** ETRTO bead-seat diameter, millimetres. */
  bsdMm: number
}

export const WHEEL_SIZE_OPTIONS: WheelSizeOption[] = [
  { id: '700c', label: '700C', diameterInches: 28, bsdMm: 622 },
  { id: '650b', label: '650B', diameterInches: 27.5, bsdMm: 584 },
  { id: '650c', label: '650C', diameterInches: 24, bsdMm: 571 },
  { id: '29', label: '29"', diameterInches: 29, bsdMm: 622 },
  { id: '27.5', label: '27.5"', diameterInches: 27.5, bsdMm: 584 },
  { id: '26', label: '26"', diameterInches: 26, bsdMm: 559 },
  { id: '20', label: '20"', diameterInches: 20, bsdMm: 406 },
  { id: '16', label: '16"', diameterInches: 16, bsdMm: 349 },
]

const TOLERANCE = 0.35

export interface ResolvedBeadSeat {
  bsdMm: number
  /** R_L, metres. */
  radiusM: number
  assumed: boolean
  label: string
}

/**
 * Wheel size selects the bead-seat diameter. It is an input to Renart geometry,
 * not a display-only profile field.
 * The 24 inch preset is the existing 650C option (571 mm), not a 507 mm 24 inch wheel.
 */
export function resolveBeadSeat(diameterInches: number | undefined): ResolvedBeadSeat {
  if (diameterInches === undefined || !Number.isFinite(diameterInches)) {
    return {
      bsdMm: DEFAULT_BEAD_SEAT_DIAMETER_MM,
      radiusM: DEFAULT_BEAD_SEAT_DIAMETER_MM / 2000,
      assumed: true,
      label: '700C',
    }
  }
  const match = WHEEL_SIZE_OPTIONS.find(
    (opt) => Math.abs(opt.diameterInches - diameterInches) <= TOLERANCE,
  )
  if (!match) {
    return {
      bsdMm: DEFAULT_BEAD_SEAT_DIAMETER_MM,
      radiusM: DEFAULT_BEAD_SEAT_DIAMETER_MM / 2000,
      assumed: true,
      label: '700C',
    }
  }
  return {
    bsdMm: match.bsdMm,
    radiusM: match.bsdMm / 2000,
    assumed: false,
    label: match.label,
  }
}

export function wheelSizeIdForInches(inches: number): string {
  const match = WHEEL_SIZE_OPTIONS.find(
    (opt) => Math.abs(opt.diameterInches - inches) <= TOLERANCE,
  )
  return match?.id ?? 'custom'
}

export function inchesFromWheelSizeId(id: string, customInches?: number): string {
  if (id === 'custom') {
    return customInches !== undefined && Number.isFinite(customInches) ? String(customInches) : ''
  }
  const opt = WHEEL_SIZE_OPTIONS.find((o) => o.id === id)
  return opt ? String(opt.diameterInches) : ''
}

export function parseStoredWheelDiameterInches(stored: string): {
  selectId: string
  customInches: string
} {
  const trimmed = stored.trim()
  if (!trimmed) return { selectId: '', customInches: '' }
  const n = Number.parseFloat(trimmed)
  if (!Number.isFinite(n)) return { selectId: 'custom', customInches: trimmed }
  const id = wheelSizeIdForInches(n)
  if (id === 'custom') return { selectId: 'custom', customInches: trimmed }
  return { selectId: id, customInches: trimmed }
}
