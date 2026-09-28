import { formatWeightFromKg, kgToLb, lbToKg, weightUnitLabel } from '../calculator/displayUnits'
import { parseNum } from '../calculator/buildInput'
import type { WeightDisplayUnit } from '../types'
import { RiderWeightDial } from './RiderWeightDial'
import { cardInner, cardOuter, fieldClassName, sectionTitle } from '../ui/softUi'

interface RiderTabProps {
  riderWeightKg: string
  riderKg: number
  weightUnit: WeightDisplayUnit
  onChange: (kg: string) => void
}

export function RiderTab({ riderWeightKg, riderKg, weightUnit, onChange }: RiderTabProps) {
  const displayValue =
    weightUnit === 'lb'
      ? String(Math.round(kgToLb(riderKg) * 10) / 10)
      : riderWeightKg

  function onDisplayChange(raw: string) {
    if (weightUnit === 'lb') {
      const lb = parseNum(raw, Number.NaN)
      if (Number.isFinite(lb)) onChange(String(Math.round(lbToKg(lb) * 10) / 10))
      else onChange(raw)
      return
    }
    onChange(raw)
  }

  return (
    <section className={`mx-4 space-y-4 pb-24 ${cardOuter}`}>
      <h2 className={sectionTitle}>Rider</h2>
      <div className={`space-y-3 p-3 ${cardInner}`}>
        <RiderWeightDial
          kg={riderKg}
          min={40}
          max={120}
          onChange={(kg) => onChange(String(kg))}
        />
        <p className="text-center text-sm font-medium">{formatWeightFromKg(riderKg, weightUnit)}</p>
        <label className="block text-sm">
          Exact weight ({weightUnitLabel(weightUnit)})
          <input
            className={fieldClassName}
            inputMode="decimal"
            value={displayValue}
            onChange={(e) => onDisplayChange(e.target.value)}
          />
        </label>
      </div>
    </section>
  )
}
