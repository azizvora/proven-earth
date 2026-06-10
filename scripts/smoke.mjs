// Smoke test: loads every route in headless Chrome, fails on console/page
// errors, drops screenshots in /tmp/pe-shots. Dev server must be running:
//   npm run dev    then    node scripts/smoke.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "fs";

const BASE = "http://localhost:5173";
const ROUTES = ["/", "/stars", "/flights", "/circum"];
mkdirSync("/tmp/pe-shots", { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
const errors = [];
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));

let failed = false;
for (const r of ROUTES) {
  errors.length = 0;
  await page.goto(BASE + r, { waitUntil: "networkidle" });
  await page.waitForSelector("text=PROVEN EARTH", { timeout: 15000 });
  await page.waitForTimeout(1500);
  const name = r === "/" ? "home" : r.slice(1);
  await page.screenshot({ path: `/tmp/pe-shots/${name}.png` });
  if (errors.length) { failed = true; console.log(`${r} FAIL: ${errors.join(" | ")}`); }
  else console.log(`${r} ok`);
}
await browser.close();
process.exit(failed ? 1 : 0);
