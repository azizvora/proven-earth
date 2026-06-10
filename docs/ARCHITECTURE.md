# Architecture

## Tech stack
- React + Vite, one file per section (split June 2026)
- D3 for map projections and geography
- TopoJSON world atlas served from `/public/countries-110m.json` (no runtime CDN dependency); parsed with the `topojson-client` npm package
- All rendering is canvas-based (no Chart.js)
- No backend — fully static
- Fonts: Barlow Condensed 900 (headings), DM Sans 400/500 (body) via Google Fonts

## File structure
```
proven-earth/
├── index.html
├── vite.config.js
├── wrangler.toml                ← pages_build_output_dir = "dist"
├── package.json
├── public/_redirects            ← SPA fallback: /* /index.html 200
├── public/favicon.svg           ← PE monogram, dark-mode aware
├── public/countries-110m.json   ← world atlas TopoJSON, served locally
├── CLAUDE.md
├── docs/
├── scripts/
│   ├── generate-og-image.mjs
│   └── smoke.mjs                ← headless-Chrome route check (needs dev server running)
└── src/
    ├── flat-earth-debunker.jsx  ← App shell: routes, world-data fetch + retry banner, ALL CSS (~210 lines)
    ├── copy.js                  ← SECTIONS list + shared map-note copy (MAP_NOTE_GLOBE, MAP_NOTE_AE)
    ├── chrome.jsx               ← SidebarBrand + SectionNav components
    ├── SolarSection.jsx         ← day/night terminator section
    ├── StarsSection.jsx         ← side-by-side star trail panels + own sky renderer
    ├── FlightSection.jsx        ← animated flight routes
    ├── CircumnavSection.jsx     ← Antarctic circumnavigation routes
    ├── data.js                  ← pure data constants (CITIES, AIRPORTS, TRAIL_STARS, etc.)
    ├── helpers.js               ← pure math utilities (sun, colours, geo)
    ├── drawing.js               ← shared canvas drawing functions + illum caches
    ├── NewsTicker.jsx           ← news ticker (signup form removed pending Beehiiv)
    ├── index.css
    └── main.jsx                 ← BrowserRouter + App mount
```

## Shared drawing functions — CRITICAL
Module-level functions in `drawing.js` used by ALL map sections. Never duplicate — always use these:
- `sharedDrawGlobe(ctx, W, worldData, rot, z, sun, options)` — orthographic globe
- `sharedDrawAE(ctx, W, worldData, z, p, sun, options)` — north-pole AE flat earth map. Uses `rotate([90,-90])` (canonical Gleason orientation).
- `sharedDrawAESouth(ctx, W, worldData, z, rot, sun, options)` — south-pole AE (circumnavigation tab)
- `sharedDrawMercator(ctx, W, worldData, options)` — rectangular Mercator (Flights tab; also the Stars location picker)

The `options` object supports: `showCities`, `cityDotsFn(ctx, proj)`, `overlayFn(ctx, proj, pathGen)`, `flatLight`, `graticuleVisible`

## Illumination performance
`buildIllumCanvas` is expensive (pixel-by-pixel math). Two optimisations:
- **Fixed size**: always rendered at `ILLUM_R = 180` (360×360px), upscaled via `drawImage`
- **Rotation cache**: `_illumCacheGlobe`, `_illumCacheAE`, `_illumCacheAES` — module-level objects keyed by rotation+sun+flatLight. Pinch zoom skips the rebuild.

## Sections (one file each)
1. **Solar illumination** — real-time day/night terminator, city times, date/time sliders, globe + AE + compare modes
2. **Star trails** — two square panels side by side ("On a globe" / "On a flat earth"), each a simulated long-exposure photo with horizon and ground. One renderer `drawSkyPanel` handles every latitude: pole-centred azimuthal projection, camera facing the celestial pole the model puts in the sky. Flat model mirrors southern latitudes to north (the common single-north-pole description). Mercator click-map picks the location; only latitude affects the sky.
3. **Flight paths** — animated routes, globe + Mercator + AE, 700ms crossfade, scroll/pinch zoom, flat light
4. **Circumnavigation** — real Antarctic routes (ROUTES at module scope), globe + AE, flat light

## Colour system (pixel-level, per-latitude)
- `oceanColor(light)`, `landColor(light)`, `iceColor(light)` — atlas palette
- `iceBlend(lat)` — 0→1 fade for Arctic/Antarctic ice (latitude only)
- `blendColors(c1, c2, t)` — linear interpolation
- `getLightLevel(lat, lon, sunLat, sunLon)` — returns -1 to 1

## App shell layout (iOS Safari fix)
- Outer wrapper: `height: 100vh; display: flex; flex-direction: column; overflow: hidden`
- `html, body` have `height: 100%; overflow: hidden`
- Scrollable content: `flex: 1; overflow-y: auto`
- News ticker: normal flex child at bottom (not `position: fixed`)
- World-data fetch failure shows a `.map-error` banner with a Retry button above the ticker

## News ticker
Fixed bar at bottom. Headlines from IFLScience, Upworthy, CBC News, British Antarctic Survey, Maritime Executive, ESA. No NASA. Draggable. The newsletter signup form was REMOVED (it was frontend-only and silently discarded emails) — re-add only with a real Beehiiv integration.

## Lint
`npm run lint` is clean as of June 2026 — keep it that way; it is the regression gate.
Intentional `eslint-disable` blocks exist for the one-shot camera-snap effects in Flight and Circumnav sections.
