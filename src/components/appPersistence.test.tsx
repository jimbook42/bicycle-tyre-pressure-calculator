/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'
import {
  defaultAppPersistence,
  loadAppPersistence,
  saveAppPersistence,
  STORAGE_KEY_V2,
} from '../storage/localStore'
import { parseStoredWheelDiameterInches } from '../data/wheelSizes'

describe('app persistence with refactored UI', () => {
  const storage = {
    store: {} as Record<string, string>,
    getItem(key: string) {
      return this.store[key] ?? null
    },
    setItem(key: string, value: string) {
      this.store[key] = value
    },
    removeItem(key: string) {
      delete this.store[key]
    },
    clear() {
      this.store = {}
    },
    get length() {
      return Object.keys(this.store).length
    },
    key() {
      return null
    },
  }

  afterEach(() => {
    storage.clear()
  })

  it('loads existing v2 bikes and enables weather on normalize', () => {
    const bike = defaultAppPersistence().bikes[0]
    bike.advanced.wheelDiameterInches = '28'
    const saved = {
      ...defaultAppPersistence(),
      riderWeightKg: '89.4',
      selectedBikeId: bike.id,
      bikes: [bike],
      weather: { ...defaultAppPersistence().weather, enabled: false },
    }
    storage.setItem(STORAGE_KEY_V2, JSON.stringify(saved))
    const loaded = loadAppPersistence(storage as Storage)
    expect(loaded.riderWeightKg).toBe('89.4')
    expect(loaded.weather.enabled).toBe(true)
    expect(parseStoredWheelDiameterInches(loaded.bikes[0].advanced.wheelDiameterInches).selectId).toBe(
      '700c',
    )
  })

  it('round-trips selected bike id', () => {
    const state = defaultAppPersistence()
    const second = { ...state.bikes[0], id: 'bike-2', name: 'Gravel rig' }
    state.bikes.push(second)
    state.selectedBikeId = 'bike-2'
    saveAppPersistence(state, storage as Storage)
    const loaded = loadAppPersistence(storage as Storage)
    expect(loaded.selectedBikeId).toBe('bike-2')
    expect(loaded.bikes.find((b) => b.id === 'bike-2')?.name).toBe('Gravel rig')
  })
})
