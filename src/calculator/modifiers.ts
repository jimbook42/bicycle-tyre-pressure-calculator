import {
  TUBE_COEFFICIENTS,
  CASING_COEFFICIENTS,
  CATEGORY_COEFFICIENTS,
} from '../data/v2ModelConstants'
import type { CasingType, MoistureClass, TubeType, TyreCategory } from '../types'

export interface ConstructionFactors {
  tube: number
  casing: number
  category: number
  /** Product of the three. Neutral inputs stay at 1. */
  combined: number
  unknownTube: boolean
  unknownCasing: boolean
  unknownCategory: boolean
}

export function constructionFactors(
  tubeType: TubeType | string | undefined,
  casing: CasingType | '' | undefined,
  category: TyreCategory | '' | undefined,
): ConstructionFactors {
  const tubeKnown = tubeType !== undefined && tubeType in TUBE_COEFFICIENTS
  const casingKnown = !casing || casing in CASING_COEFFICIENTS
  const categoryKnown = !category || category in CATEGORY_COEFFICIENTS
  const tube = tubeKnown ? TUBE_COEFFICIENTS[tubeType as TubeType] : 1
  const casingFactor = casing && casing in CASING_COEFFICIENTS
    ? CASING_COEFFICIENTS[casing as CasingType]
    : 1
  const categoryFactor = category && category in CATEGORY_COEFFICIENTS
    ? CATEGORY_COEFFICIENTS[category as TyreCategory]
    : 1
  return {
    tube,
    casing: casingFactor,
    category: categoryFactor,
    combined: tube * casingFactor * categoryFactor,
    unknownTube: !tubeKnown,
    unknownCasing: !casingKnown,
    unknownCategory: !categoryKnown,
  }
}

export function resolveRideMoisture(
  wetMode: 'auto' | 'dry' | 'wet',
  forecast: MoistureClass | undefined,
): MoistureClass {
  if (wetMode === 'dry') return 'dry'
  if (wetMode === 'wet') return 'wet'
  return forecast ?? 'dry'
}
