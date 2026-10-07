import type { CasingType, TubeType, TyreCategory } from '../types'

export function tubeLabel(tube: TubeType | string): string {
  if (tube === 'tubeless') return 'Tubeless'
  if (tube === 'tpu') return 'TPU'
  if (tube === 'latex') return 'Latex'
  if (tube === 'butyl') return 'Butyl'
  return 'Tubeless'
}

export function categoryLabel(category: TyreCategory | '' | undefined): string | undefined {
  if (category === 'road') return 'Road tyre'
  if (category === 'allroad') return 'All-road tyre'
  if (category === 'gravel') return 'Gravel tyre'
  return undefined
}

export function casingLabel(casing: CasingType | '' | undefined): string | undefined {
  if (casing === 'standard') return 'Standard casing'
  if (casing === 'endurance') return 'Endurance / reinforced casing'
  if (casing === 'race') return 'Race / lightweight casing'
  if (casing === 'reinforced') return 'Reinforced / puncture-resistant casing'
  return undefined
}

export function combinedFeel(
  front: 'too_hard' | 'good' | 'too_soft',
  rear: 'too_hard' | 'good' | 'too_soft',
): 'too_hard' | 'good' | 'too_soft' {
  if (front === rear) return front
  if (front === 'good') return rear
  if (rear === 'good') return front
  return 'good'
}
