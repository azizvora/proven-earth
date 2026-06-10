// ─── SHARED MAP DRAWING ───────────────────────────────────────────────────────
// Single source of truth for globe and AE rendering used by ALL sections.

import * as d3 from "d3";
import { getLightLevel, blendColors, landColor, iceColor, iceBlend, oceanColor } from "./helpers.js";

// Illumination canvas cache — keyed by rotation+sun+flatLight so pinch-zoom
// (which only changes scale, not rotation) skips the expensive pixel rebuild.
const _illumCacheGlobe = { key: null, canvas: null };
const _illumCacheAE    = { key: null, canvas: null };
const _illumCacheAES   = { key: null, canvas: null };
// Fixed render size for illumination — upscaled via drawImage. Caps cost at
// zoom and makes the canvas independent of the current radius.
const ILLUM_R = 180;

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
function buildIllumCanvas(proj3, rP, tP, worldData, sun, flatLight = false) {
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
    const light = flatLight ? 0.8 : getLightLevel(lat, lon, sun.lat, sun.lon);
    const isLand = mData[(py*PIX_S+px)*4] > 128;
    const [r,g,b] = isLand ? blendColors(landColor(light), iceColor(light), iceBlend(lat,lon)) : oceanColor(light);
    data[idx]=r; data[idx+1]=g; data[idx+2]=b; data[idx+3]=255;
  }
  ictx.putImageData(imgData, 0, 0);
  return illum;
}

// Draw overlays (borders, graticule, ocean labels, optional cities/routes) clipped to disc.
function drawOverlays(ctx, proj, worldData, z, options = {}) {
  const { showCities=false, cityDotsFn=null, overlayFn=null, graticuleVisible=false } = options;
  if (!worldData) return;
  const pathGen = d3.geoPath(proj, ctx);

  // Graticule — faint always, more prominent when notes are open
  const grat = d3.geoGraticule().step([30, 30])();
  ctx.beginPath(); pathGen(grat);
  ctx.strokeStyle = graticuleVisible ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)";
  ctx.lineWidth = graticuleVisible ? Math.max(0.6, 0.9*z) : Math.max(0.2, 0.5*z);
  ctx.stroke();

  // Lat/lon labels when notes are open
  if (graticuleVisible) {
    const latLines  = [-60, -30, 0, 30, 60];
    const lonLines  = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180];
    ctx.font = "9px monospace"; ctx.textAlign = "center";
    latLines.forEach(lat => {
      const pt = proj([0, lat]); if (!pt) return;
      if (proj.invert) {
        const back = proj.invert(pt); if (!back) return;
        if (Math.abs(back[1] - lat) > 3) return;
      }
      const label = lat === 0 ? "Equator" : `${Math.abs(lat)}°${lat > 0 ? "N" : "S"}`;
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(label, pt[0], pt[1] - 4);
    });
    lonLines.forEach(lon => {
      const pt = proj([lon, 10]); if (!pt) return;
      if (proj.invert) {
        const back = proj.invert(pt); if (!back) return;
        if (Math.abs(((lon - back[0]) + 540) % 360 - 180) > 3) return;
      }
      const label = lon === 0 ? "0°" : lon === 180 || lon === -180 ? "180°" : `${Math.abs(lon)}°${lon > 0 ? "E" : "W"}`;
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillText(label, pt[0], pt[1]);
    });
  }

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
export function sharedDrawGlobe(ctx, W, worldData, rot, z, sun, options = {}) {
  const cx = W/2, cy = W/2;
  const { flatLight = false } = options;
  const radius = (W/2 - 12) * z;
  const proj = d3.geoOrthographic().scale(radius).translate([cx,cy]).rotate(rot).clipAngle(90);
  ctx.fillStyle = "#08090f"; ctx.fillRect(0,0,W,W);
  // Illumination layer — fixed ILLUM_R size regardless of zoom, cached by rotation+sun
  const effectiveSun = flatLight ? { lat: 0, lon: 0 } : (sun || { lat: 0, lon: 0 });
  const illumKey = `${Math.round(rot[0])},${Math.round(rot[1])},${effectiveSun.lat},${effectiveSun.lon},${flatLight},${!!worldData}`;
  if (_illumCacheGlobe.key !== illumKey) {
    const proj3 = d3.geoOrthographic().scale(ILLUM_R).translate([ILLUM_R,ILLUM_R]).rotate(rot).clipAngle(90);
    _illumCacheGlobe.canvas = buildIllumCanvas(proj3, ILLUM_R, ILLUM_R, worldData, effectiveSun, flatLight);
    _illumCacheGlobe.key = illumKey;
  }
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(_illumCacheGlobe.canvas, cx-radius, cy-radius, radius*2, radius*2);
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
export function sharedDrawAE(ctx, W, worldData, z, p, sun, options = {}) {
  const cx = W/2, cy = W/2;
  const radius = (W/2 - 16) * 0.78 * z;
  const tx = cx + p.x, ty = cy + p.y;
  const proj = d3.geoAzimuthalEquidistant().rotate([90,-90]).scale(radius/Math.PI).translate([tx,ty]);
  // Background with hatching
  ctx.fillStyle = "#08090f"; ctx.fillRect(0,0,W,W);
  ctx.strokeStyle = "rgba(150,160,190,0.07)"; ctx.lineWidth = 0.7;
  for (let i = -W; i < W*2; i+=18) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i+W,W); ctx.stroke(); }
  // Illumination layer clipped to disc — fixed ILLUM_R size, cached by sun+flatLight
  const { flatLight = false } = options;
  const effectiveSun = flatLight ? { lat: 0, lon: 0 } : (sun || { lat: 0, lon: 0 });
  const illumKey = `${effectiveSun.lat},${effectiveSun.lon},${flatLight},${!!worldData}`;
  if (_illumCacheAE.key !== illumKey) {
    const proj3 = d3.geoAzimuthalEquidistant().rotate([90,-90]).scale(ILLUM_R/Math.PI).translate([ILLUM_R,ILLUM_R]);
    _illumCacheAE.canvas = buildIllumCanvas(proj3, ILLUM_R, ILLUM_R, worldData, effectiveSun, flatLight);
    _illumCacheAE.key = illumKey;
  }
  ctx.save(); ctx.beginPath(); ctx.arc(tx,ty,radius,0,Math.PI*2); ctx.clip();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(_illumCacheAE.canvas, tx-radius, ty-radius, radius*2, radius*2);
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
  ctx.font="italic 11px Georgia, serif"; ctx.fillStyle="rgba(170,180,200,0.45)";
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
export function sharedDrawAESouth(ctx, W, worldData, z, rot, sun, options = {}) {
  const cx = W/2, cy = W/2;
  const radius = (W/2 - 16) * 0.78 * z;
  const proj = d3.geoAzimuthalEquidistant().rotate([rot[0], 90]).scale(radius/Math.PI).translate([cx,cy]);
  ctx.fillStyle = "#08090f"; ctx.fillRect(0,0,W,W);
  ctx.strokeStyle = "rgba(150,160,190,0.07)"; ctx.lineWidth=0.7;
  for (let i=-W;i<W*2;i+=18){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+W,W);ctx.stroke();}
  const { flatLight = false } = options;
  const effectiveSun = flatLight ? { lat: 0, lon: 0 } : (sun || { lat: 0, lon: 0 });
  const illumKey = `${Math.round(rot[0])},${effectiveSun.lat},${effectiveSun.lon},${flatLight},${!!worldData}`;
  if (_illumCacheAES.key !== illumKey) {
    const proj3=d3.geoAzimuthalEquidistant().rotate([rot[0],90]).scale(ILLUM_R/Math.PI).translate([ILLUM_R,ILLUM_R]);
    _illumCacheAES.canvas = buildIllumCanvas(proj3,ILLUM_R,ILLUM_R,worldData,effectiveSun,flatLight);
    _illumCacheAES.key = illumKey;
  }
  ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,radius,0,Math.PI*2); ctx.clip();
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality="high";
  ctx.drawImage(_illumCacheAES.canvas,cx-radius,cy-radius,radius*2,radius*2);
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

// Shared Mercator draw — rectangular world map, used in flights tab.
export function sharedDrawMercator(ctx, W, worldData, options = {}) {
  ctx.fillStyle = "#08090f"; ctx.fillRect(0, 0, W, W);

  const pad = 18;
  const scale = (W - pad * 2) / (2 * Math.PI);
  const proj = d3.geoMercator().scale(scale).translate([W / 2, W / 2]);

  // Map vertical extent (Mercator clips at ±85.051°)
  const topY = Math.round(proj([0, 85.051])[1]);
  const botY = Math.round(proj([0, -85.051])[1]);
  const mapW = W - pad * 2;
  const mapH = botY - topY;

  // Low-res illumination scan
  const S = 0.4;
  const lW = Math.ceil(mapW * S), lH = Math.ceil(mapH * S);
  const lScale = lW / (2 * Math.PI);
  const lProj = d3.geoMercator().scale(lScale).translate([lW / 2, lH / 2]);

  // Land mask
  const maskOff = document.createElement("canvas");
  maskOff.width = lW; maskOff.height = lH;
  const mctx = maskOff.getContext("2d");
  mctx.fillStyle = "#000"; mctx.fillRect(0, 0, lW, lH);
  if (worldData) {
    const mp = d3.geoPath(lProj, mctx);
    mctx.beginPath(); mp(worldData); mctx.fillStyle = "#fff"; mctx.fill();
  }
  const mData = mctx.getImageData(0, 0, lW, lH).data;

  // Pixel-level illumination (no sun — flights tab doesn't use solar)
  const illum = document.createElement("canvas");
  illum.width = lW; illum.height = lH;
  const ictx = illum.getContext("2d");
  const imgData = ictx.createImageData(lW, lH);
  const idata = imgData.data;
  for (let py = 0; py < lH; py++) {
    for (let px = 0; px < lW; px++) {
      const geo = lProj.invert([px, py]);
      const idx = (py * lW + px) * 4;
      if (!geo) { idata[idx+3] = 0; continue; }
      const [lon, lat] = geo;
      const light = 0.55; // neutral daylight — no sun calculation needed here
      const isLand = mData[idx] > 128;
      const [r,g,b] = isLand
        ? blendColors(landColor(light), iceColor(light), iceBlend(lat, lon))
        : oceanColor(light);
      idata[idx]=r; idata[idx+1]=g; idata[idx+2]=b; idata[idx+3]=255;
    }
  }
  ictx.putImageData(imgData, 0, 0);

  // Draw map clipped to rect
  ctx.save();
  ctx.beginPath(); ctx.rect(pad, topY, mapW, mapH); ctx.clip();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(illum, pad, topY, mapW, mapH);
  drawOverlays(ctx, proj, worldData, 1, options);
  ctx.restore();

  // Map border
  ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1;
  ctx.strokeRect(pad, topY, mapW, mapH);

  // Distortion callout — only when notes are open
  if (options.graticuleVisible) {
    const yEqLow  = proj([0,  0])[1];    // equator
    const yEqHigh = proj([0, 30])[1];    // 30°N
    const yPoLow  = proj([0, 60])[1];    // 60°N
    const yPoHigh = proj([0, 85.051])[1]; // ~top of map

    // Pill centred on canvas; bracket + labels centred within the pill
    const bgPadH = 28;
    const contentW = 100; // approx width of bracket (8px) + gap (12px) + longest label (~80px)
    const pillW = contentW + bgPadH * 2;
    const pillCX = Math.round(proj([-150, 0])[0]);
    const xTickL = Math.round(pillCX - contentW / 2);
    const xBar   = xTickL + 8;
    const xLabel = xBar + 12;

    // All-sides gradient: draw horizontal fade on offscreen canvas, then mask
    // it with a vertical fade using destination-in compositing.
    const bgPad = 28;
    const bgX = pillCX - pillW / 2;
    const bgY = yPoHigh - bgPad;
    const bgW = pillW;
    const bgH = (yEqLow - yPoHigh) + bgPad * 2;
    const ofc = document.createElement("canvas");
    ofc.width = bgW; ofc.height = bgH;
    const octx = ofc.getContext("2d");
    const hGrad = octx.createLinearGradient(0, 0, bgW, 0);
    hGrad.addColorStop(0,    "rgba(0,0,0,0)");
    hGrad.addColorStop(0.15, "rgba(0,0,0,0.55)");
    hGrad.addColorStop(0.85, "rgba(0,0,0,0.55)");
    hGrad.addColorStop(1,    "rgba(0,0,0,0)");
    octx.fillStyle = hGrad;
    octx.fillRect(0, 0, bgW, bgH);
    octx.globalCompositeOperation = "destination-in";
    const vGrad = octx.createLinearGradient(0, 0, 0, bgH);
    vGrad.addColorStop(0,    "rgba(0,0,0,0)");
    vGrad.addColorStop(0.18, "rgba(0,0,0,1)");
    vGrad.addColorStop(0.82, "rgba(0,0,0,1)");
    vGrad.addColorStop(1,    "rgba(0,0,0,0)");
    octx.fillStyle = vGrad;
    octx.fillRect(0, 0, bgW, bgH);
    ctx.drawImage(ofc, bgX, bgY);

    const bracketColor = "rgba(255,220,80,1)";

    function drawBracket(y1, y2, bandLabel) {
      ctx.save();
      ctx.strokeStyle = bracketColor; ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(xBar, y1); ctx.lineTo(xBar, y2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xTickL, y1); ctx.lineTo(xBar, y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xTickL, y2); ctx.lineTo(xBar, y2); ctx.stroke();
      const midY = (y1 + y2) / 2;
      ctx.textAlign = "left";
      ctx.font = "10px monospace"; ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(bandLabel, xLabel, midY - 4);
      ctx.font = "bold 11px monospace"; ctx.fillStyle = bracketColor;
      ctx.fillText("≈ 3,330 km", xLabel, midY + 10);
      ctx.restore();
    }

    drawBracket(yEqHigh, yEqLow, "0°–30°N");
    drawBracket(yPoHigh, yPoLow, "60°–90°N");
  }
}
