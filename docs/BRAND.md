# Brand & Design

## Brand
- **Name:** Proven Earth
- **Strapline:** Independent, verifiable demonstrations of Earth's shape
- **Voice:** Calm, confident, non-confrontational. Descriptive, not conclusive. Never tells the user what to think.
- **Future vision:** Science communication platform covering vaccine scepticism, climate denial, covid conspiracies, anti-intellectualism. Think Live Science with interactive demos and strong editorial identity.

## Design system
- Background: `#f0ece4` (warm off-white)
- Dark map background: `#08090f`
- Font headings: Barlow Condensed 900, uppercase
- Font body: DM Sans 400/500
- Buttons: `.mode-btn` class, active = black bg + off-white text
- Border colour: `#d0ccc4`
- Muted text: `#888` or `#999`
- Header: title + subtitle left-aligned, tabs in flex row (wrap on mobile)
- Mobile breakpoint: 640px — tabs go 2×2 grid, subtitles hidden, padding uses clamp()

## Cities (CITIES array — 21 cities)
Chosen for flat earth debate relevance. Strong southern hemisphere representation.
Northern: London, New York, Tokyo, Dubai, Moscow, Mumbai, Cairo, Los Angeles, Nairobi
Southern: Sydney, Auckland, Invercargill, Buenos Aires, Santiago, Punta Arenas, Cape Town, Johannesburg, Ushuaia
Antarctic: McMurdo, Rothera (UK)

## What NOT to do
- Do not add NASA as a source (distrusted by target audience)
- Do not state conclusions in UI copy — describe, let users decide
- Do not duplicate map drawing logic — always use shared functions
- Do not use confrontational language
- Do not add popups or intrusive UI patterns
- Do not use GitHub Actions for deploy
