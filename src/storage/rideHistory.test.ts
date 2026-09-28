import { describe, expect, it } from 'vitest'
import { defaultAppPersistence } from './localStore'
import { createRideHistoryRecord, prependRideHistory } from './rideHistory'
import { calculatePressure } from '../calculator/pressureEngine'

describe('ride history', () => {
  it('records recommended pressures after a calculation context', () => {
    const state = defaultAppPersistence()
    const bike = state.bikes[0]
    const result = calculatePressure({
      rider: { weightKg: 75 },
      bike: { weightKg: 9 },
      ride: { type: 'road', gravelPercent: 0, packWeightKg: 0 },
      tyres: { frontWidthMm: 28, rearWidthMm: 28, tubeType: 'tubeless' },
    })
    const record = createRideHistoryRecord({
      state,
      bike,
      setupKey: 'test-key',
      systemWeightKg: result.systemWeightKg,
      result,
      shownFrontKpa: result.front.clampedKpa,
      shownRearKpa: result.rear.clampedKpa,
      preview: null,
    })
    expect(record.recommendedFrontKpa).toBe(result.front.clampedKpa)
    expect(record.bikeName).toBe(bike.name)
    const next = prependRideHistory(state, record)
    expect(next.rideHistory).toHaveLength(1)
    expect(next.rideHistory[0].id).toBe(record.id)
  })
})
