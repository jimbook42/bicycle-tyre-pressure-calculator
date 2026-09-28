import type {
  AppPersistence,
  BikeAdvancedStored,
  BikeProfile,
  PressureUnit,
  StoredAppStateV1,
  TubeType,
} from '../types'

const STORAGE_KEY_V1 = 'bicycle-tyre-pressure-calculator:v1'
const STORAGE_KEY_V2 = 'bicycle-tyre-pressure-calculator:v2'

export function createId(): string {
  return crypto.randomUUID()
}

export function defaultBikeAdvanced(): BikeAdvancedStored {
  return {
    frontMeasuredWidthMm: '',
    rearMeasuredWidthMm: '',
    rimInternalWidthMm: '',
    rimType: '',
    wheelDiameterInches: '',
    frontMinPsi: '',
    frontMaxPsi: '',
    rearMinPsi: '',
    rearMaxPsi: '',
    frontLoadPercent: '',
  }
}

export function createBikeProfile(overrides: Partial<BikeProfile> = {}): BikeProfile {
  const { advanced: advancedOverrides, ...rest } = overrides
  return {
    id: createId(),
    name: 'My bike',
    weightKg: '9',
    frontWidthMm: '28',
    rearWidthMm: '28',
    tubeType: 'tubeless',
    ...rest,
    advanced: { ...defaultBikeAdvanced(), ...advancedOverrides },
  }
}

export function defaultAppPersistence(): AppPersistence {
  const bike = createBikeProfile({ name: 'My bike' })
  return {
    version: 2,
    riderWeightKg: '75',
    bikes: [bike],
    selectedBikeId: bike.id,
    rideType: 'road',
    gravelPercent: '30',
    packWeightKg: '0',
    pressureUnit: 'psi',
    advancedOpen: false,
  }
}

export function migrateFromV1(legacy: StoredAppStateV1): AppPersistence {
  const defaults = defaultAppPersistence()
  const bike = createBikeProfile({
    name: 'My bike',
    weightKg: legacy.bikeWeightKg ?? defaults.bikes[0].weightKg,
    frontWidthMm: legacy.frontWidthMm ?? defaults.bikes[0].frontWidthMm,
    rearWidthMm: legacy.rearWidthMm ?? defaults.bikes[0].rearWidthMm,
    tubeType: (legacy.tubeType ?? defaults.bikes[0].tubeType) as TubeType,
    advanced: {
      ...defaultBikeAdvanced(),
      frontMeasuredWidthMm: legacy.frontMeasuredWidthMm ?? '',
      rearMeasuredWidthMm: legacy.rearMeasuredWidthMm ?? '',
      rimInternalWidthMm: legacy.rimInternalWidthMm ?? '',
      rimType: legacy.rimType ?? '',
      wheelDiameterInches: legacy.wheelDiameterInches ?? '',
      frontMinPsi: legacy.frontMinPsi ?? '',
      frontMaxPsi: legacy.frontMaxPsi ?? '',
      rearMinPsi: legacy.rearMinPsi ?? '',
      rearMaxPsi: legacy.rearMaxPsi ?? '',
      frontLoadPercent: legacy.frontLoadPercent ?? '',
    },
  })

  return {
    version: 2,
    riderWeightKg: legacy.riderWeightKg ?? defaults.riderWeightKg,
    bikes: [bike],
    selectedBikeId: bike.id,
    rideType: legacy.rideType ?? defaults.rideType,
    gravelPercent: legacy.gravelPercent ?? defaults.gravelPercent,
    packWeightKg: legacy.packWeightKg ?? defaults.packWeightKg,
    pressureUnit: (legacy.pressureUnit ?? defaults.pressureUnit) as PressureUnit,
    advancedOpen: legacy.advancedOpen ?? defaults.advancedOpen,
  }
}

function normalizeBike(raw: unknown, index: number): BikeProfile {
  const defaults = createBikeProfile({ name: `Bike ${index + 1}` })
  if (!raw || typeof raw !== 'object') return defaults
  const b = raw as Partial<BikeProfile>
  const id = typeof b.id === 'string' && b.id ? b.id : createId()
  const advRaw = b.advanced && typeof b.advanced === 'object' ? b.advanced : {}
  const adv = { ...defaultBikeAdvanced(), ...advRaw } as BikeAdvancedStored
  return {
    id,
    name: typeof b.name === 'string' && b.name.trim() ? b.name : defaults.name,
    weightKg: typeof b.weightKg === 'string' ? b.weightKg : defaults.weightKg,
    frontWidthMm:
      typeof b.frontWidthMm === 'string' ? b.frontWidthMm : defaults.frontWidthMm,
    rearWidthMm: typeof b.rearWidthMm === 'string' ? b.rearWidthMm : defaults.rearWidthMm,
    tubeType: (b.tubeType ?? defaults.tubeType) as TubeType,
    advanced: adv,
  }
}

/** Parse unknown JSON into a safe AppPersistence without throwing. */
export function normalizeAppPersistence(raw: unknown): AppPersistence {
  const defaults = defaultAppPersistence()
  if (!raw || typeof raw !== 'object') return defaults

  const data = raw as Partial<AppPersistence>
  let bikes: BikeProfile[] = Array.isArray(data.bikes)
    ? data.bikes.map((b, i) => normalizeBike(b, i))
    : defaults.bikes

  if (bikes.length === 0) {
    bikes = [createBikeProfile()]
  }

  let selectedBikeId =
    typeof data.selectedBikeId === 'string' ? data.selectedBikeId : bikes[0].id
  if (!bikes.some((b) => b.id === selectedBikeId)) {
    selectedBikeId = bikes[0].id
  }

  return {
    version: 2,
    riderWeightKg:
      typeof data.riderWeightKg === 'string' ? data.riderWeightKg : defaults.riderWeightKg,
    bikes,
    selectedBikeId,
    rideType: data.rideType ?? defaults.rideType,
    gravelPercent:
      typeof data.gravelPercent === 'string' ? data.gravelPercent : defaults.gravelPercent,
    packWeightKg:
      typeof data.packWeightKg === 'string' ? data.packWeightKg : defaults.packWeightKg,
    pressureUnit: (data.pressureUnit ?? defaults.pressureUnit) as PressureUnit,
    advancedOpen:
      typeof data.advancedOpen === 'boolean' ? data.advancedOpen : defaults.advancedOpen,
  }
}

export function getSelectedBike(state: AppPersistence): BikeProfile {
  return state.bikes.find((b) => b.id === state.selectedBikeId) ?? state.bikes[0]
}

export function updateSelectedBike(
  state: AppPersistence,
  updater: (bike: BikeProfile) => BikeProfile,
): AppPersistence {
  const selected = getSelectedBike(state)
  return {
    ...state,
    bikes: state.bikes.map((b) => (b.id === selected.id ? updater(b) : b)),
  }
}

export function addBike(state: AppPersistence, name?: string): AppPersistence {
  const bike = createBikeProfile({ name: name?.trim() || `Bike ${state.bikes.length + 1}` })
  return {
    ...state,
    bikes: [...state.bikes, bike],
    selectedBikeId: bike.id,
  }
}

export function deleteBike(state: AppPersistence, bikeId: string): AppPersistence {
  if (state.bikes.length <= 1) return state
  const bikes = state.bikes.filter((b) => b.id !== bikeId)
  const selectedBikeId =
    state.selectedBikeId === bikeId ? bikes[0].id : state.selectedBikeId
  return { ...state, bikes, selectedBikeId }
}

export function loadAppPersistence(storage: Storage = localStorage): AppPersistence {
  try {
    const v2 = storage.getItem(STORAGE_KEY_V2)
    if (v2) {
      return normalizeAppPersistence(JSON.parse(v2))
    }
    const v1 = storage.getItem(STORAGE_KEY_V1)
    if (v1) {
      const migrated = migrateFromV1(JSON.parse(v1) as StoredAppStateV1)
      storage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated))
      return migrated
    }
  } catch {
    // fall through
  }
  return defaultAppPersistence()
}

export function saveAppPersistence(state: AppPersistence, storage: Storage = localStorage): void {
  storage.setItem(STORAGE_KEY_V2, JSON.stringify(state))
}

/** @deprecated use loadAppPersistence */
export function loadStoredState(): AppPersistence {
  return loadAppPersistence()
}

/** @deprecated use saveAppPersistence */
export function saveStoredState(state: AppPersistence): void {
  saveAppPersistence(state)
}

export { STORAGE_KEY_V1, STORAGE_KEY_V2 }
