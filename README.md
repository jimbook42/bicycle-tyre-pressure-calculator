# Bicycle Tyre Pressure Calculator

Evidence-backed starting front and rear tyre pressures for a planned ride. Client-only Vite + React app.

**Version 2.1 — empirical Berto baseline + evidence-informed condition adjustments + temperature + safety + bounded personalisation.**

It does not claim a single optimal pressure. The baseline is a published curve fit to Frank Berto’s 15% tyre-drop chart, not Berto’s own equation. Surface and wet conditions apply small calibrated adjustments around that baseline. Renart does not set the pressure. See `SCIENCE.md` for sources, calibrations, and limits.

## Stack

- Vite, React, TypeScript
- Tailwind CSS
- Vitest for the pressure engine
- Browser `localStorage` for bikes, rides, and feedback (schema version 3, stored under the existing `bicycle-tyre-pressure-calculator:v2` key)

Version 2.1 does not reset saved bikes, rides, feedback, settings, or personalisation. Older `road` notes still match normal road. Older `gravel` notes still match typical gravel. A saved commute ride keeps its type and uses the rough-road adjustment.

## Scripts

```bash
npm install
npm run dev
npm test
npm run build
```

## Deploy (Vercel)

Connect the GitHub repo and use the default Vite build settings:

- **Build command:** `npm run build`
- **Output directory:** `dist`

No environment variables are required.

## Project layout

- `src/calculator/` — Version 2.1 pressure engine, Berto baseline, condition adjustments, safety, Renart diagnostic
- `src/data/` — model constants, references, and version
- `src/types/` — shared TypeScript types
- `src/storage/` — `localStorage` persistence and schema migration
- `SCIENCE.md` — sources, calibration choices, and limitations

## Author / repo

- GitHub user: `jimbook42`
- Git email used for commits: `isaactull42@gmail.com`
