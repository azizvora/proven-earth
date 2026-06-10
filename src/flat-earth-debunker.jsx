// ─── APP SHELL ────────────────────────────────────────────────────────────────
// Routes, world-data loading, and the shared stylesheet. Sections live in
// their own files; shared brand/nav/copy in chrome.jsx; map rendering in
// drawing.js.

import { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { feature } from "topojson-client";
import SolarSection from "./SolarSection.jsx";
import StarsSection from "./StarsSection.jsx";
import FlightSection from "./FlightSection.jsx";
import CircumnavSection from "./CircumnavSection.jsx";
import NewsTicker from "./NewsTicker.jsx";

export default function App() {
  const [worldData, setWorldData] = useState(null);
  const [mapError, setMapError] = useState(false);

  // Land outlines served from /public — no runtime third-party dependency
  const fetchWorld = useCallback(() => {
    fetch("/countries-110m.json")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(topo => setWorldData(feature(topo, topo.objects.countries)))
      .catch(() => setMapError(true));
  }, []);
  useEffect(() => { fetchWorld(); }, [fetchWorld]);

  return (
    <>
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Barlow+Condensed:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; height: 100%; overflow: hidden; background: #f0ece4; }
        .ctrl-label { font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-bottom: 6px; font-weight: 500; }
        .ctrl-input { background: #fff; color: #1a1a1a; border: 1.5px solid #d0ccc4; border-radius: 6px; padding: 8px 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.15s; }
        .ctrl-input:focus { border-color: #1a1a1a; }
        select.ctrl-input option { background: #fff; color: #1a1a1a; }
        input[type=date].ctrl-input { color-scheme: light; appearance: auto; }
        input[type=range] { accent-color: #1a1a1a; cursor: pointer; }
        .mode-btn { background: #fff; border: 1.5px solid #d0ccc4; border-radius: 6px; padding: 9px 18px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: #666; transition: all 0.15s; }
        .mode-btn:hover { border-color: #1a1a1a; color: #1a1a1a; }
        .mode-btn.active { border-color: #1a1a1a; background: #1a1a1a; color: #f0ece4; }
        .stat-chip { background: #fff; border: 1.5px solid #d0ccc4; border-radius: 6px; padding: 5px 12px; font-size: 13px; letter-spacing: 0.02em; white-space: nowrap; color: #444; }
        .city-btn { background: #fff; border: 1.5px solid #d0ccc4; border-radius: 6px; padding: 6px 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #666; transition: all 0.15s; }
        .city-btn:hover { border-color: #1a1a1a; color: #1a1a1a; }
        .city-btn.active { border-color: #1a1a1a; background: #1a1a1a; color: #f0ece4; }
        .map-label { position: absolute; top: 8px; left: 12px; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); z-index: 5; font-weight: 500; }
        .nav-tabs-group { display: flex; background: rgba(0,0,0,0.07); padding: 3px; border-radius: 8px; gap: 2px; flex-wrap: wrap; }
        .nav-tab { background: none; border: none; border-radius: 6px; padding: 7px 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #666; letter-spacing: 0.01em; transition: all 0.15s; white-space: nowrap; }
        .nav-tab:hover { color: #1a1a1a; background: rgba(255,255,255,0.5); }
        .nav-tab.active { background: #fff; color: #1a1a1a; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
        @media (max-width: 640px) {
          .nav-tabs-group { width: 100%; }
          .nav-tab { flex: 1; text-align: center; padding: 8px 10px; font-size: 11px; }
          input[type=range] { height: 20px; }
          input[type=range]::-webkit-slider-thumb { width: 24px; height: 24px; }
          input[type=range]::-moz-range-thumb { width: 24px; height: 24px; }
          .solar-canvas-wrapper { order: -1; margin-bottom: 12px; }
        }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-inner { display: flex; align-items: center; height: 100%; animation: ticker 90s linear infinite; white-space: nowrap; will-change: transform; }
        .ticker-inner:hover { animation-play-state: paused; }
        .proof-note { padding: 12px 16px; border-radius: 8px; font-size: 14px; line-height: 1.7; margin-bottom: 12px; }
        .proof-note.solstice { background: #fffbe6; border: 1.5px solid #f0d060; color: #7a5a00; }
        .proof-note.equinox { background: #e8f4fb; border: 1.5px solid #90c8e8; color: #1a4a6a; }
        .proof-note.tilt { background: #fff0e6; border: 1.5px solid #f0a860; color: #7a3a00; }
        .insight-note { margin-top: 12px; padding: 12px 16px; background: #fff; border: 1.5px solid #e0dcd4; border-radius: 8px; font-size: 14px; color: #444; line-height: 1.7; }
        .warning-note { margin-top: 12px; padding: 12px 16px; background: #fff5f5; border: 1.5px solid #f0b8b8; border-radius: 8px; font-size: 14px; color: #8a2020; line-height: 1.7; }
        .prove-card { margin-top: 10px; background: #fff; border: 1.5px solid #d0ccc4; border-radius: 10px; padding: 14px 18px; }
        .map-error { flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 8px 16px; background: #fff5f5; border-top: 1.5px solid #f0b8b8; color: #8a2020; font-size: 13px; font-family: 'DM Sans', sans-serif; }
        .map-error button { background: #fff; border: 1.5px solid #8a2020; border-radius: 6px; padding: 3px 12px; cursor: pointer; font-family: inherit; font-size: 12px; color: #8a2020; }
        /* ── Layout ── */
        .app-shell { height: 100vh; display: flex; flex-direction: column; background: #f0ece4; font-family: 'DM Sans','Helvetica Neue',sans-serif; color: #1a1a1a; overflow: hidden; }
        .site-header { display: flex; align-items: center; gap: 24px; padding: 20px 32px; border-bottom: 1.5px solid #d0ccc4; flex-shrink: 0; }
        .header-brand { flex-shrink: 0; }
        .site-title { font-family: 'Barlow Condensed',sans-serif; font-size: clamp(52px,6.5vw,108px); font-weight: 900; margin: 0; letter-spacing: -0.01em; line-height: 0.88; text-transform: uppercase; color: #1a1a1a; cursor: pointer; }
        .site-desc { font-size: 15px; color: #666; margin: 14px 0 0; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 500; line-height: 1.6; }
        .header-center { flex: 1; display: flex; justify-content: center; align-items: center; }
        .header-nav { display: flex; align-items: center; gap: 3px; background: rgba(0,0,0,0.06); padding: 3px; border-radius: 8px; }
        .header-nav .nav-tab { display: flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 6px; background: none; border: none; font-family: 'DM Sans',sans-serif; font-size: 13px; font-weight: 500; color: #777; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .header-nav .nav-tab:hover { color: #1a1a1a; background: rgba(255,255,255,0.5); }
        .header-nav .nav-tab.active { background: #fff; color: #1a1a1a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .nav-icon { font-size: 14px; line-height: 1; }
        .header-meta { flex-shrink: 0; min-width: 160px; max-width: 200px; text-align: right; font-size: 13px; color: #aaa; line-height: 1.55; }
        .body-area { flex: 1; display: flex; min-height: 0; overflow: hidden; }
        .section-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 20px 24px 32px; -webkit-overflow-scrolling: touch; }
        /* ── Section split ── */
        .section-split { flex: 1; display: flex; min-height: 0; overflow: hidden; }
        .section-left { width: 33%; flex-shrink: 0; overflow-y: auto; padding: 20px 24px 28px; border-right: none; display: flex; flex-direction: column; gap: 16px; -webkit-overflow-scrolling: touch; }
        .section-right { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .map-canvas-area { flex: 1; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .globe-fill { height: 100%; aspect-ratio: 1/1; max-width: 100%; position: relative; flex-shrink: 0; }
        .globe-fill canvas { display: block; width: 100%; height: auto; }
        .globe-compare-wrap { height: 100%; width: 100%; display: flex; gap: 10px; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box; }
        .globe-compare-wrap > div { height: 100%; aspect-ratio: 1/1; max-width: calc(50% - 5px); flex-shrink: 0; position: relative; }
        .globe-compare-wrap canvas { display: block; width: 100%; height: auto; }
        .sky-compare-wrap { height: 100%; width: 100%; display: flex; gap: 10px; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box; }
        .sky-compare-wrap > div { width: min(calc(50% - 5px), calc(100vh - 160px)); aspect-ratio: 1/1; flex-shrink: 0; position: relative; }
        .sky-compare-wrap canvas { display: block; width: 100%; height: auto; }
        .map-controls-overlay { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 6px; background: rgba(240,236,228,0.93); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); padding: 6px 10px; border-radius: 8px; border: 1px solid #d0ccc4; z-index: 10; white-space: nowrap; flex-wrap: wrap; justify-content: center; }
        .map-notes-panel { position: absolute; top: 12px; left: 12px; right: 12px; z-index: 10; padding: 12px 16px; background: rgba(248,245,239,0.96); border: 1.5px solid #e0dcd4; border-radius: 8px; font-size: 14px; color: #444; line-height: 1.75; }
        .explain-btn { font-size: 13px; color: #888; background: none; border: none; cursor: pointer; padding: 4px 6px; text-decoration: underline; text-decoration-style: dotted; font-family: 'DM Sans',sans-serif; transition: color 0.15s; }
        .explain-btn:hover, .explain-btn.on { color: #1a1a1a; }
        .cities-toggle { font-size: 12px; color: #bbb; background: none; border: none; border-bottom: 1px solid transparent; cursor: pointer; font-family: 'DM Sans',sans-serif; padding: 2px 0; transition: all 0.15s; }
        .cities-toggle.on { color: #1a1a1a; border-bottom-color: #1a1a1a; }
        .ctrl-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; gap: 8px; }
        .ctrl-value { font-size: 18px; font-weight: 700; letter-spacing: 0.04em; color: #1a1a1a; flex-shrink: 0; }
        .tick-labels { display: flex; justify-content: space-between; font-size: 12px; color: #aaa; margin-top: 2px; }
        .sidebar-brand { padding-bottom: 24px; margin-bottom: 4px; border-bottom: 1.5px solid #e4e0d8; }
        .section-nav-overlay { display: flex; align-items: center; gap: 6px; padding: 12px 20px; flex-shrink: 0; flex-wrap: wrap; border-bottom: 1.5px solid #d0ccc4; background: #f0ece4; }
        .nav-mini-brand { display: none; }
        /* ── Mobile ── */
        @media (max-width: 700px) {
          .site-header { padding: 10px 16px; gap: 10px; flex-wrap: wrap; }
          .site-title { font-size: clamp(32px,10vw,52px); }
          .site-desc { font-size: 12px; }
          .header-meta { display: none; }
          .header-center { flex: 1; min-width: 100%; order: 2; }
          .header-nav { width: 100%; flex-wrap: wrap; }
          .header-nav .nav-tab { flex: 1; justify-content: center; font-size: 11px; padding: 7px 8px; }
          .section-split { flex-direction: column; overflow-y: auto; -webkit-overflow-scrolling: touch; }
          /* Map first on mobile: the visual leads, controls follow */
          .section-left { width: 100%; padding: 12px 16px; gap: 10px; flex-shrink: 0; order: 2; }
          .section-right { flex: none; order: 1; overflow: visible; }
          .sidebar-brand { display: none; }
          .section-nav-overlay { padding: 8px 12px 6px; gap: 4px; position: sticky; top: 0; z-index: 30; }
          .section-nav-overlay .mode-btn { padding: 7px 10px; font-size: 11px; }
          .nav-mini-brand { display: block; width: 100%; font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 28px; line-height: 1; letter-spacing: 0.01em; text-transform: uppercase; color: #1a1a1a; cursor: pointer; padding: 2px 4px 4px; }
          .map-canvas-area { height: auto; flex-direction: column; }
          .globe-fill { height: auto; width: 100%; }
          .map-controls-overlay { position: static; transform: none; width: 100%; border: none; border-bottom: 1.5px solid #d0ccc4; border-radius: 0; padding: 8px 12px; backdrop-filter: none; -webkit-backdrop-filter: none; }
          .globe-compare-wrap { height: auto; flex-direction: column; padding: 8px; }
          .globe-compare-wrap > div { height: auto; width: 100%; max-width: 100%; }
          .sky-compare-wrap { flex-direction: column; height: auto; }
          .sky-compare-wrap > div { width: 100%; }
          .map-controls-overlay { bottom: 8px; padding: 5px 8px; gap: 4px; }
          input[type=range] { height: 20px; }
          input[type=range]::-webkit-slider-thumb { width: 24px; height: 24px; }
          input[type=range]::-moz-range-thumb { width: 24px; height: 24px; }
        }
      `}</style>
    <div className="app-shell">
      <div className="body-area">
        <Routes>
          <Route path="/" element={<SolarSection worldData={worldData} />} />
          <Route path="/solar" element={<SolarSection worldData={worldData} />} />
          <Route path="/stars" element={<StarsSection worldData={worldData} />} />
          <Route path="/flights" element={<FlightSection worldData={worldData} />} />
          <Route path="/circum" element={<CircumnavSection worldData={worldData} />} />
        </Routes>
      </div>

      {mapError && (
        <div className="map-error">
          The map data failed to load.
          <button onClick={() => { setMapError(false); fetchWorld(); }}>Retry</button>
        </div>
      )}

      <NewsTicker />
    </div>
    </>
  );
}
