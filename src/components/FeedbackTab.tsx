import { formatPressure, unitLabel } from '../calculator/units'
import { rideTypeLabel, formatRecommendedPressures } from '../storage/rideHistory'
import type { AppPersistence, PressureUnit, RideFeel, RideHistoryRecord } from '../types'
import { btnRaised, cardInner, cardOuter, fieldClassName, mutedText, sectionTitle } from '../ui/softUi'

interface FeedbackTabProps {
  state: AppPersistence
  unit: PressureUnit
  selectedRideId: string | null
  actualFront: string
  actualRear: string
  frontFeel: RideFeel
  rearFeel: RideFeel
  rideNote: string
  feedbackMessage: string | null
  onSelectRide: (rideId: string | null) => void
  onActualFront: (v: string) => void
  onActualRear: (v: string) => void
  onFrontFeel: (v: RideFeel) => void
  onRearFeel: (v: RideFeel) => void
  onRideNote: (v: string) => void
  onSave: () => void
}

function feelWord(feel: RideFeel): string {
  if (feel === 'too_hard') return 'Too hard'
  if (feel === 'too_soft') return 'Too soft'
  return 'Good'
}

function formatRideDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function rideSummaryLine(record: RideHistoryRecord): string {
  const weather =
    record.temperatureSummary ||
    (record.weatherCondition ? record.weatherCondition : undefined)
  const parts = [
    rideTypeLabel(record.rideType),
    `${record.frontWidthMm}/${record.rearWidthMm} mm`,
  ]
  if (weather) parts.push(weather.replace(/^[\d–]+°[CF]\s*·\s*/, ''))
  return parts.join(' · ')
}

export function FeedbackTab({
  state,
  unit,
  selectedRideId,
  actualFront,
  actualRear,
  frontFeel,
  rearFeel,
  rideNote,
  feedbackMessage,
  onSelectRide,
  onActualFront,
  onActualRear,
  onFrontFeel,
  onRearFeel,
  onRideNote,
  onSave,
}: FeedbackTabProps) {
  const selectedRide =
    selectedRideId != null
      ? state.rideHistory.find((r) => r.id === selectedRideId) ?? null
      : null
  const displayUnit = selectedRide?.pressureUnit ?? unit

  return (
    <div className={`mx-4 space-y-4 pb-24 ${cardOuter}`}>
      <section className={`space-y-3 p-3 ${cardInner}`}>
        <h2 className={sectionTitle}>Recent rides</h2>
        {state.rideHistory.length === 0 && (
          <p className={`text-sm ${mutedText}`}>
            Completed calculations will appear here so you can log how the ride felt and improve
            personalisation on this device.
          </p>
        )}
        <ul className="space-y-2">
          {state.rideHistory.slice(0, 20).map((ride) => (
            <li key={ride.id}>
              <button
                type="button"
                className={`w-full min-w-0 text-left p-3 ${cardInner} ${
                  selectedRideId === ride.id ? 'ring-1 ring-[#c4b8a8] dark:ring-[#444]' : ''
                }`}
                onClick={() => onSelectRide(ride.id)}
              >
                <p className="text-sm font-medium">
                  {formatRideDate(ride.calculatedAt)} ·{' '}
                  <span className="font-normal">{ride.bikeName}</span>
                </p>
                <p className={`truncate text-xs ${mutedText}`}>{rideSummaryLine(ride)}</p>
                <p className={`mt-1 text-xs ${mutedText}`}>
                  Recommended: {formatRecommendedPressures(ride, displayUnit)}
                  {ride.feedbackId ? ' · Feedback logged' : ''}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selectedRide && (
        <section className={`space-y-3 p-3 ${cardInner}`}>
          <h2 className={sectionTitle}>Log feedback</h2>
          <p className={`text-sm ${mutedText}`}>
            Recommended {formatRecommendedPressures(selectedRide, displayUnit)}. Enter the pressures
            you actually rode — they can differ from the recommendation.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="min-w-0 text-sm">
              Actual front ({unitLabel(displayUnit)})
              <input
                className={fieldClassName}
                inputMode="decimal"
                value={actualFront}
                onChange={(e) => onActualFront(e.target.value)}
              />
            </label>
            <label className="min-w-0 text-sm">
              Actual rear ({unitLabel(displayUnit)})
              <input
                className={fieldClassName}
                inputMode="decimal"
                value={actualRear}
                onChange={(e) => onActualRear(e.target.value)}
              />
            </label>
          </div>
          <p className="text-sm font-medium">How did it feel?</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="min-w-0 text-sm">
              Front
              <select
                className={fieldClassName}
                value={frontFeel}
                onChange={(e) => onFrontFeel(e.target.value as RideFeel)}
              >
                <option value="too_soft">Too soft</option>
                <option value="good">Good</option>
                <option value="too_hard">Too hard</option>
              </select>
            </label>
            <label className="min-w-0 text-sm">
              Rear
              <select
                className={fieldClassName}
                value={rearFeel}
                onChange={(e) => onRearFeel(e.target.value as RideFeel)}
              >
                <option value="too_soft">Too soft</option>
                <option value="good">Good</option>
                <option value="too_hard">Too hard</option>
              </select>
            </label>
          </div>
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
      )}

      {state.feedback.length > 0 && (
        <section className={`space-y-3 p-3 ${cardInner}`}>
          <h2 className={sectionTitle}>Saved evidence</h2>
          <ul className="space-y-3 text-sm">
            {state.feedback.slice(0, 15).map((entry) => (
              <li key={entry.id} className="border-t border-[#e8e2d8] pt-2 dark:border-[#333]">
                <p className="truncate">
                  {new Date(entry.createdAt).toLocaleString()} · {entry.bikeName} ·{' '}
                  {entry.rideType}
                </p>
                <p className={`${mutedText} break-words`}>
                  Recommended {formatPressure(entry.baselineFrontKpa, unit)}/
                  {formatPressure(entry.baselineRearKpa, unit)} {unitLabel(unit)} · rode{' '}
                  {formatPressure(entry.actualFrontKpa, unit)}/
                  {formatPressure(entry.actualRearKpa, unit)} ·{' '}
                  {entry.frontFeel || entry.rearFeel
                    ? `front ${feelWord(entry.frontFeel ?? entry.result)}, rear ${feelWord(entry.rearFeel ?? entry.result)}`
                    : feelWord(entry.result)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
