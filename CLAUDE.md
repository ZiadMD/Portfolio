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
- **`src/components/Portfolio.tsx`** is the client-side shell. It creates the single Lenis instance (skipped when `prefers-reduced-motion` is set), publishes it through the module-level `src/lib/lenis-ref.ts`, runs the rAF loop, and handles nav scrolling (`offsetTop - 52` for the fixed navbar). It then composes `IntroGate`, `Navbar`, `ScrollRuler`, the sections (`Hero`, `About`, `Experience`, `Work`) and `Contact`.
- **ASCII intro (`src/components/intro/`)**: `AsciiIntro.jsx` + `introEngine.js` are a dependency-free canvas 2D intro (nodes → links → talking wave → glitch/escape → portrait spreads from the eye under red rain, 14.7 s, timeline constants at the top of `introEngine.js`; the soundtrack `public/intro.mp3` is timed to them, so re-timing means regenerating the audio). `IntroGate.tsx` shows it full-screen over the site on every visit and hands over on `onFinish`: the last frame dissolves cell by cell into the hero while its text forms out of glyphs (`handover.ts`, page state `handover`). Section headings (`ui/SplitHeading.tsx`) form out of glyphs the same way the first time they scroll into view (`formElements`). While it plays, `html[data-intro-state="playing"]` hides the chrome and locks scrolling; the pre-paint script in `layout.tsx` sets it before first paint (4 s failsafe unless `intro-live`), and the gate layer is only visible in that state. In dev, `?t=9.5` freezes the ASCII intro at that second.
- **Hero (`sections/Hero.tsx`)** is the intro's end frame kept alive: the same engine renders the ASCII portrait at 15 fps from `t = TOTAL` on (rain, rare glitches, a cursor lens via `setPointer`; past `TOTAL` the engine caches the portrait and only redraws rain). `intro/framing.ts` holds the photos, their `eye` values and the framing both use (phones: `MOBILE_END_ZOOM`, `MOBILE_EYE_Y`), so the intro's last frame is the hero. It pauses while the intro covers it and once both the hero and About are off screen. Its Replay button dispatches `zs:intro-replay`. Engine changes must leave `t <= TOTAL` untouched, since the soundtrack is timed to it.
- **Lenis access:** any component that scrolls or measures scroll position imports `lenisRef` and must fall back to native `window` scrolling when `lenisRef.current` is `null` (reduced motion, or before mount).
- **`src/components/ruler/`** is a self-contained scroll-progress "ruler" with headings that travel along a rail (`scroll-ruler.tsx`, `heading-flow.tsx`). `layout/ScrollRuler.tsx` just re-exports it. `ruler-tunables.ts` holds the layout, motion and look parameters, and `ruler-shared.ts` the math helpers. Its section list (`RULER_SECTIONS`) must match the section element ids in the page (`hero`, `about`, `experience`, `work`, `contact`). Adding or renaming a section means updating that list, the navbar and the section's `id`.
- **Project images** load in ASCII through `ui/AsciiImg.tsx` (the `ascii-reveal` package): hidden until scrolled into view, then decoded in, with a glyph shimmer while still downloading. Both project lists (Featured and Working on now) are `.row` buttons sharing one hover preview (`#peek`, image strip `PEEK_PROJECTS` in `Work.tsx`); phones show each row's image instead.
- **`src/data/portfolioData.ts`** and **`src/types/portfolio.ts`** hold the portfolio content (experience, projects and so on) as typed data. Edit content here rather than in the section components. `photoSrc.ts` holds the desktop/mobile portrait paths, which point into `public/images/`.
- **Styling:** Tailwind v4 via `@tailwindcss/postcss` (`postcss.config.ts`). Theme colours are CSS variables defined in `app/globals.css` (`--bg`, `--fg` and others) and used as `bg-[var(--bg)]`. The path alias `@/*` maps to `src/*`, though existing code mostly uses relative imports.

## CV

`resume.tex` is the LaTeX source for the CV. The compiled PDF is served from `public/` and linked as a direct download. The template is tuned to fit exactly 2 pages, so keep spacing changes minimal and recheck the page count after edits.

## Installed skills

`.claude/skills/` contains `impeccable` and `design-taste-frontend` (see `skills-lock.json`), used for UI design and design audits.
