/** Common wheel sizes in UI; stored internally as nominal outer diameter in inches. */
export interface WheelSizeOption {
  id: string
  label: string
  diameterInches: number
}

export const WHEEL_SIZE_OPTIONS: WheelSizeOption[] = [
  { id: '700c', label: '700C', diameterInches: 28 },
  { id: '650b', label: '650B', diameterInches: 27.5 },
  { id: '650c', label: '650C', diameterInches: 24 },
  { id: '29', label: '29"', diameterInches: 29 },
  { id: '27.5', label: '27.5"', diameterInches: 27.5 },
  { id: '26', label: '26"', diameterInches: 26 },
  { id: '20', label: '20"', diameterInches: 20 },
  { id: '16', label: '16"', diameterInches: 16 },
]

const TOLERANCE = 0.35

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
