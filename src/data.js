// ─── DATA ─────────────────────────────────────────────────────────────────────

export const TIMEZONES = [
  { label: "UTC−12: Baker Island", value: -12 },
  { label: "UTC−11: Samoa", value: -11 },
  { label: "UTC−10: Hawaii", value: -10 },
  { label: "UTC−9: Alaska", value: -9 },
  { label: "UTC−8: Pacific Time", value: -8 },
  { label: "UTC−7: Mountain Time", value: -7 },
  { label: "UTC−6: Central Time", value: -6 },
  { label: "UTC−5: Eastern Time", value: -5 },
  { label: "UTC−4: Atlantic Time", value: -4 },
  { label: "UTC−3: Buenos Aires", value: -3 },
  { label: "UTC−2: South Georgia", value: -2 },
  { label: "UTC−1: Azores", value: -1 },
  { label: "UTC±0: London / Reykjavik", value: 0 },
  { label: "UTC+1: Paris / Berlin", value: 1 },
  { label: "UTC+2: Cairo / Athens", value: 2 },
  { label: "UTC+3: Moscow / Nairobi", value: 3 },
  { label: "UTC+4: Dubai / Baku", value: 4 },
  { label: "UTC+5: Karachi", value: 5 },
  { label: "UTC+5:30: India (IST)", value: 5.5 },
  { label: "UTC+6: Dhaka", value: 6 },
  { label: "UTC+7: Bangkok / Jakarta", value: 7 },
  { label: "UTC+8: Beijing / Singapore", value: 8 },
  { label: "UTC+9: Tokyo / Seoul", value: 9 },
  { label: "UTC+10: Sydney", value: 10 },
  { label: "UTC+11: Noumea", value: 11 },
  { label: "UTC+12: Auckland / Fiji", value: 12 },
];

export const CITIES = [
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

// Star catalogue for star trail section: [ra_hours, dec_degrees, brightness_0_to_1]
// Real astronomical coordinates for ~58 bright/well-distributed stars.
export const TRAIL_STARS = [
  // North polar region
  [2.53, 89.26, 0.70],  // Polaris
  [17.54, 86.59, 0.22], // Yildun
  [15.35, 71.83, 0.42], // Gamma UMi
  // Ursa Major
  [11.06, 61.75, 0.62], [11.03, 56.38, 0.62], [12.90, 55.96, 0.68],
  [13.40, 54.93, 0.62], [13.79, 49.31, 0.62],
  // Cassiopeia / Perseus / Auriga
  [0.68, 56.54, 0.62], [0.15, 59.15, 0.52],
  [3.41, 49.86, 0.68], [5.28, 45.99, 0.95], [5.99, 44.95, 0.58],
  // Cygnus / Lyra / Draco
  [18.62, 38.78, 0.95], [20.69, 45.28, 0.82], [17.94, 51.49, 0.52],
  // Northern mid-lat
  [7.65, 5.22, 0.88], [7.76, 28.03, 0.82], [7.58, 31.89, 0.62],
  [10.14, 11.97, 0.78], [14.26, 19.18, 0.95], [4.60, 16.51, 0.82],
  // Orion (equatorial)
  [5.92, 7.41, 0.92],  // Betelgeuse
  [5.24, -8.20, 0.92], // Rigel
  [5.42, 6.35, 0.58], [5.60, -1.20, 0.58], [5.68, -1.94, 0.52], [5.53, -0.30, 0.48],
  // Equatorial / mid
  [6.75, -16.72, 0.98], // Sirius — brightest
  [13.42, -11.16, 0.88], // Spica
  [16.49, -26.43, 0.82], // Antares
  // Southern mid-lat
  [22.96, -29.62, 0.78], // Fomalhaut
  [18.40, -34.38, 0.72], // Kaus Australis
  [22.14, -46.96, 0.68], // Al Nair
  [6.98, -28.97, 0.72],  // Adhara
  [9.13, -43.43, 0.68],  // Suhail
  [8.16, -47.34, 0.62],  // Gamma Velorum
  [20.43, -56.73, 0.72], // Peacock
  [8.37, -59.51, 0.58],  // Avior
  [17.62, -42.99, 0.62], // Sargas
  [17.56, -37.10, 0.68], // Shaula
  // Deep south
  [6.40, -52.69, 0.98],  // Canopus — 2nd brightest
  [1.63, -57.24, 0.88],  // Achernar
  [9.22, -69.72, 0.68],  // Miaplacidus
  [16.81, -69.03, 0.68], // Atria
  [14.66, -60.83, 0.98], // Alpha Centauri
  [14.06, -60.37, 0.88], // Hadar
  [12.44, -63.10, 0.88], // Acrux (Southern Cross)
  [12.80, -59.69, 0.78], // Mimosa (Southern Cross)
  [12.35, -57.11, 0.58], // Delta Cru (Southern Cross)
  // South polar region
  [21.08, -88.96, 0.12], // Sigma Octantis — the southern pole star (very dim)
  [23.88, -82.07, 0.22], // Gamma Oct
  [18.59, -87.61, 0.18], // Chi Oct
  [14.45, -83.67, 0.22], // Delta Oct
];

export const FLIGHT_ROUTES = [
  {
    id: "syd-jnb",
    name: "Sydney → Johannesburg",
    from: { name: "Sydney", lat: -33.9, lon: 151.2 },
    to: { name: "Johannesburg", lat: -26.2, lon: 28.0 },
    color: "#ff6b6b",
    description: "Flies directly across the Indian Ocean. On a flat (AE) map this route appears to require a detour through Asia or the Middle East, but the direct flight takes around 11 hours.",
    flatEarthProblem: "On the AE map, Asia sits between these two cities. A flat-earth path would add ~8,000 km.",
    fr24Hint: "Look for QF63 (Qantas)",
  },
  {
    id: "akl-eze",
    name: "Auckland → Buenos Aires",
    from: { name: "Auckland", lat: -37.0, lon: 174.8 },
    to: { name: "Buenos Aires", lat: -34.8, lon: -58.5 },
    color: "#ffa500",
    description: "Air New Zealand flies this route across the South Pacific. The direct route runs close to Antarctica, the opposite of what the flat (AE) map suggests.",
    flatEarthProblem: "On the AE map, these cities sit near opposite edges of the disc. The flat-earth path would span nearly the entire map.",
    fr24Hint: "Look for NZ30 (Air New Zealand)",
  },
  {
    id: "per-lhr",
    name: "Perth → London",
    from: { name: "Perth", lat: -31.9, lon: 115.9 },
    to: { name: "London", lat: 51.5, lon: -0.5 },
    color: "#60f0a0",
    description: "Qantas operates this ~17-hour direct flight over the Indian Ocean and Middle East. It is one of the longest commercial flights in the world by distance.",
    flatEarthProblem: "On the AE map, Perth is near the outer edge and London near the centre, making the route appear far longer than it is.",
    fr24Hint: "Look for QF9 (Qantas)",
  },
  {
    id: "jnb-gru",
    name: "Johannesburg → São Paulo",
    from: { name: "Johannesburg", lat: -26.2, lon: 28.0 },
    to: { name: "São Paulo", lat: -23.4, lon: -46.5 },
    color: "#a78bfa",
    description: "Crosses the South Atlantic in roughly 9 hours. The two cities sit at similar latitudes on opposite sides of the ocean, close on a sphere, but separated by a large expanse on flat maps.",
    flatEarthProblem: "On the AE map, South America and southern Africa are pushed to opposite outer edges, making this route look far longer than it is.",
    fr24Hint: "Look for SA222 (South African Airways)",
  },
];

// All airports that appear in at least one verified direct route
export const AIRPORT_DATA = {
  SYD: { name: "Sydney",        lat: -33.9,  lon: 151.2 },
  MEL: { name: "Melbourne",     lat: -37.8,  lon: 144.9 },
  AKL: { name: "Auckland",      lat: -37.0,  lon: 174.8 },
  JNB: { name: "Johannesburg",  lat: -26.1,  lon: 28.2  },
  CPT: { name: "Cape Town",     lat: -33.9,  lon: 18.6  },
  EZE: { name: "Buenos Aires",  lat: -34.8,  lon: -58.5 },
  SCL: { name: "Santiago",      lat: -33.4,  lon: -70.8 },
  PER: { name: "Perth",         lat: -31.9,  lon: 115.9 },
  GRU: { name: "São Paulo",     lat: -23.4,  lon: -46.5 },
  LAX: { name: "Los Angeles",   lat: 33.9,   lon: -118.4},
  JFK: { name: "New York",      lat: 40.6,   lon: -73.8 },
  LHR: { name: "London",        lat: 51.5,   lon: -0.5  },
  NRT: { name: "Tokyo",         lat: 35.8,   lon: 140.4 },
  SIN: { name: "Singapore",     lat: 1.4,    lon: 103.9 },
  DXB: { name: "Dubai",         lat: 25.3,   lon: 55.4  },
  HKG: { name: "Hong Kong",     lat: 22.3,   lon: 113.9 },
  CDG: { name: "Paris",         lat: 49.0,   lon: 2.5   },
  FRA: { name: "Frankfurt",     lat: 50.0,   lon: 8.6   },
  AMS: { name: "Amsterdam",     lat: 52.3,   lon: 4.8   },
  MAD: { name: "Madrid",        lat: 40.5,   lon: -3.6  },
  MIA: { name: "Miami",         lat: 25.8,   lon: -80.3 },
  BOM: { name: "Mumbai",        lat: 19.1,   lon: 72.9  },
  ICN: { name: "Seoul",         lat: 37.5,   lon: 126.5 },
  DOH: { name: "Doha",          lat: 25.3,   lon: 51.6  },
  NBO: { name: "Nairobi",       lat: -1.3,   lon: 36.9  },
};

// Southern hemisphere airports shown at the top of dropdowns
export const KEY_IATAS = new Set(["SYD","MEL","AKL","JNB","CPT","EZE","SCL","PER","GRU"]);

// Verified direct long-haul routes (bidirectional). Sources: airline route maps / FlightConnections.
export const DIRECT_ROUTE_PAIRS = [
  // Sydney
  ["SYD","MEL"],["SYD","AKL"],["SYD","NRT"],["SYD","HKG"],["SYD","SIN"],
  ["SYD","DXB"],["SYD","LHR"],["SYD","LAX"],["SYD","JNB"],["SYD","CDG"],
  // Melbourne
  ["MEL","AKL"],["MEL","NRT"],["MEL","SIN"],["MEL","DXB"],["MEL","LHR"],["MEL","LAX"],
  // Auckland
  ["AKL","NRT"],["AKL","SIN"],["AKL","LAX"],["AKL","LHR"],["AKL","EZE"],
  ["AKL","SCL"],["AKL","HKG"],["AKL","CDG"],
  // Johannesburg
  ["JNB","LHR"],["JNB","JFK"],["JNB","DXB"],["JNB","SIN"],["JNB","GRU"],
  ["JNB","BOM"],["JNB","PER"],["JNB","CPT"],["JNB","AMS"],["JNB","CDG"],
  ["JNB","FRA"],["JNB","NBO"],["JNB","HKG"],
  // Cape Town
  ["CPT","LHR"],["CPT","AMS"],["CPT","DXB"],["CPT","CDG"],["CPT","FRA"],
  // Buenos Aires
  ["EZE","SCL"],["EZE","GRU"],["EZE","MAD"],["EZE","LHR"],["EZE","MIA"],
  ["EZE","JFK"],["EZE","CDG"],
  // Santiago
  ["SCL","GRU"],["SCL","MAD"],["SCL","MIA"],["SCL","JFK"],["SCL","LAX"],["SCL","CDG"],
  // Perth
  ["PER","LHR"],["PER","SIN"],["PER","DXB"],
  // São Paulo
  ["GRU","MAD"],["GRU","LHR"],["GRU","JFK"],["GRU","LAX"],["GRU","MIA"],
  ["GRU","CDG"],["GRU","AMS"],["GRU","FRA"],
  // Los Angeles
  ["LAX","NRT"],["LAX","LHR"],["LAX","SIN"],["LAX","JFK"],["LAX","CDG"],
  ["LAX","FRA"],["LAX","DXB"],["LAX","ICN"],["LAX","HKG"],
  // New York
  ["JFK","LHR"],["JFK","NRT"],["JFK","DXB"],["JFK","SIN"],["JFK","CDG"],
  ["JFK","FRA"],["JFK","HKG"],["JFK","MIA"],["JFK","MAD"],["JFK","AMS"],
  ["JFK","DOH"],["JFK","NBO"],
  // London
  ["LHR","NRT"],["LHR","SIN"],["LHR","DXB"],["LHR","HKG"],["LHR","CDG"],
  ["LHR","FRA"],["LHR","AMS"],["LHR","MAD"],["LHR","BOM"],["LHR","SCL"],
  ["LHR","DOH"],["LHR","NBO"],["LHR","ICN"],
  // Tokyo
  ["NRT","SIN"],["NRT","DXB"],["NRT","CDG"],["NRT","FRA"],["NRT","HKG"],["NRT","ICN"],
  // Singapore
  ["SIN","DXB"],["SIN","CDG"],["SIN","FRA"],["SIN","AMS"],["SIN","BOM"],
  ["SIN","HKG"],["SIN","ICN"],["SIN","NBO"],["SIN","DOH"],
  // Dubai
  ["DXB","CDG"],["DXB","FRA"],["DXB","AMS"],["DXB","BOM"],["DXB","HKG"],
  ["DXB","MIA"],["DXB","ICN"],["DXB","DOH"],["DXB","MAD"],["DXB","NBO"],
  // Others
  ["HKG","CDG"],["HKG","FRA"],["HKG","AMS"],["HKG","BOM"],["HKG","ICN"],
  ["CDG","FRA"],["CDG","AMS"],["CDG","MAD"],["CDG","BOM"],["CDG","NBO"],
  ["FRA","AMS"],["FRA","BOM"],["FRA","ICN"],["FRA","DOH"],["FRA","NBO"],
  ["AMS","BOM"],["AMS","NBO"],["AMS","DOH"],
  ["MAD","MIA"],["MAD","NBO"],
  ["BOM","DOH"],["BOM","NBO"],
  ["ICN","NRT"],["NBO","DOH"],
];

// Adjacency map: iata → Set of directly reachable iatas
export const ADJACENCY = {};
DIRECT_ROUTE_PAIRS.forEach(([a, b]) => {
  if (!ADJACENCY[a]) ADJACENCY[a] = new Set();
  if (!ADJACENCY[b]) ADJACENCY[b] = new Set();
  ADJACENCY[a].add(b);
  ADJACENCY[b].add(a);
});

// Sorted airport list derived from AIRPORT_DATA
export const ALL_AIRPORT_LIST = Object.entries(AIRPORT_DATA)
  .map(([iata, d]) => ({ iata, ...d }))
  .sort((a, b) => a.name.localeCompare(b.name));
