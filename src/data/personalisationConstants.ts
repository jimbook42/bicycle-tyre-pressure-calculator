import { KPA_PER_PSI } from './constants'

/**
 * Personalisation constants.
 * These bound a local evidence layer. They are not part of the tyre-pressure model.
 *
 * Why these values:
 * - A 2 PSI directional step is a small hint when the rider says too hard or too soft
 *   without naming a new target. It is not a measured comfort delta.
 * - Five agreeing rides are required before the full weighted offset is applied,
 *   so one ride can move the suggestion by at most one fifth of the max offset.
 * - An 8 PSI cap keeps personal notes from replacing the baseline on a typical road tyre.
 * - Recency decay (0.85) lets newer rides count more without discarding older ones immediately.
 */

/** Implied step when feedback is too hard or too soft. */
export const DIRECTIONAL_STEP_KPA = 2 * KPA_PER_PSI

/** Agreeing rides required before the full offset is applied. */
export const RIDES_FOR_FULL_WEIGHT = 5

/** Hard cap on how far personalisation may move from the baseline. */
export const MAX_OFFSET_PSI = 8

/** Newer rides count more. Oldest of a pair is multiplied by this factor. */
export const RECENCY_DECAY = 0.85

/** Recent matching rides considered. Older notes stay in history but drop out of the average. */
export const MAX_EVIDENCE_RIDES = 12

/** Offsets smaller than this are treated as no active adjustment. */
export const MIN_ACTIVE_OFFSET_PSI = 0.4

/** System-weight bucket (kg) so small day-to-day changes share evidence. */
export const WEIGHT_BUCKET_KG = 2
