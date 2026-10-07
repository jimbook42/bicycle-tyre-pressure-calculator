import type {
  AppPersistence,
  BikeAdvancedStored,
  BikeProfile,
  CasingType,
  PressureUnit,
  RideFeedback,
  RideFeel,
  RideHistoryRecord,
  RideType,
  StoredAppStateV1,
  TubeType,
  TyreCategory,
  WeatherSettingsStored,
} from '../types'
import { isRideType } from '../data/rideTypes'

const STORAGE_KEY_V1 = 'bicycle-tyre-pressure-calculator:v1'
const STORAGE_KEY_V2 = 'bicycle-tyre-pressure-calculator:v2'

/** In-file schema. The storage key stays v2 so existing browsers are migrated in place. */
export const SCHEMA_VERSION = 3

const TUBE_TYPES: TubeType[] = ['butyl', 'tpu', 'tubeless', 'latex']
const TYRE_CATEGORIES: TyreCategory[] = ['road', 'allroad', 'gravel']
const CASING_TYPES: CasingType[] = ['standard', 'endurance', 'race', 'reinforced']

function asRideType(value: unknown, fallback: RideType): RideType {
  return isRideType(value) ? value : fallback
}

function asTubeType(value: unknown, fallback: TubeType): TubeType {
  return typeof value === 'string' && TUBE_TYPES.includes(value as TubeType)
    ? (value as TubeType)
    : fallback
}

function asCategory(value: unknown): TyreCategory | '' {
  return typeof value === 'string' && TYRE_CATEGORIES.includes(value as TyreCategory)
    ? (value as TyreCategory)
    : ''
}

function asCasing(value: unknown): CasingType | '' {
  return typeof value === 'string' && CASING_TYPES.includes(value as CasingType)
    ? (value as CasingType)
    : ''
}

export function defaultWeatherSettings(): WeatherSettingsStored {
  return {
    enabled: true,
    weatherOpen: true,
    locationMode: 'search',
    locationSearch: '',
    locationLabel: '',
    timingMode: 'now',
    rideDate: '',
    startTime: '09:00',
    durationPreset: '60',
    durationCustomMinutes: '90',
    inflationMode: 'ambient',
    inflationManualC: '20',
    wetMode: 'auto',
  }
}

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
    tyreCategory: '',
    casing: '',
    tyreModel: '',
    ...rest,
    advanced: { ...defaultBikeAdvanced(), ...advancedOverrides },
  }
}

export function defaultAppPersistence(): AppPersistence {
  const bike = createBikeProfile({ name: 'My bike' })
  return {
    version: SCHEMA_VERSION,
    darkMode: true,
    riderWeightKg: '75',
    bikes: [bike],
    selectedBikeId: bike.id,
    rideType: 'road',
    gravelPercent: '30',
    packWeightKg: '0',
    expectedSpeedKmh: '',
    pressureUnit: 'psi',
    weightUnit: 'kg',
    temperatureUnit: 'celsius',
    advancedOpen: false,
    applyPersonalisation: true,
    feedback: [],
    rideHistory: [],
    weather: defaultWeatherSettings(),
  }
}

export function migrateFromV1(legacy: StoredAppStateV1): AppPersistence {
  const defaults = defaultAppPersistence()
  const bike = createBikeProfile({
    name: 'My bike',
    weightKg: legacy.bikeWeightKg ?? defaults.bikes[0].weightKg,
    frontWidthMm: legacy.frontWidthMm ?? defaults.bikes[0].frontWidthMm,
    rearWidthMm: legacy.rearWidthMm ?? defaults.bikes[0].rearWidthMm,
    tubeType: asTubeType(legacy.tubeType, defaults.bikes[0].tubeType),
    tyreCategory: '',
    casing: '',
    tyreModel: '',
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
    version: SCHEMA_VERSION,
    darkMode: defaults.darkMode,
    riderWeightKg: legacy.riderWeightKg ?? defaults.riderWeightKg,
    bikes: [bike],
    selectedBikeId: bike.id,
    rideType: asRideType(legacy.rideType, defaults.rideType),
    gravelPercent: legacy.gravelPercent ?? defaults.gravelPercent,
    packWeightKg: legacy.packWeightKg ?? defaults.packWeightKg,
    expectedSpeedKmh: defaults.expectedSpeedKmh,
    pressureUnit: (legacy.pressureUnit ?? defaults.pressureUnit) as PressureUnit,
    weightUnit: defaults.weightUnit,
    temperatureUnit: defaults.temperatureUnit,
    advancedOpen: legacy.advancedOpen ?? defaults.advancedOpen,
    applyPersonalisation: true,
    feedback: [],
    rideHistory: [],
    weather: defaultWeatherSettings(),
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
    tubeType: asTubeType(b.tubeType, defaults.tubeType),
    tyreCategory: asCategory(b.tyreCategory),
    casing: asCasing(b.casing),
    tyreModel: typeof b.tyreModel === 'string' ? b.tyreModel : '',
    advanced: adv,
  }
}

const RIDE_FEELS: RideFeel[] = ['too_hard', 'good', 'too_soft']

function normalizeFeedback(raw: unknown): RideFeedback[] {
  if (!Array.isArray(raw)) return []
  const kept: RideFeedback[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const record = item as Partial<RideFeedback>
    if (typeof record.id !== 'string' || typeof record.setupKey !== 'string') continue
    if (!RIDE_FEELS.includes(record.result as RideFeel)) continue
    if (
      typeof record.baselineFrontKpa !== 'number' ||
      typeof record.baselineRearKpa !== 'number' ||
      typeof record.actualFrontKpa !== 'number' ||
      typeof record.actualRearKpa !== 'number'
    ) {
      continue
    }
    kept.push({
      id: record.id,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date(0).toISOString(),
      bikeId: typeof record.bikeId === 'string' ? record.bikeId : '',
      bikeName: typeof record.bikeName === 'string' ? record.bikeName : 'Bike',
      setupKey: record.setupKey,
      rideType: asRideType(record.rideType, 'road'),
      gravelPercent: typeof record.gravelPercent === 'number' ? record.gravelPercent : 0,
      systemWeightKg: typeof record.systemWeightKg === 'number' ? record.systemWeightKg : 0,
      tubeType: asTubeType(record.tubeType, 'tubeless'),
      frontWidthMm: typeof record.frontWidthMm === 'number' ? record.frontWidthMm : 0,
      rearWidthMm: typeof record.rearWidthMm === 'number' ? record.rearWidthMm : 0,
      baselineFrontKpa: record.baselineFrontKpa,
      baselineRearKpa: record.baselineRearKpa,
      actualFrontKpa: record.actualFrontKpa,
      actualRearKpa: record.actualRearKpa,
      result: record.result as RideFeel,
      frontFeel: RIDE_FEELS.includes(record.frontFeel as RideFeel)
        ? (record.frontFeel as RideFeel)
        : undefined,
      rearFeel: RIDE_FEELS.includes(record.rearFeel as RideFeel)
        ? (record.rearFeel as RideFeel)
        : undefined,
      notes: typeof record.notes === 'string' ? record.notes : '',
      weatherLocationLabel:
        typeof record.weatherLocationLabel === 'string' ? record.weatherLocationLabel : undefined,
      rideHistoryId:
        typeof record.rideHistoryId === 'string' ? record.rideHistoryId : undefined,
    })
  }
  return kept
}

function normalizeRideHistory(raw: unknown): RideHistoryRecord[] {
  if (!Array.isArray(raw)) return []
  const kept: RideHistoryRecord[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const record = item as Partial<RideHistoryRecord>
    if (typeof record.id !== 'string' || typeof record.setupKey !== 'string') continue
    if (
      typeof record.recommendedFrontKpa !== 'number' ||
      typeof record.recommendedRearKpa !== 'number'
    ) {
      continue
    }
    const baselineFrontKpa =
      typeof record.baselineFrontKpa === 'number'
        ? record.baselineFrontKpa
        : record.recommendedFrontKpa
    const baselineRearKpa =
      typeof record.baselineRearKpa === 'number'
        ? record.baselineRearKpa
        : record.recommendedRearKpa
    kept.push({
      id: record.id,
      calculatedAt:
        typeof record.calculatedAt === 'string' ? record.calculatedAt : new Date(0).toISOString(),
      bikeId: typeof record.bikeId === 'string' ? record.bikeId : '',
      bikeName: typeof record.bikeName === 'string' ? record.bikeName : 'Bike',
      setupKey: record.setupKey,
      rideType: asRideType(record.rideType, 'road'),
      gravelPercent: typeof record.gravelPercent === 'number' ? record.gravelPercent : 0,
      riderWeightKg: typeof record.riderWeightKg === 'number' ? record.riderWeightKg : 0,
      packWeightKg: typeof record.packWeightKg === 'number' ? record.packWeightKg : 0,
      systemWeightKg: typeof record.systemWeightKg === 'number' ? record.systemWeightKg : 0,
      tubeType: asTubeType(record.tubeType, 'tubeless'),
      frontWidthMm: typeof record.frontWidthMm === 'number' ? record.frontWidthMm : 0,
      rearWidthMm: typeof record.rearWidthMm === 'number' ? record.rearWidthMm : 0,
      recommendedFrontKpa: record.recommendedFrontKpa,
      recommendedRearKpa: record.recommendedRearKpa,
      baselineFrontKpa,
      baselineRearKpa,
      pressureUnit: (record.pressureUnit ?? 'psi') as PressureUnit,
      locationLabel: typeof record.locationLabel === 'string' ? record.locationLabel : undefined,
      rideTimingLine:
        typeof record.rideTimingLine === 'string' ? record.rideTimingLine : undefined,
      temperatureSummary:
        typeof record.temperatureSummary === 'string' ? record.temperatureSummary : undefined,
      weatherCondition:
        typeof record.weatherCondition === 'string' ? record.weatherCondition : undefined,
      wetMode: record.wetMode,
      feedbackId: typeof record.feedbackId === 'string' ? record.feedbackId : undefined,
    })
  }
  return kept
}

function normalizeWeather(raw: unknown): WeatherSettingsStored {
  const defaults = defaultWeatherSettings()
  if (!raw || typeof raw !== 'object') return defaults
  const w = raw as Partial<WeatherSettingsStored>
  return {
    enabled: true,
    weatherOpen: typeof w.weatherOpen === 'boolean' ? w.weatherOpen : defaults.weatherOpen,
    locationMode: w.locationMode === 'device' ? 'device' : 'search',
    locationSearch: typeof w.locationSearch === 'string' ? w.locationSearch : defaults.locationSearch,
    locationLabel: typeof w.locationLabel === 'string' ? w.locationLabel : defaults.locationLabel,
    timingMode:
      w.timingMode === 'today' ||
      w.timingMode === 'tomorrow' ||
      w.timingMode === 'future' ||
      w.timingMode === 'now'
        ? w.timingMode
        : defaults.timingMode,
    rideDate: typeof w.rideDate === 'string' ? w.rideDate : defaults.rideDate,
    startTime: typeof w.startTime === 'string' ? w.startTime : defaults.startTime,
    durationPreset:
      typeof w.durationPreset === 'string' ? w.durationPreset : defaults.durationPreset,
    durationCustomMinutes:
      typeof w.durationCustomMinutes === 'string'
        ? w.durationCustomMinutes
        : defaults.durationCustomMinutes,
    inflationMode: w.inflationMode === 'manual' ? 'manual' : 'ambient',
    inflationManualC:
      typeof w.inflationManualC === 'string' ? w.inflationManualC : defaults.inflationManualC,
    wetMode:
      w.wetMode === 'dry' || w.wetMode === 'wet' || w.wetMode === 'auto'
        ? w.wetMode
        : defaults.wetMode,
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
    version: SCHEMA_VERSION,
    darkMode: typeof data.darkMode === 'boolean' ? data.darkMode : defaults.darkMode,
    riderWeightKg:
      typeof data.riderWeightKg === 'string' ? data.riderWeightKg : defaults.riderWeightKg,
    bikes,
    selectedBikeId,
    rideType: asRideType(data.rideType, defaults.rideType),
    gravelPercent:
      typeof data.gravelPercent === 'string' ? data.gravelPercent : defaults.gravelPercent,
    packWeightKg:
      typeof data.packWeightKg === 'string' ? data.packWeightKg : defaults.packWeightKg,
    expectedSpeedKmh:
      typeof data.expectedSpeedKmh === 'string' ? data.expectedSpeedKmh : defaults.expectedSpeedKmh,
    pressureUnit: (data.pressureUnit ?? defaults.pressureUnit) as PressureUnit,
    weightUnit:
      data.weightUnit === 'lb' || data.weightUnit === 'kg'
        ? data.weightUnit
        : defaults.weightUnit,
    temperatureUnit:
      data.temperatureUnit === 'fahrenheit' || data.temperatureUnit === 'celsius'
        ? data.temperatureUnit
        : defaults.temperatureUnit,
    advancedOpen:
      typeof data.advancedOpen === 'boolean' ? data.advancedOpen : defaults.advancedOpen,
    applyPersonalisation:
      typeof data.applyPersonalisation === 'boolean'
        ? data.applyPersonalisation
        : defaults.applyPersonalisation,
    feedback: normalizeFeedback(data.feedback),
    rideHistory: normalizeRideHistory(data.rideHistory),
    weather: normalizeWeather(data.weather),
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
