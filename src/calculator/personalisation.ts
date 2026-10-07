import {
  DIRECTIONAL_STEP_KPA,
  MAX_EVIDENCE_RIDES,
  MAX_OFFSET_PSI,
  MIN_ACTIVE_OFFSET_PSI,
  RECENCY_DECAY,
  RIDES_FOR_FULL_WEIGHT,
  WEIGHT_BUCKET_KG,
} from '../data/personalisationConstants'
import { KPA_PER_PSI } from '../data/constants'
import { applyManufacturerLimits } from './safetyLimits'
import { kpaToPsi } from './units'
import type { PressureResult, RideFeedback, RideFeel, RideType, TubeType } from '../types'

export interface SetupEvidenceIdentity {
  bikeId: string
  rideType: RideType
  gravelPercent: number
  frontWidthMm: number
  rearWidthMm: number
  frontMeasuredWidthMm?: number
  rearMeasuredWidthMm?: number
  tubeType: TubeType
  systemWeightKg: number
}

export interface WheelAdjustment {
  baselineKpa: number
  personalisedKpa: number
  offsetKpa: number
  evidenceCount: number
  /** 1 = evidence agrees; 0 = opposing evidence cancels. */
  agreement: number
  active: boolean
}

export interface PersonalisationAdjustment {
  front: WheelAdjustment
  rear: WheelAdjustment
  active: boolean
  evidenceCount: number
  summary: string
}

const MAX_OFFSET_KPA = MAX_OFFSET_PSI * KPA_PER_PSI
const MIN_ACTIVE_OFFSET_KPA = MIN_ACTIVE_OFFSET_PSI * KPA_PER_PSI

export function setupEvidenceKey(identity: SetupEvidenceIdentity): string {
  const gravel =
    identity.rideType === 'mixed' ? Math.round(identity.gravelPercent / 10) * 10 : 0
  const weightBucket = Math.round(identity.systemWeightKg / WEIGHT_BUCKET_KG) * WEIGHT_BUCKET_KG
  const frontMeasured = identity.frontMeasuredWidthMm
    ? Math.round(identity.frontMeasuredWidthMm)
    : 0
  const rearMeasured = identity.rearMeasuredWidthMm
    ? Math.round(identity.rearMeasuredWidthMm)
    : 0
  return [
    identity.bikeId,
    identity.rideType,
    gravel,
    Math.round(identity.frontWidthMm),
    Math.round(identity.rearWidthMm),
    frontMeasured,
    rearMeasured,
    identity.tubeType,
    weightBucket,
  ].join('|')
}

function desiredPressureKpa(actualKpa: number, feel: RideFeel): number {
  if (feel === 'too_hard') return actualKpa - DIRECTIONAL_STEP_KPA
  if (feel === 'too_soft') return actualKpa + DIRECTIONAL_STEP_KPA
  return actualKpa
}

function offsetForWheel(record: RideFeedback, wheel: 'front' | 'rear'): number {
  const baseline = wheel === 'front' ? record.baselineFrontKpa : record.baselineRearKpa
  const actual = wheel === 'front' ? record.actualFrontKpa : record.actualRearKpa
  const feel =
    wheel === 'front' ? (record.frontFeel ?? record.result) : (record.rearFeel ?? record.result)
  return desiredPressureKpa(actual, feel) - baseline
}

interface WeightedOffset {
  offsetKpa: number
  weight: number
}

function agreementFactor(samples: WeightedOffset[]): number {
  let positive = 0
  let negative = 0
  const deadband = MIN_ACTIVE_OFFSET_KPA
  for (const sample of samples) {
    if (sample.offsetKpa > deadband) positive += sample.weight
    else if (sample.offsetKpa < -deadband) negative += sample.weight
  }
  const opposed = positive + negative
  if (opposed === 0) return 1
  if (positive === 0 || negative === 0) return 1
  return Math.abs(positive - negative) / opposed
}

function weightedMean(samples: WeightedOffset[]): number {
  const total = samples.reduce((sum, sample) => sum + sample.weight, 0)
  if (total === 0) return 0
  return samples.reduce((sum, sample) => sum + sample.offsetKpa * sample.weight, 0) / total
}

function wheelOffsetKpa(records: RideFeedback[], wheel: 'front' | 'rear'): {
  offsetKpa: number
  evidenceCount: number
  agreement: number
} {
  const newestFirst = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const used = newestFirst.slice(0, MAX_EVIDENCE_RIDES)
  if (used.length === 0) {
    return { offsetKpa: 0, evidenceCount: 0, agreement: 1 }
  }

  const samples: WeightedOffset[] = used.map((record, index) => ({
    offsetKpa: offsetForWheel(record, wheel),
    weight: RECENCY_DECAY ** index,
  }))

  const mean = weightedMean(samples)
  const agreement = agreementFactor(samples)
  const sampleFactor = Math.min(1, used.length / RIDES_FOR_FULL_WEIGHT)
  const influenceCap = MAX_OFFSET_KPA * sampleFactor
  const scaled = mean * agreement
  const offsetKpa = Math.min(influenceCap, Math.max(-influenceCap, scaled))
  return { offsetKpa, evidenceCount: used.length, agreement }
}

function personaliseWheel(
  baselineKpa: number,
  minKpa: number | undefined,
  maxKpa: number | undefined,
  records: RideFeedback[],
  wheel: 'front' | 'rear',
): WheelAdjustment {
  const stats = wheelOffsetKpa(records, wheel)
  const unclamped = baselineKpa + stats.offsetKpa
  const clamped = applyManufacturerLimits(unclamped, { minKpa, maxKpa }).clampedKpa
  const offsetKpa = clamped - baselineKpa
  const active = Math.abs(offsetKpa) >= MIN_ACTIVE_OFFSET_KPA
  return {
    baselineKpa,
    personalisedKpa: clamped,
    offsetKpa,
    evidenceCount: stats.evidenceCount,
    agreement: stats.agreement,
    active,
  }
}

function describe(front: WheelAdjustment, rear: WheelAdjustment): string {
  if (!front.active && !rear.active) {
    return 'Using the baseline calculation. Saved ride notes are not moving this setup yet.'
  }
  const frontPsi = kpaToPsi(front.offsetKpa)
  const rearPsi = kpaToPsi(rear.offsetKpa)
  const count = Math.max(front.evidenceCount, rear.evidenceCount)
  const frontText =
    Math.abs(frontPsi) < MIN_ACTIVE_OFFSET_PSI
      ? 'front unchanged'
      : `front ${frontPsi > 0 ? '+' : ''}${frontPsi.toFixed(1)} PSI`
  const rearText =
    Math.abs(rearPsi) < MIN_ACTIVE_OFFSET_PSI
      ? 'rear unchanged'
      : `rear ${rearPsi > 0 ? '+' : ''}${rearPsi.toFixed(1)} PSI`
  const confidence =
    Math.min(front.agreement, rear.agreement) < 0.6
      ? ' Recent notes disagree, so the shift stays small.'
      : ''
  return `Based on your previous rides on this setup (${count} noted), starting pressure is adjusted from the baseline: ${frontText}, ${rearText}.${confidence}`
}

/** Apply saved ride notes on top of an already-computed baseline. Does not change the model. */
export function personalisePressure(
  baseline: PressureResult,
  records: RideFeedback[],
  setupKey: string,
): PersonalisationAdjustment {
  const matching = records.filter((record) => record.setupKey === setupKey)
  const front = personaliseWheel(
    baseline.front.clampedKpa,
    baseline.front.safetyMinKpa ?? baseline.front.manufacturerMinKpa,
    baseline.front.safetyMaxKpa ?? baseline.front.manufacturerMaxKpa,
    matching,
    'front',
  )
  const rear = personaliseWheel(
    baseline.rear.clampedKpa,
    baseline.rear.safetyMinKpa ?? baseline.rear.manufacturerMinKpa,
    baseline.rear.safetyMaxKpa ?? baseline.rear.manufacturerMaxKpa,
    matching,
    'rear',
  )
  return {
    front,
    rear,
    active: front.active || rear.active,
    evidenceCount: matching.length,
    summary: describe(front, rear),
  }
}

export function resetPersonalisation(
  records: RideFeedback[],
  setupKey: string,
): RideFeedback[] {
  return records.filter((record) => record.setupKey !== setupKey)
}
