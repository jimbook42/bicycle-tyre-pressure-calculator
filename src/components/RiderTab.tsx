import { RiderWeightDial } from './RiderWeightDial'
import { cardInner, cardOuter, fieldClassName, sectionTitle } from '../ui/softUi'

interface RiderTabProps {
  riderWeightKg: string
  riderKg: number
  onChange: (kg: string) => void
}

export function RiderTab({ riderWeightKg, riderKg, onChange }: RiderTabProps) {
  return (
    <section className={`space-y-4 p-4 ${cardOuter}`}>
      <h2 className={sectionTitle}>Rider</h2>
      <div className={`space-y-3 p-3 ${cardInner}`}>
        <RiderWeightDial
          kg={riderKg}
          min={40}
          max={120}
          onChange={(kg) => onChange(String(kg))}
        />
        <label className="block text-sm">
          Exact weight (kg)
          <input
            className={fieldClassName}
            inputMode="decimal"
            value={riderWeightKg}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>
    </section>
  )
}
