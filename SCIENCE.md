# Science and model notes — Version 2

This app estimates a **starting** tyre pressure for a planned ride. It is not an optimal-pressure formula, and it is not a substitute for the tyre, rim, or hookless limits printed by the manufacturer.

Tags used below:

- **[P]** Physics or a relationship taken from the cited source
- **[L]** Anchored to a published finding or a standard, then applied in a stated way
- **[A]** A product calibration choice. Not a law, and not something the cited papers measured as a universal PSI correction

## Pipeline

```text
system mass
  → front and rear wheel loads
  → tyre / rim geometry
  → Renart pressure at a surface deflection target
  → bounded speed and wet-grip modifiers
  → safety envelope
  → ideal-gas temperature correction
  → personalisation (local evidence only)
```

Personalisation does not change Renart coefficients or any constant in this file.

## Wheel load [P]

```text
F = m × g × λ
g = 9.80665 m/s²
```

`m` is system mass: rider + bike + pack, in kilograms. `λ` is that wheel's share of the load.

The default front share is **40%** **[A]**. Rear is the rest. A rider can override the front share. The model does not force 40/60 inside the pressure equation: each wheel is solved from its own load and its own tyre.

For identical tyres at the same deflection, pressure is proportional to wheel load, because Renart's small-deflection relation is linear in force.

## Tyre and rim geometry [P]

Production pressure no longer uses an effective-width heuristic.

For each wheel, with lengths in metres:

```text
R_T0 = tyre width / 2
W_L  = rim internal width
φ0   = arccos(W_L / (2 × R_T0))
R_L  = bead-seat diameter / 2
R_W  = R_L + R_T0 × sin(φ0)
H0   = R_W + R_T0 − R_L
```

`W_L` must be narrower than the tyre width. Invalid geometry is rejected instead of being forced through the formula.

Measured mounted width replaces nominal width for that wheel when the rider supplies it.

Wheel size selects the bead-seat diameter. It is an input to `R_L`, not a label.

| Preset | Bead-seat diameter | Radius |
| --- | --- | --- |
| 700C and 29" | 622 mm | 311 mm |
| 650B and 27.5" | 584 mm | 292 mm |
| 650C (stored as the existing 24 inch preset) | 571 mm | 285.5 mm |
| 26" | 559 mm | 279.5 mm |
| 20" | 406 mm | 203 mm |
| 16" | 349 mm | 174.5 mm |

If wheel size is omitted, bead-seat diameter is **622 mm (700C)** **[A]** and the result says so.

If rim internal width is omitted, the model uses **19 mm** **[A]**, the historical road measuring-rim scale, and marks the result as less refined. If 19 mm is not narrower than the tyre, it uses **0.7 × tyre width** **[A]** so the geometry stays valid.

## Renart pressure relationship [P]

Source: Renart & Roura-Grabulosa, “Deformation of an inflated bicycle tire when loaded,” *American Journal of Physics* 87, 102–109 (2019). Preprint: arXiv:1902.03661.

Small-deflection relation used here:

```text
F = K × P × d^1.5
P = F / (K × d^1.5)
```

```text
K = α × β × R_L / (R_W + R_T0)
α = 1.259
β = sqrt(2 × (R_W + R_T0)) × (b/a)
```

`b/a` is equation (25) of the paper and depends only on `φ0`. `α = 1.259` is the footprint factor the authors report after applying the `R_L / (R_W + R_T0)` correction to their road-wheel curve. `P` is membrane overpressure, which is what a tyre gauge reads.

Internal units are newtons, metres, and pascals. Display converts gauge pressure to PSI, bar, or kPa.

Figure 4a of the paper reports `F(N) = 44.16 × d(mm)^1.5` at 0.6 MPa for `W_L = 19.04 mm`, `R_T0 = 15.8 mm`, `R_W = 296.8 mm`, `R_L = 282.5 mm`. Evaluating the published power-law constants on those inputs reproduces a coefficient near 42.3. The automated test allows a **6% reproduction tolerance** around 44.16. That 6% is a test tolerance for reproducing the reported coefficient. It is not a statement of model accuracy.

### What Renart is not

The paper's model is a thin inextensible toroidal membrane, tread removed for the experiments, under a small-deflection assumption, checked on two wheels. It is not a tyre-dynamics model and it is not proof of a universally good bicycle pressure.

## Deflection target [A], on a section height the standard names [L]

Absolute deflection is a fraction of the unloaded tyre height `H0` from the geometry above. That is the height Renart calls the tyre height (`H0 = R_W + R_T0 − R_L`).

Smooth surfaces aim at **15%** of `H0`. Rough surfaces aim at **25%** of `H0`. Those two anchors are **[A]** calibration choices. They are not a claim that the literature proved those exact fractions are optimal.

The transition uses a smoothstep from IRI **5 to 10 m/km** **[A]**:

```text
x = clamp((IRI − 5) / 5, 0, 1)
s = x² × (3 − 2x)
d* = 0.15 + s × (0.25 − 0.15)
```

### The 30% deflection ceiling

ISO 5775-1:2023 says, in the pressure-marking clause: “It is recommended that the deflection of the tyre in use does not exceed 30 % of the tyre section height at the minimum inflation pressure, if it is specified on the tyre.”

That sentence identifies the basis as **tyre section height**, not tyre width. This implementation applies 30% to the same `H0` the pressure model deflects. ISO 5775-1:2014 also defines a *design* section height used for size designation (`nominal width + 4 mm` below 28 mm, `+ 5.5 mm` at 28 mm and above, with a further off-road allowance). That design height is a marking dimension. It is not substituted for `H0`, because mixing it with Renart's deflection would change the pressure without being the height the model compresses.

The 30% ceiling is a **safety floor on pressure** (more deflection means less pressure). It replaces the old synthetic ~10 PSI / 69 kPa floor. It is a standards recommendation applied inside this model, not a measured optimum. If a modifier would ask for more than 30% of `H0`, deflection stops at 30%.

## Surface roughness [L] and the IRI numbers [A]

Turner 2024, *Vehicle System Dynamics* 62(10), is the reason roughness enters as IRI and why rolling loss is treated as scaling with something like `IRI²` times vertical stiffness. That paper does not hand back a rider PSI.

Mixed rides therefore combine roughness, not pressures **[P]** relative to that modelling choice:

```text
IRI_eff = sqrt(q_road × IRI_road² + q_gravel × IRI_gravel²)
q_road = 1 − q_gravel
```

The IRI numbers themselves are **[A]** product defaults, not a survey of every road:

| Ride | IRI |
| --- | --- |
| Road | 4 m/km |
| Commute | 6 m/km |
| Gravel | 12 m/km |

Commute is rougher than the road default. It is not a copy of the road case with a pack-weight penalty. Pack weight is simply part of system mass on every ride type.

## Speed [A]

Expected average speed is a model input. If it is omitted, the reference is **25 km/h**, where the speed term is exactly 1.

Eng et al., *Eng* 6(9):245 (2025), shows that speed, pressure, width, and inner tube change measured bicycle vibration on a specific rig. It does not publish a universal PSI-per-km/h correction. Turner’s stiffness term is a reason speed can matter, not a coefficient.

The implementation changes target deflection by at most **±4%** between 5 and 45 km/h **[A]**. Faster than the reference is slightly firmer. Slower is slightly softer. The term saturates outside that span. It is labelled calibration, not a physical law.

## Wet grip [A]

There is no `× 0.97` rule and no fixed “about 2 PSI” wet deduction.

The existing forecast classifies the ride window as dry, damp, or wet from precipitation and weather codes (drizzle and fog lean damp; rain and heavier precipitation lean wet). The rider can still force dry or wet.

Damp adds up to **1.5%** deflection and wet up to **3%** **[A]**, which lowers pressure because the Renart relation is `P ∝ 1 / d^1.5`. Above the reference speed the wet term is reduced, and the combined speed × wet deflection multiplier is clamped to **0.96–1.06** **[A]**. The point of the clamp is to stop the two contexts stacking into a large pressure change.

The UI describes this as a grip-oriented nudge. It does not override the safety envelope.

## Tube system, casing, and category [A]

Supported tube systems: tubeless, TPU, butyl, latex.

Supported casings: standard, endurance / reinforced, race / lightweight, reinforced / puncture-resistant.

Supported categories: road, all-road, gravel.

Each has a coefficient that multiplies `K`. Every coefficient is **1.0**. An unknown value also uses 1.0 and is flagged. These inputs are stored so later calibration can use them. They are not experimental PSI offsets. Tyre model name is stored for the same reason and does not change pressure.

## Safety [L]

Final maximum pressure is the lowest of:

- the manufacturer maximum the rider entered (tyre or rim — enter the lower one; the form has one maximum per wheel)
- the ISO 5775-1:2023 Table 3 straight-side / hookless cap, when that cap applies

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

This table is the ISO/ETRTO straight-side recommendation (also republished by Schwalbe as that ISO table). It is not a claim that every rim brand uses these numbers. A lower manufacturer maximum still wins. Selecting **hooked** does not apply the table. If rim type is omitted, the table is applied and the result warns, because an unknown rim is treated as the more restrictive case.

The width used to pick a band is the larger of nominal and measured width **[A]**, so a tyre that mounts into a wider band is not given the higher cap of a narrower nominal size. The standard itself indexes the table by nominal section width.

Minimum pressure is the higher of the 30% deflection floor and any manufacturer minimum. If that minimum sits above the maximum, the maximum is kept and the conflict is flagged.

## Temperature [P]

Cold inflation gauge pressure:

```text
P_fill_gauge = (P_target_gauge + P_atm) × (T_fill / T_ride) − P_atm
```

Temperatures are kelvin. `P_atm` is 101.325 kPa at sea level. When the forecast payload includes elevation, `P_atm` follows the International Standard Atmosphere troposphere formula. Otherwise it stays at sea level.

Worked check: 50 PSI gauge at a 10°C ride, filled at 20°C, is about **52.3 PSI** on the pump.

Ride temperature is still the duration-weighted air temperature over the planned window from the existing Open-Meteo provider. There is no second weather system.

## Personalisation

Saved feedback is not part of the physical model. It runs after the safety envelope. Temperature correction is then applied to the personalised riding pressure so the pump setting matches that ride target.

The adjustment uses the **pressure actually ridden**, with front and rear feel stored separately (`too soft`, `good`, `too hard`). Older notes that only have one overall feel still apply that feel to both wheels. The offset stays capped (see `src/data/personalisationConstants.ts`). It cannot rewrite `α` or any other physical constant.

## Other evidence that informed the design, and what it does not do

- **Buder, Fouchard & Schwanitz 2025**, *Journal of Science & Cycling* 14(2). Width and pressure trade off rolling resistance and vibration in a specific TPU-tube test. Absolute pressures from that setup are not copied into this model.
- **Dressel**, University of Wisconsin–Milwaukee thesis. Broader tyre stiffness measurements. It is a thesis, not a journal paper, and it is not used as a hidden PSI table here.
- **Frank Berto’s 15% drop chart** and the old Bike Tinker regression are not the production baseline. They remain useful only as a historical comparison. Version 2 is not tuned to match them.

## Removed from production

- Berto regression `PSI = 153.6 × load_lbf / width^1.5785 − 7.1685`
- Rim-width effective-width heuristic
- Gravel `× 0.9` and linear mixed-pressure blending
- Synthetic ~10 PSI floor
- Wet `× 0.97` / about −2 PSI
