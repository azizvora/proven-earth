# Proven Earth — Claude Code Context

## What this is
A React single-page application that debunks flat earth theory through four interactive, map-based demonstrations. The ethos is calm, confident and non-confrontational — the goal is to empower people to change their own minds, not to mock them.

## Brand
- **Name:** Proven Earth
- **Strapline:** Independent, verifiable demonstrations of Earth's shape
- **Voice:** Calm, confident, non-confrontational. Descriptive, not conclusive. Never tells the user what to think.
- **Future vision:** Expand into a broader science communication platform covering vaccine scepticism, climate denial, covid conspiracies and anti-intellectualism. Think Live Science but with interactive demonstrations and a strong editorial identity.

## Tech stack
- React (single file, no router needed)
- D3 for map projections and geography
- TopoJSON via CDN for world atlas data
- Chart.js not used — all rendering is canvas-based
- No backend — fully static
- Fonts: Barlow Condensed 900 (headings), DM Sans 400/500 (body) via Google Fonts
- Deployment target: Cloudflare Pages or Netlify (GitHub-connected, auto-deploy)

## File structure (current)
The entire app lives in one file: `flat-earth-debunker.jsx`
When scaffolding into a proper project, use Vite + React.

Suggested structure:
```
proven-earth/
├── index.html
├── vite.config.js
├── package.json
├── CLAUDE.md
└── src/
    └── App.jsx  ← rename flat-earth-debunker.jsx to this
```

## Architecture — CRITICAL
There are three shared module-level drawing functions used by ALL map sections:
- `sharedDrawGlobe(ctx, W, worldData, rot, z, sun, options)` — orthographic globe
- `sharedDrawAE(ctx, W, worldData, z, p, sun, options)` — north-pole AE flat earth map
- `sharedDrawAESouth(ctx, W, worldData, z, rot, sun, options)` — south-pole AE (circumnavigation tab)

**Any visual change to maps must go through these shared functions — never duplicate drawing logic in individual sections.**

The `options` object supports:
- `showCities` — boolean
- `cityDotsFn(ctx, proj)` — draws city dots and time labels
- `overlayFn(ctx, proj, pathGen)` — draws routes/paths on top of the base map
- `sun` — { lat, lon } subsolar point

## Colour system (pixel-level, per-latitude)
- `oceanColor(light)` — atlas blue
- `landColor(light)` — atlas green
- `iceColor(light)` — white/pale blue
- `iceBlend(lat, lon)` — 0→1 fade for Arctic/Antarctic ice
- `blendColors(c1, c2, t)` — linear interpolation
- `getLightLevel(lat, lon, sunLat, sunLon)` — returns -1 to 1

## Sections
1. **Solar illumination** — real-time day/night terminator, city times, date/time sliders, globe + AE + compare modes
2. **Stars by latitude** — animated starfield, constellation visibility by latitude
3. **Flight paths** — animated great-circle routes vs flat earth direct lines, globe + AE modes
4. **Circumnavigation** — real historical Antarctic circumnavigation routes, globe + AE modes

## Cities (CITIES array)
21 cities chosen specifically for flat earth debate relevance. Strong southern hemisphere representation:
- Northern: London, New York, Tokyo, Dubai, Moscow, Mumbai, Cairo, Los Angeles, Nairobi
- Southern: Sydney, Auckland, Invercargill, Buenos Aires, Santiago, Punta Arenas, Cape Town, Johannesburg, Ushuaia
- Antarctic: McMurdo, Rothera (UK)

## News ticker
Fixed bar at bottom of viewport. Real headlines from: IFLScience, Upworthy, CBC News, British Antarctic Survey, Maritime Executive, ESA. No NASA (distrusted by flat earth audience). Draggable. Newsletter signup on right side (frontend only — integrate with Beehiiv when ready).

## Known pending work
- Newsletter backend — integrate with Beehiiv
- Mobile layout polish
- Content writing pass — insight notes and proof callouts need tightening to match brand voice
- Stars section could be more polished
- Consider adding a fifth section as the site expands

## Hosting plan
- GitHub repo → Cloudflare Pages or Netlify (auto-deploy on push)
- Domain: provenearth.com (GoDaddy)
- No backend needed for current feature set
- Future backend (newsletter storage, articles DB) → Fly.io or similar

## Design system
- Background: `#f0ece4` (warm off-white)
- Dark map background: `#08090f`
- Font headings: Barlow Condensed 900, uppercase
- Font body: DM Sans 400/500
- Buttons: `.mode-btn` class, active = black bg + off-white text
- Border colour: `#d0ccc4`
- Muted text: `#888` or `#999`

## What NOT to do
- Do not add NASA as a source anywhere (distrusted by target audience)
- Do not state conclusions in UI copy — describe what the demonstration shows, let users decide
- Do not duplicate map drawing logic — always use the shared functions
- Do not use confrontational language in any copy
- Do not add popups or intrusive UI patterns
