import { useState, useEffect, useRef } from "react";

const TICKER_ITEMS = [
  {
    tag: "Science",
    source: "IFLScience",
    text: "Flat-earther Jeran Campanella visits Antarctica, witnesses the 24-hour midnight sun, and admits he was wrong, on camera",
    url: "https://www.iflscience.com/what-happened-during-flat-earthers-final-experiment-in-antarctica-80665",
  },
  {
    tag: "Science",
    source: "Upworthy",
    text: "Flat earthers travel to Antarctica to disprove the midnight sun, and had an emotional on-camera reckoning with what they find",
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
    text: "RRS Sir David Attenborough departs Plymouth for Antarctica, one of 60+ science projects running across five BAS stations this season",
    url: "https://www.bas.ac.uk/news/a-new-antarctic-season-begins-for-2025-26/",
  },
  {
    tag: "Antarctica",
    source: "Maritime Executive",
    text: "Canada eyes a second expedition to Antarctica in 2026. Canadian and Chilean navies to collaborate on Southern Ocean research",
    url: "https://maritime-executive.com/article/canada-eyes-a-second-expedition-to-antarctica",
  },
  {
    tag: "Science",
    source: "BBC / BAS",
    text: "World's once-largest iceberg A23a, twice the size of Greater London, is breaking apart in the South Atlantic after 40 years adrift",
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
    text: "Flat-earthers spent millions travelling to Antarctica to see if the 24-hour sun was real. It was, and some admitted they were wrong",
    url: "https://www.greenmatters.com/pn/flat-earthers-visited-antarctica-to-see-if-24-hour-midnight-sun-was-real-it-went-as-expected",
  },
  {
    tag: "Antarctica",
    source: "British Antarctic Survey",
    text: "Brunt Ice Shelf, home to Halley VI station, is the world's most closely monitored ice shelf, tracked by 11 GPS units and satellite imagery",
    url: "https://www.bas.ac.uk/news/a-new-antarctic-season-begins-for-2025-26/",
  },
  {
    tag: "Space",
    source: "ESA / JAXA",
    text: "ESA and JAXA's joint EarthCARE mission observes Earth from a 393 km polar orbit. Independent data from two continents, one spherical planet",
    url: "https://earth.esa.int/eogateway/missions/earthcare/description",
  },
];

const TAG_COLORS = {
  "Antarctica": { bg: "#e8f4ef", text: "#1a5a3a" },
  "Space":      { bg: "#e8eef8", text: "#1a3a6a" },
  "Science":    { bg: "#fbf0e8", text: "#7a3a10" },
};

export default function NewsTicker() {
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

  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div style={{
      flexShrink: 0,
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
                <span style={{ color: "#d0ccc4", marginLeft: 8 }}>·</span>
              </span>
            );
          })}
        </div>
      </div>

    </div>
  );
}
