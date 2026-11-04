# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page personal portfolio built with **Next.js (App Router) + React 19 + Tailwind CSS v4**, with GSAP for animation and Lenis for smooth scrolling. There are no tests and no lint script.

`AGENTS.md` is partly stale: it describes a Vite/Figma Make scaffold (`src/App.tsx`, `vite.config.ts`, `.mise.toml`) that no longer exists. The project is Next.js. Its note that Next.js has breaking changes is still worth following: check `node_modules/next/dist/docs/` before using Next APIs from memory.

## Commands

The lockfile is `package-lock.json`, so use **npm**. `pnpm install` fails on this machine with a symlink error caused by the `Z:` drive store.

- `npm run dev`: dev server on port 8443 (`next dev --port 8443`)
- `npm run build`: production build (`next build`); `npm start` serves it
- `npm run format`: `oxfmt app src`

`next.config.ts` mixes `module.exports = { allowedDevOrigins: [...] }` with `export default nextConfig`. The CommonJS export is what sets the ngrok dev origin. If the ngrok URL changes, update it there.

## Architecture

- **`app/`** holds Next.js routing and metadata only. `app/page.tsx` renders `<Portfolio />`. `app/layout.tsx` (about 360 lines) carries the fonts (Space Grotesk, JetBrains Mono, Instrument Serif via `next/font`), the SEO metadata and the JSON-LD schema graph. `robots.ts`, `sitemap.ts`, `manifest.ts` and `icon.svg` are the other SEO files. When you change site identity or copy, check `layout.tsx` too.
- **`src/components/Portfolio.tsx`** is the client-side shell. It creates the single Lenis instance (skipped when `prefers-reduced-motion` is set), publishes it through the module-level `src/lib/lenis-ref.ts`, runs the rAF loop, and handles nav scrolling (`offsetTop - 52` for the fixed navbar). It then composes `Navbar`, `ScrollRuler`, the sections (`Hero`, `About`, `Experience`, `Work`) and `Contact`.
- **Lenis access:** any component that scrolls or measures scroll position imports `lenisRef` and must fall back to native `window` scrolling when `lenisRef.current` is `null` (reduced motion, or before mount).
- **`src/components/ruler/`** is a self-contained scroll-progress "ruler" with headings that travel along a rail (`scroll-ruler.tsx`, `heading-flow.tsx`). `layout/ScrollRuler.tsx` just re-exports it. `ruler-tunables.ts` holds the layout, motion and look parameters, and `ruler-shared.ts` the math helpers. Its section list (`RULER_SECTIONS`) must match the section element ids in the page (`hero`, `about`, `experience`, `work`, `contact`). Adding or renaming a section means updating that list, the navbar and the section's `id`.
- **`src/data/portfolioData.ts`** and **`src/types/portfolio.ts`** hold the portfolio content (experience, projects and so on) as typed data. Edit content here rather than in the section components. `heroIcons.ts` and `photoSrc.ts` hold the hero icon set and the desktop/mobile photo paths, which point into `public/images/`.
- **Styling:** Tailwind v4 via `@tailwindcss/postcss` (`postcss.config.ts`). Theme colours are CSS variables defined in `app/globals.css` (`--bg`, `--fg` and others) and used as `bg-[var(--bg)]`. The path alias `@/*` maps to `src/*`, though existing code mostly uses relative imports.

## CV

`resume.tex` is the LaTeX source for the CV. The compiled PDF is served from `public/` and linked as a direct download. The template is tuned to fit exactly 2 pages, so keep spacing changes minimal and recheck the page count after edits.

## Installed skills

`.claude/skills/` contains `impeccable` and `design-taste-frontend` (see `skills-lock.json`), used for UI design and design audits.
