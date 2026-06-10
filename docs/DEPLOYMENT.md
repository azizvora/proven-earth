# Deployment

## Deploy = push to main (Aziz's decision 2026-06-10)
Push to `main` and `.github/workflows/deploy.yml` builds and deploys to Cloudflare Pages, same pattern as SubDisplay. Requires repo secret `CLOUDFLARE_API_TOKEN` (Cloudflare Pages: Edit scope); account ID is hardcoded in the workflow. Aziz sets/rotates the secret himself in a separate terminal — never paste tokens into a Claude session.

Manual fallback only if Actions is broken:
```
npm run build && npx wrangler pages deploy dist --project-name proven-earth
```
Re-run a deploy without a new commit: `gh workflow run deploy.yml`.

## URLs
- Live: provenearth.com and proven-earth.pages.dev
- GitHub: github.com/azizvora/proven-earth

## Cloudflare
- Account ID: fa336a5b0b36c45eae8db0c40fb17837
- Nameservers: cora.ns.cloudflare.com / pranab.ns.cloudflare.com
- Domain originally on GoDaddy, DNS fully on Cloudflare

## Favicon
- `public/favicon.svg` — PE monogram, dark-mode aware (`#181818` light / `#ffffff` dark via CSS media query)
- Source: `/Users/azizvora/Downloads/proven-earth-pe-favicon.svg`
- Verify: visit provenearth.com/favicon.svg directly

## SEO status
Done: title, meta description, canonical, OG/Twitter tags, OG image, structured data, robots.txt, sitemap.xml, Search Console verified, sitemap submitted.

Deferred: self-host Google Fonts, disable pages.dev duplicate, Cloudflare Web Analytics snippet (needs one dashboard step).
Done since: per-section URLs (React Router), sitemap lists all four routes, world atlas served locally.
