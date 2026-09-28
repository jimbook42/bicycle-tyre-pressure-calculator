# Science and model notes

This app estimates **starting** tyre pressures. It is not a substitute for manufacturer guidance, hookless compatibility rules, or on-road adjustment.

## Baseline pressure (Berto chart approximation)

Wheel pressure is derived from an **empirical fit** to Frank Berto’s tyre-drop chart data (load vs width vs pressure). This is **not** presented as Berto’s original equation.

Implemented form (constants in `src/data/constants.ts`):

```
PSI = A × load_lbf / width_mm^B + C
```

- `A = 153.6`, `B = 1.5785`, `C = -7.1685`
- `load_lbf` is per-wheel load (system mass × front/rear load share)
- `width_mm` is the **effective** tyre width (see below)

The fit is widely used as a calculator approximation; it has a limited valid domain. Results below ~10 PSI are clamped to a minimum (`MODEL_MIN_PRESSURE_KPA`) to avoid nonsensical negatives from the fit tail.

**References (for the approximation, not endorsement of every detail):**

- Frank Berto, *Adventure Cyclist* / tyre drop chart work (load–pressure–width relationship)
- Community re-implementations of the chart fit (same coefficient family)

Validate against published chart examples when changing coefficients.

## Effective tyre width

- If **measured mounted width** is provided, it replaces nominal width for that wheel.
- Otherwise **nominal width** is used (we do not assume nominal equals mounted).
- Optional **rim internal width** applies a small documented spread adjustment relative to a 19 mm reference (`RIM_INTERNAL_WIDTH_EFFECT_MM_PER_MM`).

## Load split

Default **40% front / 60% rear**. Advanced override available. Rear pressure is normally higher because rear load is higher.

## Ride type

| Ride     | Model |
|----------|--------|
| Road     | Road surface factor (1.0) |
| Gravel   | Gravel surface factor (0.9) — modelling choice for rougher surfaces |
| Commute  | Same as road; **pack weight is included** in system mass (no extra “commute penalty”) |
| Mixed    | Compute road and gravel targets separately, then **linear interpolate** by gravel % |

Mixed blending is a **modelling approximation** documented in the UI.

## Tube type

Butyl, TPU, and tubeless are stored for future personalisation. **V1 applies no universal PSI offset** by tube type (insufficient evidence for a single global correction).

## Manufacturer limits

If min/max are supplied (advanced), recommended pressures are **clamped** to those bounds and flagged in metadata. If not supplied, no limits are invented.

**Hookless:** when selected, the UI warns that hookless-compatible tyres and rim/tyre pressure caps must be respected.

## Internal units

Calculations use **kg**, **mm**, and **kPa** internally. Display converts to PSI (default), bar, or kPa.
