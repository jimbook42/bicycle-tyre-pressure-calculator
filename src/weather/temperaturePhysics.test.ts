import { describe, expect, it } from 'vitest'
import { celsiusToKelvin, coldInflationGaugeKpa } from './temperaturePhysics'
import { KPA_PER_PSI } from '../data/constants'
import { kpaToPsi } from '../calculator/units'

describe('temperaturePhysics', () => {
  it('converts Celsius to Kelvin', () => {
    expect(celsiusToKelvin(0)).toBeCloseTo(273.15, 5)
    expect(celsiusToKelvin(20)).toBeCloseTo(293.15, 5)
  })

  it('leaves gauge pressure unchanged when inflation and ride temperatures match', () => {
    const target = psiToKpa(70)
    expect(coldInflationGaugeKpa(target, 20, 20)).toBeCloseTo(target, 3)
  })

  it('lowers cold inflation when the ride will be warmer than inflation', () => {
    const target = psiToKpa(70)
    const cold = coldInflationGaugeKpa(target, 25, 10)
    expect(cold).toBeLessThan(target)
  })

  it('reproduces about 52.3 PSI when 50 PSI at 10°C is filled at 20°C', () => {
    const pump = coldInflationGaugeKpa(psiToKpa(50), 10, 20)
    expect(kpaToPsi(pump)).toBeCloseTo(52.3, 1)
  })

  it('raises cold inflation when the ride will be colder than inflation', () => {
    const target = psiToKpa(70)
    const cold = coldInflationGaugeKpa(target, 5, 20)
    expect(cold).toBeGreaterThan(target)
  })
})

function psiToKpa(psi: number) {
  return psi * KPA_PER_PSI
}
