import type { MoistureClass, PressureResult, PressureUnit } from '../types'
import { formatFactorPercent } from './conditionModel'
import type { PersonalisationAdjustment } from './personalisation'
import { kpaToPsi } from './units'

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

function moistureText(moisture: MoistureClass | undefined, factor: number): string {
  if (moisture === 'wet') {
    return `Wet / likely wet, ${formatFactorPercent(factor)} after the surface adjustment. This follows the direction of a laboratory wet-grip test. The percentage is a calibration, not the measured grip change.`
  }
  if (moisture === 'damp') {
    return `Wet / likely wet (forecast was damp), ${formatFactorPercent(factor)}. Damp and wet share one reduction, because the grip test did not separate drizzle from rain.`
  }
  return 'Dry. No wet adjustment.'
}

function widthText(result: PressureResult): string {
  const front = result.front
  const rear = result.rear
  const frontSource = front.widthMeasured ? 'measured' : 'labelled width (measured width not entered)'
  const rearSource = rear.widthMeasured ? 'measured' : 'labelled width (measured width not entered)'
  return `Front ${front.effectiveWidthMm.toFixed(1)} mm, ${frontSource}\nRear ${rear.effectiveWidthMm.toFixed(1)} mm, ${rearSource}`
}

function safetyText(result: PressureResult, formatPressure: (kpa: number) => string, unit: string): string {
  const wheels = [
    ['Front', result.front],
    ['Rear', result.rear],
  ] as const
  const parts: string[] = []
  for (const [name, wheel] of wheels) {
    if (wheel.conflictingLimits) {
      parts.push(`${name} kept the maximum because the minimum was higher`)
    } else if (wheel.clampedToMax) {
      const atHookless =
        wheel.hooklessMaxKpa !== undefined &&
        Math.abs(wheel.clampedKpa - wheel.hooklessMaxKpa) < 0.5
      const atManufacturer =
        wheel.manufacturerMaxKpa !== undefined &&
        Math.abs(wheel.clampedKpa - wheel.manufacturerMaxKpa) < 0.5
      const target = `${formatPressure(wheel.targetKpa)} ${unit}`
      const usable = `${formatPressure(wheel.clampedKpa)} ${unit}`
      let cap = 'a safety maximum'
      if (atHookless && atManufacturer) cap = 'the manufacturer and hookless limits'
      else if (atManufacturer) cap = 'a manufacturer maximum'
      else if (atHookless) cap = 'the hookless compatibility limit'
      parts.push(
        `${name} model target was ${target}. The usable pressure is ${usable}, capped by ${cap}. That cap is not the original target.`,
      )
    } else if (wheel.clampedToMin) {
      parts.push(
        `${name} was raised from ${formatPressure(wheel.targetKpa)} to ${formatPressure(wheel.clampedKpa)} ${unit} to meet a manufacturer minimum`,
      )
    } else if (wheel.hooklessChecked && wheel.hooklessMaxKpa !== undefined) {
      parts.push(`${name} is inside the hookless limit and any manufacturer limits you entered`)
    }
  }
  if (parts.length === 0) return 'Inside the tyre and rim limits you entered. No extra pressure floor was applied.'
  return parts.join('. ')
}

function personalisationText(
  context: WhyContext,
  unit: string,
): string {
  const count = context.personalisation?.evidenceCount ?? 0
  if (count === 0) return 'No comparable rides saved on this device. The baseline is unchanged.'
  const front = context.personalisation?.front
  const rear = context.personalisation?.rear
  if (!front || !rear) {
    return `Based on ${count} comparable ride${count === 1 ? '' : 's'}`
  }
  const frontPsi = kpaToPsi(front.offsetKpa)
  const rearPsi = kpaToPsi(rear.offsetKpa)
  const formatOffset = (psi: number, name: string) => {
    if (Math.abs(psi) < 0.4) return `${name} unchanged`
    const sign = psi > 0 ? '+' : ''
    return `${name} ${sign}${psi.toFixed(1)} ${unit}`
  }
  return `Based on ${count} comparable ride${count === 1 ? '' : 's'}: ${formatOffset(frontPsi, 'front')}, ${formatOffset(rearPsi, 'rear')}. This stays capped so it cannot replace the empirical baseline.`
}

/** Explains the V2.1 path from load and width to the number on the dial. */
export function buildWhyLines(context: WhyContext): WhyLine[] {
  const { result } = context
  const unit = unitWord(context.unit)
  const pressure = (kpa: number) => `${context.formatPressure(kpa)} ${unit}`
  const lines: WhyLine[] = [
    { label: 'Bike', text: context.bikeName },
    {
      label: 'System weight',
      text: `${result.systemWeightKg.toFixed(1)} kg, rider plus bike plus pack`,
    },
    {
      label: 'Wheel loads',
      text: `Front ${result.front.wheelLoadKg.toFixed(1)} kg (${result.frontLoadPercent}%)\nRear ${result.rear.wheelLoadKg.toFixed(1)} kg (${result.rearLoadPercent}%)\nEach wheel is calculated from its own load. The pressures are not forced into the load ratio.`,
    },
    { label: 'Tyre width', text: widthText(result) },
  ]

  const extrapolation = [result.front, result.rear].some((wheel) => wheel.extrapolated)
  lines.push({
    label: 'Empirical baseline',
    text: `Front ${pressure(result.front.bertoBaselineKpa)}\nRear ${pressure(result.rear.bertoBaselineKpa)}\nCurve fit to the Berto 15% tyre-drop chart for a normal road. This is not Berto’s own formula, and it is a starting region rather than a proven optimum.${
      extrapolation
        ? '\nPart of this setup is outside the chart’s measured region, so that baseline is an extrapolation.'
        : ''
    }`,
  })

  lines.push({
    label: 'Surface',
    text: `${result.surfaceLabel}, ${formatFactorPercent(result.surfaceFactor)} from the baseline. Research supports lower pressure on rougher surfaces and a slight increase on very smooth ones. The size of this step is an evidence-informed calibration, not a published PSI formula.`,
  })

  lines.push({
    label: 'Wet or dry',
    text: moistureText(result.moisture, result.wetFactor),
  })

  if (
    context.weather?.active &&
    context.weather.pumpFront &&
    context.weather.pumpRear &&
    context.weather.inflationTempC !== undefined &&
    context.weather.rideTempC !== undefined
  ) {
    const assumed = context.weather.inflationAssumed ? ' assumed' : ''
    lines.push({
      label: 'Temperature',
      text: `The numbers above are the pressure to ride at, about ${context.weather.rideTempC.toFixed(0)}°C. Pump now ${context.weather.pumpFront} / ${context.weather.pumpRear} ${unit} at a fill temperature of ${context.weather.inflationTempC.toFixed(0)}°C${assumed}, so the tyre arrives at that riding pressure. Temperature is not mixed into the empirical baseline.`,
    })
  } else if (context.weather?.active && context.weather.rideTempC !== undefined) {
    lines.push({
      label: 'Temperature',
      text: `Ride temperature about ${context.weather.rideTempC.toFixed(0)}°C. The baseline is the riding pressure. It is not itself a temperature correction.`,
    })
  }

  lines.push({
    label: 'Safety',
    text: safetyText(result, context.formatPressure, unit),
  })

  const systemBits = [context.tubeLabel]
  if (context.categoryLabel) systemBits.push(context.categoryLabel)
  if (context.casingLabel) systemBits.push(context.casingLabel)
  if (context.tyreModel) systemBits.push(context.tyreModel)
  lines.push({
    label: 'Tyre system',
    text: `${systemBits.join(', ')}. Tube type and casing are recorded. They do not change this pressure.`,
  })

  if (context.personalisationEnabled) {
    lines.push({
      label: 'Personalisation',
      text: personalisationText(context, unit),
    })
  }

  lines.push({
    label: 'Starting pressure',
    text: `Evidence-backed starting pressure, not a guaranteed optimum.\nFront ${context.shownFront ?? context.formatPressure(result.front.clampedKpa)} ${unit}\nRear ${context.shownRear ?? context.formatPressure(result.rear.clampedKpa)} ${unit}`,
  })

  return lines
}
