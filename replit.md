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

## Project: CaloriZen

A mobile calorie and macro tracking app with:
- **AI photo analysis**: Take a photo of a meal; GPT-4 vision estimates calories and macros
- **Barcode scanner**: Look up packaged food nutrition by barcode (Open Food Facts + AI fallback)
- **Clarification Q&A**: If AI is unsure, it asks follow-up questions to improve accuracy
- **Food log with history**: View meals by date with 7-day scrollable date picker
- **Nutrition goals**: Set and edit daily calorie/macro targets
- **Calorie ring**: Animated SVG ring showing remaining calories for the day

### Design System (Studio-grade, Cal AI-inspired premium)
- **Forced light mode**: `userInterfaceStyle: "light"` in app.json; `useTheme.ts` always returns light colors; no dark mode anywhere in the app interior
- **Background**: Off-white `#F8F8FA` for root, pure `#FFFFFF` for cards with soft box shadows (0.04 opacity, 10px radius)
- **Accent**: Orange `#FF6B35` throughout; FAB has matching orange glow shadow
- **Text**: Black `#000000`, secondary `#3C3C43`, tertiary `#AEAEB2`
- **Font**: Inter (400/500/600/700); tight letter-spacing on headings
- **Color tokens**: protein (blue `#007AFF`), carbs (amber `#FF9500`), fat (red `#FF3B30`), calories (orange)
- **Home**: "Hello," greeting + first name, date chip with calendar icon, large calorie card (120px ring, 52px remaining number, eaten/goal dots), macro progress bars with emoji icons and percentage fills, "Today's meals" section with meal cards
- **Scan**: "Scan Food" title + subtitle, premium camera viewfinder box with corner brackets, camera icon circle, three option buttons (Gallery/Barcode/Manual) with colored icon backgrounds and hint text, expandable barcode input; animated scan line overlay with dark pill status during analysis; 90s timeout
- **Log**: Horizontal scrollable date picker with white/black pill states, summary strip with dividers, meal cards grouped by type with section headers including icons
- **Goals**: White cards with colored icon backgrounds, 32px bold values, orange edit pill button, sign out with red tint
- **Login**: Dark gradient `#0A0A0F` → `#111128`, CaloriZen™ branding, feature row (Photo scan · Barcode · AI macros), black Apple + white Google buttons, footer with Terms/Privacy
- **Onboarding**: Dark theme with 5-step flow (welcome/height/weight/goal/complete), gradient buttons, animated slide transitions, emoji goal cards; `@onboarding_complete` gates app entry; goals saved via API
- **Tab bar**: Translucent blur on iOS (`systemChromeMaterialLight`), hairline top border on web, orange active tint
- **MealCard**: White rounded cards with colored meal-type icon, calorie badge in orange tint, inline macro text (P · C · F), scale animation on press
- **StatusBar**: Light on login screen, dark everywhere else
- **Bundle ID**: `ai.calorizen.app` (iOS + Android); `CFBundleDisplayName: "CaloriZen"` for proper permission dialogs
- **Images**: NOT stored in DB — base64 used only during AI analysis then discarded; DB stores text-only meal records (~500 bytes each)

## Packages

### `artifacts/mobile` (`@workspace/mobile`)

Expo React Native app (iOS/Android/Web). Key files:
- `app/_layout.tsx` — root stack with providers (QueryClient, AuthProvider, AppProvider); redirects to login if unauthenticated
- `app/login.tsx` — login screen with Google and Apple sign-in buttons, dark gradient theme
- `app/(tabs)/_layout.tsx` — 4-tab layout (Home/Log/Scan/Goals)
- `app/(tabs)/index.tsx` — home screen: calorie ring, macro bars, quick actions
- `app/(tabs)/log.tsx` — food log with date picker
- `app/(tabs)/scan.tsx` — scan tab with camera/gallery options
- `app/(tabs)/goals.tsx` — goals CRUD with edit mode + sign-out button
- `app/barcode.tsx` — barcode lookup modal
- `app/review.tsx` — AI analysis review with clarification Q&A, editable items
- `context/AuthContext.tsx` — auth state management (user, token, signIn, signOut); stores JWT in AsyncStorage; wires `setAuthTokenGetter` for API client
- `context/AppContext.tsx` — shared state (pendingAnalysis, selectedDate)
- `constants/colors.ts` — theme tokens for light/dark mode
- `components/MacroRing.tsx` — SVG ring for macros
- `components/MealCard.tsx` — meal list item with long-press delete

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Auth: `src/lib/auth.ts` — JWT sign/verify, `requireAuth` and `optionalAuth` middleware
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/auth.ts` handles Google/Apple sign-in (POST /api/auth/google, POST /api/auth/apple, GET /api/auth/me)
- All meal/goal routes use `optionalAuth` to associate data with users when logged in
- Depends on: `@workspace/db`, `@workspace/api-zod`, `google-auth-library`, `jsonwebtoken`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/users.ts` — users table (id, email, name, avatarUrl, provider, providerId)
- `src/schema/meals.ts` — meals table with optional userId for multi-user support
- `src/schema/goals.ts` — goals table with optional userId for multi-user support
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas
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

### `artifacts/landing` (`@workspace/landing`)

React + Vite landing page for CaloriZen, targeting deployment at calorizen.ai. Cal AI-inspired premium design with:
- Sticky header with logo, nav links, App Store/Google Play buttons
- Hero section with bold headline, social proof, dual phone mockup, download CTAs
- 6-card feature grid (Snap & Track, Smart Macro Tracking, Personalized Goals, Barcode Scanner, Daily Food Log, Private & Secure)
- 3-step "How It Works" section
- Dark download CTA section with store badges
- Footer with Product, Legal, Connect links
- SEO: meta description, Open Graph tags, accessible viewport
- Responsive: mockup scales on mobile, secondary mockup hidden below md breakpoint
- Port: 18150, preview path: `/landing/`

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
