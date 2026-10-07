import { SettingsTab } from './SettingsTab'
import type { AppPersistence, PressureUnit, TemperatureDisplayUnit, WeightDisplayUnit } from '../types'
import { btnRaised, cardOuter } from '../ui/softUi'

interface SettingsPanelProps {
  open: boolean
  state: AppPersistence
  onClose: () => void
  onPressureUnit: (unit: PressureUnit) => void
  onWeightUnit: (unit: WeightDisplayUnit) => void
  onTemperatureUnit: (unit: TemperatureDisplayUnit) => void
  onApplyPersonalisation: (value: boolean) => void
  onOpenScience: () => void
  onOpenReferences: () => void
}

export function SettingsPanel({
  open,
  state,
  onClose,
  onPressureUnit,
  onWeightUnit,
  onTemperatureUnit,
  onApplyPersonalisation,
  onOpenScience,
  onOpenReferences,
}: SettingsPanelProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/30 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        className={`max-h-[85vh] w-full max-w-[440px] overflow-y-auto ${cardOuter}`}
        onClick={(e) => e.stopPropagation()}
      >
        <SettingsTab
          state={state}
          onPressureUnit={onPressureUnit}
          onWeightUnit={onWeightUnit}
          onTemperatureUnit={onTemperatureUnit}
          onApplyPersonalisation={onApplyPersonalisation}
          onOpenScience={onOpenScience}
          onOpenReferences={onOpenReferences}
        />
        <div className="px-4 pb-4">
          <button type="button" className={`w-full ${btnRaised}`} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
