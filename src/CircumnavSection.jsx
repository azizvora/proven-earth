import { useState, useEffect, useRef } from "react";
import { toRad, toDeg, isVisibleOnGlobe } from "./helpers.js";
import { sharedDrawGlobe, sharedDrawAE } from "./drawing.js";
import { SidebarBrand, SectionNav } from "./chrome.jsx";
import { MAP_NOTE_GLOBE, MAP_NOTE_AE } from "./copy.js";

// ─── SECTION 4: CIRCUMNAVIGATION ─────────────────────────────────────────────

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
    description: "First confirmed circumnavigation of Antarctica. The Russian sloop-of-war Vostok departed Kronstadt, sailed south of 60°S throughout, and returned, proving Antarctica was a continent encircling the South Pole, not scattered islands.",
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
    description: "Every solo circumnavigation must pass the three great southern capes: Cape Horn (South America), Cape of Good Hope (South Africa), and Cape Leeuwin (Australia), all south of 34°S. The routes are only consistent with a spherical Earth.",
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
    description: "Contemporary vessels circumnavigate Antarctica in as little as 60 days, staying south of 60°S. The route is approximately 24,000 km, less than 5% of the 500,000+ km that a flat earth perimeter would require.",
    // Pure southern ocean loop, staying ~60-65°S
    points: gcRoute([
      [0,-63],[40,-65],[80,-63],[120,-61],[160,-60],
      [-160,-61],[-120,-63],[-80,-62],[-40,-64],[0,-63]
    ], 40),
  },
];

export default function CircumnavSection({ worldData }) {
  const canvasRef = useRef(null);
  const [highlighted, setHighlighted] = useState(null);
  const [viewMode, setViewMode] = useState("globe");
  const [globeRotation, setGlobeRotation] = useState([0, 25]);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showMapNotes, setShowMapNotes] = useState(false);
  const rotRef = useRef([0, 25]);
  const animRef = useRef(null);
  const frameRef = useRef(0);
  const prevCanvasRef = useRef(null);
  const fadeRafRef = useRef(null);
  const prevViewModeRef = useRef(null);
  const circumTrackRef = useRef(false);
  const GLOBE_S = 900;

  const MAP_NOTES = {
    globe: MAP_NOTE_GLOBE,
    ae: MAP_NOTE_AE,
  };

  // Centre globe on highlighted route and start tracking.
  // Intentional one-shot camera snap when the highlight changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!highlighted || viewMode !== "globe") return;
    circumTrackRef.current = true;
    const route = ROUTES.find(r => r.id === highlighted);
    if (!route || !route.points.length) return;
    const mid = route.points[Math.floor(route.points.length / 2)];
    const [midLon, midLat] = mid;
    setGlobeRotation([-midLon, -midLat * 0.6]);
    rotRef.current = [-midLon, -midLat * 0.6];
  }, [highlighted]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  // Crossfade on map mode change
  useEffect(() => {
    const prevMode = prevViewModeRef.current;
    prevViewModeRef.current = viewMode;
    if (prevMode === null || prevMode === viewMode) return;
    const canvas = canvasRef.current;
    const prev = prevCanvasRef.current;
    if (!canvas || !prev) return;
    const pctx = prev.getContext("2d");
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
  }, [viewMode]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const draw = () => {
      frameRef.current++;
      // Track the route head when circumTrackRef is active
      let renderRot = globeRotation;
      if (highlighted && circumTrackRef.current && viewMode === "globe") {
        const tRoute = ROUTES.find(r => r.id === highlighted);
        if (tRoute) {
          const prog = Math.min(1, (frameRef.current % 120) / 80);
          const pc = Math.floor(tRoute.points.length * prog);
          if (pc > 0) { const [tLon, tLat] = tRoute.points[pc - 1]; renderRot = [-tLon, -tLat * 0.6]; }
        }
      }
      const routeOverlay = (ctx2, proj) => {
        ROUTES.forEach(route => {
          const isHigh = highlighted === route.id;
          const progress = isHigh ? Math.min(1,(frameRef.current%120)/80) : 1;
          const ptCount = Math.floor(route.points.length * progress);
          if (ptCount < 2) return;
          ctx2.beginPath(); let started=false;
          route.points.slice(0,ptCount).forEach(([lon,lat])=>{const pt=proj([lon,lat]);const vis=viewMode==="globe"?isVisibleOnGlobe(lat,lon,renderRot):true;if(!pt||!vis){started=false;return;}started?ctx2.lineTo(pt[0],pt[1]):ctx2.moveTo(pt[0],pt[1]);started=true;});
          ctx2.strokeStyle=isHigh?route.color:route.color+"99"; ctx2.lineWidth=isHigh?3:2; ctx2.stroke();
          if(ptCount>=2){const pt2=proj(route.points[ptCount-1]),pt1=proj(route.points[ptCount-2]);
            if(pt1&&pt2){const ang=Math.atan2(pt2[1]-pt1[1],pt2[0]-pt1[0]);
              ctx2.beginPath();ctx2.moveTo(pt2[0],pt2[1]);
              ctx2.lineTo(pt2[0]-10*Math.cos(ang-0.4),pt2[1]-10*Math.sin(ang-0.4));
              ctx2.lineTo(pt2[0]-10*Math.cos(ang+0.4),pt2[1]-10*Math.sin(ang+0.4));
              ctx2.closePath();ctx2.fillStyle=isHigh?route.color:route.color+"99";ctx2.fill();}}
        });
      };
      const circumOpts = { overlayFn: routeOverlay, graticuleVisible: showMapNotes, flatLight: true };
      if (viewMode === "globe") {
        sharedDrawGlobe(ctx, GLOBE_S, worldData, renderRot, zoom, null, circumOpts);
      } else {
        sharedDrawAE(ctx, GLOBE_S, worldData, zoom, {x:0,y:0}, null, circumOpts);
      }
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [worldData, highlighted, globeRotation, viewMode, zoom, showMapNotes]);

  const circumPinchDist = useRef(null);
  const handleMouseDown = e => {
    circumTrackRef.current = false;
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
    const onWheel = e => { if (navigator.maxTouchPoints > 1) return; e.preventDefault(); const d = e.deltaY < 0 ? 1.25 : 1/1.25; setZoom(z => Math.min(6, Math.max(0.3, z*d))); };
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
    <div className="section-split">
      <div className="section-left">
        <SidebarBrand />
        <div className="insight-note" style={{ margin: 0 }}>
          If Antarctica were an "ice wall" at the edge of a flat disc, circumnavigating it would mean travelling around the entire perimeter of the known world, over 500,000 km. In reality, ships and aircraft cross the Southern Ocean routinely. Antarctica has been circumnavigated dozens of times, on routes consistent only with a spherical Earth.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="ctrl-label">Routes</div>
          {ROUTES.map(route => (
            <div key={route.id}
              onClick={() => setHighlighted(highlighted === route.id ? null : route.id)}
              style={{ padding: "12px 16px", background: "#fff", border: `1.5px solid ${highlighted === route.id ? route.color : "#d0ccc4"}`, borderLeft: `4px solid ${route.color}`, borderRadius: 8, cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a", marginBottom: 4 }}>{route.name}</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{route.description}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "#aaa", fontStyle: "italic", textAlign: "center" }}>
          Click a route to animate it. Drag the globe to explore.
        </div>
      </div>

      <div className="section-right">
        <SectionNav />
        <div className="map-canvas-area">
          {showMapNotes && <div className="map-notes-panel">{MAP_NOTES[viewMode]}</div>}
          <div className="globe-fill" style={{ borderRadius: viewMode==="ae"?0:12, overflow: viewMode==="ae"?"visible":"hidden", border: viewMode==="ae"?"none":"1px solid #d0ccc4", cursor: viewMode === "globe" ? (dragging ? "grabbing" : "grab") : "default" }}>
            <canvas ref={prevCanvasRef} width={GLOBE_S} height={GLOBE_S}
              style={{ display: "block", width: "100%", height: "auto", position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 0 }} />
            <canvas ref={canvasRef} width={GLOBE_S} height={GLOBE_S}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
              onTouchStart={e => { e.preventDefault(); handleMouseDown(e); }}
              onTouchMove={e => { e.preventDefault(); handleMouseMove(e); }}
              onTouchEnd={e => { e.preventDefault(); handleMouseUp(e); }}
              style={{ display: "block", width: "100%", height: "auto", touchAction: "none", position: "relative", zIndex: 1 }} />
          </div>
          <div className="map-controls-overlay">
            {["globe", "ae"].map(m => (
              <button key={m} onClick={() => { setViewMode(m); setZoom(1); }}
                className={`mode-btn${viewMode === m ? " active" : ""}`}>
                {m === "globe" ? "Globe" : "Flat Earth map"}
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
