import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { TRAIL_STARS } from "./data.js";
import { sharedDrawMercator } from "./drawing.js";
import { SidebarBrand, SectionNav } from "./chrome.jsx";

// ─── SECTION: STAR TRAILS ─────────────────────────────────────────────────────
// Two simulated long-exposure photographs side by side: the sky a rotating
// globe produces, and the sky the common flat model description produces.
// Same renderer, same star catalogue, different geometry. No verdict in the
// copy — the panels speak for themselves.

const RAD = Math.PI / 180;

// Altitude and azimuth (radians) of a star with declination decDeg, for an
// observer at latDeg, at hour angle H (radians). Azimuth from north, eastward.
function starAltAz(decDeg, latDeg, H) {
  const dec = decDeg * RAD;
  const phi = latDeg * RAD;
  const sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const az = Math.atan2(
    -Math.cos(dec) * Math.sin(H),
    Math.sin(dec) * Math.cos(phi) - Math.cos(dec) * Math.cos(H) * Math.sin(phi)
  );
  return { alt, az };
}

const TRAIL_HOURS = 6;
const TRAIL = TRAIL_HOURS * Math.PI / 12; // hour angle swept by the exposure
const STEPS = 110;

// Draw one long-exposure star-trail panel. Works at every latitude: the
// camera faces the celestial pole the model places in the sky, with the
// horizon and ground in frame so the result reads like a photograph.
// flatEarth=true renders the description most often given for the flat model:
// a single celestial pole above the North Pole that the whole sky turns
// around, so southern latitudes are mirrored to their northern equivalent.
function drawSkyPanel(ctx, S, lat, { flatEarth = false, hA = 0 } = {}) {
  const effLat = flatEarth ? Math.abs(lat) : lat;
  const north = effLat >= 0;
  const poleAltDeg = Math.abs(effLat);
  const az0 = north ? 0 : Math.PI; // camera azimuth: face the visible pole

  // Sky
  ctx.fillStyle = "#04060f";
  ctx.fillRect(0, 0, S, S);

  const horizonY = S * 0.76;
  // Pixels per degree: keep the pole and a generous span of trails in frame
  const ppd = Math.min((S * 0.62) / 90, (horizonY - S * 0.13) / Math.max(30, poleAltDeg));
  const poleY = horizonY - poleAltDeg * ppd;
  const cx = S / 2;
  const sinP = Math.sin(poleAltDeg * RAD), cosP = Math.cos(poleAltDeg * RAD);

  // Map an (alt, az) direction to canvas coords via a pole-centred azimuthal
  // projection, so circumpolar trails stay perfect circles.
  const project = (alt, az) => {
    const dAz = az - az0;
    const sinA = Math.sin(alt), cosA = Math.cos(alt);
    const cosD = sinA * sinP + cosA * cosP * Math.cos(dAz);
    const d = Math.acos(Math.max(-1, Math.min(1, cosD))) / RAD; // degrees from pole
    const beta = Math.atan2(cosA * Math.sin(dAz), sinA * cosP - cosA * sinP * Math.cos(dAz));
    return [cx + d * ppd * Math.sin(beta), poleY - d * ppd * Math.cos(beta), d];
  };

  // Faint glow along the horizon
  const glow = ctx.createLinearGradient(0, horizonY - S * 0.2, 0, horizonY);
  glow.addColorStop(0, "rgba(40,55,95,0)");
  glow.addColorStop(1, "rgba(60,75,115,0.4)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, horizonY - S * 0.2, S, S * 0.2);

  // Star trails
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, S, S); ctx.clip();
  TRAIL_STARS.forEach(([ra, dec, bright]) => {
    const h0 = hA - ra * Math.PI / 12; // hour angle of this star "now"
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i <= STEPS; i++) {
      const h = h0 - TRAIL + (i / STEPS) * TRAIL;
      const { alt, az } = starAltAz(dec, effLat, h);
      if (alt < -0.005) { pen = false; continue; } // below the horizon
      const [x, y, d] = project(alt, az);
      if (d > 120) { pen = false; continue; } // behind the camera
      pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      pen = true;
    }
    ctx.strokeStyle = `rgba(255,248,210,${bright * 0.5})`;
    ctx.lineWidth = Math.max(0.4, bright * 1.4);
    ctx.stroke();

    // Head of the trail — the star now
    const { alt, az } = starAltAz(dec, effLat, h0);
    if (alt >= 0) {
      const [x, y, d] = project(alt, az);
      if (d <= 120) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, bright * 6 + 2);
        g.addColorStop(0, `rgba(255,255,245,${bright * 0.9})`);
        g.addColorStop(1, "rgba(255,255,245,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, bright * 6 + 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, Math.max(0.7, bright * 1.9), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,250,${bright})`;
        ctx.fill();
      }
    }
  });
  ctx.restore();

  // Ground: the horizon is the alt=0 curve in this projection, softened with
  // a low hill silhouette
  ctx.beginPath();
  let first = true;
  for (let a = -120; a <= 120; a += 3) {
    const [x, y] = project(0, az0 + a * RAD);
    const bump = 4 * Math.sin(a * 0.11) + 3 * Math.sin(a * 0.05 + 2);
    first ? ctx.moveTo(x, y - bump) : ctx.lineTo(x, y - bump);
    first = false;
  }
  ctx.lineTo(S + 40, S + 40);
  ctx.lineTo(-40, S + 40);
  ctx.closePath();
  const ground = ctx.createLinearGradient(0, horizonY - 10, 0, S);
  ground.addColorStop(0, "#0c0e09");
  ground.addColorStop(1, "#050604");
  ctx.fillStyle = ground;
  ctx.fill();

  // Centre of rotation marker
  if (poleY < horizonY - 4) {
    const cs = 7;
    ctx.strokeStyle = "rgba(150,190,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - cs, poleY); ctx.lineTo(cx + cs, poleY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, poleY - cs); ctx.lineTo(cx, poleY + cs); ctx.stroke();
    ctx.font = `${Math.round(S / 62)}px monospace`;
    ctx.fillStyle = "rgba(150,190,255,0.55)";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(poleAltDeg)}° above the horizon`, cx, poleY - cs - 6);
  }

  // Caption: plain description of what is drawn
  const facing = north ? "Facing north" : "Facing south";
  const turning = north ? "anticlockwise" : "clockwise";
  ctx.font = `${Math.round(S / 54)}px monospace`;
  ctx.fillStyle = "rgba(200,210,230,0.75)";
  ctx.textAlign = "center";
  ctx.fillText(`${facing} · ${TRAIL_HOURS}-hour exposure · trails turn ${turning}`, cx, S - Math.round(S / 40));
}

const PLACES = [
  ["London", 51.5, -0.1],
  ["New York", 40.7, -74.0],
  ["Quito", -0.2, -78.5],
  ["Singapore", 1.3, 103.8],
  ["Sydney", -33.9, 151.2],
  ["Ushuaia", -54.8, -68.3],
];

const PANEL_S = 760;
const MAP_S = 700;

const STARS_NOTE = "Both panels are simulated camera exposures built from the real coordinates of around fifty bright stars. The globe panel points the camera at whichever celestial pole sits above the horizon for the chosen latitude. There is no universally agreed flat Earth star model; the flat panel shows the description most often given, including by Eric Dubay, DITRH Dave, and Mark Sargent: a single celestial pole above the North Pole, with the whole sky turning around it. Real long-exposure photographs from any location can be compared against either panel.";

export default function StarsSection({ worldData }) {
  const [selected, setSelected] = useState({ lat: 51.5, lon: -0.1 });
  const [showMapNotes, setShowMapNotes] = useState(false);
  const latRef = useRef(51.5);
  const globeSkyRef = useRef(null);
  const flatSkyRef = useRef(null);
  const mapRef = useRef(null);
  const animRef = useRef(null);
  const hARef = useRef(0);

  useEffect(() => { latRef.current = selected.lat; }, [selected]);

  // One RAF loop drives both exposure panels
  useEffect(() => {
    const tick = () => {
      hARef.current += 0.0035;
      const lat = latRef.current;
      if (globeSkyRef.current) {
        drawSkyPanel(globeSkyRef.current.getContext("2d"), PANEL_S, lat, { hA: hARef.current });
      }
      if (flatSkyRef.current) {
        drawSkyPanel(flatSkyRef.current.getContext("2d"), PANEL_S, lat, { hA: hARef.current, flatEarth: true });
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Location picker — same Mercator renderer as the flights section
  useEffect(() => {
    const canvas = mapRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    sharedDrawMercator(ctx, MAP_S, worldData, {
      overlayFn: (ctx2, proj) => {
        const pt = proj([selected.lon, selected.lat]); if (!pt) return;
        ctx2.beginPath(); ctx2.arc(pt[0], pt[1], 7, 0, Math.PI * 2);
        ctx2.fillStyle = "rgba(255,60,60,0.92)"; ctx2.fill();
        ctx2.strokeStyle = "#fff"; ctx2.lineWidth = 2; ctx2.stroke();
      },
    });
  }, [worldData, selected]);

  // Must mirror the projection set up inside sharedDrawMercator (pad 18)
  const handleMapClick = useCallback((e) => {
    const canvas = mapRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (MAP_S / rect.width);
    const y = (e.clientY - rect.top) * (MAP_S / rect.height);
    const proj = d3.geoMercator().scale((MAP_S - 36) / (2 * Math.PI)).translate([MAP_S / 2, MAP_S / 2]);
    const coords = proj.invert([x, y]);
    if (coords && isFinite(coords[0]) && isFinite(coords[1])) {
      setSelected({ lon: coords[0], lat: Math.max(-85, Math.min(85, coords[1])) });
    }
  }, []);

  const latLabel = selected.lat > 0.5 ? `${Math.round(selected.lat)}°N`
    : selected.lat < -0.5 ? `${Math.round(Math.abs(selected.lat))}°S`
    : "the equator";
  const isActivePlace = ([, lat, lon]) =>
    Math.abs(lat - selected.lat) < 0.5 && Math.abs(lon - selected.lon) < 0.5;

  return (
    <div className="section-split">
      <div className="section-left">
        <SidebarBrand />

        <div className="insight-note" style={{ margin: 0 }}>
          Pick anywhere on Earth. Each panel simulates a long-exposure photograph
          of the night sky from that latitude: one drawn on a rotating globe, one
          drawn from the flat model description. Where they differ, a camera and
          a clear night can show which one matches.
        </div>

        <div>
          <div className="ctrl-label" style={{ marginBottom: 8 }}>Choose a place</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PLACES.map(place => (
              <button key={place[0]}
                className={`city-btn${isActivePlace(place) ? " active" : ""}`}
                onClick={() => setSelected({ lat: place[1], lon: place[2] })}>
                {place[0]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Or tap the map</div>
          <canvas ref={mapRef} width={MAP_S} height={MAP_S}
            onClick={handleMapClick}
            style={{ display: "block", width: "100%", height: "auto", cursor: "crosshair", borderRadius: 8 }} />
        </div>

        {selected.lat < -5 && (
          <div className="insight-note" style={{ margin: 0 }}>
            From {latLabel} the two panels show different skies turning in
            different directions. Star trail photographs from Sydney, Cape Town
            or Buenos Aires are easy to find and compare.
          </div>
        )}

        <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>
          Verify it yourself: <a href="https://www.timeanddate.com/astronomy/night/" target="_blank" rel="noreferrer"
            style={{ color: "#1a6ea8" }}>timeanddate.com night sky ↗</a> shows
          tonight's sky for any city, or search "star trails" plus any city for
          real long-exposure photographs.
        </div>
      </div>

      <div className="section-right">
        <SectionNav />
        <div className="map-canvas-area">
          {showMapNotes && <div className="map-notes-panel">{STARS_NOTE}</div>}

          <div className="sky-compare-wrap">
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #d0ccc4", background: "#04060f" }}>
              <div className="map-label">On a globe</div>
              <canvas ref={globeSkyRef} width={PANEL_S} height={PANEL_S}
                style={{ display: "block", width: "100%", height: "auto" }} />
            </div>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #d0ccc4", background: "#04060f" }}>
              <div className="map-label">On a flat earth</div>
              <canvas ref={flatSkyRef} width={PANEL_S} height={PANEL_S}
                style={{ display: "block", width: "100%", height: "auto" }} />
            </div>
          </div>

          <div className="map-controls-overlay">
            <span className="stat-chip">Sky from {latLabel}</span>
            <button className={`explain-btn${showMapNotes ? " on" : ""}`} onClick={() => setShowMapNotes(v => !v)}>
              ⓘ {showMapNotes ? "Hide" : "Explain"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
