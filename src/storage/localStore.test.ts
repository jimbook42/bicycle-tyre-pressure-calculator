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
    expect(normalized.rideHistory).toEqual([])
    expect(normalized.weightUnit).toBe('kg')
    expect(normalized.temperatureUnit).toBe('celsius')
    expect(normalized.applyPersonalisation).toBe(true)
    expect(normalized.weather.enabled).toBe(true)
  })

  it('migrates a version 2 save onto schema 3 without dropping history', () => {
    const legacy = {
      version: 2,
      riderWeightKg: '82',
      bikes: [
        {
          id: 'keep-me',
          name: 'Commute',
          weightKg: '12',
          frontWidthMm: '32',
          rearWidthMm: '32',
          tubeType: 'butyl',
          advanced: { frontMinPsi: '40', rimType: 'hooked' },
        },
      ],
      selectedBikeId: 'keep-me',
      feedback: [
        {
          id: 'fb-1',
          createdAt: '2026-01-01T00:00:00.000Z',
          bikeId: 'keep-me',
          bikeName: 'Commute',
          setupKey: 'keep-me|road|0|32|32|0|0|butyl|90',
          rideType: 'road',
          gravelPercent: 0,
          systemWeightKg: 90,
          tubeType: 'butyl',
          frontWidthMm: 32,
          rearWidthMm: 32,
          baselineFrontKpa: 400,
          baselineRearKpa: 500,
          actualFrontKpa: 390,
          actualRearKpa: 480,
          result: 'good',
          notes: 'fine',
        },
      ],
      rideHistory: [
        {
          id: 'ride-1',
          calculatedAt: '2026-01-01T00:00:00.000Z',
          bikeId: 'keep-me',
          bikeName: 'Commute',
          setupKey: 'keep-me|road|0|32|32|0|0|butyl|90',
          rideType: 'road',
          recommendedFrontKpa: 400,
          recommendedRearKpa: 500,
        },
      ],
    }
    storage.setItem(STORAGE_KEY_V2, JSON.stringify(legacy))
    const loaded = loadAppPersistence(storage)
    expect(loaded.version).toBe(3)
    expect(loaded.riderWeightKg).toBe('82')
    expect(loaded.bikes[0].id).toBe('keep-me')
    expect(loaded.bikes[0].tubeType).toBe('butyl')
    expect(loaded.bikes[0].tyreCategory).toBe('')
    expect(loaded.bikes[0].casing).toBe('')
    expect(loaded.bikes[0].tyreModel).toBe('')
    expect(loaded.bikes[0].advanced.frontMinPsi).toBe('40')
    expect(loaded.expectedSpeedKmh).toBe('')
    expect(loaded.feedback).toHaveLength(1)
    expect(loaded.feedback[0].actualFrontKpa).toBe(390)
    expect(loaded.rideHistory).toHaveLength(1)
    expect(loaded.rideHistory[0].recommendedRearKpa).toBe(500)
  })

  it('round-trips persistence through save and load', () => {
    const state = defaultAppPersistence()
    state.riderWeightKg = '81'
    state.bikes[0].tubeType = 'latex'
    state.bikes[0].tyreCategory = 'gravel'
    state.bikes[0].casing = 'race'
    state.bikes[0].tyreModel = 'Cinturato'
    state.expectedSpeedKmh = '27'
    state.feedback = [
      {
        id: 'fb',
        createdAt: '2026-02-01T00:00:00.000Z',
        bikeId: state.bikes[0].id,
        bikeName: 'My bike',
        setupKey: 'k',
        rideType: 'road',
        gravelPercent: 0,
        systemWeightKg: 84,
        tubeType: 'latex',
        frontWidthMm: 28,
        rearWidthMm: 28,
        baselineFrontKpa: 400,
        baselineRearKpa: 500,
        actualFrontKpa: 410,
        actualRearKpa: 490,
        result: 'good',
        frontFeel: 'too_soft',
        rearFeel: 'too_hard',
        notes: '',
      },
    ]
    saveAppPersistence(state, storage)
    const loaded = loadAppPersistence(storage)
    expect(loaded.riderWeightKg).toBe('81')
    expect(loaded.version).toBe(3)
    expect(loaded.expectedSpeedKmh).toBe('27')
    expect(loaded.bikes[0].tubeType).toBe('latex')
    expect(loaded.bikes[0].tyreCategory).toBe('gravel')
    expect(loaded.bikes[0].casing).toBe('race')
    expect(loaded.bikes[0].tyreModel).toBe('Cinturato')
    expect(loaded.feedback[0].frontFeel).toBe('too_soft')
    expect(loaded.feedback[0].rearFeel).toBe('too_hard')
  })

  it('keeps existing bikes, feedback, and history when a V2.1 surface type is stored', () => {
    const state = defaultAppPersistence()
    state.rideType = 'road-smooth'
    state.rideHistory = [
      {
        id: 'h1',
        calculatedAt: '2026-03-01T00:00:00.000Z',
        bikeId: state.bikes[0].id,
        bikeName: 'My bike',
        setupKey: 'legacy',
        rideType: 'gravel',
        gravelPercent: 0,
        riderWeightKg: 75,
        packWeightKg: 0,
        systemWeightKg: 84,
        tubeType: 'tubeless',
        frontWidthMm: 40,
        rearWidthMm: 40,
        recommendedFrontKpa: 280,
        recommendedRearKpa: 320,
        baselineFrontKpa: 280,
        baselineRearKpa: 320,
        pressureUnit: 'psi',
      },
    ]
    saveAppPersistence(state, storage)
    const loaded = loadAppPersistence(storage)
    expect(loaded.version).toBe(3)
    expect(loaded.bikes).toHaveLength(1)
    expect(loaded.rideType).toBe('road-smooth')
    expect(loaded.rideHistory).toHaveLength(1)
    expect(loaded.rideHistory[0].rideType).toBe('gravel')
    expect(loaded.rideHistory[0].baselineRearKpa).toBe(320)
  })
})
