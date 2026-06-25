const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const mammoth = require("mammoth");
const { v2: cloudinary } = require("cloudinary");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
dns.setServers(["1.1.1.1", "8.8.8.8"]);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const DesignRecommendation = require("../models/Project/DesignRecommendation");

const DEFAULT_DESIGNS_ROOT = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "Interior Designs"
);
const DEFAULT_JSON_OUTPUT = path.resolve(
  __dirname,
  "..",
  "data",
  "designs-import.json"
);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Valid `type` enum values on the DesignRecommendation model.
const ROOM_TYPE_ENUM = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Home Office",
  "Dining Room",
  "Whole House",
  "Commercial Space",
];

const LABELS = [
  "Design Preference",
  "Project Type",
  "Description",
  "Room Type",
  "Budget",
  "Name",
  "Tags",
].sort((a, b) => b.length - a.length);
const LABEL_PATTERN = LABELS.map(escapeRegExp).join("|");

// Designs whose docx Name does not match their image filename. Keyed by
// normalized design name -> exact image filename in the same folder.
const IMAGE_OVERRIDES = new Map(
  [
    ["Modern Black & White Office", "Modern Black & White.jpg"],
    ["Sophisticated Modern Home Office", "Sophisticated Modern Office.jpg"],
    ["Elegant Executive Home Office", "Elegant Executive Office.jpg"],
    ["Dark Monolithic Home Office", "Dark Monolithic Modern Office.jpg"],
  ].map(([name, file]) => [normalizeKey(name), file])
);

function parseArgs(argv) {
  const args = {
    dryRun: false,
    skipImages: false,
    designsRoot: DEFAULT_DESIGNS_ROOT,
    jsonOutput: DEFAULT_JSON_OUTPUT,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--skip-images") args.skipImages = true;
    else if (arg === "--designs-root") args.designsRoot = path.resolve(argv[++i]);
    else if (arg === "--json-output") args.jsonOutput = path.resolve(argv[++i]);
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/importDesignsFromDocx.js [options]

Options:
  --dry-run             Parse, validate, match images, and save JSON only
  --skip-images         Do not upload design images (keeps existing imageLink)
  --designs-root DIR    Override the source "Interior Designs" directory
  --json-output FILE    Override the JSON export file path
`);
      process.exit(0);
    }
  }

  return args;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function slugify(value) {
  return (
    String(value || "design")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "design"
  );
}

function getField(recordText, label) {
  const regex = new RegExp(
    `(?:^|\\n)\\s*${escapeRegExp(label)}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:${LABEL_PATTERN})\\s*:|$)`,
    "i"
  );
  const match = String(recordText || "").match(regex);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

// Insert a newline before each known label so getField can anchor on line starts.
function normalizeText(text) {
  let result = String(text || "").replace(/\r/g, "\n");
  for (const label of LABELS) {
    result = result.replace(
      new RegExp(`(?=${escapeRegExp(label)}\\s*:)`, "gi"),
      "\n"
    );
  }
  return result;
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupePreserveOrder(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

// Parse strings like "P35,000 – P75,000" or "₱1,200,000 – ₱1,800,000".
function parseBudgetRange(raw) {
  const numbers = (String(raw || "").match(/\d[\d,]*/g) || [])
    .map((token) => Number(token.replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));

  if (numbers.length === 0) return null;
  const min = numbers[0];
  const max = numbers.length > 1 ? numbers[1] : numbers[0];
  return { min, max };
}

function normalizeRoomType(raw) {
  const wanted = normalizeKey(raw);
  return ROOM_TYPE_ENUM.find((option) => normalizeKey(option) === wanted) || null;
}

async function walkFiles(root, predicate) {
  const results = [];
  const entries = await fsp.readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkFiles(fullPath, predicate)));
    } else if (!predicate || predicate(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

async function listImageFiles(folder) {
  try {
    const entries = await fsp.readdir(folder, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(folder, entry.name))
      .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function toRelative(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

// Match a design name to an image file in its folder:
// (1) explicit override, (2) exact basename, (3) normalized-key match.
function matchImageFile(name, imageFiles) {
  const nameKey = normalizeKey(name);

  const override = IMAGE_OVERRIDES.get(nameKey);
  if (override) {
    const hit = imageFiles.find(
      (file) => path.basename(file).toLowerCase() === override.toLowerCase()
    );
    if (hit) return hit;
  }

  return (
    imageFiles.find(
      (file) =>
        path.basename(file, path.extname(file)).toLowerCase() ===
        name.toLowerCase()
    ) ||
    imageFiles.find(
      (file) => normalizeKey(path.basename(file, path.extname(file))) === nameKey
    ) ||
    null
  );
}

async function parseDocx(docxPath, designsRoot) {
  const { value } = await mammoth.extractRawText({ path: docxPath });
  const text = normalizeText(value);
  const chunks = text
    .split(/(?=^\s*Name\s*:)/gim)
    .map((chunk) => chunk.trim())
    .filter((chunk) => /^\s*Name\s*:/i.test(chunk));

  return chunks.map((chunk) => {
    const name = getField(chunk, "Name");
    const projectTypes = splitList(getField(chunk, "Project Type"));
    const tags = splitList(getField(chunk, "Tags"));
    const roomTypeRaw = getField(chunk, "Room Type");

    return {
      title: name,
      roomTypeRaw,
      type: normalizeRoomType(roomTypeRaw),
      budgetRaw: getField(chunk, "Budget"),
      budgetRange: parseBudgetRange(getField(chunk, "Budget")),
      designPreferences: splitList(getField(chunk, "Design Preference")),
      projectTypes,
      tags: dedupePreserveOrder([...tags, ...projectTypes]),
      specification: getField(chunk, "Description"),
      sourceDocument: toRelative(designsRoot, docxPath),
      docxDir: path.dirname(docxPath),
      imageFile: "",
      imageLink: "",
    };
  });
}

async function attachImageFiles(records, designsRoot) {
  const imagesByDir = new Map();

  for (const record of records) {
    if (!imagesByDir.has(record.docxDir)) {
      imagesByDir.set(record.docxDir, await listImageFiles(record.docxDir));
    }
    const imageFiles = imagesByDir.get(record.docxDir);
    const matched = matchImageFile(record.title, imageFiles);
    record.imageFile = matched ? toRelative(designsRoot, matched) : "";
    record.imageAbsPath = matched || "";
  }
}

function validateRecord(record) {
  const missing = [];
  if (!record.title) missing.push("title");
  if (!record.type) missing.push(`type (unmapped Room Type: "${record.roomTypeRaw}")`);
  if (!record.budgetRange) missing.push(`budgetRange (raw: "${record.budgetRaw}")`);
  return missing;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function assertCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
  }
}

async function uploadBufferToCloudinary(buffer, options) {
  assertCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        overwrite: true,
        invalidate: true,
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) {
          return reject(new Error("Cloudinary upload did not return a URL"));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

// Upload to folder `design/<id>` to mirror FileController.design_image_post.
async function uploadDesignImage(record, designId) {
  const buffer = await fsp.readFile(record.imageAbsPath);
  return uploadBufferToCloudinary(buffer, {
    folder: `design/${designId}`,
    public_id: slugify(record.title),
    content_type: getContentType(record.imageAbsPath),
  });
}

function toRecommendationPayload(record) {
  return {
    title: record.title,
    specification: record.specification || undefined,
    budgetRange: record.budgetRange,
    designPreferences: record.designPreferences,
    type: record.type,
    tags: record.tags,
  };
}

async function saveJson(outputPath, payload) {
  await fsp.mkdir(path.dirname(outputPath), { recursive: true });
  await fsp.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function publicRecord(record) {
  return {
    title: record.title,
    type: record.type,
    budgetRange: record.budgetRange,
    designPreferences: record.designPreferences,
    tags: record.tags,
    specification: record.specification,
    imageFile: record.imageFile,
    imageLink: record.imageLink,
    sourceDocument: record.sourceDocument,
  };
}

async function loadRecords(designsRoot) {
  const docxFiles = (
    await walkFiles(
      designsRoot,
      (file) => path.extname(file).toLowerCase() === ".docx"
    )
  ).sort((a, b) => a.localeCompare(b));

  const records = [];
  for (const docxFile of docxFiles) {
    records.push(...(await parseDocx(docxFile, designsRoot)));
  }

  await attachImageFiles(records, designsRoot);
  return { docxFiles, records };
}

async function importRecords(records, args) {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 20000,
  });

  const summary = {
    inserted: 0,
    updated: 0,
    imagesUploaded: 0,
    failed: 0,
    noImages: [],
    errors: [],
  };

  try {
    for (const record of records) {
      try {
        const payload = toRecommendationPayload(record);
        const existing = await DesignRecommendation.findOne({
          title: record.title,
          type: record.type,
        });

        const doc = existing
          ? await DesignRecommendation.findByIdAndUpdate(existing._id, payload, {
              new: true,
              runValidators: true,
            })
          : await DesignRecommendation.create(payload);

        if (existing) summary.updated += 1;
        else summary.inserted += 1;

        if (!args.skipImages && record.imageAbsPath) {
          const url = await uploadDesignImage(record, doc._id);
          await DesignRecommendation.findByIdAndUpdate(doc._id, {
            $set: { imageLink: url },
          });
          record.imageLink = url;
          summary.imagesUploaded += 1;
        } else if (!record.imageAbsPath) {
          summary.noImages.push(record.title);
          record.imageLink = doc.imageLink || "";
        } else {
          record.imageLink = doc.imageLink || "";
        }
      } catch (error) {
        summary.failed += 1;
        summary.errors.push({ title: record.title, message: error.message });
        console.error(`Failed to import "${record.title}": ${error.message}`);
      }
    }
  } finally {
    await mongoose.disconnect();
  }

  return summary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.designsRoot)) {
    throw new Error(`Designs root not found: ${args.designsRoot}`);
  }

  const { docxFiles, records } = await loadRecords(args.designsRoot);
  const invalid = records
    .map((record) => ({ record, missing: validateRecord(record) }))
    .filter((entry) => entry.missing.length > 0);
  const missingImages = records.filter((record) => !record.imageAbsPath);

  if (invalid.length > 0) {
    await saveJson(args.jsonOutput, {
      generatedAt: new Date().toISOString(),
      dryRun: args.dryRun,
      docxCount: docxFiles.length,
      designCount: records.length,
      invalid: invalid.map((entry) => ({
        title: entry.record.title,
        sourceDocument: entry.record.sourceDocument,
        missing: entry.missing,
      })),
      designs: records.map(publicRecord),
    });
    throw new Error(
      `Parsed ${invalid.length} invalid design records. See ${args.jsonOutput}`
    );
  }

  let importSummary = null;
  if (!args.dryRun) {
    importSummary = await importRecords(records, args);
  }

  await saveJson(args.jsonOutput, {
    generatedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    docxCount: docxFiles.length,
    designCount: records.length,
    missingImageCount: missingImages.length,
    missingImages: missingImages.map((record) => ({
      title: record.title,
      sourceDocument: record.sourceDocument,
    })),
    importSummary,
    designs: records.map(publicRecord),
  });

  console.log(
    JSON.stringify(
      {
        mode: args.dryRun ? "dry-run" : "import",
        docxCount: docxFiles.length,
        designCount: records.length,
        invalidCount: invalid.length,
        missingImageCount: missingImages.length,
        jsonOutput: args.jsonOutput,
        importSummary,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
