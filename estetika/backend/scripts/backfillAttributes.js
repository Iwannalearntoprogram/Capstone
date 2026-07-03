/**
 * Backfill attributes for materials that have missing or empty `attributes`.
 *
 * The best source of attribute VALUES (AI over name/description) requires a funded
 * OPENAI_API_KEY, which is currently out of quota. This script instead derives
 * Material/Color attributes offline by keyword-matching each material's name +
 * description against curated word lists. Coverage is therefore PARTIAL: materials
 * whose text contains no recognized keyword are left untouched and reported.
 *
 * SAFE BY DEFAULT: runs as a DRY RUN (writes nothing) unless you pass --apply.
 * Re-runnable: only touches documents that still lack attributes.
 *
 * Usage:
 *   node scripts/backfillAttributes.js                 # dry run: report only, no writes
 *   node scripts/backfillAttributes.js --apply         # actually write derived attributes
 *   node scripts/backfillAttributes.js --since 2026-06-25   # limit by createdAt
 */
const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// Curated keyword lists (lowercase) shared with the recommendation style filter.
const { MATERIAL_KEYWORDS, COLOR_KEYWORDS } = require("../utils/materialLexicon");

// A few tokens appear in both lists (walnut, gold). We treat the material sense
// as primary; if a token is claimed as Material we don't also emit it as Color.

function toTitleCase(str) {
  return str
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Match whole words only (so "ashtray" doesn't match "ash", "brownie" doesn't
// match "brown"). Multi-word keywords like "stainless steel" handled via regex.
function matchesWord(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

function deriveAttributes(material) {
  const text = `${material.name || ""} ${material.description || ""}`;

  const materialsFound = [];
  for (const kw of MATERIAL_KEYWORDS) {
    if (matchesWord(text, kw) && !materialsFound.includes(kw)) {
      materialsFound.push(kw);
    }
  }
  // Normalize "wooden" -> "Wood" for a cleaner value; drop duplicates after.
  const normalizedMaterials = Array.from(
    new Set(
      materialsFound.map((m) => (m === "wooden" ? "wood" : m))
    )
  );

  const claimed = new Set(normalizedMaterials);
  const colorsFound = [];
  for (const kw of COLOR_KEYWORDS) {
    if (claimed.has(kw)) continue; // don't double-count e.g. walnut/gold
    if (matchesWord(text, kw) && !colorsFound.includes(kw)) {
      colorsFound.push(kw);
    }
  }

  const attributes = [];
  normalizedMaterials.forEach((m) =>
    attributes.push({ key: "Material", value: toTitleCase(m) })
  );
  colorsFound.forEach((c) =>
    attributes.push({ key: "Color", value: toTitleCase(c) })
  );
  return attributes;
}

function parseArgs(argv) {
  const args = { apply: false, since: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--apply") args.apply = true;
    else if (argv[i] === "--since") args.since = new Date(argv[++i]);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!process.env.MONGO_URI) throw new Error("Missing MONGO_URI in backend/.env");

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
  });
  const Materials = mongoose.connection.db.collection("materials");

  const query = {
    $or: [{ attributes: { $exists: false } }, { attributes: { $size: 0 } }],
  };
  if (args.since && !Number.isNaN(args.since.getTime())) {
    query.createdAt = { $gte: args.since };
  }

  const targets = await Materials.find(query).toArray();
  console.log(
    `Mode: ${args.apply ? "APPLY (writing)" : "DRY RUN (no writes)"}`
  );
  console.log(`Materials missing attributes: ${targets.length}\n`);

  let matched = 0;
  let written = 0;
  const unmatched = [];
  const preview = [];

  for (const m of targets) {
    const attributes = deriveAttributes(m);
    if (attributes.length === 0) {
      unmatched.push(m.name);
      continue;
    }
    matched += 1;
    if (preview.length < 20) {
      preview.push({ name: m.name, category: m.category, attributes });
    }
    if (args.apply) {
      await Materials.updateOne(
        { _id: m._id },
        { $set: { attributes } }
      );
      written += 1;
    }
  }

  console.log("Sample of derived attributes:");
  console.log(JSON.stringify(preview, null, 2));
  console.log(
    `\nMatched (would get >=1 attribute): ${matched}/${targets.length}`
  );
  console.log(`Unmatched (no keyword found, left as-is): ${unmatched.length}`);
  if (unmatched.length) {
    console.log("  " + unmatched.join(", "));
  }
  if (args.apply) {
    console.log(`\nWritten to DB: ${written}`);
  } else {
    console.log("\nDRY RUN — nothing written. Re-run with --apply to write.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
