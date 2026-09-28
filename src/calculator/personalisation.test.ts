import { describe, expect, it } from 'vitest'
import { KPA_PER_PSI } from '../data/constants'
import { personalisePressure, resetPersonalisation, setupEvidenceKey } from './personalisation'
import { psiToKpa } from './units'
import type { PressureResult, RideFeedback, RideFeel } from '../types'

function baseline(frontPsi: number, rearPsi: number, limits?: { min?: number; max?: number }): PressureResult {
  const frontKpa = psiToKpa(frontPsi)
  const rearKpa = psiToKpa(rearPsi)
  const minKpa = limits?.min !== undefined ? psiToKpa(limits.min) : undefined
  const maxKpa = limits?.max !== undefined ? psiToKpa(limits.max) : undefined
  return {
    front: {
      targetKpa: frontKpa,
      clampedKpa: frontKpa,
      effectiveWidthMm: 28,
      wheelLoadKg: 30,
      manufacturerMinKpa: minKpa,
      manufacturerMaxKpa: maxKpa,
      clampedToMin: false,
      clampedToMax: false,
    },
    rear: {
      targetKpa: rearKpa,
      clampedKpa: rearKpa,
      effectiveWidthMm: 28,
      wheelLoadKg: 50,
      manufacturerMinKpa: minKpa,
      manufacturerMaxKpa: maxKpa,
      clampedToMin: false,
      clampedToMax: false,
    },
    systemWeightKg: 84,
    frontLoadPercent: 40,
    rearLoadPercent: 60,
    surfaceModel: 'road',
    warnings: [],
    notes: [],
    inputsUsed: [],
  }
}

function note(partial: {
  setupKey?: string
  feel: RideFeel
  actualFrontPsi: number
  actualRearPsi: number
  baselineFrontPsi?: number
  baselineRearPsi?: number
  createdAt: string
  bikeId?: string
}): RideFeedback {
  const setupKey = partial.setupKey ?? 'bike-a|road|0|28|28|0|0|tubeless|84'
  return {
    id: partial.createdAt,
    createdAt: partial.createdAt,
    bikeId: partial.bikeId ?? 'bike-a',
    bikeName: 'Test',
    setupKey,
    rideType: 'road',
    gravelPercent: 0,
    systemWeightKg: 84,
    tubeType: 'tubeless',
    frontWidthMm: 28,
    rearWidthMm: 28,
    baselineFrontKpa: psiToKpa(partial.baselineFrontPsi ?? 70),
    baselineRearKpa: psiToKpa(partial.baselineRearPsi ?? 80),
    actualFrontKpa: psiToKpa(partial.actualFrontPsi),
    actualRearKpa: psiToKpa(partial.actualRearPsi),
    result: partial.feel,
    notes: '',
  }
}

const key = 'bike-a|road|0|28|28|0|0|tubeless|84'

describe('personalisation', () => {
  it('good feedback reinforces the actual pressure, even when it differs from the recommendation', () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      note({
        feel: 'good',
        actualFrontPsi: 66,
        actualRearPsi: 76,
        createdAt: `2026-01-0${i + 1}T00:00:00.000Z`,
      }),
    )
    const result = personalisePressure(baseline(70, 80), records, key)
    expect(result.front.personalisedKpa).toBeCloseTo(psiToKpa(66), 0)
    expect(result.rear.personalisedKpa).toBeCloseTo(psiToKpa(76), 0)
    expect(records[0].actualFrontKpa).not.toBe(records[0].baselineFrontKpa)
  })

  it('too hard creates downward evidence', () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      note({
        feel: 'too_hard',
        actualFrontPsi: 70,
        actualRearPsi: 80,
        createdAt: `2026-02-0${i + 1}T00:00:00.000Z`,
      }),
    )
    const result = personalisePressure(baseline(70, 80), records, key)
    expect(result.front.offsetKpa).toBeLessThan(0)
    expect(result.rear.offsetKpa).toBeLessThan(0)
  })

  it('too soft creates upward evidence', () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      note({
        feel: 'too_soft',
        actualFrontPsi: 70,
        actualRearPsi: 80,
        createdAt: `2026-03-0${i + 1}T00:00:00.000Z`,
      }),
    )
    const result = personalisePressure(baseline(70, 80), records, key)
    expect(result.front.offsetKpa).toBeGreaterThan(0)
    expect(result.rear.offsetKpa).toBeGreaterThan(0)
  })

  it('one ride cannot cause an extreme change', () => {
    const records = [
      note({
        feel: 'good',
        actualFrontPsi: 40,
        actualRearPsi: 40,
        createdAt: '2026-04-01T00:00:00.000Z',
      }),
    ]
    const result = personalisePressure(baseline(70, 80), records, key)
    const frontDropPsi = (result.front.baselineKpa - result.front.personalisedKpa) / KPA_PER_PSI
    expect(frontDropPsi).toBeLessThan(2)
    expect(frontDropPsi).toBeGreaterThan(0)
  })

  it('repeated evidence accumulates toward the ridden pressure', () => {
    const one = personalisePressure(
      baseline(70, 80),
      [note({ feel: 'good', actualFrontPsi: 66, actualRearPsi: 76, createdAt: '2026-05-01T00:00:00.000Z' })],
      key,
    )
    const many = personalisePressure(
      baseline(70, 80),
      Array.from({ length: 5 }, (_, i) =>
        note({
          feel: 'good',
          actualFrontPsi: 66,
          actualRearPsi: 76,
          createdAt: `2026-05-0${i + 1}T00:00:00.000Z`,
        }),
      ),
      key,
    )
    expect(Math.abs(many.front.offsetKpa)).toBeGreaterThan(Math.abs(one.front.offsetKpa))
  })

  it('conflicting evidence reduces the adjustment', () => {
    const agree = personalisePressure(
      baseline(70, 80),
      Array.from({ length: 5 }, (_, i) =>
        note({
          feel: 'good',
          actualFrontPsi: 66,
          actualRearPsi: 76,
          createdAt: `2026-06-0${i + 1}T00:00:00.000Z`,
        }),
      ),
      key,
    )
    const conflict = personalisePressure(
      baseline(70, 80),
      [
        ...Array.from({ length: 3 }, (_, i) =>
          note({
            feel: 'good',
            actualFrontPsi: 66,
            actualRearPsi: 76,
            createdAt: `2026-06-1${i}T00:00:00.000Z`,
          }),
        ),
        ...Array.from({ length: 3 }, (_, i) =>
          note({
            feel: 'good',
            actualFrontPsi: 74,
            actualRearPsi: 84,
            createdAt: `2026-06-2${i}T00:00:00.000Z`,
          }),
        ),
      ],
      key,
    )
    expect(conflict.front.agreement).toBeLessThan(agree.front.agreement)
    expect(Math.abs(conflict.front.offsetKpa)).toBeLessThan(Math.abs(agree.front.offsetKpa))
  })

  it('cannot push past manufacturer limits', () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      note({
        feel: 'good',
        actualFrontPsi: 50,
        actualRearPsi: 50,
        createdAt: `2026-07-0${i + 1}T00:00:00.000Z`,
      }),
    )
    const result = personalisePressure(baseline(70, 80, { min: 68, max: 90 }), records, key)
    expect(result.front.personalisedKpa).toBeGreaterThanOrEqual(psiToKpa(68) - 0.01)
    expect(result.rear.personalisedKpa).toBeGreaterThanOrEqual(psiToKpa(68) - 0.01)
  })

  it('reset removes personalisation influence for that setup', () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      note({
        feel: 'good',
        actualFrontPsi: 66,
        actualRearPsi: 76,
        createdAt: `2026-08-0${i + 1}T00:00:00.000Z`,
      }),
    )
    const cleared = resetPersonalisation(records, key)
    const result = personalisePressure(baseline(70, 80), cleared, key)
    expect(result.active).toBe(false)
    expect(result.front.personalisedKpa).toBeCloseTo(psiToKpa(70), 5)
  })

  it('keeps evidence separated by bike and setup', () => {
    const otherKey = setupEvidenceKey({
      bikeId: 'bike-b',
      rideType: 'road',
      gravelPercent: 0,
      frontWidthMm: 28,
      rearWidthMm: 28,
      tubeType: 'tubeless',
      systemWeightKg: 84,
    })
    expect(otherKey).not.toBe(key)
    const records = [
      note({
        feel: 'good',
        actualFrontPsi: 60,
        actualRearPsi: 70,
        createdAt: '2026-09-01T00:00:00.000Z',
        setupKey: otherKey,
        bikeId: 'bike-b',
      }),
    ]
    const result = personalisePressure(baseline(70, 80), records, key)
    expect(result.active).toBe(false)
  })
})
