# Proven Earth — Claude Operating Guide

React + Vite app demonstrating Earth's shape. Four interactive canvas-based sections, one file each.

## Quick facts
- App shell: `src/flat-earth-debunker.jsx` (routes, world-data fetch, ALL CSS). Sections: `SolarSection.jsx`, `StarsSection.jsx`, `FlightSection.jsx`, `CircumnavSection.jsx`. Shared nav/brand: `chrome.jsx`. Shared copy + SECTIONS list: `copy.js`.
- Deploy: push to `main` → GitHub Actions → Cloudflare Pages (same pattern as SubDisplay). Manual fallback: `npm run build && npx wrangler pages deploy dist --project-name proven-earth`, or `gh workflow run deploy.yml`. Never push without Aziz's explicit OK.
- Live: provenearth.com | Repo: github.com/azizvora/proven-earth
- Routing: React Router, BrowserRouter in main.jsx. `/` and `/solar` render SolarSection; `/stars`, `/flights`, `/circum` have their own routes. All four sections are live.
- World atlas: `/public/countries-110m.json`, parsed with `topojson-client`. No CDN at runtime. Fetch failure shows a retry banner.
- `npm run lint` is clean — keep it clean, it is the regression gate.
- Smoke test: `npm run dev` then `node scripts/smoke.mjs` (drives headless Chrome through every route, fails on console errors, screenshots to /tmp/pe-shots).

## Layout architecture
**No top header.** Full-height split layout, every section identical:

```
app-shell (flex col, 100vh)
  body-area (flex: 1, flex row)
    section-left (width: 33%, flex col, overflow-y: auto)
      SidebarBrand (title + subtitle)
      [section controls]
    section-right (flex: 1, flex col)
      SectionNav (☀ Solar | ✦ Star Trails | ✈ Flight Paths | ◎ Circumnavigation)
      map-canvas-area (flex: 1, position: relative)
        [map notes overlay]
        globe-fill OR sky-compare-wrap (Stars) OR globe-compare-wrap (Solar compare)
        map-controls-overlay (absolute bottom-center)
  [map-error banner when world data fails]
  NewsTicker (bottom)
```

## Critical rules
- **Never duplicate map drawing logic** — use `sharedDrawGlobe`, `sharedDrawAE`, `sharedDrawAESouth`, `sharedDrawMercator` from `drawing.js`. This is what keeps the map look identical across pages.
- **Site-wide copy lives in `copy.js`** (MAP_NOTE_GLOBE, MAP_NOTE_AE, SECTIONS) — edit there, not per-section.
- **Never add NASA** as a source (distrusted by target audience)
- **Never state conclusions** in UI copy — describe, let users decide. The Stars panels are labelled "On a globe" / "On a flat earth" with descriptive captions only; no "wrong"/"contradicts" language.
- **No em or en dashes in user-facing copy** — use "to" for ranges, commas or colons otherwise
- **Deploy is push-to-deploy via GitHub Actions** (Aziz's decision 2026-06-10, reversing the earlier wrangler-only rule). Workflow: `.github/workflows/deploy.yml`, needs repo secret `CLOUDFLARE_API_TOKEN` (Cloudflare Pages: Edit scope). Account ID is hardcoded in the workflow.
- **Newsletter form stays removed** until a real Beehiiv backend exists — the old form silently discarded emails
- `d3` is imported by `drawing.js` and `StarsSection.jsx` (Mercator click-invert). The app shell no longer imports it.

## Stars section (rebuilt June 2026)
- Two square panels, `drawSkyPanel` renders both: simulated long-exposure photos with horizon + ground, camera facing the celestial pole the model puts in the sky. Pole-centred azimuthal projection keeps trails circular at every latitude.
- Flat model = the common description (single celestial pole above the North Pole, whole sky turns around it); southern latitudes mirror to north via `abs(lat)`. This assumption is stated in the ⓘ Explain note.
- Location picker is the shared Mercator map; click-invert must mirror the projection inside `sharedDrawMercator` (pad 18). Only latitude affects the sky.
- The old `starAltAz` had an azimuth bug (`sin H` for `cos H`) — fixed in the rebuild; don't copy formulas from git history.

## The map stage (design rule, June 2026)
Every projection (globe, AE, Mercator, star panels) renders on the SAME dark stage: background `#08090f`, rounded 12px, `1px solid #d0ccc4` border, overflow hidden. Never give the AE map its old beige-paper treatment; switching modes must feel like changing the lens, not the site.

## Mobile layout (max-width 700px)
Map first: `.section-right` gets `order: 1`, `.section-left` (controls) `order: 2`. `.sidebar-brand` is hidden; the nav shows `.nav-mini-brand` instead and is `position: sticky` at the top of the scrolling `.section-split`. `.map-canvas-area` becomes column flow with `height: auto`; `.map-controls-overlay` becomes a static full-width row under the map (not absolute). Stars/Solar compare panels stack vertically.

## AE map orientation
All AE maps use `rotate([90,-90])` — 90°W meridian at top (Americas-facing). Crossfade canvases need `zIndex: 0` on prevCanvas and `zIndex: 1` on canvasRef.

## Default states
SolarSection `globeRotation` defaults to `[0, 0]`; FlightSection `[0, 0]`; CircumnavSection `[0, 25]`. Flight `activeRoute` starts `null` (blank globe until a route is picked). Stars defaults to London (51.5, -0.1).

## CSS (all in the JSX `<style>` block in flat-earth-debunker.jsx)
Key classes: `.section-split`, `.section-left` (33%), `.section-right`, `.section-nav-overlay`, `.map-canvas-area`, `.globe-fill` (height-driven square), `.sky-compare-wrap` (width-driven squares, Stars), `.globe-compare-wrap` (height-driven, Solar compare), `.map-controls-overlay`, `.map-error`, `.sidebar-brand`, `.site-title` (`clamp(52px,6.5vw,108px)`, Barlow Condensed 900).

## Reference docs (open only when relevant)
- `docs/ARCHITECTURE.md` — tech stack, file map, shared drawing fns, colour system
- `docs/DEPLOYMENT.md` — deploy command, Cloudflare config, favicon, SEO status
- `docs/BRAND.md` — brand voice, design system, cities list, what NOT to do
- `docs/PENDING-WORK.md` — active and future work items
