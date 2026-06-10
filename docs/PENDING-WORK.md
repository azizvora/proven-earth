# Pending Work

## Active
- Newsletter backend — signup form was removed from the ticker (it was frontend-only and discarded emails). Re-add the form together with a real Beehiiv integration.
- Mobile layout polish (tabs wrap on mobile, subtitles hidden — needs more polish; check the new Stars side-by-side panels on small screens)
- Content writing pass — insight notes and proof callouts need tightening to brand voice

## Design
- **Two-column layout (desktop)** — map left (~60%), controls/notes right (~40%). Proper fix for the scrolling problem. Needs refactoring all four sections. Quick fix (max-width cap) was tried and reverted — looked cramped. Do not attempt without a plan.

## Future
- Fifth section as site expands
- Self-host Google Fonts (SEO + faster first paint; currently `@import` inside the JSX style block, the slowest option)
- Disable pages.dev duplicate (SEO)
- Cloudflare Web Analytics — free, no cookie banner; needs one dashboard step to get the snippet token

## Done (June 2026)
- ~~Stars section~~ — rebuilt from scratch: side-by-side "On a globe" / "On a flat earth" long-exposure panels, neutral descriptive copy, horizon + ground so panels read as photographs. Fixed an azimuth bug in the old `starAltAz` (`sin H` where `cos H` belonged).
- ~~Split sections into files~~ — one file per section, shared chrome.jsx + copy.js
- ~~World atlas served locally~~ — no jsdelivr runtime dependency; retry banner on fetch failure
- ~~Sitemap~~ — now lists /, /stars, /flights, /circum
- ~~GitHub Actions workflow deleted~~ — deploy is wrangler CLI only
- ~~Per-section URLs with React Router~~
