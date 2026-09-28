import { useEffect, useMemo, useState } from 'react'
import { calculatePressure } from './calculator/pressureEngine'
import { formatPressure, psiToKpa, unitLabel } from './calculator/units'
import { loadStoredState, saveStoredState } from './storage/localStore'
import type {
  CalculatorInput,
  PressureResult,
  PressureUnit,
  RideType,
  StoredAppState,
  TubeType,
} from './types'

function parseNum(value: string, fallback = 0): number {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

function buildInput(state: StoredAppState): CalculatorInput | null {
  const riderWeightKg = parseNum(state.riderWeightKg)
  const bikeWeightKg = parseNum(state.bikeWeightKg)
  const frontWidthMm = parseNum(state.frontWidthMm)
  const rearWidthMm = parseNum(state.rearWidthMm)
  const packWeightKg = parseNum(state.packWeightKg, 0)

  if (riderWeightKg <= 0 || bikeWeightKg <= 0 || frontWidthMm <= 0 || rearWidthMm <= 0) {
    return null
  }

  if (state.rideType === 'commute' && packWeightKg <= 0) {
    return null
  }

  const frontMin = state.frontMinPsi.trim() ? psiToKpa(parseNum(state.frontMinPsi)) : undefined
  const frontMax = state.frontMaxPsi.trim() ? psiToKpa(parseNum(state.frontMaxPsi)) : undefined
  const rearMin = state.rearMinPsi.trim() ? psiToKpa(parseNum(state.rearMinPsi)) : undefined
  const rearMax = state.rearMaxPsi.trim() ? psiToKpa(parseNum(state.rearMaxPsi)) : undefined

  const frontMeasured = state.frontMeasuredWidthMm.trim()
    ? parseNum(state.frontMeasuredWidthMm)
    : undefined
  const rearMeasured = state.rearMeasuredWidthMm.trim()
    ? parseNum(state.rearMeasuredWidthMm)
    : undefined
  const rimInternal = state.rimInternalWidthMm.trim()
    ? parseNum(state.rimInternalWidthMm)
    : undefined
  const wheelDiameter = state.wheelDiameterInches.trim()
    ? parseNum(state.wheelDiameterInches)
    : undefined
  const frontLoad = state.frontLoadPercent.trim()
    ? parseNum(state.frontLoadPercent)
    : undefined

  return {
    rider: { weightKg: riderWeightKg },
    bike: { weightKg: bikeWeightKg },
    ride: {
      type: state.rideType,
      gravelPercent: Math.min(100, Math.max(0, parseNum(state.gravelPercent, 0))),
      packWeightKg,
    },
    tyres: {
      frontWidthMm,
      rearWidthMm,
      tubeType: state.tubeType,
    },
    advanced: {
      frontMeasuredWidthMm: frontMeasured,
      rearMeasuredWidthMm: rearMeasured,
      rimInternalWidthMm: rimInternal,
      rimType: state.rimType || undefined,
      wheelDiameterInches: wheelDiameter,
      frontManufacturerLimits:
        frontMin !== undefined || frontMax !== undefined
          ? { minKpa: frontMin, maxKpa: frontMax }
          : undefined,
      rearManufacturerLimits:
        rearMin !== undefined || rearMax !== undefined
          ? { minKpa: rearMin, maxKpa: rearMax }
          : undefined,
      frontLoadPercent: frontLoad,
    },
  }
}

function fieldClassName() {
  return 'mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm'
}

export default function App() {
  const [state, setState] = useState<StoredAppState>(() => loadStoredState())
  const [result, setResult] = useState<PressureResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    saveStoredState(state)
  }, [state])

  const unit = state.pressureUnit

  const previewInput = useMemo(() => buildInput(state), [state])

  function update<K extends keyof StoredAppState>(key: K, value: StoredAppState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function onCalculate() {
    const input = buildInput(state)
    if (!input) {
      setResult(null)
      if (state.rideType === 'commute' && parseNum(state.packWeightKg, 0) <= 0) {
        setError('Commute rides require pack weight (kg).')
      } else {
        setError('Check weights and tyre widths are positive numbers.')
      }
      return
    }
    setError(null)
    setResult(calculatePressure(input))
  }

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
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Rider weight (kg)
            <input
              className={fieldClassName()}
              inputMode="decimal"
              value={state.riderWeightKg}
              onChange={(e) => update('riderWeightKg', e.target.value)}
            />
          </label>
          <label className="text-sm">
            Bike weight (kg)
            <input
              className={fieldClassName()}
              inputMode="decimal"
              value={state.bikeWeightKg}
              onChange={(e) => update('bikeWeightKg', e.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm">
          Ride type
          <select
            className={fieldClassName()}
            value={state.rideType}
            onChange={(e) => update('rideType', e.target.value as RideType)}
          >
            <option value="road">Road</option>
            <option value="gravel">Gravel</option>
            <option value="commute">Commute</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>

        {state.rideType === 'mixed' && (
          <label className="block text-sm">
            Gravel portion (%)
            <input
              className={fieldClassName()}
              inputMode="numeric"
              value={state.gravelPercent}
              onChange={(e) => update('gravelPercent', e.target.value)}
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
            onChange={(e) => update('packWeightKg', e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Front tyre width (mm, nominal)
            <input
              className={fieldClassName()}
              inputMode="decimal"
              value={state.frontWidthMm}
              onChange={(e) => update('frontWidthMm', e.target.value)}
            />
          </label>
          <label className="text-sm">
            Rear tyre width (mm, nominal)
            <input
              className={fieldClassName()}
              inputMode="decimal"
              value={state.rearWidthMm}
              onChange={(e) => update('rearWidthMm', e.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm">
          Tube type
          <select
            className={fieldClassName()}
            value={state.tubeType}
            onChange={(e) => update('tubeType', e.target.value as TubeType)}
          >
            <option value="butyl">Butyl</option>
            <option value="tpu">TPU</option>
            <option value="tubeless">Tubeless</option>
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            Stored for your setup; V1 does not apply a universal PSI offset by tube type.
          </span>
        </label>

        <details
          open={state.advancedOpen}
          onToggle={(e) => update('advancedOpen', (e.target as HTMLDetailsElement).open)}
          className="rounded border border-slate-200 p-3"
        >
          <summary className="cursor-pointer text-sm font-medium">Advanced setup (optional)</summary>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Front measured width (mm)
                <input
                  className={fieldClassName()}
                  value={state.frontMeasuredWidthMm}
                  onChange={(e) => update('frontMeasuredWidthMm', e.target.value)}
                />
              </label>
              <label className="text-sm">
                Rear measured width (mm)
                <input
                  className={fieldClassName()}
                  value={state.rearMeasuredWidthMm}
                  onChange={(e) => update('rearMeasuredWidthMm', e.target.value)}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Rim internal width (mm)
                <input
                  className={fieldClassName()}
                  value={state.rimInternalWidthMm}
                  onChange={(e) => update('rimInternalWidthMm', e.target.value)}
                />
              </label>
              <label className="text-sm">
                Rim type
                <select
                  className={fieldClassName()}
                  value={state.rimType}
                  onChange={(e) => update('rimType', e.target.value as StoredAppState['rimType'])}
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
                value={state.wheelDiameterInches}
                onChange={(e) => update('wheelDiameterInches', e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Front wheel load (%)
              <input
                className={fieldClassName()}
                placeholder={`Default ${40}`}
                value={state.frontLoadPercent}
                onChange={(e) => update('frontLoadPercent', e.target.value)}
              />
            </label>
            <fieldset className="text-sm">
              <legend className="font-medium">Manufacturer limits (PSI)</legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label>
                  Front min
                  <input
                    className={fieldClassName()}
                    value={state.frontMinPsi}
                    onChange={(e) => update('frontMinPsi', e.target.value)}
                  />
                </label>
                <label>
                  Front max
                  <input
                    className={fieldClassName()}
                    value={state.frontMaxPsi}
                    onChange={(e) => update('frontMaxPsi', e.target.value)}
                  />
                </label>
                <label>
                  Rear min
                  <input
                    className={fieldClassName()}
                    value={state.rearMinPsi}
                    onChange={(e) => update('rearMinPsi', e.target.value)}
                  />
                </label>
                <label>
                  Rear max
                  <input
                    className={fieldClassName()}
                    value={state.rearMaxPsi}
                    onChange={(e) => update('rearMaxPsi', e.target.value)}
                  />
                </label>
              </div>
            </fieldset>
          </div>
        </details>

        <label className="block text-sm">
          Display unit
          <select
            className={fieldClassName()}
            value={state.pressureUnit}
            onChange={(e) => update('pressureUnit', e.target.value as PressureUnit)}
          >
            <option value="psi">PSI (whole)</option>
            <option value="bar">bar (0.1)</option>
            <option value="kPa">kPa (whole)</option>
          </select>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full rounded bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Calculate
        </button>
      </form>

      {result && (
        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-900">Recommended starting pressure</p>
          <div className="mt-3 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-800">Front</p>
              <p className="text-3xl font-semibold tabular-nums text-emerald-950">
                {formatPressure(result.front.clampedKpa, unit)}{' '}
                <span className="text-lg">{unitLabel(unit)}</span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-800">Rear</p>
              <p className="text-3xl font-semibold tabular-nums text-emerald-950">
                {formatPressure(result.rear.clampedKpa, unit)}{' '}
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
                <strong>Ride model:</strong>{' '}
                {result.surfaceModel === 'mixed'
                  ? `Mixed (${result.mixedGravelPercent}% gravel blend)`
                  : result.surfaceModel}
              </p>
              {result.inputsUsed.length > 0 && (
                <div>
                  <strong>Advanced inputs:</strong>
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
            </div>
          )}
        </section>
      )}

      {!result && previewInput && (
        <p className="mt-4 text-center text-sm text-slate-500">Press Calculate to see pressures.</p>
      )}
    </div>
  )
}
