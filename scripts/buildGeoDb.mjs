// scripts/buildGeoDb.mjs
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const root = process.cwd();

// Input CSV you created earlier
const INPUT = path.join(root, "data", "world_cities.csv");

// Output JS module for the frontend
const OUTPUT = path.join(root, "src", "utils", "geoDb.cities.generated.js");

// You can limit if bundle gets huge (set to e.g. 15000 or 30000)
const MAX_CITIES = Infinity; // change later if needed

async function run() {
  if (!fs.existsSync(INPUT)) {
    console.error("❌ Input CSV not found:", INPUT);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT, "utf8"),
    crlfDelay: Infinity,
  });

  const entries = [];
  let isHeader = true;
  let count = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // skip header
    if (isHeader) {
      isHeader = false;
      continue;
    }

    // CSV: city,country_code,lat,lon
    const parts = splitCsvLine(trimmed);
    if (parts.length < 4) continue;

    const [rawCity, rawCountry, rawLat, rawLon] = parts;
    const city = rawCity.replace(/^"|"$/g, "").replace(/"/g, '\\"').trim();
    const country = rawCountry.trim();
    const lat = Number(rawLat);
    const lon = Number(rawLon);

    if (!city || !country || Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const key = `${city}, ${country}`;
    entries.push(`  "${key}": { lat: ${lat}, lon: ${lon} }`);
    count++;

    if (count >= MAX_CITIES) break;
  }

  if (!count) {
    console.error("⚠️ No city rows parsed from CSV. Check file format / path.");
    process.exit(1);
  }

  const fileContent = `// AUTO-GENERATED FROM data/world_cities.csv – DO NOT EDIT BY HAND.
// eslint-disable

export const CITY_COORDS_FROM_CSV = {
${entries.join(",\n")}
};

export const CITY_COORDS_FROM_CSV_COUNT = ${count};
`;

  fs.writeFileSync(OUTPUT, fileContent, "utf8");
  console.log(`✅ Generated ${OUTPUT} with ${count} cities.`);
}

/**
 * Simple CSV split that handles quoted city names with commas.
 * Very lightweight, good enough for "city,country_code,lat,lon".
 */
function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // escaped quote ""
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
