import type {
  AppPersistence,
  PressureUnit,
  TemperatureDisplayUnit,
  WeightDisplayUnit,
} from '../types'
import { btnRaised, cardInner, cardOuter, fieldClassName, mutedText, sectionTitle } from '../ui/softUi'

interface SettingsTabProps {
  state: AppPersistence
  onPressureUnit: (unit: PressureUnit) => void
  onWeightUnit: (unit: WeightDisplayUnit) => void
  onTemperatureUnit: (unit: TemperatureDisplayUnit) => void
  onApplyPersonalisation: (value: boolean) => void
  onOpenScience: () => void
}

export function SettingsTab({
  state,
  onPressureUnit,
  onWeightUnit,
  onTemperatureUnit,
  onApplyPersonalisation,
  onOpenScience,
}: SettingsTabProps) {
  return (
    <section className={`space-y-4 p-4 ${cardOuter}`}>
      <h2 id="settings-title" className={sectionTitle}>Settings</h2>
      <div className={`space-y-3 p-3 ${cardInner}`}>
        <label className="block text-sm">
          Pressure unit
          <select
            className={fieldClassName}
            value={state.pressureUnit}
            onChange={(e) => onPressureUnit(e.target.value as PressureUnit)}
          >
            <option value="psi">PSI</option>
            <option value="bar">bar</option>
            <option value="kPa">kPa</option>
          </select>
        </label>
        <label className="block text-sm">
          Weight unit
          <select
            className={fieldClassName}
            value={state.weightUnit}
            onChange={(e) => onWeightUnit(e.target.value as WeightDisplayUnit)}
          >
            <option value="kg">Kilograms (kg)</option>
            <option value="lb">Pounds (lb)</option>
          </select>
        </label>
        <label className="block text-sm">
          Weather / temperature unit
          <select
            className={fieldClassName}
            value={state.temperatureUnit}
            onChange={(e) => onTemperatureUnit(e.target.value as TemperatureDisplayUnit)}
          >
            <option value="celsius">Celsius (°C)</option>
            <option value="fahrenheit">Fahrenheit (°F)</option>
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
        <p className={`text-xs ${mutedText}`}>
          Weight and pressure calculations always use kilograms and scientific units internally.
          Display units only change what you see.
        </p>
        <button type="button" className={btnRaised} onClick={onOpenScience}>
          Science
        </button>
      </div>
    </section>
  )
}
