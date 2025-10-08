#!/usr/bin/env node
/**
 * Normalize existing Material.category and subCategory values to Title Case
 * and merge duplicates logically (same Title Case). This script is idempotent.
 *
 * Usage (from backend directory):
 *   node scripts/normalizeMaterialCategories.js
 */
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Material = require("../models/Project/Material");

function toTitleCase(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

(async () => {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.DATABASE ||
    process.env.DB ||
    "mongodb://localhost:27017/estetika";
  console.log("Connecting to", mongoUri);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected. Fetching materials...");

  const materials = await Material.find(
    {},
    { category: 1, subCategory: 1 }
  ).lean();
  console.log(`Loaded ${materials.length} materials.`);

  let updates = 0;
  const categoryMap = {}; // original -> normalized

  for (const m of materials) {
    const normCategory = m.category ? toTitleCase(m.category) : m.category;
    const normSub = m.subCategory ? toTitleCase(m.subCategory) : m.subCategory;

    if (normCategory !== m.category || normSub !== m.subCategory) {
      await Material.updateOne(
        { _id: m._id },
        { $set: { category: normCategory, subCategory: normSub } }
      );
      updates++;
    }

    if (m.category) {
      categoryMap[m.category] = normCategory;
    }
  }

  const distinctBefore = [...new Set(materials.map((m) => m.category))].length;
  const distinctAfter = (await Material.distinct("category")).length;

  console.log("Normalization complete.");
  console.log("Documents updated:", updates);
  console.log("Distinct categories before:", distinctBefore);
  console.log("Distinct categories after:", distinctAfter);
  console.log("Sample mapping (first 20):");
  Object.entries(categoryMap)
    .slice(0, 20)
    .forEach(([orig, norm]) => {
      if (orig !== norm) console.log(`  '${orig}' -> '${norm}'`);
    });

  await mongoose.disconnect();
  console.log("Disconnected. Done.");
})();
