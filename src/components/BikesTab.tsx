import type { AppPersistence, BikeAdvancedStored, BikeProfile, TubeType } from '../types'
import {
  WHEEL_SIZE_OPTIONS,
  inchesFromWheelSizeId,
  parseStoredWheelDiameterInches,
} from '../data/wheelSizes'
import { IconBike, IconInfo, IconPlus } from '../ui/icons'
import {
  btnRaised,
  cardInner,
  cardOuter,
  fieldClassName,
  mutedText,
  pillActive,
  pillIdle,
  sectionTitle,
} from '../ui/softUi'

interface BikesTabProps {
  state: AppPersistence
  selectedBike: BikeProfile
  onSelectBike: (bikeId: string) => void
  onAddBike: () => void
  onDeleteBike: () => void
  onPatchBike: (patch: Partial<Omit<BikeProfile, 'id' | 'advanced'>>) => void
  onPatchAdvanced: (patch: Partial<BikeAdvancedStored>) => void
  onAdvancedOpenChange: (open: boolean) => void
}

const MEASURED_WIDTH_HELP =
  'Actual width of the inflated tyre on your wheel. Rim width can make a tyre measure wider or narrower than its labelled size.'

function tubeLabel(tube: BikeProfile['tubeType']): string {
  if (tube === 'tubeless') return 'Tubeless'
  if (tube === 'tpu') return 'TPU'
  return 'Butyl'
}

export function BikesTab({
  state,
  selectedBike,
  onSelectBike,
  onAddBike,
  onDeleteBike,
  onPatchBike,
  onPatchAdvanced,
  onAdvancedOpenChange,
}: BikesTabProps) {
  const wheelParsed = parseStoredWheelDiameterInches(selectedBike.advanced.wheelDiameterInches)
  const wheelSelectValue = wheelParsed.selectId || ''

  function onWheelSizeChange(selectId: string) {
    if (selectId === 'custom') {
      onPatchAdvanced({
        wheelDiameterInches: wheelParsed.customInches || selectedBike.advanced.wheelDiameterInches,
      })
      return
    }
    onPatchAdvanced({ wheelDiameterInches: inchesFromWheelSizeId(selectId) })
  }

  return (
    <section className={`space-y-4 p-4 pb-24 ${cardOuter}`}>
      <h2 className={sectionTitle}>Bikes</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        {state.bikes.map((bike) => {
          const active = bike.id === state.selectedBikeId
          return (
            <button
              key={bike.id}
              type="button"
              className={`min-w-0 text-left p-3 ${active ? pillActive : pillIdle}`}
              onClick={() => onSelectBike(bike.id)}
            >
              <IconBike className="mb-2 opacity-90" />
              <p className="truncate text-sm font-medium">{bike.name}</p>
              <p className={`truncate text-xs ${mutedText}`}>
                {bike.frontWidthMm} / {bike.rearWidthMm} mm
              </p>
              <p className={`truncate text-xs ${mutedText}`}>{tubeLabel(bike.tubeType)}</p>
            </button>
          )
        })}
        <button
          type="button"
          className={`flex min-h-[7.5rem] min-w-0 flex-col items-center justify-center gap-2 p-3 ${pillIdle}`}
          onClick={onAddBike}
        >
          <IconPlus className="h-6 w-6 opacity-70" />
          <span className="text-sm font-medium">Add new bike</span>
        </button>
      </div>

      <div className={`space-y-3 p-3 ${cardInner}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Edit {selectedBike.name}</h3>
          <button
            type="button"
            className={`${btnRaised} text-[#a63d2a] disabled:opacity-40`}
            disabled={state.bikes.length <= 1}
            onClick={onDeleteBike}
          >
            Delete bike
          </button>
        </div>

        <label className="block text-sm">
          Bike name
          <input
            className={fieldClassName}
            value={selectedBike.name}
            onChange={(e) => onPatchBike({ name: e.target.value })}
          />
        </label>

        <label className="block text-sm">
          Bike weight (kg)
          <input
            className={fieldClassName}
            inputMode="decimal"
            value={selectedBike.weightKg}
            onChange={(e) => onPatchBike({ weightKg: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="min-w-0 text-sm">
            Front tyre width (mm)
            <input
              className={fieldClassName}
              inputMode="decimal"
              value={selectedBike.frontWidthMm}
              onChange={(e) => onPatchBike({ frontWidthMm: e.target.value })}
            />
          </label>
          <label className="min-w-0 text-sm">
            Rear tyre width (mm)
            <input
              className={fieldClassName}
              inputMode="decimal"
              value={selectedBike.rearWidthMm}
              onChange={(e) => onPatchBike({ rearWidthMm: e.target.value })}
            />
          </label>
        </div>

        <label className="block text-sm">
          Tube type
          <select
            className={fieldClassName}
            value={selectedBike.tubeType}
            onChange={(e) => onPatchBike({ tubeType: e.target.value as TubeType })}
          >
            <option value="butyl">Butyl</option>
            <option value="tpu">TPU</option>
            <option value="tubeless">Tubeless</option>
          </select>
        </label>

        <details
          open={state.advancedOpen}
          onToggle={(e) => onAdvancedOpenChange((e.target as HTMLDetailsElement).open)}
          className={`${cardInner} p-3`}
        >
          <summary className="cursor-pointer text-sm font-medium">Advanced setup (optional)</summary>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="min-w-0 text-sm">
                <span className="inline-flex items-center gap-1">
                  Front measured width (mm)
                  <span
                    className={`cursor-help ${mutedText}`}
                    title={MEASURED_WIDTH_HELP}
                    aria-label={MEASURED_WIDTH_HELP}
                  >
                    <IconInfo />
                  </span>
                </span>
                <input
                  className={fieldClassName}
                  value={selectedBike.advanced.frontMeasuredWidthMm}
                  onChange={(e) =>
                    onPatchAdvanced({ frontMeasuredWidthMm: e.target.value })
                  }
                />
              </label>
              <label className="min-w-0 text-sm">
                <span className="inline-flex items-center gap-1">
                  Rear measured width (mm)
                  <span
                    className={`cursor-help ${mutedText}`}
                    title={MEASURED_WIDTH_HELP}
                    aria-label={MEASURED_WIDTH_HELP}
                  >
                    <IconInfo />
                  </span>
                </span>
                <input
                  className={fieldClassName}
                  value={selectedBike.advanced.rearMeasuredWidthMm}
                  onChange={(e) =>
                    onPatchAdvanced({ rearMeasuredWidthMm: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="min-w-0 text-sm">
                Rim internal width (mm)
                <input
                  className={fieldClassName}
                  value={selectedBike.advanced.rimInternalWidthMm}
                  onChange={(e) =>
                    onPatchAdvanced({ rimInternalWidthMm: e.target.value })
                  }
                />
              </label>
              <label className="min-w-0 text-sm">
                Rim type
                <select
                  className={fieldClassName}
                  value={selectedBike.advanced.rimType}
                  onChange={(e) =>
                    onPatchAdvanced({
                      rimType: e.target.value as BikeAdvancedStored['rimType'],
                    })
                  }
                >
                  <option value="">Not specified</option>
                  <option value="hooked">Hooked</option>
                  <option value="hookless">Hookless</option>
                </select>
              </label>
            </div>
            <label className="block text-sm">
              Wheel size
              <select
                className={fieldClassName}
                value={wheelSelectValue}
                onChange={(e) => onWheelSizeChange(e.target.value)}
              >
                <option value="">Not specified</option>
                {WHEEL_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
            </label>
            {wheelSelectValue === 'custom' && (
              <label className="block text-sm">
                Custom diameter (inches)
                <input
                  className={fieldClassName}
                  inputMode="decimal"
                  value={selectedBike.advanced.wheelDiameterInches}
                  onChange={(e) => onPatchAdvanced({ wheelDiameterInches: e.target.value })}
                />
              </label>
            )}
            <label className="block text-sm">
              Front wheel load (%)
              <input
                className={fieldClassName}
                placeholder="Default 40"
                value={selectedBike.advanced.frontLoadPercent}
                onChange={(e) => onPatchAdvanced({ frontLoadPercent: e.target.value })}
              />
            </label>
            <fieldset className="text-sm">
              <legend className="font-medium">Manufacturer limits (PSI)</legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="min-w-0">
                  Front min
                  <input
                    className={fieldClassName}
                    value={selectedBike.advanced.frontMinPsi}
                    onChange={(e) => onPatchAdvanced({ frontMinPsi: e.target.value })}
                  />
                </label>
                <label className="min-w-0">
                  Front max
                  <input
                    className={fieldClassName}
                    value={selectedBike.advanced.frontMaxPsi}
                    onChange={(e) => onPatchAdvanced({ frontMaxPsi: e.target.value })}
                  />
                </label>
                <label className="min-w-0">
                  Rear min
                  <input
                    className={fieldClassName}
                    value={selectedBike.advanced.rearMinPsi}
                    onChange={(e) => onPatchAdvanced({ rearMinPsi: e.target.value })}
                  />
                </label>
                <label className="min-w-0">
                  Rear max
                  <input
                    className={fieldClassName}
                    value={selectedBike.advanced.rearMaxPsi}
                    onChange={(e) => onPatchAdvanced({ rearMaxPsi: e.target.value })}
                  />
                </label>
              </div>
            </fieldset>
          </div>
        </details>
      </div>
    </section>
  )
}
