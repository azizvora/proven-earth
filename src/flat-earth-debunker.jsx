import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

// ─── DATA ────────────────────────────────────────────────────────────────────

const TIMEZONES = [
  { label: "UTC−12 — Baker Island", value: -12 },
  { label: "UTC−11 — Samoa", value: -11 },
  { label: "UTC−10 — Hawaii", value: -10 },
  { label: "UTC−9 — Alaska", value: -9 },
  { label: "UTC−8 — Pacific Time", value: -8 },
  { label: "UTC−7 — Mountain Time", value: -7 },
  { label: "UTC−6 — Central Time", value: -6 },
  { label: "UTC−5 — Eastern Time", value: -5 },
  { label: "UTC−4 — Atlantic Time", value: -4 },
  { label: "UTC−3 — Buenos Aires", value: -3 },
  { label: "UTC−2 — South Georgia", value: -2 },
  { label: "UTC−1 — Azores", value: -1 },
  { label: "UTC±0 — London / Reykjavik", value: 0 },
  { label: "UTC+1 — Paris / Berlin", value: 1 },
  { label: "UTC+2 — Cairo / Athens", value: 2 },
  { label: "UTC+3 — Moscow / Nairobi", value: 3 },
  { label: "UTC+4 — Dubai / Baku", value: 4 },
  { label: "UTC+5 — Karachi", value: 5 },
  { label: "UTC+5:30 — India (IST)", value: 5.5 },
  { label: "UTC+6 — Dhaka", value: 6 },
  { label: "UTC+7 — Bangkok / Jakarta", value: 7 },
  { label: "UTC+8 — Beijing / Singapore", value: 8 },
  { label: "UTC+9 — Tokyo / Seoul", value: 9 },
  { label: "UTC+10 — Sydney", value: 10 },
  { label: "UTC+11 — Noumea", value: 11 },
  { label: "UTC+12 — Auckland / Fiji", value: 12 },
];

const CITIES = [
  // Northern hemisphere
  { name: "London", lat: 51.5, lon: -0.1, tz: 0 },
  { name: "New York", lat: 40.7, lon: -74.0, tz: -5 },
  { name: "Tokyo", lat: 35.7, lon: 139.7, tz: 9 },
  { name: "Dubai", lat: 25.2, lon: 55.3, tz: 4 },
  { name: "Moscow", lat: 55.8, lon: 37.6, tz: 3 },
  { name: "Mumbai", lat: 19.1, lon: 72.9, tz: 5.5 },
  { name: "Cairo", lat: 30.0, lon: 31.2, tz: 2 },
  { name: "Los Angeles", lat: 34.1, lon: -118.2, tz: -8 },
  { name: "Nairobi", lat: -1.3, lon: 36.8, tz: 3 },
  // Southern hemisphere — key for flat earth discussions
  { name: "Sydney", lat: -33.9, lon: 151.2, tz: 10 },
  { name: "Auckland", lat: -36.9, lon: 174.8, tz: 12 },
  { name: "Invercargill", lat: -46.4, lon: 168.4, tz: 12 },
  { name: "Buenos Aires", lat: -34.6, lon: -58.4, tz: -3 },
  { name: "Santiago", lat: -33.4, lon: -70.7, tz: -4 },
  { name: "Punta Arenas", lat: -53.2, lon: -70.9, tz: -3 },
  { name: "Cape Town", lat: -33.9, lon: 18.4, tz: 2 },
  { name: "Johannesburg", lat: -26.2, lon: 28.0, tz: 2 },
  { name: "Ushuaia", lat: -54.8, lon: -68.3, tz: -3 },
  // Antarctic research stations
  { name: "McMurdo", lat: -77.8, lon: 166.7, tz: 12 },
  { name: "Rothera (UK)", lat: -67.6, lon: -68.1, tz: -3 },
];

const CONSTELLATIONS = [
  {
    name: "Orion",
    hemisphere: "both",
    visible_from: "both hemispheres (but flipped)",
    latRange: [-85, 85],
    stars: [[0.5, 0.3], [0.52, 0.42], [0.54, 0.55], [0.44, 0.62], [0.56, 0.65], [0.47, 0.38], [0.53, 0.37]],
    color: "#a8d0ff",
    description: "Visible from both hemispheres but appears upside-down in the Southern Hemisphere. The belt points toward Sirius from anywhere on Earth.",
  },
  {
    name: "Southern Cross",
    hemisphere: "south",
    visible_from: "South of ~25°N only",
    latRange: [-90, 25],
    stars: [[0.5, 0.3], [0.5, 0.7], [0.3, 0.5], [0.7, 0.5], [0.62, 0.38]],
    color: "#60f0a0",
    description: "Never visible from Europe, Canada, or most of the US. It rises above the horizon only when you're south of ~25°N latitude — exactly as spherical geometry predicts.",
  },
  {
    name: "Ursa Major (Big Dipper)",
    hemisphere: "north",
    visible_from: "North of ~25°S only",
    latRange: [-25, 90],
    stars: [[0.2, 0.5], [0.3, 0.4], [0.45, 0.38], [0.55, 0.42], [0.6, 0.55], [0.52, 0.65], [0.38, 0.7]],
    color: "#ffd080",
    description: "Circumpolar (never sets) at latitudes above 41°N. From Sydney or Cape Town it barely peeks above the northern horizon. From Antarctica, it's completely invisible.",
  },
  {
    name: "Polaris (North Star)",
    hemisphere: "north",
    visible_from: "Northern Hemisphere only",
    latRange: [0, 90],
    stars: [[0.5, 0.5]],
    color: "#ffffff",
    description: "Polaris sits almost exactly above Earth's North Pole. Its altitude above the horizon equals your latitude — 51° from London, 35° from Tokyo, 0° from the equator. Invisible from the Southern Hemisphere.",
  },
  {
    name: "Centaurus",
    hemisphere: "south",
    visible_from: "South of ~30°N",
    latRange: [-90, 30],
    stars: [[0.35, 0.45], [0.45, 0.55], [0.55, 0.48], [0.6, 0.35], [0.65, 0.55], [0.4, 0.62]],
    color: "#ff9f80",
    description: "Contains Alpha Centauri, the nearest star system to the Sun. Never rises above the horizon from northern Europe or most of Canada. Only visible as you travel south.",
  },
];

const FLIGHT_ROUTES = [
  {
    id: "syd-jnb",
    name: "Sydney → Johannesburg",
    from: { name: "Sydney", lat: -33.9, lon: 151.2 },
    to: { name: "Johannesburg", lat: -26.2, lon: 28.0 },
    color: "#ff6b6b",
    description: "On a flat (AE) map, this route looks like it should fly north through Asia. In reality, planes fly across the Indian Ocean — a straight line on a sphere.",
    flatEarthProblem: "Would need to detour through Africa or Asia, adding ~8,000km",
  },
  {
    id: "lax-mel",
    name: "Los Angeles → Melbourne",
    from: { name: "Los Angeles", lat: 34.1, lon: -118.2 },
    to: { name: "Melbourne", lat: -37.8, lon: 144.9 },
    color: "#ffa500",
    description: "Flies across the Pacific in a great circle that dips toward Antarctica. The path looks curved on a flat map but is the shortest possible route on a sphere.",
    flatEarthProblem: "Flat earth routes through Asia would take 30+ hours — actual flight is ~16h",
  },
  {
    id: "jfk-nrt",
    name: "New York → Tokyo",
    from: { name: "New York", lat: 40.7, lon: -74.0 },
    to: { name: "Tokyo", lat: 35.7, lon: 139.7 },
    color: "#60f0a0",
    description: "Flies northeast over Canada and Alaska, not west across the US — because the shortest path on a sphere arcs over the Arctic.",
    flatEarthProblem: "On AE map, flying 'straight' west would look shorter but isn't",
  },
  {
    id: "lon-sin",
    name: "London → Singapore",
    from: { name: "London", lat: 51.5, lon: -0.1 },
    to: { name: "Singapore", lat: 1.3, lon: 103.8 },
    color: "#a78bfa",
    description: "Arcs northeast over Central Asia — not straight east. Great circle routes always bend toward the poles on equirectangular maps.",
    flatEarthProblem: "Appears to go 'the long way' on flat maps, but is geometrically shortest",
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function getSunPosition(utcHours, dayOfYear) {
  const declination = 23.45 * Math.sin(toRad((360 / 365) * (dayOfYear - 81)));
  const subsolarLon = (12 - utcHours) * 15;
  return { lat: declination, lon: subsolarLon };
}

function getLightLevel(lat, lon, subsolarLat, subsolarLon) {
  const a = Math.sin(toRad(lat)) * Math.sin(toRad(subsolarLat));
  const b = Math.cos(toRad(lat)) * Math.cos(toRad(subsolarLat)) * Math.cos(toRad(lon - subsolarLon));
  return a + b;
}

// Classic atlas ocean: bright blue in daylight, dark navy at night
function oceanColor(light) {
  if (light > 0.12) {
    const t = Math.min(light, 1);
    return [Math.round(30 + t * 30), Math.round(100 + t * 80), Math.round(180 + t * 55)];
  }
  if (light > -0.12) {
    const t = (light + 0.12) / 0.24;
    return [Math.round(8 + t * 55), Math.round(25 + t * 90), Math.round(50 + t * 145)];
  }
  const t = Math.max(0, (light + 1) / 0.88);
  return [Math.round(2 + t * 8), Math.round(5 + t * 20), Math.round(20 + t * 40)];
}

// Classic atlas land: bright green in daylight, dark at night
function landColor(light) {
  if (light > 0.12) {
    const t = Math.min(light, 1);
    return [Math.round(60 + t * 80), Math.round(130 + t * 80), Math.round(50 + t * 30)];
  }
  if (light > -0.12) {
    const t = (light + 0.12) / 0.24;
    return [Math.round(10 + t * 60), Math.round(25 + t * 110), Math.round(10 + t * 50)];
  }
  const t = Math.max(0, (light + 1) / 0.88);
  return [Math.round(2 + t * 8), Math.round(4 + t * 16), Math.round(2 + t * 10)];
}

// Ice/snow: white in daylight, pale blue-grey at night
function iceColor(light) {
  if (light > 0.12) {
    const t = Math.min(light, 1);
    return [Math.round(210 + t * 45), Math.round(220 + t * 35), Math.round(230 + t * 25)];
  }
  if (light > -0.12) {
    const t = (light + 0.12) / 0.24;
    return [Math.round(80 + t * 140), Math.round(90 + t * 140), Math.round(110 + t * 130)];
  }
  const t = Math.max(0, (light + 1) / 0.88);
  return [Math.round(10 + t * 60), Math.round(12 + t * 65), Math.round(20 + t * 75)];
}

// Antarctica: below ~-60°. Greenland: above ~75°N, roughly -75 to -10 lon
// Returns 0 (green) → 1 (white ice) with soft transitions
function iceBlend(lat, lon) {
  // Antarctica: fully white below -65°, fades in from -55° to -65°
  if (lat < -65) return 1;
  if (lat < -55) return (lat - -55) / (-65 - -55);

  // Northern hemisphere: treeline sits around 55–65°N depending on region.
  // Fade from 55°N (tundra begins) to 72°N (full Arctic ice)
  if (lat > 55) return Math.min(1, (lat - 55) / (72 - 55));

  return 0;
}

function blendColors(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

function lightColor(light) { return oceanColor(light); }

function getSunriseSunset(lat, lon, dayOfYear) {
  const decl = 23.45 * Math.sin(toRad((360 / 365) * (dayOfYear - 81)));
  const cosHour = -Math.tan(toRad(lat)) * Math.tan(toRad(decl));
  if (cosHour < -1) return { sunrise: null, sunset: null, polar: "midnight sun" };
  if (cosHour > 1) return { sunrise: null, sunset: null, polar: "polar night" };
  const hourAngle = Math.acos(cosHour) * 180 / Math.PI;
  const noon = 12 - lon / 15;
  return {
    sunrise: ((noon - hourAngle / 15) + 24) % 24,
    sunset: ((noon + hourAngle / 15) + 24) % 24,
    polar: null,
  };
}

function formatHour(h) {
  if (h == null) return "--:--";
  const hh = Math.floor(((h % 24) + 24) % 24);
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function greatCirclePoints(lat1, lon1, lat2, lon2, n = 100) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const d = 2 * Math.asin(Math.sqrt(
      Math.sin(toRad((lat2 - lat1) / 2)) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad((lon2 - lon1) / 2)) ** 2
    ));
    if (d === 0) { pts.push([lon1, lat1]); continue; }
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(toRad(lat1)) * Math.cos(toRad(lon1)) + B * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2));
    const y = A * Math.cos(toRad(lat1)) * Math.sin(toRad(lon1)) + B * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2));
    const z = A * Math.sin(toRad(lat1)) + B * Math.sin(toRad(lat2));
    pts.push([toDeg(Math.atan2(y, x)), toDeg(Math.asin(z))]);
  }
  return pts;
}


// ─── SHARED MAP DRAWING ───────────────────────────────────────────────────────
// Single source of truth for globe and AE rendering used by ALL sections.

const OCEAN_LABELS = [
  { name: "Pacific Ocean",   lon: -150, lat:   0 },
  { name: "Atlantic Ocean",  lon:  -30, lat:  10 },
  { name: "Indian Ocean",    lon:   80, lat: -25 },
  { name: "Arctic Ocean",    lon:    0, lat:  82 },
  { name: "Southern Ocean",  lon:    0, lat: -58 },
];

// Render the illuminated pixel layer at reduced res then upscale smoothly.
// proj3 is a low-res version of the full proj, sized to the disc.
// Returns an offscreen canvas ready to drawImage.
function buildIllumCanvas(proj3, rP, tP, worldData, sun) {
  const PIX_S = Math.max(60, Math.ceil(rP * 2));
  const maskOff = document.createElement("canvas");
  maskOff.width = PIX_S; maskOff.height = PIX_S;
  const mctx = maskOff.getContext("2d");
  if (worldData) {
    mctx.fillStyle = "#000"; mctx.fillRect(0, 0, PIX_S, PIX_S);
    const mp = d3.geoPath(proj3, mctx); mctx.beginPath(); mp(worldData); mctx.fillStyle = "#fff"; mctx.fill();
  }
  const mData = mctx.getImageData(0, 0, PIX_S, PIX_S).data;
  const illum = document.createElement("canvas"); illum.width = PIX_S; illum.height = PIX_S;
  const ictx = illum.getContext("2d");
  const imgData = ictx.createImageData(PIX_S, PIX_S); const data = imgData.data;
  for (let py = 0; py < PIX_S; py++) for (let px = 0; px < PIX_S; px++) {
    const dx = px - tP, dy = py - tP;
    const idx = (py * PIX_S + px) * 4;
    if (dx*dx + dy*dy > rP*rP) { data[idx+3]=0; continue; }
    const geo = proj3.invert([px, py]); if (!geo) { data[idx+3]=0; continue; }
    const [lon, lat] = geo;
    const light = getLightLevel(lat, lon, sun.lat, sun.lon);
    const isLand = mData[(py*PIX_S+px)*4] > 128;
    const [r,g,b] = isLand ? blendColors(landColor(light), iceColor(light), iceBlend(lat,lon)) : oceanColor(light);
    data[idx]=r; data[idx+1]=g; data[idx+2]=b; data[idx+3]=255;
  }
  ictx.putImageData(imgData, 0, 0);
  return illum;
}

// Draw overlays (borders, graticule, ocean labels, optional cities/routes) clipped to disc.
function drawOverlays(ctx, proj, worldData, z, options = {}) {
  const { showCities=false, cityDotsFn=null, sun=null, overlayFn=null } = options;
  if (!worldData) return;
  const pathGen = d3.geoPath(proj, ctx);
  ctx.beginPath(); pathGen(d3.geoGraticule().step([30,30])());
  ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = Math.max(0.2, 0.5*z); ctx.stroke();
  ctx.beginPath(); pathGen(worldData);
  ctx.strokeStyle = "rgba(255,255,255,0.65)"; ctx.lineWidth = Math.max(0.3, 1.2*z); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.03)"; ctx.fill();
  // Ocean labels — only draw if point is on the visible hemisphere (proj.invert check)
  ctx.font = "italic 11px Georgia, serif"; ctx.textAlign = "center";
  OCEAN_LABELS.forEach(({ name, lon, lat }) => {
    const pt = proj([lon, lat]); if (!pt) return;
    // For orthographic: verify the point isn't on the back hemisphere by inverting
    if (proj.invert) {
      const back = proj.invert([pt[0], pt[1]]);
      if (!back) return;
      const dLon = Math.abs(((lon - back[0]) + 540) % 360 - 180);
      const dLat = Math.abs(lat - back[1]);
      if (dLon > 2 || dLat > 2) return;
    }
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillText(name, pt[0], pt[1]);
  });
  if (showCities && cityDotsFn) cityDotsFn(ctx, proj);
  if (overlayFn) overlayFn(ctx, proj, pathGen);
}

// Shared globe draw. sun is optional (pass null for non-solar tabs).
function sharedDrawGlobe(ctx, W, worldData, rot, z, sun, options = {}) {
  const cx = W/2, cy = W/2;
  const radius = (W/2 - 12) * z;
  const proj = d3.geoOrthographic().scale(radius).translate([cx,cy]).rotate(rot).clipAngle(90);
  ctx.fillStyle = "#08090f"; ctx.fillRect(0,0,W,W);
  // Illumination layer
  const discScale = 0.5; // render at half disc size for speed
  const rP = radius * discScale, tP = rP;
  const proj3 = d3.geoOrthographic().scale(rP).translate([tP,tP]).rotate(rot).clipAngle(90);
  const illum = buildIllumCanvas(proj3, rP, tP, worldData, sun || { lat:0, lon:0 });
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(illum, cx-radius, cy-radius, radius*2, radius*2);
  // Borders + labels clipped to disc
  ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,radius,0,Math.PI*2); ctx.clip();
  drawOverlays(ctx, proj, worldData, z, options);
  ctx.restore();
  // Sun glow
  if (sun) {
    const sunXY = proj([sun.lon, sun.lat]);
    if (sunXY) {
      const g = ctx.createRadialGradient(sunXY[0],sunXY[1],0,sunXY[0],sunXY[1],20);
      g.addColorStop(0,"rgba(255,240,100,0.95)"); g.addColorStop(0.3,"rgba(255,190,40,0.4)"); g.addColorStop(1,"rgba(255,140,0,0)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sunXY[0],sunXY[1],20,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#fff8a0"; ctx.beginPath(); ctx.arc(sunXY[0],sunXY[1],4,0,Math.PI*2); ctx.fill();
    }
  }
  // Edge vignette — hairline only
  const eg = ctx.createRadialGradient(cx,cy,radius*0.992,cx,cy,radius*1.002);
  eg.addColorStop(0,"rgba(6,9,18,0)"); eg.addColorStop(1,"rgba(6,9,18,1)");
  ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(cx,cy,radius*1.002,0,Math.PI*2); ctx.fill();
  // Atmosphere glow
  const glow = ctx.createRadialGradient(cx,cy,radius*0.995,cx,cy,radius*1.03);
  glow.addColorStop(0,"rgba(100,160,255,0.2)"); glow.addColorStop(1,"rgba(20,60,200,0)");
  ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(cx,cy,radius*1.03,0,Math.PI*2); ctx.fill();
}

// Shared AE draw (North Pole centred flat earth map).
function sharedDrawAE(ctx, W, worldData, z, p, sun, options = {}) {
  const cx = W/2, cy = W/2;
  const radius = (W/2 - 16) * 0.78 * z;
  const tx = cx + p.x, ty = cy + p.y;
  const proj = d3.geoAzimuthalEquidistant().rotate([0,-90]).scale(radius/Math.PI).translate([tx,ty]);
  // Background with hatching
  ctx.fillStyle = "#f0ece4"; ctx.fillRect(0,0,W,W);
  ctx.strokeStyle = "rgba(180,170,155,0.28)"; ctx.lineWidth = 0.7;
  for (let i = -W; i < W*2; i+=18) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i+W,W); ctx.stroke(); }
  // Illumination layer clipped to disc
  const rP = Math.max(30, Math.ceil(radius*0.5)), tP = rP;
  const proj3 = d3.geoAzimuthalEquidistant().rotate([0,-90]).scale(rP/Math.PI).translate([tP,tP]);
  const illum = buildIllumCanvas(proj3, rP, tP, worldData, sun || { lat:0, lon:0 });
  ctx.save(); ctx.beginPath(); ctx.arc(tx,ty,radius,0,Math.PI*2); ctx.clip();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(illum, tx-radius, ty-radius, radius*2, radius*2);
  // Borders + labels
  drawOverlays(ctx, proj, worldData, z, options);
  // Latitude labels
  [[90,"N. Pole"],[60,"60°N"],[30,"30°N"],[0,"Equator"],[-30,"30°S"],[-60,"60°S"],[-90,"Antarctica"]].forEach(([lat,label]) => {
    const pt = proj([0,lat]); if(!pt) return;
    ctx.fillStyle="rgba(180,210,255,0.4)"; ctx.font="9px monospace"; ctx.textAlign="left";
    ctx.fillText(label, pt[0]+4, pt[1]-2);
  });
  ctx.restore();
  // Ice bleed outside disc
  const bleedR = radius * 1.28;
  const bSize = Math.ceil(bleedR*2+4);
  const bOff = document.createElement("canvas"); bOff.width=bSize; bOff.height=bSize;
  const bctx = bOff.getContext("2d"); const bcx=bSize/2, bcy=bSize/2;
  const bd = bctx.createImageData(bSize,bSize); const bdata=bd.data;
  for (let py=0;py<bSize;py++) for (let px=0;px<bSize;px++) {
    const dx=px-bcx, dy=py-bcy, dist=Math.sqrt(dx*dx+dy*dy);
    if (dist<=radius*0.999||dist>=bleedR) continue;
    const t=(dist-radius)/(bleedR-radius);
    const fade=Math.sin(t*Math.PI)*Math.pow(1-t,0.6)*0.9;
    const angle=Math.atan2(dy,dx);
    const rimLat=-70-20*t;
    const rimLon=(angle*180/Math.PI+180+(-proj.rotate()[0]))%360-180;
    const light=sun?getLightLevel(rimLat,rimLon,sun.lat,sun.lon):0.5;
    const br=light>0?Math.round(220+light*30):Math.round(220*Math.max(0,1+light*2));
    const bg=light>0?Math.round(228+light*20):Math.round(228*Math.max(0,1+light*2));
    const bb=light>0?Math.round(235+light*15):Math.round(235*Math.max(0,1+light*2));
    const idx=(py*bSize+px)*4;
    bdata[idx]=br;bdata[idx+1]=bg;bdata[idx+2]=bb;bdata[idx+3]=Math.round(fade*240);
  }
  bctx.putImageData(bd,0,0);
  ctx.drawImage(bOff, tx-bcx, ty-bcy);
  ctx.save();
  ctx.font="italic 11px Georgia, serif"; ctx.fillStyle="rgba(140,130,115,0.5)";
  ctx.textAlign="center"; ctx.fillText("extent unknown", tx, ty+radius*1.3);
  ctx.restore();
  if (sun) {
    const sunXY=proj([sun.lon,sun.lat]);
    if(sunXY){const[sx,sy]=sunXY;const dx=sx-tx,dy2=sy-ty;if(dx*dx+dy2*dy2<=radius*radius){
      const g=ctx.createRadialGradient(sx,sy,0,sx,sy,22);
      g.addColorStop(0,"rgba(255,240,100,0.95)");g.addColorStop(0.3,"rgba(255,190,40,0.4)");g.addColorStop(1,"rgba(255,140,0,0)");
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,22,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fff8a0";ctx.beginPath();ctx.arc(sx,sy,4,0,Math.PI*2);ctx.fill();
    }}
  }
}

// Shared AE draw centred on SOUTH pole (for circumnavigation tab).
function sharedDrawAESouth(ctx, W, worldData, z, rot, sun, options = {}) {
  const cx = W/2, cy = W/2;
  const radius = (W/2 - 16) * 0.78 * z;
  const proj = d3.geoAzimuthalEquidistant().rotate([rot[0], 90]).scale(radius/Math.PI).translate([cx,cy]);
  ctx.fillStyle = "#f0ece4"; ctx.fillRect(0,0,W,W);
  ctx.strokeStyle = "rgba(180,170,155,0.28)"; ctx.lineWidth=0.7;
  for (let i=-W;i<W*2;i+=18){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+W,W);ctx.stroke();}
  const rP=Math.max(30,Math.ceil(radius*0.5)),tP=rP;
  const proj3=d3.geoAzimuthalEquidistant().rotate([rot[0],90]).scale(rP/Math.PI).translate([tP,tP]);
  const illum=buildIllumCanvas(proj3,rP,tP,worldData,sun||{lat:0,lon:0});
  ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,radius,0,Math.PI*2); ctx.clip();
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality="high";
  ctx.drawImage(illum,cx-radius,cy-radius,radius*2,radius*2);
  drawOverlays(ctx,proj,worldData,z,options);
  ctx.restore();
  // Ice bleed (reuse same logic — south pole is outer rim here too)
  const bleedR=radius*1.28, bSize=Math.ceil(bleedR*2+4);
  const bOff=document.createElement("canvas");bOff.width=bSize;bOff.height=bSize;
  const bctx=bOff.getContext("2d");const bcx=bSize/2,bcy=bSize/2;
  const bd=bctx.createImageData(bSize,bSize);const bdata=bd.data;
  for(let py=0;py<bSize;py++)for(let px=0;px<bSize;px++){
    const dx=px-bcx,dy=py-bcy,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<=radius*0.999||dist>=bleedR)continue;
    const t=(dist-radius)/(bleedR-radius);
    const fade=Math.sin(t*Math.PI)*Math.pow(1-t,0.6)*0.9;
    const idx=(py*bSize+px)*4;
    bdata[idx]=235;bdata[idx+1]=240;bdata[idx+2]=244;bdata[idx+3]=Math.round(fade*240);
  }
  bctx.putImageData(bd,0,0);
  ctx.drawImage(bOff,cx-bcx,cy-bcy);
}

// ─── SECTION 1: SOLAR MAP ────────────────────────────────────────────────────

function SolarSection({ worldData }) {
  const [hours, setHours] = useState(() => new Date().getHours());
  const [minutes, setMinutes] = useState(() => new Date().getMinutes());
  const [tz, setTz] = useState(() => {
    try {
      const offset = -new Date().getTimezoneOffset() / 60;
      return offset;
    } catch { return 0; }
  });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showMode, setShowMode] = useState("globe"); // globe | ae | compare
  const [showCities, setShowCities] = useState(true);
  const [proveItCity, setProveItCity] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [globeRotation, setGlobeRotation] = useState([139.7, -35.7]);
  const rotRef = useRef([139.7, -35.7]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(null);
  const canvasRef = useRef(null);
  const flatCanvasRef = useRef(null);
  const GLOBE_S = 900;

  const dayOfYear = Math.floor((new Date(date) - new Date(new Date(date).getFullYear(), 0, 0)) / 86400000);
  const utcHours = ((hours + minutes / 60 - tz) % 24 + 24) % 24;
  const sunPos = getSunPosition(utcHours, dayOfYear);
  const totalMinutes = hours * 60 + minutes;

  // City dots helper  // City dots helper for solar section
  const cityDotsFn = useCallback((ctx, proj) => {
    const sun = getSunPosition(utcHours, dayOfYear);
    CITIES.forEach(city => {
      const pt = proj([city.lon, city.lat]); if (!pt) return;
      const [px, py] = pt;
      if (proj.invert) { const c=proj.invert([px,py]); if(!c) return; const dLon=Math.abs(((city.lon-c[0])+540)%360-180); if(dLon>1) return; }
      const isDay = getLightLevel(city.lat, city.lon, sun.lat, sun.lon) > 0;
      const cityUtc = ((hours + minutes/60 - city.tz + 48) % 24);
      const ch=Math.floor(cityUtc), cm=Math.round((cityUtc%1)*60);
      const timeStr=`${String(ch).padStart(2,"0")}:${String(cm).padStart(2,"0")}`;
      ctx.beginPath(); ctx.arc(px,py,4,0,Math.PI*2);
      ctx.fillStyle=isDay?"rgba(255,240,100,0.9)":"rgba(100,160,255,0.9)"; ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,0.6)"; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,0.88)"; ctx.font="bold 10px monospace"; ctx.textAlign="left";
      ctx.fillText(`${city.name} ${timeStr}`, px+7, py+4);
    });
  }, [utcHours, dayOfYear, hours, minutes]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const sun = getSunPosition(utcHours, dayOfYear);
    const opts = { showCities, cityDotsFn };
    if (showMode === "globe" || showMode === "compare") sharedDrawGlobe(ctx, GLOBE_S, worldData, globeRotation, zoom, sun, opts);
    else sharedDrawAE(ctx, GLOBE_S, worldData, zoom, pan, sun, opts);
  }, [hours, minutes, tz, dayOfYear, globeRotation, worldData, zoom, pan, showMode, showCities, cityDotsFn, utcHours]);

  useEffect(() => {
    if (showMode !== "compare" || !flatCanvasRef.current) return;
    const ctx = flatCanvasRef.current.getContext("2d");
    const sun = getSunPosition(utcHours, dayOfYear);
    sharedDrawAE(ctx, GLOBE_S, worldData, 1, { x:0, y:0 }, sun, {});
  }, [hours, minutes, tz, dayOfYear, worldData, showMode, utcHours]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.25 : 1 / 1.25;
    setZoom(z => Math.min(6, Math.max(0.3, z * delta)));
  }, []);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    c.addEventListener("wheel", handleWheel, { passive: false });
    // Pinch-to-zoom for mobile
    let lastPinchDist = null;
    const onTouchStart2 = e => { if (e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY; lastPinchDist = Math.sqrt(dx*dx+dy*dy); } };
    const onTouchMove2 = e => { if (e.touches.length === 2 && lastPinchDist) { e.preventDefault(); const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY; const dist = Math.sqrt(dx*dx+dy*dy); const scale = dist / lastPinchDist; setZoom(z => Math.min(6, Math.max(0.3, z * scale))); lastPinchDist = dist; } };
    const onTouchEnd2 = () => { lastPinchDist = null; };
    c.addEventListener("touchstart", onTouchStart2, { passive: false });
    c.addEventListener("touchmove", onTouchMove2, { passive: false });
    c.addEventListener("touchend", onTouchEnd2);
    return () => { c.removeEventListener("wheel", handleWheel); c.removeEventListener("touchstart", onTouchStart2); c.removeEventListener("touchmove", onTouchMove2); c.removeEventListener("touchend", onTouchEnd2); };
  }, [handleWheel]);

  const lastTouchDist = useRef(null);

  const getPos = e => e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };

  const handleMouseDown = useCallback((e) => {
    if (e.touches && e.touches.length === 2) return; // let touchmove handle pinch
    if (showMode === "globe" || showMode === "compare") { setDragging(true); setDragStart(getPos(e)); rotRef.current = [...globeRotation]; }
  }, [showMode, globeRotation]);

  const handleMouseMove = useCallback((e) => {
    // Pinch to zoom
    if (e.touches && e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (lastTouchDist.current !== null) {
        const d = dist / lastTouchDist.current;
        setZoom(z => Math.min(6, Math.max(0.3, z * d)));
      }
      lastTouchDist.current = dist;
      return;
    }
    lastTouchDist.current = null;
    if ((showMode === "globe" || showMode === "compare") && dragging && dragStart) {
      const pos = getPos(e);
      const dx = (pos.x - dragStart.x) * 0.4 / zoom;
      const dy = (pos.y - dragStart.y) * 0.4 / zoom;
      setGlobeRotation([rotRef.current[0] + dx, rotRef.current[1] - dy]);
    }
  }, [showMode, dragging, dragStart, zoom, pan]);

  const handleMouseUp = useCallback((e) => {
    if (e && e.touches && e.touches.length > 0) return;
    lastTouchDist.current = null;
    setDragging(false); setDragStart(null);
  }, []);

  const proveItData = proveItCity ? getSunriseSunset(proveItCity.lat, proveItCity.lon, dayOfYear) : null;

  const canvasW = GLOBE_S;
  const canvasH = GLOBE_S;

  // Friendly timezone list — just major cities
  const TZ_SIMPLE = [
    { label: "Baker Island (UTC−12)", value: -12 },
    { label: "Honolulu (UTC−10)", value: -10 },
    { label: "Anchorage (UTC−9)", value: -9 },
    { label: "Los Angeles (UTC−8)", value: -8 },
    { label: "Denver (UTC−7)", value: -7 },
    { label: "Chicago (UTC−6)", value: -6 },
    { label: "New York (UTC−5)", value: -5 },
    { label: "Buenos Aires (UTC−3)", value: -3 },
    { label: "London (UTC±0)", value: 0 },
    { label: "Paris / Berlin (UTC+1)", value: 1 },
    { label: "Cairo (UTC+2)", value: 2 },
    { label: "Moscow (UTC+3)", value: 3 },
    { label: "Dubai (UTC+4)", value: 4 },
    { label: "Mumbai (UTC+5:30)", value: 5.5 },
    { label: "Bangkok (UTC+7)", value: 7 },
    { label: "Singapore (UTC+8)", value: 8 },
    { label: "Tokyo (UTC+9)", value: 9 },
    { label: "Sydney (UTC+10)", value: 10 },
    { label: "Auckland (UTC+12)", value: 12 },
  ];

  const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div>
      {/* Time slider + timezone inline */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div className="ctrl-label">Time of day</div>
            <select value={tz} onChange={e => setTz(parseFloat(e.target.value))}
              style={{ fontSize: 11, color: "#999", border: "none", background: "transparent", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {TZ_SIMPLE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.04em", color: "#1a1a1a" }}>
            {String(hours).padStart(2,"0")}:{String(minutes).padStart(2,"0")}
          </div>
        </div>
        <input type="range" min={0} max={1439} value={totalMinutes}
          onChange={e => { const t = parseInt(e.target.value); setHours(Math.floor(t/60)); setMinutes(t%60); }}
          style={{ width: "100%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginTop: 4 }}>
          {["00:00","03:00","06:00","09:00","12:00","15:00","18:00","21:00","24:00"].map(t => <span key={t}>{t}</span>)}
        </div>
      </div>

      {/* Date slider — full width */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <div className="ctrl-label">Date</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
            {new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          {/* Subtle highlight ranges: amber blobs near solstices, blue near equinoxes */}
          <div style={{ position: "absolute", top: "30%", left: 0, right: 0, height: "40%", borderRadius: 4, pointerEvents: "none",
            background: "linear-gradient(to right, transparent 18%, rgba(107,176,216,0.25) 20%, rgba(107,176,216,0.25) 24%, transparent 26%, transparent 44%, rgba(232,160,32,0.3) 46%, rgba(232,160,32,0.3) 50%, transparent 52%, transparent 69%, rgba(107,176,216,0.25) 71%, rgba(107,176,216,0.25) 75%, transparent 77%, transparent 94%, rgba(232,160,32,0.3) 95%, rgba(232,160,32,0.3) 99%, transparent 100%)"
          }} />
          <input type="range" min={1} max={365} value={dayOfYear}
            onChange={e => {
              const d = new Date(2024, 0, parseInt(e.target.value));
              setDate(`2024-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
            }}
            style={{ width: "100%", position: "relative" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginTop: 4 }}>
          {monthLabels.map(m => <span key={m}>{m}</span>)}
        </div>
      </div>



      {/* Mode buttons centred + cities toggle — directly above map */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8, position: "relative" }}>
        {["globe", "ae", "compare"].map(m => (
          <button key={m} onClick={() => { setShowMode(m); setZoom(1); setPan({ x: 0, y: 0 }); }}
            className={`mode-btn${showMode === m ? " active" : ""}`}>
            {m === "globe" ? "Globe" : m === "ae" ? "Flat Earth map" : "Compare"}
          </button>
        ))}
        <button onClick={() => setShowCities(v => !v)}
          style={{ position: "absolute", right: 0, fontSize: 11, color: showCities ? "#1a1a1a" : "#bbb", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "2px 0", borderBottom: showCities ? "1px solid #1a1a1a" : "1px solid transparent", transition: "all 0.15s" }}>
          {showCities ? "Hide cities" : "Show cities"}
        </button>
      </div>

      {/* Map canvas(es) */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", borderRadius: showMode === "ae" ? 0 : 12, overflow: showMode === "ae" ? "visible" : "hidden", border: showMode === "ae" ? "none" : "1px solid #d0ccc4", cursor: (showMode === "globe" || showMode === "compare") ? (dragging ? "grabbing" : "grab") : "crosshair", flex: showMode === "compare" ? "1 1 300px" : "none", width: showMode === "compare" ? "auto" : "100%" }}>
          {showMode === "compare" && <div className="map-label">Globe</div>}
          <canvas ref={canvasRef} width={canvasW} height={canvasH} style={{ display: "block", width: "100%", height: "auto" }}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={e => { e.preventDefault(); if(e.touches.length===1) handleMouseDown(e); }}
            onTouchMove={e => { e.preventDefault(); handleMouseMove(e); }}
            onTouchEnd={e => { e.preventDefault(); handleMouseUp(e); }}
            style={{ display: "block", width: "100%", height: "auto", touchAction: "none" }} />
          {/* Note overlaid on map — bottom of canvas, never pushes layout */}
          {(() => {
            const decl = sunPos.lat; const absDecl = Math.abs(decl);
            let msg = null, cls = "solstice";
            if (absDecl > 22.5) { const s = decl > 0; cls="solstice"; msg = `Near ${s?"summer":"winter"} solstice — illumination is dramatically offset toward one pole. Impossible on a flat Earth disc.`; }
            else if (absDecl < 1.5) { cls="equinox"; msg = "Near equinox — day and night nearly equal everywhere. The terminator runs almost pole-to-pole."; }
            else if (absDecl > 17) { cls="tilt"; const t = decl > 0 ? "Northern" : "Southern"; msg = `Significant axial tilt — days are growing longer toward the ${t} pole.`; }
            return msg ? (
              <div className={`proof-note ${cls}`} style={{ position: "absolute", bottom: 10, left: 10, right: 10, margin: 0, fontSize: 12 }}>
                {msg}
              </div>
            ) : null;
          })()}
        </div>
        {showMode === "compare" && (
          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #d0ccc4", flex: "1 1 300px" }}>
            <div className="map-label">Flat Earth map</div>
            <canvas ref={flatCanvasRef} width={GLOBE_S} height={GLOBE_S} style={{ display: "block", width: "100%", height: "auto" }} />
          </div>
        )}
      </div>

      {/* The key insight callout */}
      {showMode === "compare" && (
        <div className="warning-note">
          ⚠️ <strong>The flat earth problem:</strong> On a flat Earth, the sun would illuminate a full hemisphere simultaneously — visible to roughly half the planet at all times with no smooth day/night boundary.
          Instead, we observe a sharp terminator line that moves consistently, exactly matching the mathematics of a sphere rotating under a distant sun.
          Try dragging the time slider to watch the terminator — only a rotating sphere produces this pattern.
        </div>
      )}

      {/* Prove It */}
      <div style={{ marginTop: 16 }}>
        <div className="ctrl-label" style={{ marginBottom: 8 }}>🔬 Verify sunrise/sunset for any city</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CITIES.map(city => (
            <button key={city.name} onClick={() => setProveItCity(proveItCity?.name === city.name ? null : city)}
              className={`city-btn${proveItCity?.name === city.name ? " active" : ""}`}>{city.name}</button>
          ))}
        </div>
        {proveItCity && proveItData && (
          <div className="prove-card">
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>{proveItCity.name} <span style={{ fontSize: 12, opacity: 0.5 }}>({proveItCity.lat.toFixed(1)}°, {proveItCity.lon.toFixed(1)}°)</span></div>
            {proveItData.polar ? (
              <div style={{ color: "#8a6000" }}>⚠️ {proveItData.polar === "midnight sun" ? "Midnight Sun — sun never sets today" : "Polar Night — sun never rises today"}</div>
            ) : (
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 14 }}>
                <div>🌅 Sunrise: <strong>{formatHour(proveItData.sunrise)}</strong> local</div>
                <div>🌇 Sunset: <strong>{formatHour(proveItData.sunset)}</strong> local</div>
                <div>☀ Daylight: <strong>{((proveItData.sunset - proveItData.sunrise + 24) % 24).toFixed(1)}h</strong></div>
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: 12, color: "#666", lineHeight: 1.6 }}>
              Calculated from spherical Earth geometry. Verify at <a href={`https://www.timeanddate.com/sun/${proveItCity.name.toLowerCase().replace(/\s+/g, "-")}`} target="_blank" rel="noreferrer" style={{ color: "rgba(100,180,255,0.9)" }}>timeanddate.com ↗</a> — it'll match because Earth is spherical.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SECTION 2: STARS BY LATITUDE ───────────────────────────────────────────

function StarsSection() {
  const [latitude, setLatitude] = useState(35);
  const [selectedConst, setSelectedConst] = useState(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  const visibleConstellations = CONSTELLATIONS.filter(c => latitude >= c.latRange[0] && latitude <= c.latRange[1]);

  function drawStarfield(ctx, W, H, t) {
    ctx.fillStyle = "#02040e";
    ctx.fillRect(0, 0, W, H);

    // Background stars
    const seed = 42;
    for (let i = 0; i < 300; i++) {
      const x = ((Math.sin(i * 127.1 + seed) * 0.5 + 0.5)) * W;
      const y = ((Math.sin(i * 311.7 + seed) * 0.5 + 0.5)) * H;
      const r = Math.sin(i * 43.7) * 0.3 + 0.5 + Math.sin(t * 0.5 + i) * 0.15;
      const alpha = 0.3 + Math.sin(t * 0.8 + i * 0.3) * 0.15;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`; ctx.fill();
    }

    // Horizon line
    const horizonY = H * 0.65;
    const grad = ctx.createLinearGradient(0, H * 0.5, 0, H);
    grad.addColorStop(0, "rgba(20,40,20,0)");
    grad.addColorStop(0.4, "rgba(20,40,20,0.4)");
    grad.addColorStop(1, "rgba(10,30,10,0.9)");
    ctx.fillStyle = grad; ctx.fillRect(0, H * 0.5, W, H);

    ctx.strokeStyle = "rgba(100,180,100,0.3)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, horizonY); ctx.lineTo(W, horizonY); ctx.stroke();
    ctx.fillStyle = "rgba(120,200,120,0.3)"; ctx.font = "11px monospace";
    ctx.textAlign = "right"; ctx.fillText("horizon", W - 10, horizonY - 4);

    // Pole star
    if (latitude > 5) {
      const poleAngle = (90 - latitude) / 90;
      const poleSY = horizonY - (horizonY * 0.85) * (1 - poleAngle);
      const poleSX = W / 2;
      const glow = ctx.createRadialGradient(poleSX, poleSY, 0, poleSX, poleSY, 20);
      glow.addColorStop(0, "rgba(220,240,255,0.9)"); glow.addColorStop(1, "rgba(180,210,255,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(poleSX, poleSY, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(poleSX, poleSY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(200,230,255,0.7)"; ctx.font = "11px monospace"; ctx.textAlign = "center";
      ctx.fillText(`Polaris — ${latitude.toFixed(0)}° above horizon`, poleSX, poleSY - 14);
    } else if (latitude < -5) {
      ctx.fillStyle = "rgba(160,200,160,0.5)"; ctx.font = "11px monospace"; ctx.textAlign = "center";
      ctx.fillText("Polaris is below your horizon", W / 2, horizonY + 16);
    }

    // Draw visible constellations
    visibleConstellations.forEach((c, ci) => {
      const isSelected = selectedConst?.name === c.name;
      const baseX = 0.15 + ci * 0.18;
      const spreadY = 0.1 + (0.3 * (1 - Math.abs(latitude) / 90));
      const twinkle = Math.sin(t * 0.7 + ci * 2.1) * 0.1;

      c.stars.forEach(([u, v], si) => {
        const sx = (baseX + u * 0.15) * W;
        const sy = horizonY * (0.15 + v * spreadY) + twinkle * 5;
        if (sy >= horizonY) return;
        const r = (isSelected ? 3 : 2) + Math.sin(t + si) * 0.5;
        const alpha = isSelected ? 1 : 0.75;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = c.color + (isSelected ? "ff" : "cc"); ctx.fill();
        if (r > 2) {
          const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3);
          sg.addColorStop(0, c.color + "44"); sg.addColorStop(1, c.color + "00");
          ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, r * 3, 0, Math.PI * 2); ctx.fill();
        }
      });

      // Connect stars with lines
      if (isSelected && c.stars.length > 1) {
        ctx.beginPath();
        c.stars.forEach(([u, v], si) => {
          const sx = (baseX + u * 0.15) * W;
          const sy = horizonY * (0.15 + v * spreadY);
          if (sy >= horizonY) return;
          si === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        });
        ctx.strokeStyle = c.color + "44"; ctx.lineWidth = 0.8; ctx.stroke();
      }

      // Label
      const labelX = (baseX + 0.075) * W;
      const labelY = horizonY * (0.15 + 0.06);
      if (labelY < horizonY) {
        ctx.fillStyle = isSelected ? c.color : (c.color + "99");
        ctx.font = `${isSelected ? "bold " : ""}11px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(c.name, labelX, labelY - 8);
        ctx.fillStyle = "rgba(180,200,180,0.4)"; ctx.font = "9px monospace";
        ctx.fillText(c.hemisphere === "both" ? "both hemispheres" : c.hemisphere + " only", labelX, labelY + 2);
      }
    });

    // Not-visible constellations — show as "below horizon"
    const notVisible = CONSTELLATIONS.filter(c => !(latitude >= c.latRange[0] && latitude <= c.latRange[1]));
    notVisible.forEach((c, ci) => {
      ctx.fillStyle = "rgba(160,160,160,0.25)"; ctx.font = "11px monospace"; ctx.textAlign = "center";
      const lx = (0.12 + ci * 0.2) * W;
      ctx.fillText(`${c.name} — below horizon`, lx, horizonY + 18 + (ci % 2) * 14);
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const animate = () => {
      timeRef.current += 0.016;
      drawStarfield(ctx, W, H, timeRef.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [latitude, selectedConst, visibleConstellations]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="ctrl-label">Your latitude: <strong style={{ color: "#a8d0ff" }}>{latitude > 0 ? `${latitude}°N` : latitude < 0 ? `${Math.abs(latitude)}°S` : "0° Equator"}</strong></div>
          <input type="range" min={-90} max={90} value={latitude} onChange={e => setLatitude(parseInt(e.target.value))} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginTop: 4 }}>
            <span>90°S (Antarctica)</span><span>Equator</span><span>90°N (Arctic)</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ l: "London", v: 51 }, { l: "Tokyo", v: 36 }, { l: "Singapore", v: 1 }, { l: "Sydney", v: -34 }, { l: "Cape Town", v: -34 }].map(({ l, v }) => (
            <button key={l} onClick={() => setLatitude(v)} className="city-btn">{l}</button>
          ))}
        </div>
      </div>

      <canvas ref={canvasRef} width={960} height={400} style={{ display: "block", width: "100%", height: "auto", borderRadius: 12, border: "1px solid rgba(80,140,255,0.12)" }} />

      <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
        {CONSTELLATIONS.map(c => {
          const visible = latitude >= c.latRange[0] && latitude <= c.latRange[1];
          return (
            <button key={c.name}
              onClick={() => setSelectedConst(selectedConst?.name === c.name ? null : c)}
              style={{ background: selectedConst?.name === c.name ? `${c.color}22` : "rgba(20,30,60,0.5)", border: `1px solid ${visible ? c.color + "66" : "rgba(100,100,100,0.2)"}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "monospace", fontSize: 12, color: visible ? c.color : "rgba(120,120,120,0.5)", transition: "all 0.18s" }}>
              {c.name} {visible ? "✓" : "✗"}
            </button>
          );
        })}
      </div>

      {selectedConst && (
        <div style={{ marginTop: 12, padding: "12px 16px", background: "#fff", border: `1.5px solid ${selectedConst.color}`, borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: "#1a1a1a" }}>
          <strong style={{ color: selectedConst.color }}>{selectedConst.name}</strong> — visible from: <em>{selectedConst.visible_from}</em>
          <br />{selectedConst.description}
          {!visibleConstellations.find(c => c.name === selectedConst.name) && (
            <div style={{ marginTop: 6, color: "#c03030" }}>⚠️ Not visible from {Math.abs(latitude)}°{latitude >= 0 ? "N" : "S"} — below your horizon right now. Move to a different latitude to see it.</div>
          )}
        </div>
      )}

      <div className="insight-note" style={{ marginTop: 12 }}>
        💡 <strong>Why this proves a spherical Earth:</strong> On a flat Earth with a dome of stars above, everyone everywhere would see the same sky.
        Instead, as you move north or south, the entire sky rotates — new constellations rise, others sink and vanish.
        Polaris sits directly above the North Pole; its angle above your horizon exactly equals your latitude. This only works on a sphere.
      </div>
    </div>
  );
}

// ─── SECTION 3: FLIGHT PATHS ──────────────────────────────────────────────────

function FlightSection({ worldData }) {
  const [selectedRoute, setSelectedRoute] = useState(FLIGHT_ROUTES[0]);
  const [viewMode, setViewMode] = useState("globe"); // globe | ae
  const [animProgress, setAnimProgress] = useState(0);
  const [globeRotation, setGlobeRotation] = useState([0, 0]);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [zoom, setZoom] = useState(1);
  const rotRef = useRef([0, 0]);
  const animRef = useRef(null);
  const canvasRef = useRef(null);
  const GLOBE_S = 900;

  // Auto-rotate globe to focus on route midpoint
  useEffect(() => {
    const r = selectedRoute;
    const midLon = (r.from.lon + r.to.lon) / 2;
    const midLat = (r.from.lat + r.to.lat) / 2;
    setGlobeRotation([-midLon, -midLat]);
    rotRef.current = [-midLon, -midLat];
    setAnimProgress(0);
  }, [selectedRoute]);

  // Animate flight
  useEffect(() => {
    let start = null;
    const duration = 3000;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setAnimProgress(p);
      if (p < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [selectedRoute, viewMode]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || !worldData) return;
    const ctx = canvas.getContext("2d");
    const r = selectedRoute;
    const gcPts = greatCirclePoints(r.from.lat, r.from.lon, r.to.lat, r.to.lon, 100);
    const gcCount = Math.floor(gcPts.length * animProgress);

    // Route overlay drawn on top of base map
    const routeOverlay = (ctx2, proj, pathGen) => {
      // Flat earth "direct" dashed line (AE only)
      if (viewMode === "ae") {
        const fFrom=proj([r.from.lon,r.from.lat]), fTo=proj([r.to.lon,r.to.lat]);
        if(fFrom&&fTo){ctx2.strokeStyle="rgba(255,80,80,0.6)";ctx2.lineWidth=2;ctx2.setLineDash([8,4]);ctx2.beginPath();ctx2.moveTo(fFrom[0],fFrom[1]);ctx2.lineTo(fTo[0],fTo[1]);ctx2.stroke();ctx2.setLineDash([]);}
      }
      // Great circle
      if (gcCount > 1) {
        let started=false;
        ctx2.beginPath();
        gcPts.slice(0,gcCount).forEach(([lon,lat])=>{const pt=proj([lon,lat]);if(!pt){started=false;return;}started?ctx2.lineTo(pt[0],pt[1]):ctx2.moveTo(pt[0],pt[1]);started=true;});
        ctx2.strokeStyle=r.color; ctx2.lineWidth=2.5; ctx2.stroke();
      }
      // City markers
      [[r.from,"FROM"],[r.to,"TO"]].forEach(([city,label])=>{
        const pt=proj([city.lon,city.lat]);if(!pt)return;
        ctx2.beginPath();ctx2.arc(pt[0],pt[1],6,0,Math.PI*2);ctx2.fillStyle=r.color;ctx2.fill();
        ctx2.strokeStyle="#fff";ctx2.lineWidth=1.5;ctx2.stroke();
        ctx2.fillStyle="#fff";ctx2.font="bold 11px monospace";ctx2.textAlign="center";
        ctx2.fillText(city.name,pt[0],pt[1]-12);
        ctx2.fillStyle="rgba(255,255,255,0.45)";ctx2.font="9px monospace";ctx2.fillText(label,pt[0],pt[1]-22);
      });
      // Plane
      if(gcCount>0&&gcCount<gcPts.length){
        const pt=proj(gcPts[gcCount-1]);
        if(pt){ctx2.font="18px sans-serif";ctx2.textAlign="center";ctx2.fillText("✈",pt[0],pt[1]+6);}
      }
      // AE legend
      if (viewMode === "ae") {
        const ly=GLOBE_S-36;
        ctx2.setLineDash([6,3]);ctx2.beginPath();ctx2.moveTo(14,ly);ctx2.lineTo(44,ly);
        ctx2.strokeStyle="rgba(255,80,80,0.7)";ctx2.lineWidth=2;ctx2.stroke();ctx2.setLineDash([]);
        ctx2.fillStyle="rgba(255,100,100,0.85)";ctx2.font="11px monospace";ctx2.textAlign="left";
        ctx2.fillText('"Flat Earth" direct line',50,ly+4);
        ctx2.beginPath();ctx2.moveTo(14,ly+16);ctx2.lineTo(44,ly+16);
        ctx2.strokeStyle=r.color;ctx2.lineWidth=2.5;ctx2.stroke();
        ctx2.fillStyle=r.color;ctx2.fillText("Actual great circle route",50,ly+20);
      }
    };

    if (viewMode === "ae") {
      sharedDrawAE(ctx, GLOBE_S, worldData, zoom, {x:0,y:0}, null, { overlayFn: routeOverlay });
    } else {
      sharedDrawGlobe(ctx, GLOBE_S, worldData, globeRotation, zoom, null, { overlayFn: routeOverlay });
    }
  }, [selectedRoute, viewMode, animProgress, globeRotation, worldData]);

  const flightPinchDist = useRef(null);
  const handleMouseDown = e => {
    if (e.touches && e.touches.length === 2) return;
    if (viewMode === "globe") {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      setDragging(true); setDragStart({ x, y }); rotRef.current = [...globeRotation];
    }
  };
  const handleMouseMove = e => {
    if (e.touches && e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
      if (flightPinchDist.current) setZoom(z => Math.min(6, Math.max(0.3, z * dist/flightPinchDist.current)));
      flightPinchDist.current = dist; return;
    }
    flightPinchDist.current = null;
    if (viewMode === "globe" && dragging && dragStart) {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      setGlobeRotation([rotRef.current[0]+(x-dragStart.x)*0.5, rotRef.current[1]-(y-dragStart.y)*0.5]);
    }
  };
  const handleMouseUp = e => { if(e?.touches?.length>0) return; flightPinchDist.current=null; setDragging(false); setDragStart(null); };

  return (
    <div>
      {/* Route selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {FLIGHT_ROUTES.map(route => (
          <button key={route.id} onClick={() => setSelectedRoute(route)} className={`mode-btn${selectedRoute.id === route.id ? " active" : ""}`}>
            {route.name}
          </button>
        ))}
        <button onClick={() => { setAnimProgress(0); setTimeout(() => { let s = null; const a = ts => { if (!s) s = ts; const p = Math.min((ts - s) / 3000, 1); setAnimProgress(p); if (p < 1) requestAnimationFrame(a); }; requestAnimationFrame(a); }, 10); }} className="mode-btn" style={{ marginLeft: "auto" }}>↺ Replay</button>
      </div>

      {/* Map mode — centred, matching solar tab */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
        {["globe", "ae"].map(m => (
          <button key={m} onClick={() => { setViewMode(m); setZoom(1); }} className={`mode-btn${viewMode === m ? " active" : ""}`}>
            {m === "globe" ? "Globe" : "Flat Earth map"}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", borderRadius: viewMode==="ae"?0:12, overflow: viewMode==="ae"?"visible":"hidden", border: viewMode==="ae"?"none":"1px solid #d0ccc4", cursor: viewMode === "globe" ? (dragging ? "grabbing" : "grab") : "default" }}>
        <canvas ref={canvasRef} width={GLOBE_S} height={GLOBE_S}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          onTouchStart={e => { e.preventDefault(); handleMouseDown(e); }}
          onTouchMove={e => { e.preventDefault(); handleMouseMove(e); }}
          onTouchEnd={e => { e.preventDefault(); handleMouseUp(e); }}
          style={{ display: "block", width: "100%", height: "auto", touchAction: "none" }} />
      </div>

      <div className="insight-note" style={{ marginTop: 12, borderLeft: `4px solid ${selectedRoute.color}` }}>
        <strong style={{ color: "#1a1a1a" }}>{selectedRoute.name}:</strong> {selectedRoute.description}
        <div style={{ marginTop: 6, color: "#c04020" }}>⚠️ Flat Earth problem: {selectedRoute.flatEarthProblem}</div>
      </div>

      <div style={{ marginTop: 10, padding: "12px 16px", background: "#fff", border: "1.5px solid #e0dcd4", borderRadius: 8, fontSize: 13, color: "#444", lineHeight: 1.7 }}>
        💡 <strong>Great circle routes</strong> are the shortest paths on a sphere. They look curved on flat maps because flat maps distort the surface. Every commercial airline uses spherical geometry for navigation — if Earth were flat, GPS, autopilot, and fuel calculations would all be wrong, and every flight would arrive at the wrong place.
      </div>
    </div>
  );
}


// ─── SECTION 4: CIRCUMNAVIGATION ─────────────────────────────────────────────

function CircumnavSection({ worldData }) {
  const canvasRef = useRef(null);
  const flatCanvasRef = useRef(null);
  const [highlighted, setHighlighted] = useState(null);
  const [viewMode, setViewMode] = useState("globe");
  const [globeRotation, setGlobeRotation] = useState([0, 25]);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [zoom, setZoom] = useState(1);
  const rotRef = useRef([0, 25]);
  const animRef = useRef(null);
  const frameRef = useRef(0);
  const GLOBE_S = 900;

  // Generate smooth great-circle interpolation between a series of waypoints
  function gcRoute(waypoints, stepsPerLeg = 40) {
    const pts = [];
    for (let w = 0; w < waypoints.length - 1; w++) {
      const [lon1, lat1] = waypoints[w];
      const [lon2, lat2] = waypoints[w + 1];
      for (let s = 0; s <= stepsPerLeg; s++) {
        const f = s / stepsPerLeg;
        const d = 2 * Math.asin(Math.sqrt(
          Math.sin(toRad((lat2-lat1)/2))**2 +
          Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(toRad((lon2-lon1)/2))**2
        ));
        if (d < 0.0001) { pts.push([lon1, lat1]); continue; }
        const A = Math.sin((1-f)*d)/Math.sin(d), B = Math.sin(f*d)/Math.sin(d);
        const x = A*Math.cos(toRad(lat1))*Math.cos(toRad(lon1)) + B*Math.cos(toRad(lat2))*Math.cos(toRad(lon2));
        const y = A*Math.cos(toRad(lat1))*Math.sin(toRad(lon1)) + B*Math.cos(toRad(lat2))*Math.sin(toRad(lon2));
        const z = A*Math.sin(toRad(lat1)) + B*Math.sin(toRad(lat2));
        pts.push([toDeg(Math.atan2(y,x)), toDeg(Math.asin(z))]);
      }
    }
    return pts;
  }

  const ROUTES = [
    {
      id: "bellingshausen",
      name: "Bellingshausen, 1819–21",
      color: "#e8a020",
      description: "First confirmed circumnavigation of Antarctica. The Russian sloop-of-war Vostok departed Kronstadt, sailed south of 60°S throughout, and returned — proving Antarctica was a continent encircling the South Pole, not scattered islands.",
      // Key waypoints: Kronstadt → Copenhagen → Portsmouth → Rio → South Georgia → Antarctica → Sydney → Cape Horn → Rio → home
      points: gcRoute([
        [29, 60],[10, 56],[0, 51],[-43, -23],[-37, -54],[-26, -58],
        [0, -62],[40, -65],[80, -63],[140, -58],[151, -34],
        [170, -50],[-160, -55],[-130, -58],[-68, -55],[-43, -23],[0, 51],[29, 60]
      ], 30),
    },
    {
      id: "bypasses",
      name: "The three great capes",
      color: "#60b8e0",
      description: "Every solo circumnavigation must pass the three great southern capes — Cape Horn (South America), Cape of Good Hope (South Africa), and Cape Leeuwin (Australia) — all south of 34°S. The routes are only consistent with a spherical Earth.",
      // Classic clipper route: start London, Cape of Good Hope, Cape Leeuwin, Cape Horn, back
      points: gcRoute([
        [0, 51],[0, -10],[20, -34],[40, -40],[80, -45],[115, -34],
        [130, -42],[160, -48],[180, -52],[-150, -55],[-110, -52],
        [-68, -55],[-43, -23],[-20, 10],[0, 51]
      ], 30),
    },
    {
      id: "solo",
      name: "Modern Antarctic circumnavigation",
      color: "#80c870",
      description: "Contemporary vessels circumnavigate Antarctica in as little as 60 days, staying south of 60°S. The route is approximately 24,000 km — less than 5% of the 500,000+ km that a flat earth perimeter would require.",
      // Pure southern ocean loop, staying ~60-65°S
      points: gcRoute([
        [0,-63],[40,-65],[80,-63],[120,-61],[160,-60],
        [-160,-61],[-120,-63],[-80,-62],[-40,-64],[0,-63]
      ], 40),
    },
  ];



  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const draw = () => {
      frameRef.current++;
      const routeOverlay = (ctx2, proj) => {
        ROUTES.forEach(route => {
          const isHigh = highlighted === route.id;
          const progress = isHigh ? Math.min(1,(frameRef.current%120)/80) : 1;
          const ptCount = Math.floor(route.points.length * progress);
          if (ptCount < 2) return;
          ctx2.beginPath(); let started=false;
          route.points.slice(0,ptCount).forEach(([lon,lat])=>{const pt=proj([lon,lat]);if(!pt){started=false;return;}started?ctx2.lineTo(pt[0],pt[1]):ctx2.moveTo(pt[0],pt[1]);started=true;});
          ctx2.strokeStyle=isHigh?route.color:route.color+"99"; ctx2.lineWidth=isHigh?3:2; ctx2.stroke();
          if(ptCount>=2){const pt2=proj(route.points[ptCount-1]),pt1=proj(route.points[ptCount-2]);
            if(pt1&&pt2){const ang=Math.atan2(pt2[1]-pt1[1],pt2[0]-pt1[0]);
              ctx2.beginPath();ctx2.moveTo(pt2[0],pt2[1]);
              ctx2.lineTo(pt2[0]-10*Math.cos(ang-0.4),pt2[1]-10*Math.sin(ang-0.4));
              ctx2.lineTo(pt2[0]-10*Math.cos(ang+0.4),pt2[1]-10*Math.sin(ang+0.4));
              ctx2.closePath();ctx2.fillStyle=isHigh?route.color:route.color+"99";ctx2.fill();}}
        });
      };
      if (viewMode === "globe") {
        sharedDrawGlobe(ctx, GLOBE_S, worldData, globeRotation, zoom, null, { overlayFn: routeOverlay });
      } else {
        sharedDrawAE(ctx, GLOBE_S, worldData, zoom, {x:0,y:0}, null, { overlayFn: routeOverlay });
      }
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [worldData, highlighted, globeRotation, viewMode, zoom]);

  const circumPinchDist = useRef(null);
  const handleMouseDown = e => {
    if (e.touches && e.touches.length === 2) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setDragging(true); setDragStart({x, y}); rotRef.current=[...globeRotation];
  };
  const handleMouseMove = e => {
    if (e.touches && e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
      if (circumPinchDist.current) setZoom(z => Math.min(6, Math.max(0.3, z * dist/circumPinchDist.current)));
      circumPinchDist.current = dist; return;
    }
    circumPinchDist.current = null;
    if (dragging && dragStart) {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      setGlobeRotation([rotRef.current[0]+(x-dragStart.x)*0.4, rotRef.current[1]-(y-dragStart.y)*0.4]);
    }
  };
  const handleMouseUp = e => { if(e?.touches?.length>0) return; circumPinchDist.current=null; setDragging(false); setDragStart(null); };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const onWheel = e => { e.preventDefault(); const d = e.deltaY < 0 ? 1.25 : 1/1.25; setZoom(z => Math.min(6, Math.max(0.3, z*d))); };
    c.addEventListener("wheel", onWheel, {passive:false});
    let lpd = null;
    const onTS = e => { if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;lpd=Math.sqrt(dx*dx+dy*dy);} };
    const onTM = e => { if(e.touches.length===2&&lpd){e.preventDefault();const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;const d2=Math.sqrt(dx*dx+dy*dy);setZoom(z=>Math.min(6,Math.max(0.3,z*(d2/lpd))));lpd=d2;} };
    const onTE = () => { lpd=null; };
    c.addEventListener("touchstart",onTS,{passive:false});
    c.addEventListener("touchmove",onTM,{passive:false});
    c.addEventListener("touchend",onTE);
    return () => { c.removeEventListener("wheel",onWheel); c.removeEventListener("touchstart",onTS); c.removeEventListener("touchmove",onTM); c.removeEventListener("touchend",onTE); };
  }, []);

  return (
    <div>
      <div className="insight-note" style={{ marginBottom: 16 }}>
        If Antarctica were an "ice wall" at the edge of a flat disc, circumnavigating it would mean travelling around the entire perimeter of the known world — over 500,000 km. In reality, ships and aircraft cross the Southern Ocean routinely. Antarctica has been circumnavigated dozens of times, on routes consistent only with a spherical Earth.
      </div>

      {/* Map mode buttons — centred, matching solar tab */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
        {["globe", "ae"].map(m => (
          <button key={m} onClick={() => { setViewMode(m); setZoom(1); }}
            className={`mode-btn${viewMode === m ? " active" : ""}`}>
            {m === "globe" ? "Globe" : "Flat Earth map"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 400px", position: "relative", borderRadius: 12, overflow: viewMode === "ae" ? "visible" : "hidden", border: viewMode === "ae" ? "none" : "1px solid #d0ccc4", cursor: viewMode === "globe" ? (dragging ? "grabbing" : "grab") : "default" }}>
          <canvas ref={canvasRef} width={GLOBE_S} height={GLOBE_S}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={e => { e.preventDefault(); handleMouseDown(e); }}
            onTouchMove={e => { e.preventDefault(); handleMouseMove(e); }}
            onTouchEnd={e => { e.preventDefault(); handleMouseUp(e); }}
            style={{ display: "block", width: "100%", height: "auto", touchAction: "none" }} />
        </div>
        <div style={{ flex: "0 1 280px", display: "flex", flexDirection: "column", gap: 10 }}>
          {ROUTES.map(route => (
            <div key={route.id}
              onClick={() => setHighlighted(highlighted === route.id ? null : route.id)}
              style={{ padding: "12px 16px", background: "#fff", border: `1.5px solid ${highlighted === route.id ? route.color : "#d0ccc4"}`, borderLeft: `4px solid ${route.color}`, borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a", marginBottom: 4 }}>{route.name}</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{route.description}</div>
            </div>
          ))}
          <div className="insight-note" style={{ marginTop: 4, fontSize: 12 }}>
            Click a route to animate it. Drag the globe to explore. Scroll to zoom.
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── NEWS TICKER ─────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  {
    tag: "Science",
    source: "IFLScience",
    text: "Flat-earther Jeran Campanella visits Antarctica, witnesses the 24-hour midnight sun, and admits he was wrong — on camera",
    url: "https://www.iflscience.com/what-happened-during-flat-earthers-final-experiment-in-antarctica-80665",
  },
  {
    tag: "Science",
    source: "Upworthy",
    text: "Flat earthers travel to Antarctica to disprove the midnight sun — and have an emotional on-camera reckoning with what they find",
    url: "https://www.upworthy.com/flat-earthers-visited-antarctica-24-hour-sun/",
  },
  {
    tag: "Antarctica",
    source: "CBC News",
    text: "Canada eyes a second Antarctic expedition in 2026, building on its first-ever naval deployment to the continent earlier this year",
    url: "https://www.cbc.ca/news/climate/antarctic-expedition-polar-research-9.7022032",
  },
  {
    tag: "Antarctica",
    source: "British Antarctic Survey",
    text: "RRS Sir David Attenborough departs Plymouth for Antarctica — one of 60+ science projects running across five BAS stations this season",
    url: "https://www.bas.ac.uk/news/a-new-antarctic-season-begins-for-2025-26/",
  },
  {
    tag: "Antarctica",
    source: "Maritime Executive",
    text: "Canada eyes a second expedition to Antarctica in 2026 — Canadian and Chilean navies to collaborate on Southern Ocean research",
    url: "https://maritime-executive.com/article/canada-eyes-a-second-expedition-to-antarctica",
  },
  {
    tag: "Science",
    source: "BBC / BAS",
    text: "World's once-largest iceberg A23a — twice the size of Greater London — is breaking apart in the South Atlantic after 40 years adrift",
    url: "https://www.bas.ac.uk/",
  },
  {
    tag: "Space",
    source: "ESA",
    text: "ESA's EarthCARE satellite, built jointly with JAXA, maps clouds and aerosols over a spherical Earth in near-polar orbit",
    url: "https://earth.esa.int/eogateway/missions/earthcare/description",
  },
  {
    tag: "Science",
    source: "Green Matters",
    text: "Flat-earthers spent millions travelling to Antarctica to see if the 24-hour sun was real. It was — and some admitted they were wrong",
    url: "https://www.greenmatters.com/pn/flat-earthers-visited-antarctica-to-see-if-24-hour-midnight-sun-was-real-it-went-as-expected",
  },
  {
    tag: "Antarctica",
    source: "British Antarctic Survey",
    text: "Brunt Ice Shelf — home to Halley VI station — is the world's most closely monitored ice shelf, tracked by 11 GPS units and satellite imagery",
    url: "https://www.bas.ac.uk/news/a-new-antarctic-season-begins-for-2025-26/",
  },
  {
    tag: "Space",
    source: "ESA / JAXA",
    text: "ESA and JAXA's joint EarthCARE mission observes Earth from a 393 km polar orbit — independent data from two continents, one spherical planet",
    url: "https://earth.esa.int/eogateway/missions/earthcare/description",
  },
];

const TAG_COLORS = {
  "Antarctica": { bg: "#e8f4ef", text: "#1a5a3a" },
  "Space":      { bg: "#e8eef8", text: "#1a3a6a" },
  "Science":    { bg: "#fbf0e8", text: "#7a3a10" },
};

function NewsTicker() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const offsetRef = useRef(0);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);
  const innerRef = useRef(null);
  const SPEED = 12; // px per second

  // Seamless auto-scroll using rAF
  useEffect(() => {
    const tick = (ts) => {
      if (lastTimeRef.current !== null && !isPaused) {
        const dt = (ts - lastTimeRef.current) / 1000;
        const inner = innerRef.current;
        const halfW = inner ? inner.scrollWidth / 2 : 0;
        offsetRef.current = offsetRef.current - SPEED * dt;
        if (halfW > 0 && offsetRef.current < -halfW) offsetRef.current += halfW;
        setOffset(offsetRef.current);
      }
      lastTimeRef.current = ts;
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPaused]);

  const startDrag = (clientX) => {
    setIsDragging(true);
    setIsPaused(true);
    setDragStartX(clientX);
    setDragStartOffset(offsetRef.current);
  };
  const moveDrag = (clientX) => {
    if (!isDragging) return;
    const delta = clientX - dragStartX;
    const inner = innerRef.current;
    const halfW = inner ? inner.scrollWidth / 2 : 0;
    let newOffset = dragStartOffset + delta;
    if (halfW > 0 && newOffset < -halfW) newOffset += halfW;
    if (halfW > 0 && newOffset > 0) newOffset -= halfW;
    offsetRef.current = newOffset;
    setOffset(newOffset);
  };
  const endDrag = () => {
    setIsDragging(false);
    setIsPaused(false);
    lastTimeRef.current = null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && email.includes("@")) setSubmitted(true);
  };

  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "#f0ece4", borderTop: "1.5px solid #d0ccc4",
      display: "flex", alignItems: "center", height: 44,
      fontFamily: "'DM Sans', sans-serif", userSelect: "none",
    }}>
      <div style={{
        flexShrink: 0, padding: "0 14px", borderRight: "1.5px solid #d0ccc4",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "#999", height: "100%",
        display: "flex", alignItems: "center",
      }}>
        Latest
      </div>

      <div
        style={{ flex: 1, overflow: "hidden", position: "relative", height: "100%", cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={e => startDrag(e.clientX)}
        onMouseMove={e => moveDrag(e.clientX)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={e => startDrag(e.touches[0].clientX)}
        onTouchMove={e => { e.preventDefault(); moveDrag(e.touches[0].clientX); }}
        onTouchEnd={endDrag}
      >
        <div
          ref={innerRef}
          style={{
            display: "inline-flex", alignItems: "center", height: "100%",
            transform: `translateX(${offset}px)`,
            whiteSpace: "nowrap", willChange: "transform",
          }}
        >
          {items.map((item, i) => {
            const tc = TAG_COLORS[item.tag] || TAG_COLORS["Science"];
            return (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 48 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
                  background: tc.bg, color: tc.text, flexShrink: 0,
                }}>
                  {item.tag}
                </span>
                <span style={{ fontSize: 10, color: "#aaa", flexShrink: 0 }}>{item.source}</span>
                <a
                  href={item.url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: "#444", textDecoration: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#1a1a1a"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#444"; }}
                  onClick={e => isDragging && e.preventDefault()}
                >
                  {item.text}
                </a>
                <span style={{ color: "#d0ccc4", marginLeft: 8 }}>—</span>
              </span>
            );
          })}
        </div>
      </div>

      <div style={{
        flexShrink: 0, borderLeft: "1.5px solid #d0ccc4",
        padding: "0 14px", display: "flex", alignItems: "center",
        height: "100%",
      }}>
        {submitted ? (
          <span style={{ fontSize: 12, color: "#666" }}>Thanks — you're in ✓</span>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Stay updated"
              style={{
                fontSize: 12, padding: "4px 10px", border: "1.5px solid #d0ccc4",
                borderRadius: 6, background: "#fff", color: "#1a1a1a",
                outline: "none", width: 130, fontFamily: "inherit",
              }}
              onFocus={e => { e.target.style.borderColor = "#1a1a1a"; }}
              onBlur={e => { e.target.style.borderColor = "#d0ccc4"; }}
            />
            <button type="submit" style={{
              fontSize: 12, padding: "4px 10px", border: "1.5px solid #1a1a1a",
              borderRadius: 6, background: "#1a1a1a", color: "#f0ece4",
              cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
            }}>
              →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "solar", label: "Solar illumination", icon: "", subtitle: "Sunlight across the globe" },
  { id: "stars", label: "Stars by latitude", icon: "", subtitle: "The changing night sky" },
  { id: "flights", label: "Flight paths", icon: "", subtitle: "The shortest route between two points" },
  { id: "circum", label: "Circumnavigation", icon: "", subtitle: "Sailing around Antarctica" },
];

export default function App() {
  const [activeSection, setActiveSection] = useState("solar");
  const [worldData, setWorldData] = useState(null);

  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.json())
      .then(topo => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js";
        script.onload = () => setWorldData(window.topojson.feature(topo, topo.objects.countries));
        document.head.appendChild(script);
      });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f0ece4", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", color: "#1a1a1a", padding: "0 0 100px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Barlow+Condensed:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #f0ece4; }
        .ctrl-label { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-bottom: 6px; font-weight: 500; }
        .ctrl-input { background: #fff; color: #1a1a1a; border: 1.5px solid #d0ccc4; border-radius: 6px; padding: 8px 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; transition: border-color 0.15s; }
        .ctrl-input:focus { border-color: #1a1a1a; }
        select.ctrl-input option { background: #fff; color: #1a1a1a; }
        input[type=date].ctrl-input { color-scheme: light; appearance: auto; }
        input[type=range] { accent-color: #1a1a1a; cursor: pointer; }
        .mode-btn { background: #fff; border: 1.5px solid #d0ccc4; border-radius: 6px; padding: 7px 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: #666; transition: all 0.15s; }
        .mode-btn:hover { border-color: #1a1a1a; color: #1a1a1a; }
        .mode-btn.active { border-color: #1a1a1a; background: #1a1a1a; color: #f0ece4; }
        .stat-chip { background: #fff; border: 1.5px solid #d0ccc4; border-radius: 6px; padding: 5px 12px; font-size: 11px; letter-spacing: 0.02em; white-space: nowrap; color: #444; }
        .city-btn { background: #fff; border: 1.5px solid #d0ccc4; border-radius: 6px; padding: 5px 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; color: #666; transition: all 0.15s; }
        .city-btn:hover { border-color: #1a1a1a; color: #1a1a1a; }
        .city-btn.active { border-color: #1a1a1a; background: #1a1a1a; color: #f0ece4; }
        .map-label { position: absolute; top: 8px; left: 12px; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); z-index: 5; font-weight: 500; }
        .nav-tab { background: none; border: none; border-bottom: 3px solid transparent; padding: 16px 24px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #999; letter-spacing: 0.01em; transition: all 0.15s; text-align: left; }
        .nav-tab:hover { color: #1a1a1a; }
        .nav-tab.active { border-bottom-color: #1a1a1a; color: #1a1a1a; }
        .nav-tab .tab-sub { font-size: 10px; opacity: 0.6; display: block; margin-top: 2px; font-weight: 400; }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-inner { display: flex; align-items: center; height: 100%; animation: ticker 90s linear infinite; white-space: nowrap; will-change: transform; }
        .ticker-inner:hover { animation-play-state: paused; }
        .proof-note { padding: 12px 16px; border-radius: 8px; font-size: 13px; line-height: 1.7; margin-bottom: 12px; }
        .proof-note.solstice { background: #fffbe6; border: 1.5px solid #f0d060; color: #7a5a00; }
        .proof-note.equinox { background: #e8f4fb; border: 1.5px solid #90c8e8; color: #1a4a6a; }
        .proof-note.tilt { background: #fff0e6; border: 1.5px solid #f0a860; color: #7a3a00; }
        .insight-note { margin-top: 12px; padding: 12px 16px; background: #fff; border: 1.5px solid #e0dcd4; border-radius: 8px; font-size: 13px; color: #444; line-height: 1.7; }
        .warning-note { margin-top: 12px; padding: 12px 16px; background: #fff5f5; border: 1.5px solid #f0b8b8; border-radius: 8px; font-size: 13px; color: #8a2020; line-height: 1.7; }
        .prove-card { margin-top: 10px; background: #fff; border: 1.5px solid #d0ccc4; border-radius: 10px; padding: 14px 18px; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1.5px solid #d0ccc4", background: "#f0ece4" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ padding: "28px 0 0" }}>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(48px, 7vw, 88px)", fontWeight: 900, margin: 0, letterSpacing: "-0.01em", lineHeight: 0.9, textTransform: "uppercase", color: "#1a1a1a" }}>
              PROVEN<br />EARTH
            </h1>
            <p style={{ fontSize: 13, color: "#999", margin: "10px 0 0", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
              Independent, verifiable demonstrations
            </p>
            <p style={{ fontSize: 13, color: "#999", margin: "2px 0 0", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
              of Earth's shape
            </p>
          </div>
          {/* Nav */}
          <div style={{ display: "flex", gap: 0, marginTop: 16, justifyContent: "center" }}>
            {SECTIONS.map(s => (
              <button key={s.id} className={`nav-tab${activeSection === s.id ? " active" : ""}`} onClick={() => setActiveSection(s.id)}>
                <span>{s.label}</span>
                <span className="tab-sub">{s.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "32px 40px" }}>
        {activeSection === "solar" && <SolarSection worldData={worldData} />}
        {activeSection === "stars" && <StarsSection />}
        {activeSection === "flights" && <FlightSection worldData={worldData} />}
        {activeSection === "circum" && <CircumnavSection worldData={worldData} />}
      </div>
      <NewsTicker />
    </div>
  );
}
