import type { MoistureClass, PressureResult, PressureUnit } from '../types'
import type { PersonalisationAdjustment } from './personalisation'

export interface WhyLine {
  label: string
  text: string
}

export interface WhyContext {
  bikeName: string
  result: PressureResult
  formatPressure: (kpa: number) => string
  unit: PressureUnit
  tubeLabel: string
  categoryLabel?: string
  casingLabel?: string
  tyreModel?: string
  personalisation?: PersonalisationAdjustment | null
  personalisationEnabled: boolean
  /** Riding pressures shown on the dials, including personalisation when it applies. */
  shownFront?: string
  shownRear?: string
  weather?: {
    active: boolean
    rideTempC?: number
    inflationTempC?: number
    inflationAssumed?: boolean
    pumpFront?: string
    pumpRear?: string
    targetFront?: string
    targetRear?: string
  }
}

function unitWord(unit: PressureUnit): string {
  if (unit === 'kPa') return 'kPa'
  if (unit === 'bar') return 'bar'
  return 'PSI'
}

function moistureLabel(moisture: MoistureClass | undefined): string {
  if (moisture === 'wet') return 'Wet'
  if (moisture === 'damp') return 'Damp'
  return 'Dry'
}

function rideLabel(result: PressureResult): string {
  if (result.rideType === 'commute') return 'Commute'
  if (result.rideType === 'mixed' || result.surfaceModel === 'mixed') {
    return `Mixed, ${result.mixedGravelPercent ?? 0}% gravel`
  }
  if (result.rideType === 'gravel' || result.surfaceModel === 'gravel') return 'Gravel'
  return 'Road'
}

function safetyText(result: PressureResult): string {
  const wheels = [
    ['Front', result.front],
    ['Rear', result.rear],
  ] as const
  const parts: string[] = []
  for (const [name, wheel] of wheels) {
    if (wheel.conflictingLimits) {
      parts.push(`${name} kept at the maximum because the minimum was higher`)
    } else if (wheel.clampedToMax) {
      const atHookless =
        wheel.hooklessMaxKpa !== undefined &&
        Math.abs(wheel.clampedKpa - wheel.hooklessMaxKpa) < 0.5
      const atManufacturer =
        wheel.manufacturerMaxKpa !== undefined &&
        Math.abs(wheel.clampedKpa - wheel.manufacturerMaxKpa) < 0.5
      if (atHookless && atManufacturer) {
        parts.push(`${name} capped by the manufacturer and hookless limits`)
      } else if (atManufacturer) {
        parts.push(`${name} capped by a manufacturer maximum`)
      } else if (atHookless) {
        parts.push(`${name} capped by the hookless compatibility limit`)
      } else {
        parts.push(`${name} capped by a safety maximum`)
      }
    } else if (wheel.clampedToMin) {
      parts.push(`${name} raised to a minimum`)
    } else if (wheel.limitedByDeflectionEnvelope) {
      parts.push(`${name} held at the 30% section-height deflection floor`)
    }
  }
  if (parts.length === 0) return 'Within tyre/rim limits'
  return parts.join('. ')
}

/** Concise drivers for the current V2 result. Omits fields that were not used. */
export function buildWhyLines(context: WhyContext): WhyLine[] {
  const { result } = context
  const unit = unitWord(context.unit)
  const lines: WhyLine[] = [
    { label: 'Bike', text: context.bikeName },
    {
      label: 'Starting pressure',
      text: `Front ${context.shownFront ?? context.formatPressure(result.front.clampedKpa)} ${unit}\nRear ${context.shownRear ?? context.formatPressure(result.rear.clampedKpa)} ${unit}`,
    },
    { label: 'System weight', text: `${result.systemWeightKg.toFixed(1)} kg` },
    {
      label: 'Load split',
      text: `Front ${result.frontLoadPercent}% / rear ${result.rearLoadPercent}%`,
    },
    {
      label: 'Tyre widths',
      text: `Front ${result.front.effectiveWidthMm.toFixed(1)} mm\nRear ${result.rear.effectiveWidthMm.toFixed(1)} mm`,
    },
  ]

  const rimBits: string[] = []
  if (result.front.rimInternalWidthMm !== undefined) {
    const assumed = result.front.rimInternalAssumed ? ' assumed' : ''
    rimBits.push(`${result.front.rimInternalWidthMm.toFixed(0)} mm internal${assumed}`)
  }
  if (result.front.wheelSizeLabel) {
    rimBits.push(
      result.front.wheelSizeAssumed
        ? `${result.front.wheelSizeLabel} assumed`
        : result.front.wheelSizeLabel,
    )
  }
  const rimType = result.inputsUsed.find((line) => line.startsWith('Rim type:'))
  if (rimType) rimBits.push(rimType.replace('Rim type: ', ''))
  else if (result.front.hooklessChecked) rimBits.push('Rim type not set')
  if (rimBits.length > 0) {
    lines.push({ label: 'Rim', text: rimBits.join('\n') })
  }

  const systemBits = [context.tubeLabel]
  if (context.categoryLabel) systemBits.push(context.categoryLabel)
  if (context.casingLabel) systemBits.push(context.casingLabel)
  if (context.tyreModel) systemBits.push(context.tyreModel)
  lines.push({ label: 'Tyre system', text: systemBits.join('\n') })

  const speed =
    result.speedKmh === undefined
      ? undefined
      : result.speedAssumed
        ? `${result.speedKmh} km/h reference`
        : `${result.speedKmh} km/h`
  lines.push({
    label: 'Ride',
    text: speed ? `${rideLabel(result)}\nExpected speed: ${speed}` : rideLabel(result),
  })

  if (result.effectiveIri !== undefined) {
    lines.push({
      label: 'Surface',
      text: `Effective IRI: ${result.effectiveIri.toFixed(1)} m/km`,
    })
  }

  if (context.weather?.active && context.weather.rideTempC !== undefined) {
    lines.push({
      label: 'Weather',
      text: `${moistureLabel(result.moisture)}\nRide temperature: ${context.weather.rideTempC.toFixed(0)}°C`,
    })
  } else if (result.moisture && result.moisture !== 'dry') {
    lines.push({ label: 'Weather', text: moistureLabel(result.moisture) })
  }

  if (
    context.weather?.active &&
    context.weather.pumpFront &&
    context.weather.pumpRear &&
    context.weather.inflationTempC !== undefined
  ) {
    const assumed = context.weather.inflationAssumed ? ' assumed' : ''
    lines.push({
      label: 'Temperature',
      text: `Pump now: ${context.weather.pumpFront} / ${context.weather.pumpRear} ${unit}\nFill temperature: ${context.weather.inflationTempC.toFixed(0)}°C${assumed}`,
    })
  }

  lines.push({ label: 'Safety', text: safetyText(result) })

  if (context.personalisationEnabled) {
    const count = context.personalisation?.evidenceCount ?? 0
    lines.push({
      label: 'Personalisation',
      text:
        count > 0
          ? `Based on ${count} comparable ride${count === 1 ? '' : 's'}`
          : 'No comparable rides saved on this device',
    })
  }

  return lines
}
