import { DEFAULT_FRONT_LOAD_PERCENT } from '../data/constants'
import {
  DEFAULT_RIM_INTERNAL_WIDTH_MM,
  GRAVITY_M_S2,
  MAX_SECTION_HEIGHT_DEFLECTION,
  NARROW_DEFAULT_RIM_FRACTION,
} from '../data/v2ModelConstants'
import { resolveBeadSeat } from '../data/wheelSizes'
import type {
  AdvancedSetup,
  CalculatorInput,
  MoistureClass,
  PressureResult,
  RimType,
  WheelPressureDetail,
} from '../types'
import { constructionFactors, deflectionModifiers } from './modifiers'
import { renartGaugePressurePa, renartGeometry } from './renart'
import { applySafetyEnvelope, hooklessMaxKpa } from './safetyEnvelope'
import { effectiveIri, targetDeflectionFraction } from './surfaceModel'

export function systemWeightKg(input: CalculatorInput): number {
  return input.rider.weightKg + input.bike.weightKg + (input.ride.packWeightKg || 0)
}

function loadSplit(advanced: AdvancedSetup | undefined): {
  frontPercent: number
  rearPercent: number
} {
  const front =
    advanced?.frontLoadPercent !== undefined && !Number.isNaN(advanced.frontLoadPercent)
      ? advanced.frontLoadPercent
      : DEFAULT_FRONT_LOAD_PERCENT
  const clampedFront = Math.min(100, Math.max(0, front))
  return { frontPercent: clampedFront, rearPercent: 100 - clampedFront }
}

export function resolveRimInternalMm(
  tyreWidthMm: number,
  suppliedMm: number | undefined,
): { mm: number; assumed: boolean } {
  if (suppliedMm !== undefined && Number.isFinite(suppliedMm) && suppliedMm > 0) {
    return { mm: suppliedMm, assumed: false }
  }
  if (DEFAULT_RIM_INTERNAL_WIDTH_MM < tyreWidthMm) {
    return { mm: DEFAULT_RIM_INTERNAL_WIDTH_MM, assumed: true }
  }
  return { mm: tyreWidthMm * NARROW_DEFAULT_RIM_FRACTION, assumed: true }
}

function emptyWheel(loadKg: number, widthMm: number, reason: string): WheelPressureDetail {
  return {
    targetKpa: 0,
    clampedKpa: 0,
    effectiveWidthMm: widthMm,
    wheelLoadKg: loadKg,
    clampedToMin: false,
    clampedToMax: false,
    geometryValid: false,
    geometryReason: reason,
  }
}

function wheelPressure(args: {
  loadKg: number
  nominalWidthMm: number
  measuredWidthMm: number | undefined
  rimInternalMm: number | undefined
  wheelDiameterInches: number | undefined
  rimType: RimType | undefined
  manufacturerMinKpa?: number
  manufacturerMaxKpa?: number
  iri: number
  modifierFactor: number
  constructionScale: number
}): WheelPressureDetail {
  const widthMm = args.measuredWidthMm ?? args.nominalWidthMm
  const rim = resolveRimInternalMm(widthMm, args.rimInternalMm)
  const bead = resolveBeadSeat(args.wheelDiameterInches)
  const geometry = renartGeometry(widthMm / 1000, rim.mm / 1000, bead.bsdMm / 1000)
  const loadN = args.loadKg * GRAVITY_M_S2
  if (!geometry.valid) {
    return emptyWheel(args.loadKg, widthMm, geometry.reason ?? 'Invalid tyre/rim geometry.')
  }

  const surfaceFraction = targetDeflectionFraction(args.iri)
  let fraction = surfaceFraction * args.modifierFactor
  let limitedByDeflectionEnvelope = false
  if (fraction > MAX_SECTION_HEIGHT_DEFLECTION) {
    fraction = MAX_SECTION_HEIGHT_DEFLECTION
    limitedByDeflectionEnvelope = true
  }

  const deflectionM = fraction * geometry.sectionHeightM
  const floorM = MAX_SECTION_HEIGHT_DEFLECTION * geometry.sectionHeightM
  const scale = args.constructionScale > 0 ? args.constructionScale : 1
  const targetKpa = renartGaugePressurePa(loadN, geometry, deflectionM, scale) / 1000
  const deflectionFloorKpa = renartGaugePressurePa(loadN, geometry, floorM, scale) / 1000

  const applyHookless = args.rimType !== 'hooked'
  const sectionForHookless = Math.max(args.nominalWidthMm, widthMm)
  const hookless = applyHookless ? hooklessMaxKpa(sectionForHookless) : undefined
  const safety = applySafetyEnvelope({
    targetKpa,
    deflectionFloorKpa,
    manufacturerMinKpa: args.manufacturerMinKpa,
    manufacturerMaxKpa: args.manufacturerMaxKpa,
    hooklessMaxKpa: hookless,
  })

  return {
    targetKpa,
    effectiveWidthMm: widthMm,
    wheelLoadKg: args.loadKg,
    wheelLoadN: loadN,
    deflectionFraction: fraction,
    sectionHeightMm: geometry.sectionHeightM * 1000,
    rimInternalWidthMm: rim.mm,
    rimInternalAssumed: rim.assumed,
    beadSeatDiameterMm: bead.bsdMm,
    wheelSizeAssumed: bead.assumed,
    wheelSizeLabel: bead.label,
    deflectionFloorKpa,
    limitedByDeflectionEnvelope,
    geometryValid: true,
    hooklessChecked: applyHookless,
    ...safety,
  }
}

function buildMetadata(input: CalculatorInput, frontPercent: number): string[] {
  const used: string[] = []
  const adv = input.advanced
  if (adv?.frontMeasuredWidthMm !== undefined) used.push('Front measured tyre width')
  if (adv?.rearMeasuredWidthMm !== undefined) used.push('Rear measured tyre width')
  if (adv?.rimInternalWidthMm !== undefined) used.push('Rim internal width')
  if (adv?.rimType === 'hookless') used.push('Rim type: hookless')
  if (adv?.rimType === 'hooked') used.push('Rim type: hooked')
  if (adv?.frontManufacturerLimits !== undefined) used.push('Front manufacturer limits')
  if (adv?.rearManufacturerLimits !== undefined) used.push('Rear manufacturer limits')
  if (adv?.frontLoadPercent !== undefined) used.push(`Front load override: ${frontPercent}%`)
  if (adv?.wheelDiameterInches !== undefined) used.push('Wheel size')
  return used
}

/**
 * V2 starting pressure.
 * Load → geometry → Renart → surface deflection → speed/wet → safety.
 * Temperature and personalisation are applied by later steps.
 */
export function calculatePressure(input: CalculatorInput): PressureResult {
  const systemKg = systemWeightKg(input)
  const { frontPercent, rearPercent } = loadSplit(input.advanced)
  const warnings: string[] = []
  const notes: string[] = []
  const iri = effectiveIri(input.ride.type, input.ride.gravelPercent)
  const moisture: MoistureClass = input.ride.moisture ?? 'dry'
  const modifiers = deflectionModifiers(input.ride.expectedSpeedKmh, moisture)
  const construction = constructionFactors(
    input.tyres.tubeType,
    input.tyres.casing,
    input.tyres.category,
  )
  const adv = input.advanced
  const rimType = adv?.rimType

  if (rimType === 'hookless') {
    notes.push(
      'Hookless rim: ISO 5775-1 straight-side pressure caps are a hard limit, together with any manufacturer maximum you entered.',
    )
  } else if (rimType !== 'hooked') {
    warnings.push(
      'Rim type is not set. The ISO hookless pressure cap is applied until you mark the rim as hooked.',
    )
  }

  const shared = {
    rimInternalMm: adv?.rimInternalWidthMm,
    wheelDiameterInches: adv?.wheelDiameterInches,
    rimType,
    iri,
    modifierFactor: modifiers.factor,
    constructionScale: construction.combined,
  }
  const front = wheelPressure({
    ...shared,
    loadKg: (systemKg * frontPercent) / 100,
    nominalWidthMm: input.tyres.frontWidthMm,
    measuredWidthMm: adv?.frontMeasuredWidthMm,
    manufacturerMinKpa: adv?.frontManufacturerLimits?.minKpa,
    manufacturerMaxKpa: adv?.frontManufacturerLimits?.maxKpa,
  })
  const rear = wheelPressure({
    ...shared,
    loadKg: (systemKg * rearPercent) / 100,
    nominalWidthMm: input.tyres.rearWidthMm,
    measuredWidthMm: adv?.rearMeasuredWidthMm,
    manufacturerMinKpa: adv?.rearManufacturerLimits?.minKpa,
    manufacturerMaxKpa: adv?.rearManufacturerLimits?.maxKpa,
  })

  for (const [label, wheel] of [
    ['Front', front],
    ['Rear', rear],
  ] as const) {
    if (!wheel.geometryValid) {
      warnings.push(`${label} tyre/rim geometry is not valid. ${wheel.geometryReason ?? ''}`.trim())
    }
    if (wheel.clampedToMax) {
      warnings.push(`${label} pressure was capped by a safety maximum.`)
    }
    if (wheel.clampedToMin) {
      warnings.push(`${label} pressure was raised to a safety minimum.`)
    }
    if (wheel.conflictingLimits) {
      warnings.push(
        `${label} manufacturer minimum sits above the maximum cap. The maximum was kept.`,
      )
    }
  }
  if (front.rimInternalAssumed || rear.rimInternalAssumed) {
    const width = front.rimInternalWidthMm ?? rear.rimInternalWidthMm
    notes.push(
      `Rim internal width was not entered. Using ${width?.toFixed(1)} mm, so this result is less refined.`,
    )
  }
  if (front.wheelSizeAssumed || rear.wheelSizeAssumed) {
    notes.push('Wheel size was not entered. Bead-seat diameter assumed 622 mm (700C).')
  }
  if (modifiers.speedAssumed) {
    notes.push(`Expected speed omitted. Using the ${modifiers.speedKmh} km/h reference.`)
  }
  if (moisture === 'wet' || moisture === 'damp') {
    notes.push(
      'Wet-grip context lowered the starting pressure slightly. This is a bounded calibration, not a fixed wet deduction.',
    )
  }
  if (construction.unknownTube) {
    warnings.push('Tube system was not recognised. No tube offset was applied.')
  }
  if (input.ride.type === 'mixed') {
    notes.push(
      `Mixed surface uses an RMS roughness of ${iri.toFixed(1)} m/km at ${input.ride.gravelPercent}% gravel, not a blend of two pressures.`,
    )
  }

  const surfaceModel =
    input.ride.type === 'gravel' ? 'gravel' : input.ride.type === 'mixed' ? 'mixed' : 'road'

  return {
    front,
    rear,
    systemWeightKg: systemKg,
    frontLoadPercent: frontPercent,
    rearLoadPercent: rearPercent,
    surfaceModel,
    rideType: input.ride.type,
    mixedGravelPercent: input.ride.type === 'mixed' ? input.ride.gravelPercent : undefined,
    warnings,
    notes,
    inputsUsed: buildMetadata(input, frontPercent),
    effectiveIri: iri,
    surfaceDeflection: targetDeflectionFraction(iri),
    appliedDeflectionModifier: modifiers.factor,
    moisture,
    speedKmh: modifiers.speedKmh,
    speedAssumed: modifiers.speedAssumed,
    tubeCoefficient: construction.tube,
    casingCoefficient: construction.casing,
    categoryCoefficient: construction.category,
    modelVersion: 2,
  }
}
