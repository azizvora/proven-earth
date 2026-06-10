// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function toRad(d) { return d * Math.PI / 180; }
export function toDeg(r) { return r * 180 / Math.PI; }

export function getSunPosition(utcHours, dayOfYear) {
  const declination = 23.45 * Math.sin(toRad((360 / 365) * (dayOfYear - 81)));
  const subsolarLon = (12 - utcHours) * 15;
  return { lat: declination, lon: subsolarLon };
}

export function getLightLevel(lat, lon, subsolarLat, subsolarLon) {
  const a = Math.sin(toRad(lat)) * Math.sin(toRad(subsolarLat));
  const b = Math.cos(toRad(lat)) * Math.cos(toRad(subsolarLat)) * Math.cos(toRad(lon - subsolarLon));
  return a + b;
}

// Classic atlas ocean: bright blue in daylight, dark navy at night
export function oceanColor(light) {
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
export function landColor(light) {
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
export function iceColor(light) {
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
export function iceBlend(lat) {
  // Antarctica: fully white below -65°, fades in from -55° to -65°
  if (lat < -65) return 1;
  if (lat < -55) return (lat - -55) / (-65 - -55);

  // Northern hemisphere: treeline sits around 55–65°N depending on region.
  // Fade from 55°N (tundra begins) to 72°N (full Arctic ice)
  if (lat > 55) return Math.min(1, (lat - 55) / (72 - 55));

  return 0;
}

export function blendColors(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

export function lightColor(light) { return oceanColor(light); }

export function getSunriseSunset(lat, lon, dayOfYear) {
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

export function formatHour(h) {
  if (h == null) return "--:--";
  const hh = Math.floor(((h % 24) + 24) % 24);
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Returns true if [lat, lon] is on the visible hemisphere of a globe with the given rotation [rotLon, rotLat]
export function isVisibleOnGlobe(lat, lon, rot) {
  const cLon = -rot[0], cLat = -(rot[1] || 0);
  return (
    Math.sin(toRad(lat)) * Math.sin(toRad(cLat)) +
    Math.cos(toRad(lat)) * Math.cos(toRad(cLat)) * Math.cos(toRad(lon - cLon))
  ) >= 0;
}

export function greatCirclePoints(lat1, lon1, lat2, lon2, n = 100) {
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
