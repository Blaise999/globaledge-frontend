// src/utils/geoDb.js

// 🏳️ Country aliases → ISO-ish codes used in CITY_COORDS keys
export const COUNTRY_ALIASES = {
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
  "syria": "SY", "sy": "SY",          // 🔹 added
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

// 🌍 City → static coordinates.
// You can keep beefing this list up over time (hundreds+ entries).
export const CITY_COORDS = {
  // Nigeria
  "Lagos, NG":        { lat: 6.5244, lon: 3.3792 },
  "Ikeja, NG":        { lat: 6.6018, lon: 3.3515 },
  "Abuja, NG":        { lat: 9.0765, lon: 7.3986 },
  "Kano, NG":         { lat: 12.0022, lon: 8.5919 },
  "Ibadan, NG":       { lat: 7.3775, lon: 3.9470 },
  "Port Harcourt, NG":{ lat: 4.8156, lon: 7.0498 },
  "Benin City, NG":   { lat: 6.3350, lon: 5.6037 },
  "Onitsha, NG":      { lat: 6.1498, lon: 6.7850 },
  "Aba, NG":          { lat: 5.1167, lon: 7.3667 },
  "Enugu, NG":        { lat: 6.4402, lon: 7.4940 },

  // West/Central/East Africa
  "Accra, GH":        { lat: 5.6037, lon: -0.1870 },
  "Kumasi, GH":       { lat: 6.6666, lon: -1.6163 },
  "Abidjan, CI":      { lat: 5.3600, lon: -4.0083 },
  "Cotonou, BJ":      { lat: 6.3703, lon: 2.3912 },
  "Lomé, TG":         { lat: 6.1319, lon: 1.2220 },
  "Niamey, NE":       { lat: 13.5127, lon: 2.1126 },
  "Douala, CM":       { lat: 4.0511, lon: 9.7679 },
  "Yaoundé, CM":      { lat: 3.8480, lon: 11.5021 },
  "Nairobi, KE":      { lat: -1.2864, lon: 36.8172 },
  "Mombasa, KE":      { lat: -4.0435, lon: 39.6682 },
  "Addis Ababa, ET":  { lat: 8.9806, lon: 38.7578 },
  "Kigali, RW":       { lat: -1.9579, lon: 30.1127 },
  "Kampala, UG":      { lat: 0.3476, lon: 32.5825 },
  "Dar es Salaam, TZ":{ lat: -6.7924, lon: 39.2083 },
  "Johannesburg, ZA": { lat: -26.2041, lon: 28.0473 },
  "Cape Town, ZA":    { lat: -33.9249, lon: 18.4241 },
  "Gqeberha, ZA":     { lat: -33.9608, lon: 25.6022 }, // Port Elizabeth
  "Cairo, EG":        { lat: 30.0444, lon: 31.2357 },
  "Alexandria, EG":   { lat: 31.2001, lon: 29.9187 },
  "Casablanca, MA":   { lat: 33.5731, lon: -7.5898 },
  "Rabat, MA":        { lat: 34.0209, lon: -6.8416 },
  "Marrakesh, MA":    { lat: 31.6295, lon: -7.9811 },
  "Tunis, TN":        { lat: 36.8065, lon: 10.1815 },
  "Algiers, DZ":      { lat: 36.7538, lon: 3.0588 },

  // UK & Ireland
  "London, GB":       { lat: 51.5072, lon: -0.1276 },
  "Manchester, GB":   { lat: 53.4808, lon: -2.2426 },
  "Birmingham, GB":   { lat: 52.4862, lon: -1.8904 },
  "Liverpool, GB":    { lat: 53.4084, lon: -2.9916 },
  "Bristol, GB":      { lat: 51.4545, lon: -2.5879 },
  "Glasgow, GB":      { lat: 55.8642, lon: -4.2518 },
  "Dublin, IE":       { lat: 53.3498, lon: -6.2603 },

  // DACH/Benelux/Scandinavia/PL
  "Berlin, DE":       { lat: 52.5200, lon: 13.4050 },
  "Frankfurt, DE":    { lat: 50.1109, lon: 8.6821 },
  "Munich, DE":       { lat: 48.1351, lon: 11.5820 },
  "Hamburg, DE":      { lat: 53.5511, lon: 9.9937 },
  "Cologne, DE":      { lat: 50.9375, lon: 6.9603 },
  "Rostock, DE":      { lat: 54.0924, lon: 12.0991 },   // 🔹 important one
  "Brussels, BE":     { lat: 50.8503, lon: 4.3517 },
  "Antwerp, BE":      { lat: 51.2194, lon: 4.4025 },
  "Amsterdam, NL":    { lat: 52.3676, lon: 4.9041 },
  "Rotterdam, NL":    { lat: 51.9244, lon: 4.4777 },
  "The Hague, NL":    { lat: 52.0705, lon: 4.3007 },
  "Zurich, CH":       { lat: 47.3769, lon: 8.5417 },
  "Geneva, CH":       { lat: 46.2044, lon: 6.1432 },
  "Vienna, AT":       { lat: 48.2082, lon: 16.3738 },
  "Stockholm, SE":    { lat: 59.3293, lon: 18.0686 },
  "Oslo, NO":         { lat: 59.9139, lon: 10.7522 },
  "Copenhagen, DK":   { lat: 55.6761, lon: 12.5683 },
  "Warsaw, PL":       { lat: 52.2297, lon: 21.0122 },

  // France/Iberia/Italy
  "Paris, FR":        { lat: 48.8566, lon: 2.3522 },
  "Lyon, FR":         { lat: 45.7640, lon: 4.8357 },
  "Marseille, FR":    { lat: 43.2965, lon: 5.3698 },
  "Madrid, ES":       { lat: 40.4168, lon: -3.7038 },
  "Barcelona, ES":    { lat: 41.3851, lon: 2.1734 },
  "Lisbon, PT":       { lat: 38.7223, lon: -9.1393 },
  "Porto, PT":        { lat: 41.1579, lon: -8.6291 },
  "Rome, IT":         { lat: 41.9028, lon: 12.4964 },
  "Milan, IT":        { lat: 45.4642, lon: 9.1900 },
  "Naples, IT":       { lat: 40.8518, lon: 14.2681 },

  // Turkey / Middle East
  "Istanbul, TR":     { lat: 41.0082, lon: 28.9784 },
  "Ankara, TR":       { lat: 39.9334, lon: 32.8597 },
  "Dubai, AE":        { lat: 25.2048, lon: 55.2708 },
  "Abu Dhabi, AE":    { lat: 24.4539, lon: 54.3773 },
  "Doha, QA":         { lat: 25.2854, lon: 51.5310 },
  "Riyadh, SA":       { lat: 24.7136, lon: 46.6753 },
  "Jeddah, SA":       { lat: 21.4858, lon: 39.1925 },
  "Aleppo, SY":       { lat: 36.2021, lon: 37.1343 },   // 🔹 important one

  // North America
  "New York, US":     { lat: 40.7128, lon: -74.0060 },
  "Newark, US":       { lat: 40.7357, lon: -74.1724 },
  "Atlanta, US":      { lat: 33.7490, lon: -84.3880 },
  "Chicago, US":      { lat: 41.8781, lon: -87.6298 },
  "Los Angeles, US":  { lat: 34.0522, lon: -118.2437 },
  "Miami, US":        { lat: 25.7617, lon: -80.1918 },
  "Toronto, CA":      { lat: 43.6532, lon: -79.3832 },
  "Montreal, CA":     { lat: 45.5019, lon: -73.5674 },
  "Vancouver, CA":    { lat: 49.2827, lon: -123.1207 },

  // Asia
  "Delhi, IN":        { lat: 28.6139, lon: 77.2090 },
  "Mumbai, IN":       { lat: 19.0760, lon: 72.8777 },
  "Bengaluru, IN":    { lat: 12.9716, lon: 77.5946 },
  "Chennai, IN":      { lat: 13.0827, lon: 80.2707 },
  "Kolkata, IN":      { lat: 22.5726, lon: 88.3639 },
  "Beijing, CN":      { lat: 39.9042, lon: 116.4074 },
  "Shanghai, CN":     { lat: 31.2304, lon: 121.4737 },
  "Shenzhen, CN":     { lat: 22.5431, lon: 114.0579 },
  "Guangzhou, CN":    { lat: 23.1291, lon: 113.2644 },
  "Hong Kong, HK":    { lat: 22.3193, lon: 114.1694 },
  "Singapore, SG":    { lat: 1.3521, lon: 103.8198 },
  "Tokyo, JP":        { lat: 35.6762, lon: 139.6503 },
};

// ───────────────────────── Helpers ─────────────────────────

export function normCountryToCode(country = "") {
  const k = country.trim().toLowerCase();
  // If we have an alias, use it; else just uppercase the raw string
  return COUNTRY_ALIASES[k] || country.trim().toUpperCase();
}

/**
 * Look up by "City, CC"; fallback to any entry starting with city regardless of country.
 * Returns { lat, lon } or { lat: null, lon: null } if not found.
 */
export function lookupCoords(city = "", country = "") {
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
