import { describe, expect, it, beforeEach } from 'vitest'
import {
  addBike,
  defaultAppPersistence,
  deleteBike,
  getSelectedBike,
  migrateFromV1,
  normalizeAppPersistence,
  STORAGE_KEY_V1,
  STORAGE_KEY_V2,
  loadAppPersistence,
  saveAppPersistence,
  updateSelectedBike,
} from './localStore'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

describe('localStore', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('migrates legacy v1 flat state into a bike profile without losing data', () => {
    const legacy = {
      riderWeightKg: '80',
      bikeWeightKg: '10',
      frontWidthMm: '32',
      rearWidthMm: '34',
      tubeType: 'butyl' as const,
      frontMinPsi: '50',
    }
    const migrated = migrateFromV1(legacy)
    expect(migrated.riderWeightKg).toBe('80')
    expect(migrated.bikes).toHaveLength(1)
    expect(migrated.bikes[0].weightKg).toBe('10')
    expect(migrated.bikes[0].frontWidthMm).toBe('32')
    expect(migrated.bikes[0].tubeType).toBe('butyl')
    expect(migrated.bikes[0].advanced.frontMinPsi).toBe('50')
    expect(migrated.selectedBikeId).toBe(migrated.bikes[0].id)
  })

  it('loads v1 from storage, writes v2, and preserves rider weight', () => {
    storage.setItem(
      STORAGE_KEY_V1,
      JSON.stringify({ riderWeightKg: '72', bikeWeightKg: '8', frontWidthMm: '25' }),
    )
    const loaded = loadAppPersistence(storage)
    expect(loaded.riderWeightKg).toBe('72')
    expect(loaded.bikes[0].weightKg).toBe('8')
    expect(storage.getItem(STORAGE_KEY_V2)).not.toBeNull()
  })

  it('defaults missing fields on partial v2 without discarding bikes', () => {
    const partial = {
      version: 2,
      riderWeightKg: '70',
      bikes: [{ id: 'keep-me', name: 'Gravel rig', weightKg: '11' }],
      selectedBikeId: 'keep-me',
    }
    const normalized = normalizeAppPersistence(partial)
    expect(normalized.bikes[0].id).toBe('keep-me')
    expect(normalized.bikes[0].name).toBe('Gravel rig')
    expect(normalized.bikes[0].rearWidthMm).toBeTruthy()
    expect(normalized.pressureUnit).toBe('psi')
  })

  it('adds, selects, updates, and deletes bikes', () => {
    let state = defaultAppPersistence()
    const firstId = state.bikes[0].id
    state = addBike(state, 'Road bike')
    expect(state.bikes).toHaveLength(2)
    expect(getSelectedBike(state).name).toBe('Road bike')

    state = updateSelectedBike(state, (b) => ({ ...b, weightKg: '7.5' }))
    expect(getSelectedBike(state).weightKg).toBe('7.5')

    state = deleteBike(state, getSelectedBike(state).id)
    expect(state.bikes).toHaveLength(1)
    expect(state.bikes[0].id).toBe(firstId)
  })

  it('does not delete the last remaining bike', () => {
    let state = defaultAppPersistence()
    state = deleteBike(state, state.bikes[0].id)
    expect(state.bikes).toHaveLength(1)
  })

  it('defaults missing feedback fields without dropping bikes', () => {
    const normalized = normalizeAppPersistence({
      version: 2,
      riderWeightKg: '70',
      bikes: [{ id: 'keep-me', name: 'Road', weightKg: '8' }],
      selectedBikeId: 'keep-me',
    })
    expect(normalized.bikes[0].id).toBe('keep-me')
    expect(normalized.feedback).toEqual([])
    expect(normalized.applyPersonalisation).toBe(true)
    expect(normalized.weather.enabled).toBe(true)
  })

  it('round-trips persistence through save and load', () => {
    const state = defaultAppPersistence()
    state.riderWeightKg = '81'
    saveAppPersistence(state, storage)
    const loaded = loadAppPersistence(storage)
    expect(loaded.riderWeightKg).toBe('81')
    expect(loaded.bikes.length).toBe(state.bikes.length)
  })
})
