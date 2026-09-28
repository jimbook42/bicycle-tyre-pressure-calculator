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

## Personal ride notes

Saved feedback is **personal empirical evidence**. It is not a correction of the baseline model and it is not proof that the model is wrong. The app does not learn a perfect pressure.

After the baseline is calculated, a separate layer may nudge the **starting** suggestion:

- **Good** pulls toward the pressure the rider actually used (including when that differs from the recommendation).
- **Too hard** is evidence for a lower pressure than what was ridden (a fixed 2 PSI step — a hint, not a measured comfort delta).
- **Too soft** is evidence for a higher pressure by the same step.

Offsets are averaged with newer rides weighted more (`RECENCY_DECAY`). The average is scaled by how many rides exist (`RIDES_FOR_FULL_WEIGHT` = 5) and by how much the notes agree. Opposing notes shrink the shift. The result is capped at 8 PSI from the baseline (`MAX_OFFSET_PSI`), then clamped to manufacturer limits. One ride can move the suggestion by at most one fifth of that cap.

Evidence is kept apart by bike, ride type, tyre widths, tube type, and a coarse system-weight bucket. Resetting personalisation for a setup deletes only that setup’s notes. Constants live in `src/data/personalisationConstants.ts`.

## Weather and temperature (optional)

Open-Meteo supplies geocoding and hourly **2 m air temperature** and precipitation for a single representative location (not route weather). The provider sits behind `WeatherProvider` so it can be swapped if licensing changes.

**Target riding pressure** is the baseline (plus personal notes and optional wet adjustment). **Cold inflation pressure** uses an ideal-gas gauge approximation:

`P_cold_abs = P_target_abs × (T_inflate_K / T_ride_K)`

Ride temperature is a **duration-weighted** average over the planned ride window from hourly forecast data — not daily min/max. Inflation temperature defaults to current ambient from forecast when available; otherwise a labelled assumption (`DEFAULT_ASSUMED_INFLATION_TEMP_C`). Wind chill / “feels like” is not used.

Wet riding applies `WET_SURFACE_PRESSURE_FACTOR` (0.97) on the riding target — a conservative practical adjustment, not a physical law. Manufacturer limits are applied to both riding and cold inflation results.
