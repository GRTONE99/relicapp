# Relic Roster App — CLAUDE.md

## Project Overview

A collection management app (Relic Roster) built with React + TypeScript + Vite on the frontend and Supabase (PostgreSQL) on the backend. Deployed to Vercel.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite + SWC, React Router v6
- **UI**: shadcn/ui (Radix UI), Tailwind CSS, Framer Motion, Lucide icons
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth, Storage)
- **Forms/Validation**: React Hook Form + Zod
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library + MSW
- **Deploy**: Vercel

## NPM Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run tests once
npm run test:watch   # Watch mode
npm run preview      # Preview production build
```

## Environment Variables

Required (see `.env.example`):

```
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
```

## Project Structure

```
src/
  components/       # Shared components + shadcn ui/
  pages/            # Route-level page components
  context/          # CollectionContext (global state)
  hooks/            # use-mobile, use-toast
  lib/              # utils, constants, exportUtils, imageUpload
  integrations/     # Supabase client setup
  test/             # Mirrors src/ structure
supabase/
  functions/        # Edge Functions (detect-item, proxy-image, etc.)
  migrations/       # SQL migration files
  email-templates/  # Auth email templates
.claude/
  skills/           # Custom Claude skills for this project
```

## Path Alias

`@` maps to `src/` — use it for all internal imports.

## Supabase Edge Functions

| Function | JWT Required | Purpose |
|---|---|---|
| `auth-email-hook` | No | Email auth webhook |
| `detect-item` | No | AI-powered item detection |
| `process-email-queue` | Yes | Email queue processing |
| `proxy-image` | — | Image proxy |
| `upload-image` | — | Image upload handler |

## Custom Claude Skills

This project ships with skills in `.claude/skills/`:

- **relic-architect** — Architecture and design guidance
- **relic-ingest** — Data ingestion workflow
- **relic-release-qa** — Pre-release QA checklist
- **relic-supabase** — Supabase schema/migrations/functions
- **relic-ui-copy** — UI text and copy management

## Code Conventions

- TypeScript strict mode throughout
- Tailwind CSS for all styling (no CSS modules)
- HSL CSS variables for theming (dark mode supported via `next-themes`)
- Vite manual chunks: `vendor-react`, `vendor-motion`, `vendor-supabase`, `vendor-ui`, `vendor-charts`
- Tests live in `src/test/` mirroring the src structure

## Database

Migrations are in `supabase/migrations/` — always add new migrations as timestamped SQL files rather than editing existing ones.
