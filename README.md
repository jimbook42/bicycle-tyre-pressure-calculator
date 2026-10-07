# Bicycle Tyre Pressure Calculator

Fast starting front/rear tyre pressures for a specific ride. Client-only Vite + React app. Version 2 estimates a starting pressure from wheel load, tyre/rim geometry, and a surface deflection target. It does not claim a single optimal pressure.

## Stack

- Vite, React, TypeScript
- Tailwind CSS
- Vitest for the pressure engine
- Browser `localStorage` for bikes, rides, and feedback (schema version 3, stored under the existing `bicycle-tyre-pressure-calculator:v2` key)

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

- `src/calculator/` — Version 2 pressure engine, Renart geometry, surface, modifiers, safety, units
- `src/data/` — model constants, with `[P]`, `[L]`, and `[A]` tags in `v2ModelConstants.ts`
- `src/types/` — shared TypeScript types
- `src/storage/` — `localStorage` persistence and schema migration
- `SCIENCE.md` — sources, calibration choices, and limitations

## Author / repo

- GitHub user: `jimbook42`
- Git email used for commits: `isaactull42@gmail.com`
