/**
 * ISO 5775-1:2023 Table 3 — recommended maximum pressure for straight-side
 * (hookless / SS / TSS) rims, by nominal section width. [L]
 *
 * This is a generic compatibility table. It is not a claim that every rim
 * manufacturer uses these exact caps. A lower explicit manufacturer maximum
 * still binds. A hooked rim does not use this table.
 */
const HOOKLESS_BANDS: { minMm: number; maxMm: number; maxKpa: number }[] = [
  { minMm: 18, maxMm: 24, maxKpa: 550 },
  { minMm: 25, maxMm: 29, maxKpa: 500 },
  { minMm: 30, maxMm: 34, maxKpa: 450 },
  { minMm: 35, maxMm: 39, maxKpa: 400 },
  { minMm: 40, maxMm: 44, maxKpa: 350 },
  { minMm: 45, maxMm: 54, maxKpa: 300 },
  { minMm: 55, maxMm: 64, maxKpa: 250 },
  { minMm: 65, maxMm: 74, maxKpa: 200 },
  { minMm: 75, maxMm: 84, maxKpa: 150 },
]

export function hooklessMaxKpa(sectionWidthMm: number): number | undefined {
  const band = HOOKLESS_BANDS.find(
    (row) => sectionWidthMm >= row.minMm && sectionWidthMm <= row.maxMm,
  )
  return band?.maxKpa
}

export interface SafetyClampInput {
  targetKpa: number
  manufacturerMinKpa?: number
  manufacturerMaxKpa?: number
  hooklessMaxKpa?: number
}

export interface SafetyClamp {
  clampedKpa: number
  clampedToMin: boolean
  clampedToMax: boolean
  safetyMinKpa: number
  safetyMaxKpa?: number
  manufacturerMinKpa?: number
  manufacturerMaxKpa?: number
  hooklessMaxKpa?: number
  conflictingLimits: boolean
}

/**
 * Hard safety envelope, independent of the pressure model.
 * Maximum is the lowest applicable cap (manufacturer maximum and, when it
 * applies, the ISO hookless cap).
 * Minimum is an explicit manufacturer minimum only. There is no Renart
 * section-height floor and no synthetic PSI floor.
 * If the minimum sits above the maximum, the maximum still wins and the
 * conflict is flagged: staying under a stated burst or compatibility cap is
 * the conservative bound.
 */
export function applySafetyEnvelope(input: SafetyClampInput): SafetyClamp {
  const manufacturerMinKpa = finiteOrUndefined(input.manufacturerMinKpa)
  const manufacturerMaxKpa = finiteOrUndefined(input.manufacturerMaxKpa)
  const hookless = finiteOrUndefined(input.hooklessMaxKpa)
  const maxCandidates = [manufacturerMaxKpa, hookless].filter(
    (value): value is number => value !== undefined,
  )
  const safetyMaxKpa = maxCandidates.length > 0 ? Math.min(...maxCandidates) : undefined
  const safetyMinKpa = manufacturerMinKpa ?? 0

  let clampedKpa = input.targetKpa
  let clampedToMin = false
  let clampedToMax = false
  if (safetyMaxKpa !== undefined && clampedKpa > safetyMaxKpa) {
    clampedKpa = safetyMaxKpa
    clampedToMax = true
  }
  if (manufacturerMinKpa !== undefined && clampedKpa < manufacturerMinKpa) {
    clampedKpa = manufacturerMinKpa
    clampedToMin = true
  } else if (clampedKpa < 0) {
    clampedKpa = 0
  }
  let conflictingLimits = false
  if (safetyMaxKpa !== undefined && clampedKpa > safetyMaxKpa) {
    clampedKpa = safetyMaxKpa
    clampedToMax = true
    conflictingLimits = true
  }

  return {
    clampedKpa,
    clampedToMin,
    clampedToMax,
    safetyMinKpa,
    safetyMaxKpa,
    manufacturerMinKpa,
    manufacturerMaxKpa,
    hooklessMaxKpa: hookless,
    conflictingLimits,
  }
}

function finiteOrUndefined(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined
  return value
}
