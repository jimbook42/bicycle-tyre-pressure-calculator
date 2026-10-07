# Science and model notes — Version 2.1

Version 2.1 estimates an **evidence-backed starting pressure** for a planned ride. It is not a proof of the fastest pressure, and it is not a substitute for the limits printed on the tyre or rim.

Three kinds of statement are kept apart:

- **Direct evidence.** A result measured or published by a source.
- **Model inference.** A conclusion drawn by combining sources.
- **Engineering calibration.** A number chosen so the product can act on qualitative or physical evidence. It is not a published universal PSI formula.

Tags:

- **[P]** A relationship taken from the cited source
- **[L]** Anchored to a published finding or a standard, then applied in a stated way
- **[A]** An engineering calibration

## Pipeline

```text
system mass
  → front and rear wheel loads, calculated separately
  → measured tyre width, or labelled width if measured width is missing
  → empirical Berto-chart baseline (Adams regression)
  → bounded surface adjustment
  → bounded wet / likely-wet adjustment
  → safety envelope
  → ideal-gas temperature correction
  → personalisation (local evidence only, capped)
```

Speed, casing, tube type, rim internal width, and wheel diameter do not change this pressure. Renart does not determine it. Temperature is not mixed into the baseline: the baseline is the pressure to ride at, and the gas law only sets the pump pressure.

Personalisation does not change the regression coefficients or the condition factors.

## Empirical baseline [L]

Frank Berto measured static tyre drop. His own description of that work, in *All About Tire Inflation*, covers road tyres with measured widths from about 19 mm to 37 mm, wheel loads from about 20 lb to 220 lb, and pressures from about 40 psi to 160 psi. A line through about 15% drop was the reference he plotted.

Jan Heine, in *Bicycle Quarterly* Vol. 5 No. 4, published that chart and compared it with Bicycle Quarterly’s own rolling tests. The article, which Berto reviewed, says pressures for about 15% drop suit average roads. It also says a slight increase may help on a very smooth road, and a reduction may help on a very rough or unpaved road. Worked examples in that article:

| Wheel load | 20 mm | 37 mm |
| --- | ---: | ---: |
| 45 kg | 125 PSI | 45 PSI |
| 55 kg | 155 PSI | 53 PSI |

The 15% figure is the reference region on that chart. It is not a law that every modern tyre, surface, and rider is fastest at exactly 15% drop. The original set is static drop on the tyres Berto measured, mostly narrower than today’s gravel tyres.

This repository does not contain a complete digitised copy of the chart. Missing points are not invented. Production pressure uses Dave Adams’s published curve fit to the chart, via Bike Tinker:

```text
PSI = 153.6 × load_lbf / width_mm^1.5785 − 7.1685
```

That is a regression, not Berto’s equation. The interface says so. Checked against the worked examples above, it lands within about 4 PSI. Checked against approximate readings of the 100 lb column (20 mm ≈ 126 PSI, 23 mm ≈ 106, 25 mm ≈ 88, 28 mm ≈ 76, 32 mm ≈ 60, 37 mm ≈ 46), it lands within about 6 PSI. Those column readings are validation targets, not extra chart points.

Each wheel uses its own load and its own width. The regression has an intercept, so front and rear pressure are not forced to the load ratio and are not forced equal.

Measured mounted width replaces labelled width when the rider supplies it. Outside about 19–37 mm, 20–220 lb, or 40–160 PSI, the result is marked as an extrapolation and is still shown.

A 37.5 mm tyre at a 100 lb wheel load is the audit benchmark. It sits just outside the chart’s widest measured tyre, in the same pressure region as the published 37 mm example (a bit under 50 PSI from the regression), and it is not the old Renart 15% deflection pressure.

## Wheel load [P]

```text
load = (rider + bike + pack) × wheel share
```

The default front share is **40%** **[A]**. Rear is the rest. A rider can override the front share. Pack weight is part of system mass on every ride type.

## Surface adjustment [A], direction from [L]

Turner, *Vehicle System Dynamics* (2024), models roughness resistance and vibration from vertical stiffness and the International Roughness Index. Roughness resistance rises with stiffness and with roughness. Reducing vertical stiffness can reduce those losses. On smooth roads his calculated optimum often sits at the high end of the pressure range he allows, and on rough roads at the low end. That is a result inside his model. It is not a PSI table, and V2.1 does not convert IRI into a target deflection and then into pressure. Riders choose a condition. They do not enter IRI.

Bicycle Quarterly supplies the qualitative direction around the 15% chart: slight increase on a very smooth road, reduction on a very rough or unpaved road, chart pressure on an average road.

The percentages below are a calibration. Nothing in those papers publishes them. The step is 2 percentage points, about 1–2 PSI on a typical road tyre, and the whole set stays inside ±10% so the load/width baseline remains the main term.

| Condition | Factor | Stored ride type |
| --- | ---: | --- |
| Smooth road | 1.02 | `road-smooth` |
| Normal road | 1.00 | `road` |
| Smooth / hardpack gravel | 0.98 | `gravel-hardpack` |
| Rough road | 0.96 | `road-rough` |
| Typical gravel | 0.94 | `gravel` |
| Rough gravel | 0.92 | `gravel-rough` |
| Very rough / chunky gravel | 0.90 | `gravel-very-rough` |

A saved **commute** ride keeps that ride type, so older notes still match. It uses the rough-road factor, because Version 2 treated commute as rougher than the road default and there is no separate commute study.

A **mixed** ride weights the normal-road factor and the typical-gravel factor by the gravel percentage. At 0% it matches normal road. At 100% it matches typical gravel. It is not treated as pure gravel. Because both factors multiply the same baseline, that weight is also a weight of the two pressures. That is the condition blend. It is not the old root-mean-square IRI path.

## Wet weather [A], direction from [L]

Bicycle Rolling Resistance (Bierman, 2024) tested three 28-622 tyres — Continental GP5000 S TR, Vittoria Corsa Pro TLR, and Tufo Comtura Prima TR — at 54, 72, 90 and 108 PSI. The surface was a flat textured ceramic plate. Speed was very low. Average centre grip was 0.78, 0.74, 0.71 and 0.69 at those four pressures. Edge grip moved less. Grip rose as pressure fell.

The test does not say the PSI should fall by the grip percentage. From 90 PSI to 72 PSI is a 20% pressure drop for about a 4% rise in centre grip. V2.1 applies **−4%** **[A]**, one fifth of that pressure step, independently on each wheel, after the surface factor and before the safety envelope. Dry is a factor of 1. Damp forecasts use the same −4%, because the test did not separate drizzle from rain. The old Version 2 deflection bumps (+3% wet, +1.5% damp) are not used.

The wet factor cannot override a manufacturer or hookless limit, because the safety envelope runs after it.

## What is recorded and does not change PSI

**Speed.** Crenna, Belotti, Colò, Morettini and Tenerini, *Eng* 6(9):245 (2025), measured bicycle vibration at two speeds and found pressure and width changed vibration. Turner’s stiffness term also depends on the broader riding context. Neither source publishes a universal speed-to-PSI percentage. Expected speed may still be stored from an older session. It is not shown as a pressure input and it does not change PSI.

**Casing and tube type.** Construction changes rolling resistance, grip, puncture and pinch-flat risk, and vibration. The 2025 vibration paper included an inner tube as a test factor on one road setup. That is not a general `casing → ±X%` or `tube → ±X%` rule. Coefficients in the code are 1 and are not multiplied into the result. An unrecognised tube type is flagged and still does not move PSI.

**Rim internal width and wheel diameter.** They describe the bike and they still matter for the Renart diagnostic. They are not inputs to the Berto regression.

## Safety [L]

After the condition adjustments, the usable pressure is limited by:

- the manufacturer minimum the rider entered, if any
- the manufacturer maximum the rider entered, if any
- ISO 5775-1:2023 Table 3, when the rim is hookless or the rim type is not set

Table 3 recommended maximums, by section width:

| Width (mm) | Maximum |
| --- | --- |
| 18–24 | 550 kPa |
| 25–29 | 500 kPa |
| 30–34 | 450 kPa |
| 35–39 | 400 kPa |
| 40–44 | 350 kPa |
| 45–54 | 300 kPa |
| 55–64 | 250 kPa |
| 65–74 | 200 kPa |
| 75–84 | 150 kPa |

The width used to pick a band is the larger of labelled and measured width **[A]**, so a tyre that mounts wider is not given the higher cap of a narrower label. Selecting **hooked** skips the table. If rim type is omitted, the table is applied and the result says so.

There is no Renart 30% section-height floor and no synthetic 10 PSI floor. If the calculated target is above a maximum, the target is kept internally and the usable pressure is the cap. The explanation says the number was capped. If a minimum is above the maximum, the maximum is kept and the conflict is flagged.

## Temperature [P]

Cold inflation gauge pressure, applied once to the riding target (after personalisation when that is on):

```text
P_fill_gauge = (P_target_gauge + P_atm) × (T_fill / T_ride) − P_atm
```

Temperatures are kelvin. `P_atm` is 101.325 kPa at sea level. When the forecast includes elevation, `P_atm` follows the International Standard Atmosphere troposphere formula.

Worked check: 50 PSI gauge at a 10°C ride, filled at 20°C, is about **52.3 PSI** on the pump.

Ride temperature is the duration-weighted air temperature from the existing Open-Meteo provider.

## Personalisation

Saved feedback is not part of the physical model. It runs after the safety envelope. The offset uses the pressure actually ridden, with front and rear feel stored separately. The offset stays inside the cap in `src/data/personalisationConstants.ts` (8 PSI, and less until several agreeing rides exist). It cannot rewrite the regression or the condition factors. Existing notes are kept when the model changes. A note still matches the same bike, ride type, width, tube, and weight bucket. `road` is still normal road and `gravel` is still typical gravel, so older notes for those choices still apply.

## Other research that informed the design, and what it does not do

- **Buder, Fouchard and Schwanitz 2025**, *Journal of Science and Cycling* 14(2). On one tyre model, width and pressure changed rolling resistance together, and a rougher lab surface was a secondary effect. Wider tyres reduced vibration more than pressure did. The pressures from that treadmill setup are not copied.
- **Crenna et al. 2025**, *Eng* 6(9):245. Lower pressure reduced measured vibration. Earlier project notes called this paper “Eng et al.” because *Eng* is the journal title. The authors are Crenna, Belotti, Colò, Morettini and Tenerini.
- **Renart and Roura-Grabulosa 2019**, *American Journal of Physics* 87, 102–109. A thin inextensible membrane under a small-deflection assumption, checked on two wheels. Version 2 used it as the pressure engine. Version 2.1 does not. The paper does not validate that model as a direct recommendation for what to pump into a modern bicycle tyre. The implementation remains in `src/calculator/renart.ts` for reference and tests. It is not on the production path.

## Removed from the production pressure path

- Renart deflection target and Renart-derived pressure
- IRI → deflection → pressure
- Speed deflection modifier
- Wet and damp deflection modifiers (+3% and +1.5%)
- 30% section-height pressure floor
- Any universal casing or tube PSI multiplier

Storage schema version stays 3, under the existing `bicycle-tyre-pressure-calculator:v2` key. Bikes, rides, feedback, settings, and personalisation history are not reset.
