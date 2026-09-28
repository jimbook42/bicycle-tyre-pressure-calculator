import type { AppPersistence, PressureUnit } from '../types'
import { btnRaised, cardInner, cardOuter, fieldClassName, mutedText, sectionTitle } from '../ui/softUi'

interface SettingsTabProps {
  state: AppPersistence
  onPressureUnit: (unit: PressureUnit) => void
  onApplyPersonalisation: (value: boolean) => void
  onOpenScience: () => void
}

export function SettingsTab({
  state,
  onPressureUnit,
  onApplyPersonalisation,
  onOpenScience,
}: SettingsTabProps) {
  return (
    <section className={`space-y-4 p-4 ${cardOuter}`}>
      <h2 className={sectionTitle}>Settings</h2>
      <div className={`space-y-3 p-3 ${cardInner}`}>
        <label className="block text-sm">
          Pressure unit
          <select
            className={fieldClassName}
            value={state.pressureUnit}
            onChange={(e) => onPressureUnit(e.target.value as PressureUnit)}
          >
            <option value="psi">PSI (whole)</option>
            <option value="bar">bar (0.1)</option>
            <option value="kPa">kPa (whole)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.applyPersonalisation}
            onChange={(e) => onApplyPersonalisation(e.target.checked)}
          />
          Apply notes from previous rides
        </label>
        <p className={`text-xs ${mutedText}`}>Rider and pack weights are entered in kilograms.</p>
        <button type="button" className={btnRaised} onClick={onOpenScience}>
          Science
        </button>
      </div>
    </section>
  )
}
