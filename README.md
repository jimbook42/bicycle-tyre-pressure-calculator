# Bicycle Tyre Pressure Calculator

Fast starting front/rear tyre pressures for a specific ride. Client-only Vite + React app with deterministic calculation and local browser storage.

## Stack

- Vite, React, TypeScript
- Tailwind CSS
- Vitest for the pressure engine

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

No environment variables required for V1.

## Project layout

- `src/calculator/` — pressure engine, units, safety clamping
- `src/data/` — model constants (isolated from logic)
- `src/types/` — shared TypeScript types
- `src/storage/` — `localStorage` persistence
- `SCIENCE.md` — model sources and limitations

## Author / repo

- GitHub user: `jimbook42`
- Git email used for commits: `isaactull42@gmail.com`
