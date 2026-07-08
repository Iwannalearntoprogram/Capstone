const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const Material = require("../models/Project/Material");

const ROOM_MATCHERS = [
  [
    "Bathroom",
    /\b(bath|bathroom|lavatory|vanity|shower|toilet|washroom)\b/i,
  ],
  [
    "Bedroom",
    /\b(bed|bedroom|bedroom|bed frame|mattress|wardrobe|dresser|nightstand|closet|armoire)\b/i,
  ],
  [
    "Dining Room",
    /\b(dining|buffet|sideboard|bar stool|barstool|stool)\b/i,
  ],
  [
    "Home Office",
    /\b(office|desk|workspace|executive|task chair|workstation)\b/i,
  ],
  [
    "Kitchen",
    /\b(kitchen|counter|pantry|backsplash|island|cupboard)\b/i,
  ],
  [
    "Commercial Space",
    /\b(commercial|reception|retail|display|storefront)\b/i,
  ],
  [
    "Living Room",
    /\b(living|sofa|loveseat|sectional|recliner|coffee table|tv stand|media|console|accent chair|wall decor|rug|rugs|lighting|lamp|bookcase|shelf|fireplace)\b/i,
  ],
];

function getAttributeValue(material, keyPattern) {
  if (!Array.isArray(material.attributes)) return "";
  const match = material.attributes.find((attribute) =>
    keyPattern.test(attribute?.key || "")
  );
  return match?.value || "";
}

function inferRoomType(material) {
  const sourceText = [
    getAttributeValue(material, /^source folder$/i),
    getAttributeValue(material, /^source document$/i),
    material.category,
    material.subCategory,
    material.name,
    material.description,
  ]
    .filter(Boolean)
    .join(" ");

  for (const [roomType, matcher] of ROOM_MATCHERS) {
    if (matcher.test(sourceText)) return roomType;
  }

  return "Whole House";
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 20000,
  });

  const materials = await Material.find({
    $or: [
      { roomTypes: { $exists: false } },
      { roomTypes: null },
      { roomTypes: { $size: 0 } },
      { roomType: { $exists: false } },
      { roomType: null },
      { roomType: "" },
    ],
  }).select("name category subCategory description attributes roomType roomTypes");

  const counts = {};
  let updated = 0;

  for (const material of materials) {
    const roomType = inferRoomType(material);
    counts[roomType] = (counts[roomType] || 0) + 1;

    if (!dryRun) {
      material.roomTypes = [roomType];
      material.roomType = roomType;
      await material.save();
      updated += 1;
    }
  }

  await mongoose.disconnect();

  console.log(
    JSON.stringify(
      {
        dryRun,
        matched: materials.length,
        updated,
        inferredCounts: counts,
      },
      null,
      2
    )
  );
}

main().catch(async (error) => {
  console.error(error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
