import { applyManufacturerLimits } from './safetyLimits'
import {
  DEFAULT_FRONT_LOAD_PERCENT,
} from '../data/constants'
import { baselineWheelPressureKpa, effectiveTyreWidthMm } from '../data/pressureModel'
import type {
  AdvancedSetup,
  CalculatorInput,
  PressureResult,
  Ride,
  SurfaceModel,
  WheelPressureDetail,
} from '../types'

function resolveSurfaceModel(ride: Ride): SurfaceModel | 'mixed' {
  if (ride.type === 'gravel') return 'gravel'
  if (ride.type === 'road' || ride.type === 'commute') return 'road'
  return 'mixed'
}

export function systemWeightKg(input: CalculatorInput): number {
  const pack =
    input.ride.type === 'commute'
      ? input.ride.packWeightKg
      : input.ride.packWeightKg || 0
  return input.rider.weightKg + input.bike.weightKg + pack
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
  return {
    frontPercent: clampedFront,
    rearPercent: 100 - clampedFront,
  }
}

function wheelDetail(
  wheelLoadKg: number,
  nominalWidthMm: number,
  measuredWidthMm: number | undefined,
  rimInternalWidthMm: number | undefined,
  surface: SurfaceModel,
  limits: AdvancedSetup['frontManufacturerLimits'],
): WheelPressureDetail {
  const effectiveWidthMm = effectiveTyreWidthMm(
    nominalWidthMm,
    measuredWidthMm,
    rimInternalWidthMm,
  )
  const targetKpa = baselineWheelPressureKpa(wheelLoadKg, effectiveWidthMm, surface)
  const safety = applyManufacturerLimits(targetKpa, limits)
  return {
    targetKpa,
    effectiveWidthMm,
    wheelLoadKg,
    ...safety,
  }
}

function pairForSurface(
  input: CalculatorInput,
  surface: SurfaceModel,
  systemKg: number,
  frontPercent: number,
  rearPercent: number,
): { front: WheelPressureDetail; rear: WheelPressureDetail } {
  const adv = input.advanced
  const frontLoadKg = (systemKg * frontPercent) / 100
  const rearLoadKg = (systemKg * rearPercent) / 100
  return {
    front: wheelDetail(
      frontLoadKg,
      input.tyres.frontWidthMm,
      adv?.frontMeasuredWidthMm,
      adv?.rimInternalWidthMm,
      surface,
      adv?.frontManufacturerLimits,
    ),
    rear: wheelDetail(
      rearLoadKg,
      input.tyres.rearWidthMm,
      adv?.rearMeasuredWidthMm,
      adv?.rimInternalWidthMm,
      surface,
      adv?.rearManufacturerLimits,
    ),
  }
}

function interpolateWheel(
  road: WheelPressureDetail,
  gravel: WheelPressureDetail,
  gravelFraction: number,
  limits: AdvancedSetup['frontManufacturerLimits'],
): WheelPressureDetail {
  const t = Math.min(1, Math.max(0, gravelFraction))
  const targetKpa = road.targetKpa * (1 - t) + gravel.targetKpa * t
  const safety = applyManufacturerLimits(targetKpa, limits)
  return {
    targetKpa,
    effectiveWidthMm: road.effectiveWidthMm,
    wheelLoadKg: road.wheelLoadKg,
    ...safety,
  }
}

function buildMetadata(input: CalculatorInput, frontPercent: number): string[] {
  const used: string[] = []
  const adv = input.advanced
  if (adv?.frontMeasuredWidthMm !== undefined) used.push('Front measured tyre width')
  if (adv?.rearMeasuredWidthMm !== undefined) used.push('Rear measured tyre width')
  if (adv?.rimInternalWidthMm !== undefined) used.push('Rim internal width')
  if (adv?.rimType !== undefined) used.push(`Rim type: ${adv.rimType}`)
  if (adv?.wheelDiameterInches !== undefined) used.push('Wheel diameter')
  if (adv?.frontManufacturerLimits !== undefined) used.push('Front manufacturer limits')
  if (adv?.rearManufacturerLimits !== undefined) used.push('Rear manufacturer limits')
  if (adv?.frontLoadPercent !== undefined) {
    used.push(`Front load override: ${frontPercent}%`)
  }
  used.push(`Tube type stored (${input.tyres.tubeType}) — no V1 pressure offset`)
  return used
}

export function calculatePressure(input: CalculatorInput): PressureResult {
  const systemKg = systemWeightKg(input)
  const { frontPercent, rearPercent } = loadSplit(input.advanced)
  const surfaceModel = resolveSurfaceModel(input.ride)
  const warnings: string[] = []
  const notes: string[] = [
    'Pressures use a Berto chart approximation (see SCIENCE.md); starting values only.',
  ]

  if (input.advanced?.rimType === 'hookless') {
    warnings.push(
      'Hookless rim selected: use only hookless-compatible tyres and stay within tyre/rim manufacturer pressure limits.',
    )
  }

  const adv = input.advanced
  let front: WheelPressureDetail
  let rear: WheelPressureDetail

  if (surfaceModel === 'mixed') {
    const gravelFraction = input.ride.gravelPercent / 100
    const roadPair = pairForSurface(input, 'road', systemKg, frontPercent, rearPercent)
    const gravelPair = pairForSurface(input, 'gravel', systemKg, frontPercent, rearPercent)
    front = interpolateWheel(
      roadPair.front,
      gravelPair.front,
      gravelFraction,
      adv?.frontManufacturerLimits,
    )
    rear = interpolateWheel(
      roadPair.rear,
      gravelPair.rear,
      gravelFraction,
      adv?.rearManufacturerLimits,
    )
    notes.push(
      `Mixed ride: linear blend between road and gravel models at ${input.ride.gravelPercent}% gravel (modelling approximation).`,
    )
  } else {
    const pair = pairForSurface(input, surfaceModel, systemKg, frontPercent, rearPercent)
    front = pair.front
    rear = pair.rear
    if (input.ride.type === 'commute') {
      notes.push('Commute uses the on-road model with full system weight including pack.')
    }
  }

  if (front.clampedToMin || front.clampedToMax) {
    warnings.push('Front pressure adjusted to manufacturer limit.')
  }
  if (rear.clampedToMin || rear.clampedToMax) {
    warnings.push('Rear pressure adjusted to manufacturer limit.')
  }

  return {
    front,
    rear,
    systemWeightKg: systemKg,
    frontLoadPercent: frontPercent,
    rearLoadPercent: rearPercent,
    surfaceModel,
    mixedGravelPercent: surfaceModel === 'mixed' ? input.ride.gravelPercent : undefined,
    warnings,
    notes,
    inputsUsed: buildMetadata(input, frontPercent),
  }
}

/** Exposed for tests — pure road/gravel pair without mixed blending. */
export function calculateForSurface(
  input: CalculatorInput,
  surface: SurfaceModel,
): Pick<PressureResult, 'front' | 'rear' | 'systemWeightKg'> {
  const systemKg = systemWeightKg(input)
  const { frontPercent, rearPercent } = loadSplit(input.advanced)
  const pair = pairForSurface(input, surface, systemKg, frontPercent, rearPercent)
  return { ...pair, systemWeightKg: systemKg }
}
