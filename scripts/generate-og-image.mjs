import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@900&amp;family=DM+Sans:wght@400;500&amp;display=swap');
    </style>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#f0ece4"/>

  <!-- Subtle grid lines -->
  <line x1="0" y1="210" x2="1200" y2="210" stroke="#d0ccc4" stroke-width="1"/>
  <line x1="0" y1="420" x2="1200" y2="420" stroke="#d0ccc4" stroke-width="1"/>
  <line x1="400" y1="0" x2="400" y2="630" stroke="#d0ccc4" stroke-width="1"/>
  <line x1="800" y1="0" x2="800" y2="630" stroke="#d0ccc4" stroke-width="1"/>

  <!-- Globe illustration — simple orthographic outline -->
  <circle cx="990" cy="315" r="210" fill="none" stroke="#d0ccc4" stroke-width="1.5"/>
  <!-- Latitude lines -->
  <ellipse cx="990" cy="315" rx="210" ry="42" fill="none" stroke="#d0ccc4" stroke-width="1"/>
  <ellipse cx="990" cy="245" rx="180" ry="36" fill="none" stroke="#d0ccc4" stroke-width="1"/>
  <ellipse cx="990" cy="385" rx="180" ry="36" fill="none" stroke="#d0ccc4" stroke-width="1"/>
  <ellipse cx="990" cy="175" rx="120" ry="24" fill="none" stroke="#d0ccc4" stroke-width="1"/>
  <ellipse cx="990" cy="455" rx="120" ry="24" fill="none" stroke="#d0ccc4" stroke-width="1"/>
  <!-- Longitude lines -->
  <ellipse cx="990" cy="315" rx="105" ry="210" fill="none" stroke="#d0ccc4" stroke-width="1"/>
  <line x1="990" y1="105" x2="990" y2="525" stroke="#d0ccc4" stroke-width="1"/>

  <!-- PE monogram — scaled up, used as brand mark -->
  <!-- P -->
  <text x="88" y="228" font-family="Georgia, serif" font-weight="900" font-size="160" fill="#181818" letter-spacing="-4">P</text>
  <!-- E -->
  <text x="174" y="228" font-family="Georgia, serif" font-weight="900" font-size="160" fill="#181818" letter-spacing="-4">E</text>

  <!-- Divider -->
  <rect x="88" y="252" width="280" height="3" fill="#181818"/>

  <!-- Wordmark -->
  <text x="88" y="308" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="42" fill="#181818" letter-spacing="6" text-transform="uppercase">PROVEN EARTH</text>

  <!-- Subtitle -->
  <text x="88" y="370" font-family="Arial, sans-serif" font-weight="400" font-size="28" fill="#444444">Independent, verifiable demonstrations</text>
  <text x="88" y="406" font-family="Arial, sans-serif" font-weight="400" font-size="28" fill="#444444">of Earth's shape.</text>

  <!-- Bottom tag line -->
  <text x="88" y="520" font-family="Arial, sans-serif" font-weight="400" font-size="20" fill="#888888">Solar illumination  ·  Star visibility  ·  Flight paths  ·  Circumnavigation</text>

  <!-- URL -->
  <text x="88" y="578" font-family="Arial, sans-serif" font-weight="500" font-size="22" fill="#888888">provenearth.com</text>
</svg>`;

const svgPath = join(__dirname, '../public/og-image.svg');
const pngPath = join(__dirname, '../public/og-image.png');

writeFileSync(svgPath, svg);

await sharp(Buffer.from(svg))
  .png()
  .toFile(pngPath);

console.log('OG image written to public/og-image.png');
