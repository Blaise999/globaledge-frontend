// scripts/buildWorldCitiesCsv.mjs
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const root = process.cwd();

// where the geonames txt is
const INPUT = path.join(root, "data", "cities5000.txt");

// where we’ll write the CSV (you can change the path if you like)
const OUTPUT = path.join(root, "data", "world_cities.csv");

async function run() {
  if (!fs.existsSync(INPUT)) {
    console.error("Input file not found:", INPUT);
    process.exit(1);
  }

  // create read + write streams
  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT, "utf8"),
    crlfDelay: Infinity,
  });

  const out = fs.createWriteStream(OUTPUT, "utf8");
  // CSV header
  out.write("city,country_code,lat,lon\n");

  let count = 0;

  for await (const line of rl) {
    if (!line || line.startsWith("#")) continue;

    const parts = line.split("\t");
    if (parts.length < 9) continue;

    const name = parts[1];          // city name
    const lat = parseFloat(parts[4]);
    const lon = parseFloat(parts[5]);
    const country = parts[8];       // country code (e.g. DE, NG, IQ)

    if (!name || !country || Number.isNaN(lat) || Number.isNaN(lon)) continue;

    // escape quotes in city name for CSV (rare but safe)
    const safeName = name.replace(/"/g, '""');

    out.write(`"${safeName}",${country},${lat},${lon}\n`);
    count++;
  }

  out.end();
  out.on("finish", () => {
    console.log(`Done. Wrote ${count} cities to ${OUTPUT}`);
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
