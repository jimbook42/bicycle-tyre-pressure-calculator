import { useEffect, useMemo, useState } from 'react'
import { buildCalculatorInput, parseNum } from './calculator/buildInput'
import {
  personalisePressure,
  resetPersonalisation,
  setupEvidenceKey,
  type PersonalisationAdjustment,
} from './calculator/personalisation'
import { calculatePressure } from './calculator/pressureEngine'
import { displayToKpa, formatPressure, unitLabel } from './calculator/units'
import { validateForCalculation } from './calculator/validation'
import {
  addBike,
  createId,
  deleteBike,
  getSelectedBike,
  loadAppPersistence,
  saveAppPersistence,
  updateSelectedBike,
} from './storage/localStore'
import type {
  AppPersistence,
  BikeAdvancedStored,
  BikeProfile,
  PressureResult,
  PressureUnit,
  RideFeel,
  RideType,
  TubeType,
} from './types'

function fieldClassName() {
  return 'mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm'
}

export default function App() {
  const [state, setState] = useState<AppPersistence>(() => loadAppPersistence())
  const [result, setResult] = useState<PressureResult | null>(null)
  const [adjustment, setAdjustment] = useState<PersonalisationAdjustment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [actualFront, setActualFront] = useState('')
  const [actualRear, setActualRear] = useState('')
  const [rideFeel, setRideFeel] = useState<RideFeel>('good')
  const [rideNote, setRideNote] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const selectedBike = useMemo(() => getSelectedBike(state), [state])

  useEffect(() => {
    saveAppPersistence(state)
  }, [state])

  const unit = state.pressureUnit

  function setApp(updater: (prev: AppPersistence) => AppPersistence) {
    setState(updater)
  }

  function updateApp<K extends keyof AppPersistence>(key: K, value: AppPersistence[K]) {
    setApp((prev) => ({ ...prev, [key]: value }))
  }

  function patchSelectedBike(patch: Partial<Omit<BikeProfile, 'id' | 'advanced'>>) {
    setApp((prev) =>
      updateSelectedBike(prev, (bike) => ({
        ...bike,
        ...patch,
      })),
    )
  }

  function patchSelectedAdvanced(patch: Partial<BikeAdvancedStored>) {
    setApp((prev) =>
      updateSelectedBike(prev, (bike) => ({
        ...bike,
        advanced: { ...bike.advanced, ...patch },
      })),
    )
  }

  function onCalculate() {
    const bike = getSelectedBike(state)
    const validation = validateForCalculation(state, bike)
    if (!validation.ok) {
      setResult(null)
      setError(validation.message)
      return
    }
    setError(null)
    setFeedbackMessage(null)
    const baseline = calculatePressure(validation.input)
    const key = evidenceKeyFor(state, bike, baseline.systemWeightKg)
    const personal = personalisePressure(baseline, state.feedback, key)
    setResult(baseline)
    setAdjustment(personal)
    const shownFront = state.applyPersonalisation ? personal.front.personalisedKpa : baseline.front.clampedKpa
    const shownRear = state.applyPersonalisation ? personal.rear.personalisedKpa : baseline.rear.clampedKpa
    setActualFront(formatPressure(shownFront, state.pressureUnit))
    setActualRear(formatPressure(shownRear, state.pressureUnit))
    setRideFeel('good')
    setRideNote('')
  }

  function evidenceKeyFor(
    app: AppPersistence,
    bike: BikeProfile,
    systemKg: number,
  ): string {
    const input = buildCalculatorInput(app, bike)
    return setupEvidenceKey({
      bikeId: bike.id,
      rideType: app.rideType,
      gravelPercent: input?.ride.gravelPercent ?? 0,
      frontWidthMm: parseNum(bike.frontWidthMm),
      rearWidthMm: parseNum(bike.rearWidthMm),
      frontMeasuredWidthMm: bike.advanced.frontMeasuredWidthMm.trim()
        ? parseNum(bike.advanced.frontMeasuredWidthMm)
        : undefined,
      rearMeasuredWidthMm: bike.advanced.rearMeasuredWidthMm.trim()
        ? parseNum(bike.advanced.rearMeasuredWidthMm)
        : undefined,
      tubeType: bike.tubeType,
      systemWeightKg: systemKg,
    })
  }

  function saveRideFeedback() {
    if (!result) return
    const front = parseNum(actualFront, Number.NaN)
    const rear = parseNum(actualRear, Number.NaN)
    if (!(front > 0) || !(rear > 0)) {
      setFeedbackMessage('Enter the front and rear pressures you actually rode.')
      return
    }
    const recordKey = evidenceKeyFor(state, selectedBike, result.systemWeightKg)
    const record = {
      id: createId(),
      createdAt: new Date().toISOString(),
      bikeId: selectedBike.id,
      bikeName: selectedBike.name,
      setupKey: recordKey,
      rideType: state.rideType,
      gravelPercent: parseNum(state.gravelPercent, 0),
      systemWeightKg: result.systemWeightKg,
      tubeType: selectedBike.tubeType,
      frontWidthMm: parseNum(selectedBike.frontWidthMm),
      rearWidthMm: parseNum(selectedBike.rearWidthMm),
      baselineFrontKpa: result.front.clampedKpa,
      baselineRearKpa: result.rear.clampedKpa,
      actualFrontKpa: displayToKpa(front, state.pressureUnit),
      actualRearKpa: displayToKpa(rear, state.pressureUnit),
      result: rideFeel,
      notes: rideNote.trim(),
    }
    setApp((prev) => ({ ...prev, feedback: [record, ...prev.feedback] }))
    setFeedbackMessage('Ride note saved on this device.')
  }

  const canCalculate = buildCalculatorInput(state, selectedBike) !== null

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Tyre pressure calculator</h1>
        <p className="mt-1 text-sm text-slate-600">
          Quick starting pressures for front and rear — adjust on the ride as needed.
        </p>
      </header>

      <form
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault()
          onCalculate()
        }}
      >
        <section className="space-y-3 rounded border border-slate-100 bg-slate-50 p-3">
          <h2 className="text-sm font-medium">Rider</h2>
          <label className="block text-sm">
            Rider weight (kg)
            <input
              className={fieldClassName()}
              inputMode="decimal"
              value={state.riderWeightKg}
              onChange={(e) => updateApp('riderWeightKg', e.target.value)}
            />
          </label>
        </section>

        <section className="space-y-3 rounded border border-slate-100 p-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[10rem] flex-1 text-sm">
              Bike
              <select
                className={fieldClassName()}
                value={state.selectedBikeId}
                onChange={(e) => updateApp('selectedBikeId', e.target.value)}
              >
                {state.bikes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => setApp((prev) => addBike(prev))}
            >
              Add bike
            </button>
            <button
              type="button"
              className="rounded border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40"
              disabled={state.bikes.length <= 1}
              onClick={() => {
                if (
                  state.bikes.length > 1 &&
                  window.confirm(`Delete “${selectedBike.name}”?`)
                ) {
                  setApp((prev) => deleteBike(prev, selectedBike.id))
                }
              }}
            >
              Delete
            </button>
          </div>

          <label className="block text-sm">
            Bike name
            <input
              className={fieldClassName()}
              value={selectedBike.name}
              onChange={(e) => patchSelectedBike({ name: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            Bike weight (kg)
            <input
              className={fieldClassName()}
              inputMode="decimal"
              value={selectedBike.weightKg}
              onChange={(e) => patchSelectedBike({ weightKg: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Front tyre width (mm, nominal)
              <input
                className={fieldClassName()}
                inputMode="decimal"
                value={selectedBike.frontWidthMm}
                onChange={(e) => patchSelectedBike({ frontWidthMm: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Rear tyre width (mm, nominal)
              <input
                className={fieldClassName()}
                inputMode="decimal"
                value={selectedBike.rearWidthMm}
                onChange={(e) => patchSelectedBike({ rearWidthMm: e.target.value })}
              />
            </label>
          </div>

          <label className="block text-sm">
            Tube type
            <select
              className={fieldClassName()}
              value={selectedBike.tubeType}
              onChange={(e) => patchSelectedBike({ tubeType: e.target.value as TubeType })}
            >
              <option value="butyl">Butyl</option>
              <option value="tpu">TPU</option>
              <option value="tubeless">Tubeless</option>
            </select>
          </label>

          <details
            open={state.advancedOpen}
            onToggle={(e) => updateApp('advancedOpen', (e.target as HTMLDetailsElement).open)}
            className="rounded border border-slate-200 p-3"
          >
            <summary className="cursor-pointer text-sm font-medium">Advanced setup (optional)</summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Front measured width (mm)
                  <input
                    className={fieldClassName()}
                    value={selectedBike.advanced.frontMeasuredWidthMm}
                    onChange={(e) =>
                      patchSelectedAdvanced({ frontMeasuredWidthMm: e.target.value })
                    }
                  />
                </label>
                <label className="text-sm">
                  Rear measured width (mm)
                  <input
                    className={fieldClassName()}
                    value={selectedBike.advanced.rearMeasuredWidthMm}
                    onChange={(e) =>
                      patchSelectedAdvanced({ rearMeasuredWidthMm: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Rim internal width (mm)
                  <input
                    className={fieldClassName()}
                    value={selectedBike.advanced.rimInternalWidthMm}
                    onChange={(e) =>
                      patchSelectedAdvanced({ rimInternalWidthMm: e.target.value })
                    }
                  />
                </label>
                <label className="text-sm">
                  Rim type
                  <select
                    className={fieldClassName()}
                    value={selectedBike.advanced.rimType}
                    onChange={(e) =>
                      patchSelectedAdvanced({
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
                Wheel diameter (inches)
                <input
                  className={fieldClassName()}
                  value={selectedBike.advanced.wheelDiameterInches}
                  onChange={(e) =>
                    patchSelectedAdvanced({ wheelDiameterInches: e.target.value })
                  }
                />
              </label>
              <label className="block text-sm">
                Front wheel load (%)
                <input
                  className={fieldClassName()}
                  placeholder="Default 40"
                  value={selectedBike.advanced.frontLoadPercent}
                  onChange={(e) =>
                    patchSelectedAdvanced({ frontLoadPercent: e.target.value })
                  }
                />
              </label>
              <fieldset className="text-sm">
                <legend className="font-medium">Manufacturer limits (PSI)</legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label>
                    Front min
                    <input
                      className={fieldClassName()}
                      value={selectedBike.advanced.frontMinPsi}
                      onChange={(e) => patchSelectedAdvanced({ frontMinPsi: e.target.value })}
                    />
                  </label>
                  <label>
                    Front max
                    <input
                      className={fieldClassName()}
                      value={selectedBike.advanced.frontMaxPsi}
                      onChange={(e) => patchSelectedAdvanced({ frontMaxPsi: e.target.value })}
                    />
                  </label>
                  <label>
                    Rear min
                    <input
                      className={fieldClassName()}
                      value={selectedBike.advanced.rearMinPsi}
                      onChange={(e) => patchSelectedAdvanced({ rearMinPsi: e.target.value })}
                    />
                  </label>
                  <label>
                    Rear max
                    <input
                      className={fieldClassName()}
                      value={selectedBike.advanced.rearMaxPsi}
                      onChange={(e) => patchSelectedAdvanced({ rearMaxPsi: e.target.value })}
                    />
                  </label>
                </div>
              </fieldset>
            </div>
          </details>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">This ride</h2>
          <label className="block text-sm">
            Ride type
            <select
              className={fieldClassName()}
              value={state.rideType}
              onChange={(e) => updateApp('rideType', e.target.value as RideType)}
            >
              <option value="road">Road</option>
              <option value="gravel">Gravel</option>
              <option value="commute">Commute</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>

          {state.rideType === 'mixed' && (
            <label className="block text-sm">
              Gravel portion: {Math.min(100, Math.max(0, parseNum(state.gravelPercent, 0)))}%
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                className="mt-2 w-full"
                value={Math.min(100, Math.max(0, parseNum(state.gravelPercent, 0)))}
                onChange={(e) => updateApp('gravelPercent', e.target.value)}
              />
              <input
                className={`${fieldClassName()} mt-2`}
                inputMode="numeric"
                value={state.gravelPercent}
                onChange={(e) => updateApp('gravelPercent', e.target.value)}
              />
              <span className="mt-1 block text-xs text-slate-500">
                Road portion: {Math.max(0, 100 - parseNum(state.gravelPercent, 0))}%
              </span>
            </label>
          )}

          <label className="block text-sm">
            Pack weight (kg)
            {state.rideType === 'commute' ? ' — required' : ' — optional'}
            <input
              className={fieldClassName()}
              inputMode="decimal"
              value={state.packWeightKg}
              onChange={(e) => updateApp('packWeightKg', e.target.value)}
            />
          </label>
        </section>

        <section className="rounded border border-slate-100 bg-slate-50 p-3">
          <h2 className="text-sm font-medium">Settings</h2>
          <label className="mt-2 block text-sm">
            Pressure unit
            <select
              className={fieldClassName()}
              value={state.pressureUnit}
              onChange={(e) => updateApp('pressureUnit', e.target.value as PressureUnit)}
            >
              <option value="psi">PSI (whole)</option>
              <option value="bar">bar (0.1)</option>
              <option value="kPa">kPa (whole)</option>
            </select>
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.applyPersonalisation}
              onChange={(e) => updateApp('applyPersonalisation', e.target.checked)}
            />
            Apply notes from previous rides
          </label>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Calculate
        </button>
      </form>

      {result && adjustment && (
        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-900">Recommended starting pressure</p>
          {state.applyPersonalisation && adjustment.active && (
            <p className="mt-1 text-sm text-emerald-900">{adjustment.summary}</p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-800">Front</p>
              <p className="text-3xl font-semibold tabular-nums text-emerald-950">
                {formatPressure(
                  state.applyPersonalisation
                    ? adjustment.front.personalisedKpa
                    : result.front.clampedKpa,
                  unit,
                )}{' '}
                <span className="text-lg">{unitLabel(unit)}</span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-800">Rear</p>
              <p className="text-3xl font-semibold tabular-nums text-emerald-950">
                {formatPressure(
                  state.applyPersonalisation
                    ? adjustment.rear.personalisedKpa
                    : result.rear.clampedKpa,
                  unit,
                )}{' '}
                <span className="text-lg">{unitLabel(unit)}</span>
              </p>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-sm text-amber-900">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="mt-4 text-sm font-medium text-emerald-900 underline"
            onClick={() => setDetailsOpen((v) => !v)}
          >
            {detailsOpen ? 'Hide details' : 'Why? / Details'}
          </button>

          {detailsOpen && (
            <div className="mt-3 space-y-2 border-t border-emerald-200 pt-3 text-sm text-emerald-950">
              <p>
                <strong>Bike:</strong> {selectedBike.name}
              </p>
              <p>
                <strong>Baseline:</strong> front {formatPressure(result.front.clampedKpa, unit)}{' '}
                {unitLabel(unit)}, rear {formatPressure(result.rear.clampedKpa, unit)}{' '}
                {unitLabel(unit)}
              </p>
              <p>
                <strong>System weight:</strong> {result.systemWeightKg.toFixed(1)} kg
              </p>
              <p>
                <strong>Load split:</strong> front {result.frontLoadPercent}% / rear{' '}
                {result.rearLoadPercent}%
              </p>
              <p>
                <strong>Tyre widths used:</strong> front {result.front.effectiveWidthMm.toFixed(1)}{' '}
                mm, rear {result.rear.effectiveWidthMm.toFixed(1)} mm
              </p>
              <p>
                <strong>Ride type:</strong>{' '}
                {result.surfaceModel === 'mixed'
                  ? `Mixed (${result.mixedGravelPercent}% gravel blend)`
                  : state.rideType}
              </p>
              {(result.front.manufacturerMinKpa !== undefined ||
                result.front.manufacturerMaxKpa !== undefined) && (
                <p>
                  <strong>Front limits (kPa):</strong>{' '}
                  {result.front.manufacturerMinKpa?.toFixed(0) ?? '—'} –{' '}
                  {result.front.manufacturerMaxKpa?.toFixed(0) ?? '—'}
                </p>
              )}
              {(result.rear.manufacturerMinKpa !== undefined ||
                result.rear.manufacturerMaxKpa !== undefined) && (
                <p>
                  <strong>Rear limits (kPa):</strong>{' '}
                  {result.rear.manufacturerMinKpa?.toFixed(0) ?? '—'} –{' '}
                  {result.rear.manufacturerMaxKpa?.toFixed(0) ?? '—'}
                </p>
              )}
              {result.inputsUsed.length > 0 && (
                <div>
                  <strong>Advanced values used:</strong>
                  <ul className="list-disc pl-5">
                    {result.inputsUsed.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.notes.map((note) => (
                <p key={note} className="text-emerald-900">
                  {note}
                </p>
              ))}
              <p className="text-emerald-900">
                Ride notes are personal evidence stored on this device. They do not change the
                baseline model.
              </p>
              {state.applyPersonalisation && (
                <button
                  type="button"
                  className="text-sm font-medium text-emerald-900 underline"
                  onClick={() => {
                    const key = evidenceKeyFor(state, selectedBike, result.systemWeightKg)
                    setApp((prev) => ({
                      ...prev,
                      feedback: resetPersonalisation(prev.feedback, key),
                    }))
                    setAdjustment(
                      personalisePressure(
                        result,
                        resetPersonalisation(state.feedback, key),
                        key,
                      ),
                    )
                    setFeedbackMessage('Personalisation reset for this setup.')
                  }}
                >
                  Reset personalisation for this setup
                </button>
              )}
            </div>
          )}

          <div className="mt-4 space-y-3 border-t border-emerald-200 pt-3">
            <p className="text-sm font-medium text-emerald-950">After the ride</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Actual front ({unitLabel(unit)})
                <input
                  className={fieldClassName()}
                  inputMode="decimal"
                  value={actualFront}
                  onChange={(e) => setActualFront(e.target.value)}
                />
              </label>
              <label className="text-sm">
                Actual rear ({unitLabel(unit)})
                <input
                  className={fieldClassName()}
                  inputMode="decimal"
                  value={actualRear}
                  onChange={(e) => setActualRear(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-sm">
              How did it feel?
              <select
                className={fieldClassName()}
                value={rideFeel}
                onChange={(e) => setRideFeel(e.target.value as RideFeel)}
              >
                <option value="too_hard">Too hard</option>
                <option value="good">Good</option>
                <option value="too_soft">Too soft</option>
              </select>
            </label>
            <label className="block text-sm">
              Notes (optional)
              <input
                className={fieldClassName()}
                value={rideNote}
                onChange={(e) => setRideNote(e.target.value)}
              />
            </label>
            {feedbackMessage && <p className="text-sm text-emerald-900">{feedbackMessage}</p>}
            <button
              type="button"
              className="rounded border border-emerald-800 px-3 py-2 text-sm font-medium text-emerald-950"
              onClick={saveRideFeedback}
            >
              Save ride note
            </button>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <button
          type="button"
          className="text-sm font-medium"
          onClick={() => setHistoryOpen((open) => !open)}
        >
          {historyOpen ? 'Hide history' : `History (${state.feedback.length})`}
        </button>
        {historyOpen && (
          <ul className="mt-3 space-y-3 text-sm">
            {state.feedback.length === 0 && (
              <li className="text-slate-500">No ride notes yet.</li>
            )}
            {state.feedback.slice(0, 20).map((entry) => (
              <li key={entry.id} className="border-t border-slate-100 pt-2">
                <p>
                  {new Date(entry.createdAt).toLocaleString()} · {entry.bikeName} · {entry.rideType}
                </p>
                <p>
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
                {entry.notes && <p className="text-slate-600">{entry.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!result && canCalculate && (
        <p className="mt-4 text-center text-sm text-slate-500">Press Calculate to see pressures.</p>
      )}
    </div>
  )
}
