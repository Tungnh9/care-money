# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Next.js version warning

This project runs Next.js 16.3.0 with a React 19.2 canary — newer than most training data, with real breaking changes from Next.js 15 and earlier. Before writing App Router code, check `node_modules/next/dist/docs/01-app/` for the current API rather than relying on memory. Highlights that are easy to get wrong:

- **Turbopack is the default** bundler for `next dev` and `next build` now; no `--turbopack` flag needed, and a custom Webpack config will fail the build unless you pass `--webpack`.
- **Async request APIs have no sync fallback anymore**: `cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` must always be `await`ed.
- **`middleware.ts` is renamed to `proxy.ts`** (export `proxy`, not `middleware`); the edge runtime is not supported in `proxy`.
- **Route-aware type helpers are auto-generated globals**: `PageProps<'/route'>`, `LayoutProps<'/route'>`, `RouteContext<'/route'>` — use these instead of hand-writing `params`/`searchParams` prop types. `app/layout.tsx` already does this (`LayoutProps<"/">`).
- **`next lint` is removed.** `npm run lint` runs the ESLint CLI directly against the flat config in `eslint.config.mjs`.
- **Caching model changed**: `revalidateTag` now requires a `cacheLife` profile as its second argument; `cacheLife`/`cacheTag` are stable (no more `unstable_` prefix). Cache Components (`cacheComponents: true` in `next.config.ts`) is the new opt-in model replacing experimental PPR — not enabled in this project yet.

## Commands

- `npm run dev` — start the dev server (Turbopack) at http://localhost:3000
- `npm run build` — production build (Turbopack)
- `npm run start` — run the production build
- `npm run lint` — lint via ESLint flat config

No test runner is configured in this repository.

## Architecture

This is a freshly bootstrapped `create-next-app` project (App Router) — currently just the default scaffold, not yet built out.

- `app/layout.tsx` — root layout; loads Geist Sans/Mono via `next/font/google`, sets `<html>`/`<body>`.
- `app/page.tsx` — the `/` route (starter page).
- `app/globals.css` — Tailwind v4 entry point (`@import "tailwindcss"`); light/dark theme tokens are defined as CSS custom properties here and wired to Tailwind via `@theme inline` — there is no `tailwind.config.*` file.
- Tailwind v4 is wired in purely through the PostCSS plugin (`@tailwindcss/postcss` in `postcss.config.mjs`).
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
