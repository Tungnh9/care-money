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
