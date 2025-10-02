// src/pages/track/TrackPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../../assets/globaledge.png";
import { useAuth } from "../../auth/AuthContext";
import { ShipAPI, geocode as GeoAPI } from "../../utils/api";

// 🗺️ react-leaflet + leaflet
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// ⚙️ Thunderforest key from env (don’t hardcode)
const TF_KEY = import.meta.env.VITE_THUNDERFOREST_KEY;

// fix default marker assets for bundlers
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

/* ========================= Lightweight Geocoder ========================= */
/** Country aliases → ISO-2 codes we use in CITY_COORDS keys */
const COUNTRY_ALIASES = {
  // Africa
  "nigeria": "NG", "ng": "NG",
  "ghana": "GH", "gh": "GH",
  "cote d'ivoire": "CI", "côte d’ivoire": "CI", "cote d’ivoire": "CI", "ivory coast": "CI", "ci": "CI",
  "benin": "BJ", "bj": "BJ",
  "togo": "TG", "tg": "TG",
  "niger": "NE", "ne": "NE",
  "cameroon": "CM", "cm": "CM",
  "kenya": "KE", "ke": "KE",
  "ethiopia": "ET", "et": "ET",
  "rwanda": "RW", "rw": "RW",
  "uganda": "UG", "ug": "UG",
  "tanzania": "TZ", "tz": "TZ",
  "south africa": "ZA", "sa": "ZA", "za": "ZA",
  "zimbabwe": "ZW", "zw": "ZW",
  "malawi": "MW", "mw": "MW",
  "egypt": "EG", "eg": "EG",
  "morocco": "MA", "ma": "MA",
  "tunisia": "TN", "tn": "TN",
  "algeria": "DZ", "dz": "DZ",

  // Europe
  "united kingdom": "GB", "uk": "GB", "gb": "GB", "england": "GB", "scotland": "GB", "wales": "GB",
  "ireland": "IE", "ie": "IE",
  "belgium": "BE", "be": "BE",
  "netherlands": "NL", "holland": "NL", "nl": "NL",
  "germany": "DE", "de": "DE",
  "france": "FR", "fr": "FR",
  "spain": "ES", "es": "ES",
  "portugal": "PT", "pt": "PT",
  "italy": "IT", "it": "IT",
  "switzerland": "CH", "ch": "CH",
  "austria": "AT", "at": "AT",
  "sweden": "SE", "se": "SE",
  "norway": "NO", "no": "NO",
  "denmark": "DK", "dk": "DK",
  "poland": "PL", "pl": "PL",
  "czech republic": "CZ", "czechia": "CZ", "cz": "CZ",
  "hungary": "HU", "hu": "HU",
  "turkey": "TR", "tr": "TR",

  // Middle East
  "united arab emirates": "AE", "uae": "AE", "ae": "AE",
  "qatar": "QA", "qa": "QA",
  "saudi arabia": "SA", "sa": "SA",

  // Americas
  "united states": "US", "usa": "US", "us": "US", "u.s.": "US",
  "canada": "CA", "ca": "CA",
  "mexico": "MX", "mx": "MX",
  "brazil": "BR", "br": "BR",

  // Asia
  "india": "IN", "in": "IN",
  "china": "CN", "cn": "CN",
  "japan": "JP", "jp": "JP",
  "hong kong": "HK", "hk": "HK",
  "singapore": "SG", "sg": "SG",
};

/** Common lanes (additive). Key format: "City, CC" */
const CITY_COORDS = {
  // Nigeria
  "Lagos, NG": { lat: 6.5244, lon: 3.3792 },
  "Ikeja, NG": { lat: 6.6018, lon: 3.3515 },
  "Abuja, NG": { lat: 9.0765, lon: 7.3986 },
  "Kano, NG": { lat: 12.0022, lon: 8.5919 },
  "Ibadan, NG": { lat: 7.3775, lon: 3.9470 },
  "Port Harcourt, NG": { lat: 4.8156, lon: 7.0498 },
  "Benin City, NG": { lat: 6.3350, lon: 5.6037 },
  "Onitsha, NG": { lat: 6.1498, lon: 6.7850 },
  "Aba, NG": { lat: 5.1167, lon: 7.3667 },
  "Enugu, NG": { lat: 6.4402, lon: 7.4940 },

  // West/Central/East Africa
  "Accra, GH": { lat: 5.6037, lon: -0.1870 },
  "Kumasi, GH": { lat: 6.6666, lon: -1.6163 },
  "Abidjan, CI": { lat: 5.3600, lon: -4.0083 },
  "Cotonou, BJ": { lat: 6.3703, lon: 2.3912 },
  "Lomé, TG": { lat: 6.1319, lon: 1.2220 },
  "Niamey, NE": { lat: 13.5127, lon: 2.1126 },
  "Douala, CM": { lat: 4.0511, lon: 9.7679 },
  "Yaoundé, CM": { lat: 3.8480, lon: 11.5021 },
  "Nairobi, KE": { lat: -1.2864, lon: 36.8172 },
  "Mombasa, KE": { lat: -4.0435, lon: 39.6682 },
  "Addis Ababa, ET": { lat: 8.9806, lon: 38.7578 },
  "Kigali, RW": { lat: -1.9579, lon: 30.1127 },
  "Kampala, UG": { lat: 0.3476, lon: 32.5825 },
  "Dar es Salaam, TZ": { lat: -6.7924, lon: 39.2083 },
  "Johannesburg, ZA": { lat: -26.2041, lon: 28.0473 },
  "Cape Town, ZA": { lat: -33.9249, lon: 18.4241 },
  "Gqeberha, ZA": { lat: -33.9608, lon: 25.6022 }, // Port Elizabeth
  "Cairo, EG": { lat: 30.0444, lon: 31.2357 },
  "Alexandria, EG": { lat: 31.2001, lon: 29.9187 },
  "Casablanca, MA": { lat: 33.5731, lon: -7.5898 },
  "Rabat, MA": { lat: 34.0209, lon: -6.8416 },
  "Marrakesh, MA": { lat: 31.6295, lon: -7.9811 },
  "Tunis, TN": { lat: 36.8065, lon: 10.1815 },
  "Algiers, DZ": { lat: 36.7538, lon: 3.0588 },

  // UK & Ireland
  "London, GB": { lat: 51.5072, lon: -0.1276 },
  "Manchester, GB": { lat: 53.4808, lon: -2.2426 },
  "Birmingham, GB": { lat: 52.4862, lon: -1.8904 },
  "Liverpool, GB": { lat: 53.4084, lon: -2.9916 },
  "Bristol, GB": { lat: 51.4545, lon: -2.5879 },
  "Glasgow, GB": { lat: 55.8642, lon: -4.2518 },
  "Dublin, IE": { lat: 53.3498, lon: -6.2603 },

  // DACH/Benelux/Scandinavia/PL
  "Berlin, DE": { lat: 52.5200, lon: 13.4050 },
  "Frankfurt, DE": { lat: 50.1109, lon: 8.6821 },
  "Munich, DE": { lat: 48.1351, lon: 11.5820 },
  "Hamburg, DE": { lat: 53.5511, lon: 9.9937 },
  "Cologne, DE": { lat: 50.9375, lon: 6.9603 },
  "Brussels, BE": { lat: 50.8503, lon: 4.3517 },
  "Antwerp, BE": { lat: 51.2194, lon: 4.4025 },
  "Amsterdam, NL": { lat: 52.3676, lon: 4.9041 },
  "Rotterdam, NL": { lat: 51.9244, lon: 4.4777 },
  "The Hague, NL": { lat: 52.0705, lon: 4.3007 },
  "Zurich, CH": { lat: 47.3769, lon: 8.5417 },
  "Geneva, CH": { lat: 46.2044, lon: 6.1432 },
  "Vienna, AT": { lat: 48.2082, lon: 16.3738 },
  "Stockholm, SE": { lat: 59.3293, lon: 18.0686 },
  "Oslo, NO": { lat: 59.9139, lon: 10.7522 },
  "Copenhagen, DK": { lat: 55.6761, lon: 12.5683 },
  "Warsaw, PL": { lat: 52.2297, lon: 21.0122 },

  // France/Iberia/Italy
  "Paris, FR": { lat: 48.8566, lon: 2.3522 },
  "Lyon, FR": { lat: 45.7640, lon: 4.8357 },
  "Marseille, FR": { lat: 43.2965, lon: 5.3698 },
  "Madrid, ES": { lat: 40.4168, lon: -3.7038 },
  "Barcelona, ES": { lat: 41.3851, lon: 2.1734 },
  "Lisbon, PT": { lat: 38.7223, lon: -9.1393 },
  "Porto, PT": { lat: 41.1579, lon: -8.6291 },
  "Rome, IT": { lat: 41.9028, lon: 12.4964 },
  "Milan, IT": { lat: 45.4642, lon: 9.1900 },
  "Naples, IT": { lat: 40.8518, lon: 14.2681 },

  // Turkey / Middle East
  "Istanbul, TR": { lat: 41.0082, lon: 28.9784 },
  "Ankara, TR": { lat: 39.9334, lon: 32.8597 },
  "Dubai, AE": { lat: 25.2048, lon: 55.2708 },
  "Abu Dhabi, AE": { lat: 24.4539, lon: 54.3773 },
  "Doha, QA": { lat: 25.2854, lon: 51.5310 },
  "Riyadh, SA": { lat: 24.7136, lon: 46.6753 },
  "Jeddah, SA": { lat: 21.4858, lon: 39.1925 },

  // North America (handy for cross-dock)
  "New York, US": { lat: 40.7128, lon: -74.0060 },
  "Newark, US": { lat: 40.7357, lon: -74.1724 },
  "Atlanta, US": { lat: 33.7490, lon: -84.3880 },
  "Chicago, US": { lat: 41.8781, lon: -87.6298 },
  "Los Angeles, US": { lat: 34.0522, lon: -118.2437 },
  "Miami, US": { lat: 25.7617, lon: -80.1918 },
  "Toronto, CA": { lat: 43.6532, lon: -79.3832 },
  "Montreal, CA": { lat: 45.5019, lon: -73.5674 },
  "Vancouver, CA": { lat: 49.2827, lon: -123.1207 },

  // Asia
  "Delhi, IN": { lat: 28.6139, lon: 77.2090 },
  "Mumbai, IN": { lat: 19.0760, lon: 72.8777 },
  "Bengaluru, IN": { lat: 12.9716, lon: 77.5946 },
  "Chennai, IN": { lat: 13.0827, lon: 80.2707 },
  "Kolkata, IN": { lat: 22.5726, lon: 88.3639 },
  "Beijing, CN": { lat: 39.9042, lon: 116.4074 },
  "Shanghai, CN": { lat: 31.2304, lon: 121.4737 },
  "Shenzhen, CN": { lat: 22.5431, lon: 114.0579 },
  "Guangzhou, CN": { lat: 23.1291, lon: 113.2644 },
  "Hong Kong, HK": { lat: 22.3193, lon: 114.1694 },
  "Singapore, SG": { lat: 1.3521, lon: 103.8198 },
  "Tokyo, JP": { lat: 35.6762, lon: 139.6503 },
};

function normCountryToCode(country = "") {
  const k = country.trim().toLowerCase();
  return COUNTRY_ALIASES[k] || country.trim().toUpperCase();
}

/** Look up by "City, CC"; fallback to any entry starting with city regardless of country */
function lookupCoords(city = "", country = "") {
  const cc = normCountryToCode(country);
  const keyA = `${city.trim()}, ${cc}`;
  if (CITY_COORDS[keyA]) return CITY_COORDS[keyA];

  // Fallback: any entry whose key starts with "City,"
  const lower = city.trim().toLowerCase();
  for (const k of Object.keys(CITY_COORDS)) {
    if (k.toLowerCase().startsWith(`${lower},`)) return CITY_COORDS[k];
  }
  return { lat: null, lon: null };
}

/* ---------- NEW: filter out audit/editor timeline items ---------- */
const ALLOWED_SCAN_STATUSES = new Set([
  "CREATED",
  "PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED",
  "DEPARTED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
  "CUSTOMS",
  "CUSTOMS_HOLD",
  "CUSTOMS_RELEASED",
  "HELD",
  "RETURNED",
]);

function isAuditTimelineItem(ev = {}) {
  const n = (ev.note || ev.message || "").toLowerCase();
  const s = String(ev.status || "").toUpperCase();

  if (n.startsWith("updated by")) return true;
  if (n.includes("updated by admin")) return true;
  if (n.includes("→") || n.includes("->")) return true;

  if (!ALLOWED_SCAN_STATUSES.has(s)) return true;

  return false;
}

/* ========================= Main ========================= */
export default function TrackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // UI state
  const [view, setView] = useState("enter");
  const [inputId, setInputId] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  // Deep link: /track?ref=GE123...
  useEffect(() => {
    const id = searchParams.get("ref");
    if (id) {
      setInputId(id);
      doTrack(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doTrack(id) {
    setErr("");
    if (!id || id.trim().length < 6) {
      setErr("Please enter a valid tracking ID.");
      setView("enter");
      return;
    }
    setView("loading");
    try {
      const raw = await ShipAPI.track(id.trim().toUpperCase());
      if (!raw) {
        setView("error");
        setErr("We couldn’t find that tracking ID. Check for typos or contact the sender.");
        return;
      }
      const mapped = mapShipmentToTrackView(raw);
      setData(mapped);
      setView("result");

      // 🔹 hydrate coords asynchronously using backend geocoder
      try {
        const hydrated = await geocodeHydrate(mapped);
        setData((prev) => (prev ? { ...prev, ...hydrated } : { ...mapped, ...hydrated }));
      } catch {}
    } catch (e) {
      const msg =
        e?.data?.message ||
        e?.message ||
        "Something went wrong while fetching tracking. Please try again.";
      setView("error");
      setErr(msg);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    const trimmed = inputId.trim();
    if (!trimmed) return;
    navigate(`/track?ref=${encodeURIComponent(trimmed)}`);
    doTrack(trimmed);
  }

  const maskedRecipient = useMemo(() => {
    if (!data?.summary?.to) return "";
    if (user) return data.summary.to;
    const parts = data.summary.to.split(",");
    return parts.length >= 2 ? parts.slice(-2).join(", ").trim() : data.summary.to;
  }, [data, user]);

  const recipientEmailDisplay = useMemo(() => {
    const email = data?.summary?.recipientEmail || "";
    if (!email) return "—";
    return user ? email : maskEmail(email);
  }, [data, user]);

  /* ---------- NEW: masks for phones ---------- */
  const shipperPhoneDisplay = useMemo(() => {
    const p = data?.shipper?.phone || "";
    if (!p) return "—";
    return user ? p : maskPhone(p);
  }, [data, user]);

  const recipientPhoneDisplay = useMemo(() => {
    const p = data?.recipient?.phone || "";
    if (!p) return "—";
    return user ? p : maskPhone(p);
  }, [data, user]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <a href="/" className="flex items-center">
              <img src={Logo} alt="GlobalEdge" className="h-10 w-auto object-contain" />
            </a>
            <div className="flex items-center gap-2">
              <Link
                to="/services/express?type=parcel#quote"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:scale-[0.98]"
              >
                <BoltIcon /> Create Shipment
              </Link>
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Entry / Search bar */}
      <section className="bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-black">Track a shipment</h1>
          <p className="mt-2 text-white/90 max-w-prose">
            Paste your GlobalEdge tracking ID to see live status, ETA, and checkpoints.
          </p>
          <form onSubmit={onSubmit} className="mt-6 p-2 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-stretch gap-2">
            <div className="flex items-center px-3 text-white/80">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="e.g. GE1234567890"
              className="flex-1 min-w-0 outline-none rounded-xl px-2 text-sm sm:text-base py-3 bg-transparent placeholder:text-white/70 text-white"
            />
            <button
              className="px-4 sm:px-6 py-3 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 active:scale-[0.98]"
              type="submit"
            >
              Track
            </button>
          </form>
          {err && view !== "result" && (
            <div className="mt-3 text-sm bg-white/10 ring-1 ring-white/20 rounded-xl px-3 py-2">
              {err}
            </div>
          )}
        </div>
      </section>

      {/* Content states */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === "loading" && <LoadingSkeleton />}

        {view === "error" && (
          <div className="rounded-2xl border bg-white p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-600 grid place-items-center">
              <InfoIcon />
            </div>
            <h2 className="mt-3 text-lg font-semibold">We couldn’t find that ID</h2>
            <p className="mt-1 text-sm text-gray-600">{err}</p>
            <button
              className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              onClick={() => setView("enter")}
            >
              Try another ID
            </button>
          </div>
        )}

        {view === "result" && data && (
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl border bg-white p-5">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Tracking ID</div>
                    <div className="text-xl font-bold tracking-tight">{data.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={data.status} />
                    {data.etaText && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        <ClockIcon /> {data.etaText}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">Last update: {data.lastUpdateText}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => copyLink(data.id)} className="btn-ghost"><CopyIcon /> Copy link</button>
                  <button onClick={() => shareLink(data.id)} className="btn-ghost"><ShareIcon /> Share</button>
                  <button className="btn-ghost"><DownloadIcon /> Download PDF</button>
                  <a href="#support" className="btn-ghost"><HeadsetIcon /> Contact support</a>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <ProgressSteps status={data.status} />
                <div className="mt-5">
                  <h3 className="font-semibold mb-3">Tracking timeline</h3>
                  <ul className="space-y-4">
                    {data.events.map((ev, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="mt-1">{i === 0 ? <DotCurrent /> : <DotPast />}</div>
                        <div>
                          <div className="font-medium">{ev.title}</div>
                          <div className="text-sm text-gray-600">
                            {ev.location} • {formatTime(ev.ts)}
                          </div>
                          {ev.code && <div className="text-xs text-gray-400 mt-0.5">Scan: {ev.code}</div>}
                        </div>
                      </li>
                    ))}
                    {data.events.length === 0 && (
                      <li className="text-sm text-gray-600">Label created — tracking will appear after the first scan.</li>
                    )}
                  </ul>
                </div>
              </div>

              {data.exception && (
                <div className="rounded-2xl border bg-white p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 grid place-items-center"><AlertIcon /></div>
                    <div>
                      <div className="font-semibold">Action required</div>
                      <p className="text-sm text-gray-600">{data.exception.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className="btn-primary">Upload documents</button>
                        <a href="#support" className="btn-secondary">Chat with support</a>
                      </div>
                      {data.exception.next && (
                        <div className="mt-2 text-xs text-gray-500">Next attempt: {data.exception.next}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border bg-white p-5">
                <h3 className="font-semibold">Get updates</h3>
                {user ? (
                  <div className="mt-3 flex items-center gap-4">
                    <Toggle label="Email alerts" />
                    <Toggle label="SMS alerts" />
                    <button className="btn-primary ml-auto">Save</button>
                  </div>
                ) : (
                  <form className="mt-3 flex flex-wrap gap-2 items-center" onSubmit={(e) => e.preventDefault()}>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="flex-1 min-w-[220px] rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/30"
                    />
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" className="rounded border-gray-300 text-red-600 focus:ring-red-600" />
                      I agree to receive shipment notifications for this ID.
                    </label>
                    <button className="btn-primary">Subscribe</button>
                  </form>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border bg-white p-5">
                <h3 className="font-semibold">Map</h3>
                <RealMap
                  origin={data.origin}
                  destination={data.destination}
                  current={data.current}
                  status={data.status}
                  routeGeo={data.routeGeo}
                />
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg border p-3">
                    <div className="text-gray-500">Origin</div>
                    <div className="font-medium">
                      {data.origin.city}{data.origin.country ? `, ${data.origin.country}` : ""}
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-gray-500">Current</div>
                    <div className="font-medium">
                      {data.current.city}{data.current.country ? `, ${data.current.country}` : ""}
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-gray-500">Destination</div>
                    <div className="font-medium">
                      {data.destination.city}{data.destination.country ? `, ${data.destination.country}` : ""}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <a className="btn-ghost" href={gmapsLink(data.current)} target="_blank" rel="noreferrer"><PinIcon /> Open in Maps</a>
                  <button className="btn-ghost" onClick={() => doTrack(data.id)}><RefreshIcon /> Refresh</button>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <h3 className="font-semibold">Shipment summary</h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">From</dt>
                    <dd className="font-medium">{data.summary.from}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">To</dt>
                    <dd className="font-medium">{maskedRecipient}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Recipient email</dt>
                    <dd className="font-medium">{recipientEmailDisplay}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Service</dt>
                    <dd className="font-medium">{data.summary.service}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Pieces / Weight</dt>
                    <dd className="font-medium">{data.summary.pieces} • {data.summary.weightKg} kg</dd>
                  </div>
                  {data.summary.dims && (
                    <div>
                      <dt className="text-gray-500">Dimensions</dt>
                      <dd className="font-medium">{data.summary.dims}</dd>
                    </div>
                  )}
                  {data.summary.duties && (
                    <div>
                      <dt className="text-gray-500">Duties</dt>
                      <dd className="font-medium">{data.summary.duties}</dd>
                    </div>
                  )}

                  {/* ---------- NEW: Contacts (shipper + recipient) ---------- */}
                  {data.shipper?.name && (
                    <div className="col-span-2">
                      <dt className="text-gray-500">Shipper</dt>
                      <dd className="font-medium">
                        {data.shipper.name}
                        {data.shipper.email ? ` • ${user ? data.shipper.email : maskEmail(data.shipper.email)}` : ""}
                        {shipperPhoneDisplay !== "—" ? ` • ${shipperPhoneDisplay}` : ""}
                      </dd>
                    </div>
                  )}
                  {(data.recipient?.name || data.recipient?.phone || data.recipient?.address) && (
                    <>
                      <div className="col-span-2">
                        <dt className="text-gray-500">Recipient</dt>
                        <dd className="font-medium">
                          {data.recipient?.name || "—"}
                          {recipientPhoneDisplay !== "—" ? ` • ${recipientPhoneDisplay}` : ""}
                        </dd>
                      </div>
                      {data.recipient?.address && (
                        <div className="col-span-2">
                          <dt className="text-gray-500">Recipient address</dt>
                          <dd className="font-medium">{data.recipient.address}</dd>
                        </div>
                      )}
                    </>
                  )}
                </dl>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ---------- NEW: For further enquiries bar ---------- */}
      <section id="support" className="border-t bg-gradient-to-r from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-100">
              <HeadsetIcon /> Need help?
            </div>
            <div className="text-sm text-gray-700">
              For further enquiries, email{" "}
              <a
                href="mailto:Globaledgeshippings@gmail.com"
                className="font-semibold text-red-700 hover:underline"
              >
                Globaledgeshippings@gmail.com
              </a>.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ========================= Mapper ========================= */
// Convert backend shipment doc → UI shape used by this page.
function mapShipmentToTrackView(s) {
  // source timeline and filter out audit entries
  const sourceTimeline = Array.isArray(s.timeline) ? s.timeline : [];
  const shipmentEvents = sourceTimeline.filter(ev => !isAuditTimelineItem(ev));

  // decide single "Created" timestamp
  let createdTs = s.createdAt || null;
  if (!createdTs) {
    const firstCreated = sourceTimeline
      .filter(ev => String(ev.status).toUpperCase() === "CREATED")
      .sort((a, b) => new Date(a.at) - new Date(b.at))[0];
    if (firstCreated?.at) createdTs = firstCreated.at;
  }
  const createdEvt = {
    title: "Label created",
    location: s.from || "Origin",
    ts: createdTs,
    code: "CREATED",
  };

  const mappedEvents = shipmentEvents
    .map(ev => ({
      title: toTitle(String(ev.status || "").replace(/_/g, " ").toLowerCase()),
      location: ev.note || ev.location || "",
      ts: ev.at,
      code: String(ev.status || "").toUpperCase(),
    }))
    .filter(e => e.code !== "CREATED")
    .sort((a, b) => new Date(b.ts) - new Date(a.ts));

  const events = ([createdEvt.ts ? createdEvt : null, ...mappedEvents].filter(Boolean))
    .sort((a, b) => new Date(b.ts) - new Date(a.ts));

  // ── smarter place parser: last token is country, token before that is city
  const toPlace = (str = "") => {
    const parts = String(str).split(",").map((t) => t.trim()).filter(Boolean);
    if (!parts.length) return { city: "", country: "", lat: null, lon: null };

    const countryRaw = parts[parts.length - 1];
    const cityGuess  = parts.length >= 2 ? parts[parts.length - 2] : parts[0];

    const country = normCountryToCode(countryRaw);
    const { lat, lon } = lookupCoords(cityGuess, country);
    return { city: cityGuess, country, lat, lon };
  };

  /* ---------- normalize contacts from server ---------- */
  const shipper = s.shipper || s.capturedContact || { name: "", email: "", phone: "" };
  const recipient = {
    name: s.recipient?.name || s.recipientName || "",
    phone: s.recipient?.phone || s.recipientPhone || "",
    email: s.recipient?.email || s.recipientEmail || "",
    address: s.recipient?.address || s.recipientAddress || "",
  };

  return {
    id: s.trackingNumber,
    status: s.status || "Created",
    etaText: s.eta || "",
    lastUpdateText: s.updatedAt ? new Date(s.updatedAt).toLocaleString() : "",
    origin: toPlace(s.from),
    destination: toPlace(s.to),
    current: toPlace(s.lastLocation || s.from),
    routeGeo: [],

    events,

    exception: s.status === "Exception" ? { message: "Attention required", next: "" } : null,

    /* ---------- expose contacts ---------- */
    shipper,
    recipient,

    summary: {
      from: s.from || "",
      to: s.to || "",
      recipientEmail: s.recipientEmail || recipient.email || "",
      service: toTitle(s.serviceType || "Standard"),
      pieces: s.parcel ? 1 : (s.freight?.pallets || 1),
      weightKg: s.parcel?.weight || s.freight?.weight || 0,
      dims: s.parcel ? fmtDims(s.parcel.length, s.parcel.width, s.parcel.height) : "",
      duties: s.freight?.incoterm || "",
    },

    // 🔹 Preserve raw strings for geocoding
    rawFrom: s.from || "",
    rawTo: s.to || "",
    rawCurrent: s.lastLocation || s.from || "",
  };
}

// 🔹 Geocode hydrator — upgrades origin/current/destination with real lat/lon via backend
async function geocodeHydrate(mapped) {
  const out = {
    origin: { ...mapped.origin },
    current: { ...mapped.current },
    destination: { ...mapped.destination },
  };

  async function ensureLatLon(placeObj, rawFallback) {
    const has = (v) => v != null && v !== "";
    const needs = !(has(placeObj.lat) && has(placeObj.lon));

    if (!needs) return placeObj;

    // Build a good query string
    const q =
      (rawFallback && rawFallback.trim()) ||
      [placeObj.city, placeObj.country].filter(Boolean).join(", ");

    if (!q) return placeObj;

    try {
      const { lat, lon } = await GeoAPI.resolve(q);
      if (lat != null && lon != null) {
        return { ...placeObj, lat, lon };
      }
    } catch {
      // ignore errors; static coords are already present when possible
    }
    return placeObj;
  }

  out.origin = await ensureLatLon(out.origin, mapped.rawFrom);
  out.current = await ensureLatLon(out.current, mapped.rawCurrent);
  out.destination = await ensureLatLon(out.destination, mapped.rawTo);

  return out;
}

function fmtDims(l, w, h) {
  const parts = [l, w, h].filter((x) => x != null && x !== "");
  return parts.length ? `${parts.join("×")} cm` : "";
}
function toTitle(s = "") {
  const t = String(s);
  return t.length ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

/* ========================= Components ========================= */

function LoadingSkeleton() {
  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border bg-white p-5">
            <Shimmer className="h-5 w-48" />
            <div className="mt-3 space-y-2">
              <Shimmer className="h-3 w-full" />
              <Shimmer className="h-3 w-3/4" />
              <Shimmer className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-2xl border bg-white p-5">
          <Shimmer className="h-5 w-32" />
          <div className="mt-3 rounded-xl border bg-gray-50">
            <div className="aspect-[16/10]">
              <div className="h-full w-full">
                <Shimmer className="h-full w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <Shimmer className="h-5 w-40" />
          <div className="mt-3 space-y-2">
            <Shimmer className="h-3 w-2/3" />
            <Shimmer className="h-3 w-1/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Shimmer({ className = "" }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className}`} />;
}
function StatusPill({ status }) {
  const map = {
    "Created": "bg-gray-100 text-gray-700 ring-gray-200",
    "Picked Up": "bg-sky-50 text-sky-700 ring-sky-200",
    "In Transit": "bg-blue-50 text-blue-700 ring-blue-200",
    "Out for Delivery": "bg-amber-50 text-amber-800 ring-amber-200",
    "Delivered": "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Exception": "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
        map[status] || "bg-gray-100 text-gray-700 ring-gray-200"
      }`}
    >
      <DotTiny /> {status}
    </span>
  );
}

function ProgressSteps({ status }) {
  const steps = ["Label created", "Picked up", "In transit", "Out for delivery", "Delivered"];
  const idx = statusToIndex(status);
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 flex items-center">
            <div className={`h-7 w-7 grid place-items-center rounded-full text-[11px] font-bold ${i <= idx ? "bg-red-600 text-white" : "bg-gray-200 text-gray-600"}`}>
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-1 flex-1 mx-2 rounded ${i < idx ? "bg-red-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        {steps.map((s) => <span key={s}>{s}</span>)}
      </div>
    </div>
  );
}

function statusToIndex(status) {
  switch (status) {
    case "Created": return 0;
    case "Picked Up": return 1;
    case "In Transit": return 2;
    case "Out for Delivery": return 3;
    case "Delivered": return 4;
    case "Exception": return 2;
    default: return 0;
  }
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function copyLink(id) {
  const url = `${location.origin}/track?ref=${encodeURIComponent(id)}`;
  navigator.clipboard?.writeText(url);
}

async function shareLink(id) {
  const url = `${location.origin}/track?ref=${encodeURIComponent(id)}`;
  if (navigator.share) {
    try { await navigator.share({ title: `Tracking ${id}`, url }); } catch {}
  } else {
    copyLink(id);
  }
}

function gmapsLink(loc = {}) {
  if (!loc.lat || !loc.lon) return "#";
  return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lon}`;
}

// email mask (j***e@d***.com)
function maskEmail(e = "") {
  const [local, domain] = e.split("@");
  if (!local || !domain) return e;
  const mask = (s) => (s.length <= 2 ? s[0] + "*" : s[0] + "****" + s.slice(-1));
  const [host, ...tldParts] = domain.split(".");
  const maskedHost = host.length <= 2 ? host[0] + "*" : host[0] + "***";
  return `${mask(local)}@${maskedHost}.${tldParts.join(".") || ""}`.replace(/\.\./g, ".");
}

/* ---------- NEW: phone mask (e.g., +44******45) ---------- */
function maskPhone(p = "") {
  const d = String(p).replace(/\D/g, "");
  if (!d) return p;
  if (d.length <= 4) return "*".repeat(d.length);
  return d.slice(0, 2) + "*".repeat(Math.max(2, d.length - 4)) + d.slice(-2);
}

/* ========================= Real Map (Leaflet) ========================= */
function RealMap({ origin, destination, current, routeGeo = [], status }) {
  const toLL = (o) => (o?.lat != null && o?.lon != null ? [o.lat, o.lon] : null);
  let O = toLL(origin);
  let C = toLL(current);
  let D = toLL(destination);

  // If two points are very close, nudge one slightly so both markers are visible
  const nudgeIfClose = (a, b, epsDeg = 0.01, delta = 0.02) => {
    if (!a || !b) return [a, b];
    const [latA, lonA] = a, [latB, lonB] = b;
    if (Math.abs(latA - latB) < epsDeg && Math.abs(lonA - lonB) < epsDeg) {
      return [a, [latB + delta, lonB + delta]];
    }
    return [a, b];
  };
  [O, C] = nudgeIfClose(O, C);
  [C, D] = nudgeIfClose(C, D);
  [O, D] = nudgeIfClose(O, D);

  // 3-point polyline: origin → current → destination
  const line = [O, C, D].filter(Boolean);

  // Bounds: prefer routeGeo if provided; else use 3-point line
  const fitPoints = (routeGeo || [])
    .map(p => (p?.lat != null && p?.lon != null ? [p.lat, p.lon] : null))
    .filter(Boolean);
  const boundsPoints = fitPoints.length >= 2 ? fitPoints : line;

  const initialCenter = O || C || D || [0, 0];

  const makeIcon = (color, size, ring = true) =>
    L.divIcon({
      className: "",
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};${ring ? "box-shadow:0 0 0 2px #fff;" : ""}"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  const originIcon  = makeIcon("#6b7280", 14);  // gray
  const currentIcon = makeIcon("#dc2626", 18);  // red
  const destIcon    = makeIcon("#000000", 14);  // black

  // ---------- NEW: English-first tiles (Thunderforest) with CARTO fallback + retina
  const TF_STYLE = "atlas"; // alternatives: 'outdoors','transport','landscape','neighbourhood','mobile-atlas'
  const retina = (typeof window !== "undefined" && window.devicePixelRatio > 1) ? "@2x" : "";
  const tfUrl = `https://{s}.tile.thunderforest.com/${TF_STYLE}/{z}/{x}/{y}${retina}.png?apikey=${TF_KEY}`;

  const cartoUrl = `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}${retina}.png`;

  const useThunderforest = Boolean(TF_KEY);
  const tileUrl = useThunderforest ? tfUrl : cartoUrl;
  const tileAttribution =
    useThunderforest
      ? '© OpenStreetMap contributors, Tiles © Thunderforest'
      : '© OpenStreetMap contributors, © CARTO';

  function FitAndZoom() {
    const map = useMap();
    setTimeout(() => {
      if (boundsPoints.length >= 2) {
        map.fitBounds(L.latLngBounds(boundsPoints), { padding: [30, 30] });
      } else {
        map.setView(initialCenter, 6);
      }
      map.invalidateSize();
    }, 0);
    const focus = C || D || O;
    const z = status === "Out for Delivery" ? 15 : 14;
    const t = setTimeout(() => { if (focus) map.setView(focus, z, { animate: true }); }, 2000);
    return () => clearTimeout(t);
  }

  return (
    <div className="mt-3 rounded-xl border overflow-hidden">
      <MapContainer
        center={initialCenter}
        zoom={6}
        style={{ height: "280px", width: "100%" }}
        scrollWheelZoom={false}
        zoomAnimation
        markerZoomAnimation
        preferCanvas={false}
      >
        <FitAndZoom />
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
          subdomains={['a','b','c']}
          updateWhenZooming
          updateWhenIdle={false}
          keepBuffer={4}
          detectRetina={false} // we already toggle @2x via URL
        />

        {line.length >= 2 && <Polyline positions={line} />}

        {O && (
          <Marker position={O} icon={originIcon} zIndexOffset={200}>
            <Popup><b>Origin</b><br />{origin.city}{origin.country ? `, ${origin.country}` : ""}</Popup>
          </Marker>
        )}
        {D && (
          <Marker position={D} icon={destIcon} zIndexOffset={300}>
            <Popup><b>Destination</b><br />{destination.city}{destination.country ? `, ${destination.country}` : ""}</Popup>
          </Marker>
        )}
        {C && (
          <Marker position={C} icon={currentIcon} zIndexOffset={400}>
            <Popup><b>Current</b><br />{current.city}{current.country ? `, ${current.country}` : ""}</Popup>
          </Marker>
        )}
      </MapContainer>
      <div className="px-3 py-2 text-[11px] text-gray-500 border-t bg-white">
        {tileAttribution}
      </div>
    </div>
  );
}

function Toggle({ label }) {
  const [on, setOn] = useState(true);
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => setOn((s) => !s)}
        className={`w-10 h-6 rounded-full p-0.5 transition ${on ? "bg-red-600" : "bg-gray-300"}`}
      >
        <span className={`block h-5 w-5 bg-white rounded-full transform transition ${on ? "translate-x-4" : ""}`} />
      </button>
      {label}
    </label>
  );
}

/* ========================= Icons & Dots (inline) ========================= */
function BoltIcon(){return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M11 21 3 13h6L7 3h10l-4 8h6z"/></svg>;}
function SearchIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>;}
function ClockIcon(){return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>;}
function CopyIcon(){return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="9" width="10" height="10" rx="2"/><rect x="5" y="5" width="10" height="10" rx="2"/></svg>;}
function ShareIcon(){return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5"/></svg>;}
function DownloadIcon(){return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><rect x="3" y="19" width="18" height="2" rx="1"/></svg>;}
function HeadsetIcon(){return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12a8 8 0 0 1 16 0v6a2 2 0 0 1-2 2h-2"/><path d="M6 20H5a2 2 0 0 1-2-2v-3"/><rect x="17" y="13" width="4" height="6" rx="2"/><rect x="3" y="13" width="4" height="6" rx="2"/></svg>;}
function PinIcon(){return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>;}
function RefreshIcon(){return <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 11A8 8 0 1 1 4.6 6.6"/><path d="M20 4v7h-7"/></svg>;}
function InfoIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8h.01M11 12h2v4h-2"/></svg>;}
function AlertIcon(){return <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.3 2.3 1.7 17.7A2 2 0 0 0 3.4 20h17.2a2 2 0 0 0 1.7-2.3L13.7 2.3a2 2 0 0 0-3.4 0z"/><path d="M12 8v5M12 17h.01"/></svg>;}
function DotTiny(){return <span className="inline-block w-1.5 h-1.5 rounded-full bg-current"></span>;}
function DotPast(){return <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>;}
function DotCurrent(){return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600"></span>;}
