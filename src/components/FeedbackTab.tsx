import { formatPressure, unitLabel } from '../calculator/units'
import type { AppPersistence, PressureUnit, RideFeel } from '../types'
import { btnRaised, cardInner, cardOuter, fieldClassName, mutedText, sectionTitle } from '../ui/softUi'

interface FeedbackTabProps {
  state: AppPersistence
  unit: PressureUnit
  actualFront: string
  actualRear: string
  rideFeel: RideFeel
  rideNote: string
  feedbackMessage: string | null
  hasResult: boolean
  onActualFront: (v: string) => void
  onActualRear: (v: string) => void
  onRideFeel: (v: RideFeel) => void
  onRideNote: (v: string) => void
  onSave: () => void
}

export function FeedbackTab({
  state,
  unit,
  actualFront,
  actualRear,
  rideFeel,
  rideNote,
  feedbackMessage,
  hasResult,
  onActualFront,
  onActualRear,
  onRideFeel,
  onRideNote,
  onSave,
}: FeedbackTabProps) {
  return (
    <div className={`space-y-4 p-4 ${cardOuter}`}>
      <section className={`space-y-3 p-3 ${cardInner}`}>
        <h2 className={sectionTitle}>Log ride feedback</h2>
        {!hasResult && (
          <p className={`text-sm ${mutedText}`}>
            Calculate a pressure on the Calculate tab first, or enter the pressures you actually
            rode.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Actual front ({unitLabel(unit)})
            <input
              className={fieldClassName}
              inputMode="decimal"
              value={actualFront}
              onChange={(e) => onActualFront(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Actual rear ({unitLabel(unit)})
            <input
              className={fieldClassName}
              inputMode="decimal"
              value={actualRear}
              onChange={(e) => onActualRear(e.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm">
          How did it feel?
          <select
            className={fieldClassName}
            value={rideFeel}
            onChange={(e) => onRideFeel(e.target.value as RideFeel)}
          >
            <option value="too_hard">Too hard</option>
            <option value="good">Good</option>
            <option value="too_soft">Too soft</option>
          </select>
        </label>
        <label className="block text-sm">
          Notes (optional)
          <input
            className={fieldClassName}
            value={rideNote}
            onChange={(e) => onRideNote(e.target.value)}
          />
        </label>
        {feedbackMessage && <p className={`text-sm ${mutedText}`}>{feedbackMessage}</p>}
        <button type="button" className={btnRaised} onClick={onSave}>
          Save ride note
        </button>
      </section>

      <section className={`space-y-3 p-3 ${cardInner}`}>
        <h2 className={sectionTitle}>Recent notes</h2>
        <ul className="space-y-3 text-sm">
          {state.feedback.length === 0 && <li className={mutedText}>No ride notes yet.</li>}
          {state.feedback.slice(0, 20).map((entry) => (
            <li key={entry.id} className="border-t border-[#e8e2d8] pt-2 dark:border-[#333]">
              <p>
                {new Date(entry.createdAt).toLocaleString()} · {entry.bikeName} · {entry.rideType}
              </p>
              <p className={mutedText}>
                Recommended {formatPressure(entry.baselineFrontKpa, unit)}/
                {formatPressure(entry.baselineRearKpa, unit)} {unitLabel(unit)} · rode{' '}
                {formatPressure(entry.actualFrontKpa, unit)}/
                {formatPressure(entry.actualRearKpa, unit)} ·{' '}
                {entry.result === 'too_hard'
                  ? 'Too hard'
                  : entry.result === 'too_soft'
                    ? 'Too soft'
                    : 'Good'}
              </p>
              {entry.weatherLocationLabel && (
                <p className={mutedText}>{entry.weatherLocationLabel}</p>
              )}
              {entry.notes && <p className={mutedText}>{entry.notes}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
