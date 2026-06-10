import { useState, useEffect, useRef } from "react";
import { FLIGHT_ROUTES, AIRPORT_DATA, ADJACENCY, ALL_AIRPORT_LIST } from "./data.js";
import { toRad, isVisibleOnGlobe, greatCirclePoints } from "./helpers.js";
import { sharedDrawGlobe, sharedDrawAE, sharedDrawMercator } from "./drawing.js";
import { SidebarBrand, SectionNav } from "./chrome.jsx";
import { MAP_NOTE_GLOBE, MAP_NOTE_AE } from "./copy.js";

// ─── SECTION 3: FLIGHT PATHS ──────────────────────────────────────────────────

function gcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)));
}

// Build a "route" object from two airport entries (mirroring FLIGHT_ROUTES shape)
function airportRoute(from, to) {
  return {
    id: `${from.iata}-${to.iata}`,
    name: `${from.name} → ${to.name}`,
    from: { name: from.name, lat: from.lat, lon: from.lon, iata: from.iata },
    to:   { name: to.name,   lat: to.lat,   lon: to.lon,   iata: to.iata   },
    color: "#60c8f0",
    curated: false,
  };
}


export default function FlightSection({ worldData }) {
  const [activeRoute, setActiveRoute] = useState(null);
  const [fromIata, setFromIata] = useState("SYD");
  const [toIata,   setToIata]   = useState("JNB");
  const [viewMode, setViewMode] = useState("globe");
  const [animProgress, setAnimProgress] = useState(0);
  const [globeRotation, setGlobeRotation] = useState([0, 0]);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showMapNotes, setShowMapNotes] = useState(false);
  const rotRef = useRef([0, 0]);
  const animRef = useRef(null);
  const trackRef = useRef(true);
  const canvasRef = useRef(null);
  const prevCanvasRef = useRef(null);
  const fadeRafRef = useRef(null);
  const prevViewModeRef = useRef(null);
  const GLOBE_S = 900;

  const MAP_NOTES = {
    globe: MAP_NOTE_GLOBE,
    mercator: "Try peeling an orange and pressing the skin flat. It's mathematically impossible without distorting it. The Mercator map projection is one solution to that problem: it preserves the shape of landmasses but distorts their size, which is why Greenland in the north and Antarctica in the south look greatly exaggerated. It's used by Google Maps, most flight booking sites, and countless classroom walls. When you see a curved flight path on the screen in the back of the seat in front of you, that's this map. The curve isn't the pilot going the long way round. It's the shortest path drawn on a distorted surface.",
    ae: MAP_NOTE_AE,
  };

  // When dropdowns change, update active route
  function handleRouteChange(newFromIata, newToIata) {
    const from = AIRPORT_DATA[newFromIata];
    const to   = AIRPORT_DATA[newToIata];
    if (!from || !to || newFromIata === newToIata) return;
    const curated = FLIGHT_ROUTES.find(
      r => r.from.name === from.name && r.to.name === to.name
    );
    if (curated) {
      setActiveRoute({ ...curated, from: { ...curated.from, iata: newFromIata }, to: { ...curated.to, iata: newToIata }, curated: true });
    } else {
      setActiveRoute(airportRoute({ iata: newFromIata, ...from }, { iata: newToIata, ...to }));
    }
  }

  // Airports reachable from the current From selection
  const reachableIatas = ADJACENCY[fromIata] || new Set();

  // Auto-rotate globe to focus on route, then track plane.
  // Intentional one-shot camera snap when the route changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!activeRoute) return;
    trackRef.current = true;
    const r = activeRoute;
    const midLon = (r.from.lon + r.to.lon) / 2;
    const midLat = (r.from.lat + r.to.lat) / 2;
    setGlobeRotation([-midLon, -midLat]);
    rotRef.current = [-midLon, -midLat];
    setAnimProgress(0);
  }, [activeRoute]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Animate flight — tracks plane on globe when trackRef is true
  useEffect(() => {
    if (!activeRoute) return;
    const r = activeRoute;
    const gcPts = viewMode === "globe" ? greatCirclePoints(r.from.lat, r.from.lon, r.to.lat, r.to.lon, 100) : null;
    let start = null;
    const duration = 3000;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setAnimProgress(p);
      if (viewMode === "globe" && trackRef.current && gcPts && gcPts.length > 0) {
        const gcCount = Math.max(1, Math.floor(gcPts.length * p));
        const [pLon, pLat] = gcPts[gcCount - 1];
        const newRot = [-pLon, -pLat * 0.75];
        setGlobeRotation(newRot);
        rotRef.current = newRot;
      }
      if (p < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [activeRoute, viewMode]);

  // Crossfade: snapshot old frame into prevCanvas, hide the active canvas, then fade it back in.
  // Direct DOM manipulation bypasses React's async render cycle so the opacity:0 frame actually paints.
  useEffect(() => {
    const prevMode = prevViewModeRef.current;
    prevViewModeRef.current = viewMode;
    if (prevMode === null || prevMode === viewMode) return;
    const canvas = canvasRef.current;
    const prev = prevCanvasRef.current;
    if (!canvas || !prev) return;

    // Copy current frame to the background canvas
    const pctx = prev.getContext("2d");
    pctx.clearRect(0, 0, GLOBE_S, GLOBE_S);
    pctx.drawImage(canvas, 0, 0);

    // Hide the active canvas immediately — no transition yet
    canvas.style.transition = "none";
    canvas.style.opacity = "0";

    // The draw effect (defined next) runs synchronously in the same commit and paints
    // the new projection while the canvas is hidden. Then we fade it in.
    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    fadeRafRef.current = requestAnimationFrame(() => {
      fadeRafRef.current = requestAnimationFrame(() => {
        canvas.style.transition = "opacity 700ms ease";
        canvas.style.opacity = "1";
      });
    });
    return () => { if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current); };
  }, [viewMode]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || !worldData) return;
    const ctx = canvas.getContext("2d");

    if (!activeRoute) {
      const opts = { graticuleVisible: showMapNotes, flatLight: true };
      if (viewMode === "ae") sharedDrawAE(ctx, GLOBE_S, worldData, zoom, {x:0,y:0}, null, opts);
      else if (viewMode === "mercator") sharedDrawMercator(ctx, GLOBE_S, worldData, opts);
      else sharedDrawGlobe(ctx, GLOBE_S, worldData, globeRotation, zoom, null, opts);
      return;
    }

    const r = activeRoute;
    const gcPts = greatCirclePoints(r.from.lat, r.from.lon, r.to.lat, r.to.lon, 100);
    const gcCount = Math.floor(gcPts.length * animProgress);

    // Route overlay drawn on top of base map
    const routeOverlay = (ctx2, proj) => {
      // Flat earth "direct" dashed line (AE only)
      if (viewMode === "ae") {
        const fFrom=proj([r.from.lon,r.from.lat]), fTo=proj([r.to.lon,r.to.lat]);
        if(fFrom&&fTo){ctx2.strokeStyle="rgba(255,80,80,0.6)";ctx2.lineWidth=2;ctx2.setLineDash([8,4]);ctx2.beginPath();ctx2.moveTo(fFrom[0],fFrom[1]);ctx2.lineTo(fTo[0],fTo[1]);ctx2.stroke();ctx2.setLineDash([]);}
      }
      // Great circle — with antimeridian break for Mercator
      if (gcCount > 1) {
        let started=false, prevLon=null;
        ctx2.beginPath();
        gcPts.slice(0,gcCount).forEach(([lon,lat])=>{
          const visible = viewMode === "globe" ? isVisibleOnGlobe(lat, lon, globeRotation) : true;
          const pt = proj([lon,lat]);
          // Break path on antimeridian jump (>180° longitude change) — globe projection handles wrap natively
          const antimeridianJump = viewMode !== "globe" && prevLon !== null && Math.abs(lon - prevLon) > 180;
          if(!pt || !visible || antimeridianJump){started=false; prevLon=lon; return;}
          started?ctx2.lineTo(pt[0],pt[1]):ctx2.moveTo(pt[0],pt[1]);
          started=true; prevLon=lon;
        });
        ctx2.strokeStyle=r.color; ctx2.lineWidth=2.5; ctx2.stroke();
      }
      // City markers
      [[r.from,"FROM"],[r.to,"TO"]].forEach(([city,label])=>{
        const cityVisible = viewMode === "globe" ? isVisibleOnGlobe(city.lat, city.lon, globeRotation) : true;
        const pt=proj([city.lon,city.lat]);if(!pt||!cityVisible)return;
        ctx2.beginPath();ctx2.arc(pt[0],pt[1],6,0,Math.PI*2);ctx2.fillStyle=r.color;ctx2.fill();
        ctx2.strokeStyle="#fff";ctx2.lineWidth=1.5;ctx2.stroke();
        ctx2.fillStyle="#fff";ctx2.font="bold 11px monospace";ctx2.textAlign="center";
        ctx2.fillText(city.name,pt[0],pt[1]-12);
        ctx2.fillStyle="rgba(255,255,255,0.45)";ctx2.font="9px monospace";ctx2.fillText(label,pt[0],pt[1]-22);
      });
      // Plane
      if(gcCount>0&&gcCount<gcPts.length){
        const [pLon,pLat]=gcPts[gcCount-1];
        const planeVisible = viewMode === "globe" ? isVisibleOnGlobe(pLat, pLon, globeRotation) : true;
        const pt=proj([pLon,pLat]);
        if(pt&&planeVisible){ctx2.font="18px sans-serif";ctx2.textAlign="center";ctx2.fillText("✈",pt[0],pt[1]+6);}
      }
      // Legend
      if (viewMode === "ae" || viewMode === "mercator") {
        const ly=GLOBE_S-36;
        if (viewMode === "ae") {
          ctx2.setLineDash([8,4]);ctx2.beginPath();ctx2.moveTo(14,ly);ctx2.lineTo(44,ly);
          ctx2.strokeStyle="rgba(255,80,80,0.6)";ctx2.lineWidth=2;ctx2.stroke();ctx2.setLineDash([]);
          ctx2.fillStyle="rgba(255,100,100,0.85)";ctx2.font="11px monospace";ctx2.textAlign="left";
          ctx2.fillText('"Flat Earth" direct line',50,ly+4);
          ctx2.beginPath();ctx2.moveTo(14,ly+16);ctx2.lineTo(44,ly+16);
          ctx2.strokeStyle=r.color;ctx2.lineWidth=2.5;ctx2.stroke();
          ctx2.fillStyle=r.color;ctx2.fillText("Actual route",50,ly+20);
        } else {
          ctx2.beginPath();ctx2.moveTo(14,ly);ctx2.lineTo(44,ly);
          ctx2.strokeStyle=r.color;ctx2.lineWidth=2.5;ctx2.stroke();
          ctx2.fillStyle=r.color;ctx2.font="11px monospace";ctx2.textAlign="left";
          ctx2.fillText("Actual route",50,ly+4);
        }
      }
    };

    const opts = { overlayFn: routeOverlay, graticuleVisible: showMapNotes, flatLight: true };
    if (viewMode === "ae") {
      sharedDrawAE(ctx, GLOBE_S, worldData, zoom, {x:0,y:0}, null, opts);
    } else if (viewMode === "mercator") {
      sharedDrawMercator(ctx, GLOBE_S, worldData, opts);
    } else {
      sharedDrawGlobe(ctx, GLOBE_S, worldData, globeRotation, zoom, null, opts);
    }
  }, [activeRoute, viewMode, animProgress, globeRotation, worldData, showMapNotes, zoom]);

  const flightPinchDist = useRef(null);
  const handleMouseDown = e => {
    if (e.touches && e.touches.length === 2) return;
    if (viewMode === "globe") {
      trackRef.current = false;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      setDragging(true); setDragStart({ x, y }); rotRef.current = [...globeRotation];
    }
  };
  const handleMouseMove = e => {
    if (e.touches && e.touches.length === 2) return; // pinch handled by addEventListener
    flightPinchDist.current = null;
    if (viewMode === "globe" && dragging && dragStart) {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      setGlobeRotation([rotRef.current[0]+(x-dragStart.x)*0.5, rotRef.current[1]-(y-dragStart.y)*0.5]);
    }
  };
  const handleMouseUp = e => { if(e?.touches?.length>0) return; flightPinchDist.current=null; setDragging(false); setDragStart(null); };

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const onWheel = e => { if (navigator.maxTouchPoints > 1) return; e.preventDefault(); setZoom(z => Math.min(6, Math.max(0.3, z * (e.deltaY < 0 ? 1.25 : 1/1.25)))); };
    let pinchDist = null;
    const onTS = e => { if (e.touches.length === 2) { pinchDist = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY); } };
    const onTM = e => { if (e.touches.length === 2 && pinchDist) { e.preventDefault(); const d = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY); setZoom(z => Math.min(6, Math.max(0.3, z * d/pinchDist))); pinchDist = d; } };
    const onTE = () => { pinchDist = null; };
    c.addEventListener("wheel", onWheel, { passive: false });
    c.addEventListener("touchstart", onTS, { passive: false });
    c.addEventListener("touchmove", onTM, { passive: false });
    c.addEventListener("touchend", onTE);
    return () => { c.removeEventListener("wheel", onWheel); c.removeEventListener("touchstart", onTS); c.removeEventListener("touchmove", onTM); c.removeEventListener("touchend", onTE); };
  }, []);

  const selectStyle = {
    padding: "6px 10px", border: "1.5px solid #d0ccc4", borderRadius: 6,
    background: "#fff", fontSize: 13, color: "#1a1a1a", cursor: "pointer",
    appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", paddingRight: 24,
  };

  const distKm = activeRoute ? gcDistanceKm(activeRoute.from.lat, activeRoute.from.lon, activeRoute.to.lat, activeRoute.to.lon) : 0;
  const fcUrl = activeRoute ? `https://www.flightconnections.com/flights-from-${activeRoute.from.name.toLowerCase().replace(/\s+/g,"-")}-${(activeRoute.from.iata||"").toLowerCase()}-to-${activeRoute.to.name.toLowerCase().replace(/\s+/g,"-")}-${(activeRoute.to.iata||"").toLowerCase()}` : "";

  return (
    <div className="section-split">
      <div className="section-left">
        <SidebarBrand />
        {/* Curated route quick-select */}
        <div>
          <div className="ctrl-label">Quick routes</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FLIGHT_ROUTES.map(r => (
              <button key={r.id}
                className={`mode-btn${activeRoute?.id === r.id ? " active" : ""}`}
                onClick={() => {
                  const fromA = Object.entries(AIRPORT_DATA).find(([,d]) => d.name === r.from.name);
                  const toA   = Object.entries(AIRPORT_DATA).find(([,d]) => d.name === r.to.name);
                  if (!fromA || !toA) return;
                  setFromIata(fromA[0]); setToIata(toA[0]);
                  setActiveRoute({ ...r, from: { ...r.from, iata: fromA[0] }, to: { ...r.to, iata: toA[0] }, curated: true });
                }}>
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* Route selector dropdowns */}
        <div>
          <div className="ctrl-label">Custom route</div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>From</span>
            <select value={fromIata} style={selectStyle} onChange={e => {
              const v = e.target.value;
              setFromIata(v);
              const newReachable = ADJACENCY[v] || new Set();
              const newTo = newReachable.has(toIata) ? toIata : [...newReachable][0];
              setToIata(newTo);
              handleRouteChange(v, newTo);
            }}>
              {ALL_AIRPORT_LIST.map(a => <option key={a.iata} value={a.iata}>{a.name}</option>)}
            </select>
            <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>To</span>
            <select value={toIata} style={selectStyle} onChange={e => {
              const v = e.target.value; setToIata(v); handleRouteChange(fromIata, v);
            }}>
              {ALL_AIRPORT_LIST.filter(a => reachableIatas.has(a.iata)).map(a => <option key={a.iata} value={a.iata}>{a.name}</option>)}
            </select>
          </div>
          {activeRoute && (
            <button onClick={() => { setAnimProgress(0); setTimeout(() => { let s = null; const a = ts => { if (!s) s = ts; const p = Math.min((ts - s) / 3000, 1); setAnimProgress(p); if (p < 1) requestAnimationFrame(a); }; requestAnimationFrame(a); }, 10); }} className="mode-btn" style={{ marginTop: 8 }}>↺ Replay</button>
          )}
        </div>

        {/* Route info */}
        {activeRoute ? (
          <div className="insight-note" style={{ margin: 0, borderLeft: `4px solid ${activeRoute.color}` }}>
            {activeRoute.curated ? (
              <>
                <strong style={{ color: "#1a1a1a" }}>{activeRoute.name}:</strong> {activeRoute.description}
                <div style={{ marginTop: 6, color: "#c04020" }}>⚠️ Flat Earth problem: {activeRoute.flatEarthProblem}</div>
              </>
            ) : (
              <>
                <strong style={{ color: "#1a1a1a" }}>{activeRoute.name}</strong>
                <div style={{ marginTop: 4, color: "#444", fontSize: 13 }}>
                  Shortest path distance: <strong>{distKm.toLocaleString()} km</strong>
                </div>
              </>
            )}
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
              <a href={fcUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: "#1a6ea8", textDecoration: "none", borderBottom: "1px solid #a0c4e0" }}>
                FlightConnections ↗
              </a>
              <a href={`https://www.flightradar24.com/airport/${(activeRoute.from.iata || "").toLowerCase()}/departures`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: "#1a6ea8", textDecoration: "none", borderBottom: "1px solid #a0c4e0" }}>
                FR24 departures ↗
              </a>
              {activeRoute.fr24Hint && (
                <span style={{ fontSize: 12, color: "#888" }}>{activeRoute.fr24Hint}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="insight-note" style={{ margin: 0, color: "#888" }}>
            Select a route above to see the flight path and details.
          </div>
        )}

        {/* Fact */}
        <div style={{ padding: "12px 16px", background: "#fff", border: "1.5px solid #e0dcd4", borderRadius: 8, fontSize: 13, color: "#444", lineHeight: 1.7 }}>
          💡 The shortest path between two points on a sphere looks curved on a flat map, not because the route bends, but because the map does. Every commercial airline uses spherical geometry for navigation.
        </div>
      </div>

      <div className="section-right">
        <SectionNav />
        <div className="map-canvas-area">
          {showMapNotes && <div className="map-notes-panel">{MAP_NOTES[viewMode]}</div>}
          <div className="globe-fill" style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #d0ccc4", cursor: viewMode === "globe" ? (dragging ? "grabbing" : "grab") : "default" }}>
            <canvas ref={prevCanvasRef} width={GLOBE_S} height={GLOBE_S}
              style={{ display: "block", width: "100%", height: "auto", position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 0 }} />
            <canvas ref={canvasRef} width={GLOBE_S} height={GLOBE_S}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
              onTouchStart={e => { e.preventDefault(); handleMouseDown(e); }}
              onTouchMove={e => { e.preventDefault(); handleMouseMove(e); }}
              onTouchEnd={e => { e.preventDefault(); handleMouseUp(e); }}
              style={{ display: "block", width: "100%", height: "auto", touchAction: "none", position: "relative", zIndex: 1 }} />
          </div>
          <div className="map-controls-overlay">
            {["globe", "mercator", "ae"].map(m => (
              <button key={m} onClick={() => { setViewMode(m); setZoom(1); }} className={`mode-btn${viewMode === m ? " active" : ""}`}>
                {m === "globe" ? "Globe" : m === "mercator" ? "Mercator" : "Flat Earth map"}
              </button>
            ))}
            <button className={`explain-btn${showMapNotes ? " on" : ""}`} onClick={() => setShowMapNotes(v => !v)}>
              ⓘ {showMapNotes ? "Hide" : "Explain"}
            </button>
          </div>
        </div>{/* end map-canvas-area */}
      </div>
    </div>
  );
}
