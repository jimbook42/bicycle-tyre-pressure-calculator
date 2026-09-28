# Science and model notes

This app estimates **starting** tyre pressures. It is not a substitute for manufacturer guidance, hookless compatibility rules, or on-road adjustment.

## Baseline pressure (Berto chart approximation)

Wheel pressure is a **regression fit to Frank Berto’s 15% tyre-drop chart**, not an equation Berto published. Dave at Bike Tinker (2010) fit Berto’s measured chart points as:

```
PSI = 153.6 × load_lbf / width_mm^1.5785 − 7.1685
```

Constants live in `src/data/constants.ts` (`BERTO_APPROX_A`, `BERTO_APPROX_B`, `BERTO_APPROX_C`). The fit targets the pressure that produced about a **15% drop in tyre height** on the tyres Berto measured. Fifteen percent was a manufacturer deflection recommendation that Berto charted; it is a starting-point criterion, not a measured proof of the single best pressure for every modern tyre.

- `load_lbf` is per-wheel load (system mass × front/rear load share × 2.2046226218)
- `width_mm` is the **effective** tyre width (see below)
- Road uses the fit unchanged. Gravel multiplies the result by 0.9 (`GRAVEL_SURFACE_PRESSURE_FACTOR`), a separate modelling choice, not part of Berto’s chart.
- Results below ~10 PSI are clamped to `MODEL_MIN_PRESSURE_KPA`.

**References:**

- Frank Berto’s 15% tyre-drop chart, discussed by Jan Heine in *Bicycle Quarterly* (pressures for a stated drop, using wheel load, not total bike weight)
- Dave, “Optimal Tire Pressure for bicycles,” Bike Tinker, 2010 — source of the coefficient fit above

The coefficients were not re-derived from Berto’s original plot in this repository. Treat them as that published community fit, valid as an approximation inside the chart’s measured domain, not as Berto’s own formula.

## Effective tyre width

- If **measured mounted width** is provided, it replaces nominal width for that wheel.
- Otherwise **nominal width** is used (we do not assume nominal equals mounted).
- Optional **rim internal width** applies a small documented spread adjustment relative to a 19 mm reference (`RIM_INTERNAL_WIDTH_EFFECT_MM_PER_MM`).

## Load split

Default **40% front / 60% rear**. Advanced override available. Rear pressure is normally higher because rear load is higher.

The pressure equation is nearly linear in wheel load, so a 40/60 split produces a large front/rear gap. For a 104 kg system on 35 mm tyres the fit evaluates to about **44 PSI front and 70 PSI rear** (41.6 kg / 62.4 kg per wheel). That gap is the load split passing through this equation. It is not an extra front/rear correction.

Frank Berto’s chart, as republished with Jan Heine’s measurements, also uses **per-wheel load**, so different front and rear pressures are what that chart shows. Heine later warned that running the front much softer than the rear can be unstable under braking, and that many riders then raise the front toward the rear figure. This app does not apply that practical override: doing so would replace the load-based chart rather than fix a calculation error.

## Worked example (104 kg, 35 mm, road, 40/60)

Wheel loads: front 41.6 kg (91.7 lbf), rear 62.4 kg (137.6 lbf).

```
35^1.5785 ≈ 273.72
front PSI = 153.6 × 91.7 / 273.72 − 7.1685 ≈ 44.3 → 44 PSI displayed
rear PSI  = 153.6 × 137.6 / 273.72 − 7.1685 ≈ 70.0 → 70 PSI displayed
```

35 mm and these wheel loads sit inside the width and load range Berto charted (roughly 20–37+ mm and touring wheel loads). The result is the 15% drop fit, not a claim that 44 PSI will feel firm on a modern 35 mm road tyre. No tube-type offset is applied.

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
