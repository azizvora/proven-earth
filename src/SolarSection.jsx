import { useState, useEffect, useRef, useCallback } from "react";
import { CITIES } from "./data.js";
import { getLightLevel, getSunPosition, getSunriseSunset, formatHour } from "./helpers.js";
import { sharedDrawGlobe, sharedDrawAE } from "./drawing.js";
import { SidebarBrand, SectionNav } from "./chrome.jsx";
import { MAP_NOTE_GLOBE, MAP_NOTE_AE } from "./copy.js";

// ─── SECTION 1: SOLAR MAP ────────────────────────────────────────────────────

export default function SolarSection({ worldData }) {
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
  const [showMapNotes, setShowMapNotes] = useState(false);
  const [showCities, setShowCities] = useState(false);

  const MAP_NOTES = {
    globe: MAP_NOTE_GLOBE,
    ae: MAP_NOTE_AE,
    compare: "Side by side: the orthographic globe on the left, the azimuthal equidistant flat Earth map on the right. Notice how the day/night terminator takes a completely different shape on each.",
  };
  const [proveItCity, setProveItCity] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [globeRotation, setGlobeRotation] = useState([0, 0]);
  const rotRef = useRef([0, 0]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const flatCanvasRef = useRef(null);
  const prevCanvasRef = useRef(null);
  const fadeRafRef = useRef(null);
  const prevShowModeRef = useRef(null);
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

  // Crossfade on solar map mode change
  useEffect(() => {
    const prev = prevShowModeRef.current;
    prevShowModeRef.current = showMode;
    if (prev === null || prev === showMode) return;
    const canvas = canvasRef.current;
    const prevCanvas = prevCanvasRef.current;
    if (!canvas || !prevCanvas) return;
    const pctx = prevCanvas.getContext("2d");
    pctx.clearRect(0, 0, GLOBE_S, GLOBE_S);
    pctx.drawImage(canvas, 0, 0);
    canvas.style.transition = "none";
    canvas.style.opacity = "0";
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    fadeRafRef.current = requestAnimationFrame(() => {
      fadeRafRef.current = requestAnimationFrame(() => {
        canvas.style.transition = "opacity 700ms ease";
        canvas.style.opacity = "1";
      });
    });
    return () => { if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current); };
  }, [showMode]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const sun = getSunPosition(utcHours, dayOfYear);
    const opts = { showCities, cityDotsFn, graticuleVisible: showMapNotes };
    if (showMode === "globe" || showMode === "compare") sharedDrawGlobe(ctx, GLOBE_S, worldData, globeRotation, zoom, sun, opts);
    else sharedDrawAE(ctx, GLOBE_S, worldData, zoom, pan, sun, opts);
  }, [hours, minutes, tz, dayOfYear, globeRotation, worldData, zoom, pan, showMode, showCities, cityDotsFn, utcHours, showMapNotes]);

  useEffect(() => {
    if (showMode !== "compare" || !flatCanvasRef.current) return;
    const ctx = flatCanvasRef.current.getContext("2d");
    const sun = getSunPosition(utcHours, dayOfYear);
    sharedDrawAE(ctx, GLOBE_S, worldData, 1, { x:0, y:0 }, sun, { graticuleVisible: showMapNotes });
  }, [hours, minutes, tz, dayOfYear, worldData, showMode, utcHours, showMapNotes]);

  const handleWheel = useCallback((e) => {
    if (navigator.maxTouchPoints > 1) return;
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
  }, [showMode, dragging, dragStart, zoom]);

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
    <div className="section-split">

      {/* Left: brand + sliders + prove-it */}
      <div className="section-left">
        <SidebarBrand />
        {/* Time */}
        <div>
          <div className="ctrl-header">
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
              <span className="ctrl-label" style={{ margin: 0 }}>Time of day</span>
              <select value={tz} onChange={e => setTz(parseFloat(e.target.value))}
                style={{ fontSize: 11, color: "#999", border: "none", background: "transparent", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
                {TZ_SIMPLE.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <span className="ctrl-value">{String(hours).padStart(2,"0")}:{String(minutes).padStart(2,"0")}</span>
          </div>
          <input type="range" min={0} max={1439} value={totalMinutes}
            onChange={e => { const t = parseInt(e.target.value); setHours(Math.floor(t/60)); setMinutes(t%60); }}
            style={{ width: "100%" }} />
          <div className="tick-labels">
            {["00:00","03:00","06:00","09:00","12:00","15:00","18:00","21:00","24:00"].map(t => <span key={t}>{t}</span>)}
          </div>
        </div>

        {/* Date */}
        <div>
          <div className="ctrl-header">
            <span className="ctrl-label" style={{ margin: 0 }}>Date</span>
            <span className="ctrl-value">{new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</span>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: "30%", left: 0, right: 0, height: "40%", borderRadius: 4, pointerEvents: "none",
              background: "linear-gradient(to right, transparent 18%, rgba(107,176,216,0.25) 20%, rgba(107,176,216,0.25) 24%, transparent 26%, transparent 44%, rgba(232,160,32,0.3) 46%, rgba(232,160,32,0.3) 50%, transparent 52%, transparent 69%, rgba(107,176,216,0.25) 71%, rgba(107,176,216,0.25) 75%, transparent 77%, transparent 94%, rgba(232,160,32,0.3) 95%, rgba(232,160,32,0.3) 99%, transparent 100%)"
            }} />
            <input type="range" min={1} max={365} value={dayOfYear}
              onChange={e => { const d = new Date(2024, 0, parseInt(e.target.value)); setDate(`2024-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`); }}
              style={{ width: "100%", position: "relative" }} />
          </div>
          <div className="tick-labels">
            {monthLabels.map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* Prove It */}
        <div>
          <div className="ctrl-label" style={{ marginBottom: 8 }}>🔬 Verify sunrise/sunset for any city</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CITIES.map(city => (
              <button key={city.name} onClick={() => setProveItCity(proveItCity?.name === city.name ? null : city)}
                className={`city-btn${proveItCity?.name === city.name ? " active" : ""}`}>{city.name}</button>
            ))}
          </div>
          {proveItCity && proveItData && (
            <div className="prove-card">
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>{proveItCity.name} <span style={{ fontSize: 11, opacity: 0.5 }}>({proveItCity.lat.toFixed(1)}°, {proveItCity.lon.toFixed(1)}°)</span></div>
              {proveItData.polar ? (
                <div style={{ color: "#8a6000", fontSize: 13 }}>⚠️ {proveItData.polar === "midnight sun" ? "Midnight Sun: sun never sets today" : "Polar Night: sun never rises today"}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                  <div>🌅 Sunrise: <strong>{formatHour(proveItData.sunrise)}</strong></div>
                  <div>🌇 Sunset: <strong>{formatHour(proveItData.sunset)}</strong></div>
                  <div>☀ Daylight: <strong>{((proveItData.sunset - proveItData.sunrise + 24) % 24).toFixed(1)}h</strong></div>
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 11, color: "#666", lineHeight: 1.6 }}>
                Verify at <a href={`https://www.timeanddate.com/sun/${proveItCity.name.toLowerCase().replace(/\s+/g, "-")}`} target="_blank" rel="noreferrer" style={{ color: "rgba(100,180,255,0.9)" }}>timeanddate.com ↗</a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: nav bar + globe fills height */}
      <div className="section-right">
        <SectionNav />
        <div className="map-canvas-area">
        {showMapNotes && <div className="map-notes-panel">{MAP_NOTES[showMode]}</div>}

        {showMode === "compare" ? (
          <div className="globe-compare-wrap">
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #d0ccc4", cursor: dragging ? "grabbing" : "grab" }}>
              <div className="map-label">Globe</div>
              <canvas ref={prevCanvasRef} width={canvasW} height={canvasH}
                style={{ display: "block", width: "100%", height: "auto", position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 0 }} />
              <canvas ref={canvasRef} width={canvasW} height={canvasH}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                onTouchStart={e => { e.preventDefault(); if(e.touches.length===1) handleMouseDown(e); }}
                onTouchMove={e => { e.preventDefault(); handleMouseMove(e); }}
                onTouchEnd={e => { e.preventDefault(); handleMouseUp(e); }}
                style={{ display: "block", width: "100%", height: "auto", touchAction: "none", position: "relative", zIndex: 1 }} />
            </div>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #d0ccc4" }}>
              <div className="map-label">Flat Earth map</div>
              <canvas ref={flatCanvasRef} width={GLOBE_S} height={GLOBE_S} style={{ display: "block", width: "100%", height: "auto" }} />
            </div>
          </div>
        ) : (
          <div className="globe-fill" style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #d0ccc4", cursor: dragging ? "grabbing" : "grab" }}>
            <canvas ref={prevCanvasRef} width={canvasW} height={canvasH}
              style={{ display: "block", width: "100%", height: "auto", position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 0 }} />
            <canvas ref={canvasRef} width={canvasW} height={canvasH}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
              onTouchStart={e => { e.preventDefault(); if(e.touches.length===1) handleMouseDown(e); }}
              onTouchMove={e => { e.preventDefault(); handleMouseMove(e); }}
              onTouchEnd={e => { e.preventDefault(); handleMouseUp(e); }}
              style={{ display: "block", width: "100%", height: "auto", touchAction: "none", position: "relative", zIndex: 1 }} />
            {(() => {
              const decl = sunPos.lat; const absDecl = Math.abs(decl);
              let msg = null, cls = "solstice";
              if (absDecl > 22.5) { const s = decl > 0; cls="solstice"; msg = `Near ${s?"summer":"winter"} solstice. Illumination is dramatically offset toward one pole, impossible on a flat Earth disc.`; }
              else if (absDecl < 1.5) { cls="equinox"; msg = "Near equinox. Day and night are nearly equal everywhere, and the terminator runs almost pole-to-pole."; }
              else if (absDecl > 17) { cls="tilt"; const t = decl > 0 ? "Northern" : "Southern"; msg = `Significant axial tilt. Days are growing longer toward the ${t} pole.`; }
              return msg ? <div className={`proof-note ${cls}`} style={{ position: "absolute", bottom: 56, left: 10, right: 10, margin: 0, fontSize: 12 }}>{msg}</div> : null;
            })()}
          </div>
        )}

        {/* Mode controls pinned to bottom of globe */}
        <div className="map-controls-overlay">
          {["globe", "ae", "compare"].map(m => (
            <button key={m} onClick={() => { setShowMode(m); setZoom(1); setPan({ x: 0, y: 0 }); }}
              className={`mode-btn${showMode === m ? " active" : ""}`}>
              {m === "globe" ? "Globe" : m === "ae" ? "Flat Earth map" : "Compare"}
            </button>
          ))}
          <button onClick={() => setShowMapNotes(v => !v)} className={`explain-btn${showMapNotes ? " on" : ""}`}>
            {showMapNotes ? "ⓘ Hide" : "ⓘ Explain"}
          </button>
          <button onClick={() => setShowCities(v => !v)} className={`cities-toggle${showCities ? " on" : ""}`}>
            {showCities ? "Hide cities" : "Show cities"}
          </button>
        </div>

        {showMode === "compare" && (
          <div className="warning-note" style={{ position: "absolute", bottom: 56, left: 12, right: 12, margin: 0, fontSize: 12 }}>
            ⚠️ <strong>Flat earth problem:</strong> The terminator on a flat Earth disc would illuminate half the planet simultaneously — no smooth day/night boundary. Drag the time slider to watch.
          </div>
        )}
        </div>{/* end map-canvas-area */}
      </div>
    </div>
  );
}
