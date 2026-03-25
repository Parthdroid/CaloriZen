# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Project: NutriSnap

A mobile calorie and macro tracking app with:
- **AI photo analysis**: Take a photo of a meal; GPT-4 vision estimates calories and macros
- **Barcode scanner**: Look up packaged food nutrition by barcode (Open Food Facts + AI fallback)
- **Clarification Q&A**: If AI is unsure, it asks follow-up questions to improve accuracy
- **Food log with history**: View meals by date with 7-day scrollable date picker
- **Nutrition goals**: Set and edit daily calorie/macro targets
- **Calorie ring**: Animated SVG ring showing remaining calories for the day

### Design System (Cal AI-inspired premium)
- Clean, smooth, Cal AI-inspired light theme; soft off-white (#FAFAFA) background, pure white cards
- Orange accent: `#FF6B35`; iOS-style gray palette (text #1E1E1E, secondary #8E8E93, tertiary #AEAEB2)
- Font: Inter (400/500/600/700); 28px date heading, tight letter-spacing
- Color tokens: protein (blue #5B9FF3), carbs (amber #FFBF47), fat (red #FF6B6B), calories (orange)
- Home: centered calorie ring with remaining count, eaten/goal stats with dots+divider, macro mini-ring cards with percentages, clean orange Scan Meal button + white Barcode button
- Onboarding: dark theme (#0F0F0F → #1A1A2E gradient), step numbers (01/02/03), gradient buttons, animated slide transitions, emoji goal cards; AsyncStorage `@onboarding_complete` gates app entry; goals saved via API
- Scan: dark (#0A0A0A) camera-first unified hub with photo/barcode mode toggle, bottom toolbar (gallery, shutter, manual entry), viewfinder corners; animated scan line overlay and cycling tips; 90s timeout via Promise.race
- Goals: rounded cards with colored icons and checkmark badges; edit mode with inline inputs
- Log: horizontal scrollable date picker with day abbreviations, orange highlight for selected date, today dot indicator
- Tab bar: dark transparent on Scan tab, standard white on other tabs

## Packages

### `artifacts/mobile` (`@workspace/mobile`)

Expo React Native app (iOS/Android/Web). Key files:
- `app/_layout.tsx` — root stack with providers (QueryClient, AppProvider)
- `app/(tabs)/_layout.tsx` — 4-tab layout (Home/Log/Scan/Goals)
- `app/(tabs)/index.tsx` — home screen: calorie ring, macro bars, quick actions
- `app/(tabs)/log.tsx` — food log with date picker
- `app/(tabs)/scan.tsx` — scan tab with camera/gallery options
- `app/(tabs)/goals.tsx` — goals CRUD with edit mode
- `app/barcode.tsx` — barcode lookup modal
- `app/review.tsx` — AI analysis review with clarification Q&A, editable items
- `context/AppContext.tsx` — shared state (pendingAnalysis, selectedDate)
- `constants/colors.ts` — theme tokens for light/dark mode
- `components/MacroRing.tsx` — SVG ring for macros
- `components/MealCard.tsx` — meal list item with long-press delete

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
