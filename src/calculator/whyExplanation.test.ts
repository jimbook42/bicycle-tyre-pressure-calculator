import { describe, expect, it } from 'vitest'
import { calculatePressure } from './pressureEngine'
import { buildWhyLines } from './whyExplanation'
import type { CalculatorInput } from '../types'

const input: CalculatorInput = {
  rider: { weightKg: 75 },
  bike: { weightKg: 9 },
  ride: { type: 'road', gravelPercent: 0, packWeightKg: 0 },
  tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'tubeless' },
  advanced: { rimType: 'hooked', wheelDiameterInches: 28, rimInternalWidthMm: 19 },
}

describe('Why explanation', () => {
  it('uses the pressures shown on the dials, including a personalised adjustment', () => {
    const result = calculatePressure(input)
    const lines = buildWhyLines({
      bikeName: 'My bike',
      result,
      formatPressure: (kpa) => String(Math.round(kpa)),
      unit: 'psi',
      tubeLabel: 'Tubeless',
      personalisationEnabled: true,
      personalisation: {
        front: {
          baselineKpa: result.front.clampedKpa,
          personalisedKpa: result.front.clampedKpa,
          offsetKpa: 0,
          evidenceCount: 1,
          agreement: 1,
          active: true,
        },
        rear: {
          baselineKpa: result.rear.clampedKpa,
          personalisedKpa: result.rear.clampedKpa,
          offsetKpa: 0,
          evidenceCount: 1,
          agreement: 1,
          active: true,
        },
        active: true,
        evidenceCount: 1,
        summary: '',
      },
      shownFront: '68',
      shownRear: '100',
    })
    const starting = lines.find((line) => line.label === 'Starting pressure')
    expect(starting?.text).toContain('Front 68 PSI')
    expect(starting?.text).toContain('Rear 100 PSI')
    expect(lines.find((line) => line.label === 'Personalisation')?.text).toBe(
      'Based on 1 comparable ride',
    )
    expect(lines.find((line) => line.label === 'Surface')?.text).toContain('IRI')
  })
})
