import { DEFAULT_FRONT_LOAD_PERCENT } from '../data/constants'
import { PRESSURE_MODEL_VERSION } from '../data/appVersion'
import type {
  AdvancedSetup,
  CalculatorInput,
  MoistureClass,
  PressureResult,
  RimType,
  WheelPressureDetail,
} from '../types'
import { bertoBaseline, WIDTH_MILD_EXTRAPOLATION_MESSAGE } from './bertoBaseline'
import { surfaceCondition, wetPressureFactor } from './conditionModel'
import { effectiveLoadFraction, NEUTRAL_LOAD_FRACTION } from './loadDistribution'
import { constructionFactors } from './modifiers'
import { applySafetyEnvelope, hooklessMaxKpa } from './safetyEnvelope'

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

function emptyWheel(loadKg: number, widthMm: number): WheelPressureDetail {
  return {
    targetKpa: 0,
    bertoBaselineKpa: 0,
    neutralBaselineKpa: 0,
    surfaceFactor: 1,
    wetFactor: 1,
    widthMeasured: false,
    extrapolated: true,
    extrapolationReasons: ['Tyre width or wheel load is not usable.'],
    clampedKpa: 0,
    effectiveWidthMm: widthMm,
    wheelLoadKg: loadKg,
    effectiveLoadKg: loadKg,
    clampedToMin: false,
    clampedToMax: false,
    conflictingLimits: false,
  }
}

function wheelPressure(args: {
  staticLoadKg: number
  effectiveLoadKg: number
  neutralLoadKg: number
  nominalWidthMm: number
  measuredWidthMm: number | undefined
  rimType: RimType | undefined
  manufacturerMinKpa?: number
  manufacturerMaxKpa?: number
  surfaceFactor: number
  wetFactor: number
}): WheelPressureDetail {
  const widthMeasured =
    args.measuredWidthMm !== undefined &&
    Number.isFinite(args.measuredWidthMm) &&
    args.measuredWidthMm > 0
  const widthMm = widthMeasured ? args.measuredWidthMm! : args.nominalWidthMm
  if (!(widthMm > 0) || !(args.effectiveLoadKg >= 0) || !Number.isFinite(args.effectiveLoadKg)) {
    return emptyWheel(args.staticLoadKg, widthMm)
  }

  const baseline = bertoBaseline(args.effectiveLoadKg, widthMm)
  const neutral = bertoBaseline(args.neutralLoadKg, widthMm)
  const targetKpa = baseline.kpa * args.surfaceFactor * args.wetFactor
  const applyHookless = args.rimType !== 'hooked'
  const sectionForHookless = Math.max(args.nominalWidthMm, widthMm)
  const hookless = applyHookless ? hooklessMaxKpa(sectionForHookless) : undefined
  const safety = applySafetyEnvelope({
    targetKpa,
    manufacturerMinKpa: args.manufacturerMinKpa,
    manufacturerMaxKpa: args.manufacturerMaxKpa,
    hooklessMaxKpa: hookless,
  })

  return {
    targetKpa,
    bertoBaselineKpa: baseline.kpa,
    neutralBaselineKpa: neutral.kpa,
    surfaceFactor: args.surfaceFactor,
    wetFactor: args.wetFactor,
    widthMeasured,
    extrapolated: baseline.extrapolated,
    extrapolationReasons: baseline.reasons,
    effectiveWidthMm: widthMm,
    wheelLoadKg: args.staticLoadKg,
    effectiveLoadKg: args.effectiveLoadKg,
    hooklessChecked: applyHookless,
    ...safety,
  }
}

function buildMetadata(input: CalculatorInput, frontPercent: number): string[] {
  const used: string[] = []
  const adv = input.advanced
  if (adv?.frontMeasuredWidthMm !== undefined) used.push('Front measured tyre width')
  if (adv?.rearMeasuredWidthMm !== undefined) used.push('Rear measured tyre width')
  if (adv?.rimType === 'hookless') used.push('Rim type: hookless')
  if (adv?.rimType === 'hooked') used.push('Rim type: hooked')
  if (adv?.frontManufacturerLimits !== undefined) used.push('Front manufacturer limits')
  if (adv?.rearManufacturerLimits !== undefined) used.push('Rear manufacturer limits')
  if (adv?.frontLoadPercent !== undefined) used.push(`Front load override: ${frontPercent}%`)
  return used
}

/**
 * V2.2 starting pressure.
 * Static wheel loads → neutral Berto baseline at an even split → damped load
 * redistribution → surface factor → wet factor → safety envelope.
 * Temperature and personalisation are later steps. Speed, casing, tube type,
 * rim internal width, and wheel diameter do not change this pressure.
 * Renart is not on this path.
 */
export function calculatePressure(input: CalculatorInput): PressureResult {
  const systemKg = systemWeightKg(input)
  const { frontPercent, rearPercent } = loadSplit(input.advanced)
  const effectiveFrontFraction = effectiveLoadFraction(frontPercent / 100)
  const effectiveFrontPercent = effectiveFrontFraction * 100
  const effectiveRearPercent = (1 - effectiveFrontFraction) * 100
  const neutralLoadKg = systemKg * NEUTRAL_LOAD_FRACTION
  const warnings: string[] = []
  const notes: string[] = []
  const moisture: MoistureClass = input.ride.moisture ?? 'dry'
  const surface = surfaceCondition(input.ride.type, input.ride.gravelPercent, {
    roadType: input.ride.mixedRoadType ?? 'road',
    gravelType: input.ride.mixedGravelType ?? 'gravel',
  })
  const wetFactor = wetPressureFactor(moisture)
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
    rimType,
    surfaceFactor: surface.factor,
    wetFactor,
  }
  const front = wheelPressure({
    ...shared,
    staticLoadKg: (systemKg * frontPercent) / 100,
    effectiveLoadKg: systemKg * effectiveFrontFraction,
    neutralLoadKg,
    nominalWidthMm: input.tyres.frontWidthMm,
    measuredWidthMm: adv?.frontMeasuredWidthMm,
    manufacturerMinKpa: adv?.frontManufacturerLimits?.minKpa,
    manufacturerMaxKpa: adv?.frontManufacturerLimits?.maxKpa,
  })
  const rear = wheelPressure({
    ...shared,
    staticLoadKg: (systemKg * rearPercent) / 100,
    effectiveLoadKg: systemKg * (1 - effectiveFrontFraction),
    neutralLoadKg,
    nominalWidthMm: input.tyres.rearWidthMm,
    measuredWidthMm: adv?.rearMeasuredWidthMm,
    manufacturerMinKpa: adv?.rearManufacturerLimits?.minKpa,
    manufacturerMaxKpa: adv?.rearManufacturerLimits?.maxKpa,
  })

  for (const [label, wheel] of [
    ['Front', front],
    ['Rear', rear],
  ] as const) {
    if (wheel.clampedToMax) {
      warnings.push(
        `${label} recommendation was capped by a safety maximum. The model target was higher.`,
      )
    }
    if (wheel.clampedToMin) {
      warnings.push(`${label} pressure was raised to a manufacturer minimum.`)
    }
    if (wheel.conflictingLimits) {
      warnings.push(
        `${label} manufacturer minimum sits above the maximum cap. The maximum was kept.`,
      )
    }
    for (const reason of wheel.extrapolationReasons) {
      if (reason === WIDTH_MILD_EXTRAPOLATION_MESSAGE) {
        warnings.push(`${label}: ${reason}`)
      } else {
        warnings.push(`${label}: ${reason}. The baseline is an extrapolated curve fit.`)
      }
    }
  }
  if (construction.unknownTube) {
    warnings.push('Tube system was not recognised. No tube offset was applied.')
  }
  if (moisture === 'wet' || moisture === 'damp') {
    notes.push(
      'Wet or likely-wet conditions apply a small grip-oriented reduction before the safety limits. The size of that reduction is an engineering calibration, not the measured grip change.',
    )
  }
  if (input.ride.type === 'mixed') {
    notes.push(
      `Mixed surface blends the selected road and gravel terrain adjustments by ${input.ride.gravelPercent}% gravel (${surface.label}).`,
    )
  }
  if (input.ride.type === 'commute') {
    notes.push(
      'This saved commute setting uses the rough-road adjustment. Older commute notes still match this ride type.',
    )
  }
  if (Math.abs(frontPercent - 50) > 0.05) {
    notes.push(
      'Front and rear pressure follow a damped response to the static load split. An even split is unchanged. The gap is smaller than the static load percentages.',
    )
  }

  return {
    front,
    rear,
    systemWeightKg: systemKg,
    frontLoadPercent: frontPercent,
    rearLoadPercent: rearPercent,
    effectiveFrontLoadPercent: effectiveFrontPercent,
    effectiveRearLoadPercent: effectiveRearPercent,
    surfaceModel: surface.family,
    rideType: input.ride.type,
    mixedGravelPercent: input.ride.type === 'mixed' ? input.ride.gravelPercent : undefined,
    warnings,
    notes,
    inputsUsed: buildMetadata(input, frontPercent),
    surfaceLabel: surface.label,
    surfaceFactor: surface.factor,
    wetFactor,
    moisture,
    speedApplied: false,
    tubeCoefficient: construction.tube,
    casingCoefficient: construction.casing,
    categoryCoefficient: construction.category,
    modelVersion: PRESSURE_MODEL_VERSION,
  }
}
