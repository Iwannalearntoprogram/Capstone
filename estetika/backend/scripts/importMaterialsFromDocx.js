const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const mammoth = require("mammoth");
const { initializeApp, getApps } = require("firebase/app");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");
const { v2: cloudinary } = require("cloudinary");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
dns.setServers(["1.1.1.1", "8.8.8.8"]);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const Material = require("../models/Project/Material");
const { generateEmbedding } = require("../utils/embed");

const DEFAULT_MATERIALS_ROOT = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "Materials"
);
const DEFAULT_JSON_OUTPUT = path.resolve(
  __dirname,
  "..",
  "data",
  "materials-import.json"
);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const LABELS = [
  "Material Name",
  "Company Name",
  "Material Price",
  "Material Category",
  "Sub Category",
  "Description",
  "Company",
  "Category",
  "Color",
  "Price",
  "Name",
  "Type",
  "Size",
  "Link",
].sort((a, b) => b.length - a.length);
const LABEL_PATTERN = LABELS.map(escapeRegExp).join("|");

function parseArgs(argv) {
  const args = {
    dryRun: false,
    skipEmbeddings: false,
    skipImages: false,
    updateImagesOnly: false,
    imageMode: process.env.MATERIAL_IMAGE_MODE || "static",
    materialsRoot: DEFAULT_MATERIALS_ROOT,
    jsonOutput: DEFAULT_JSON_OUTPUT,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--no-embed") args.skipEmbeddings = true;
    else if (arg === "--skip-images") args.skipImages = true;
    else if (arg === "--update-images-only") args.updateImagesOnly = true;
    else if (arg === "--image-mode") args.imageMode = argv[++i];
    else if (arg === "--materials-root") args.materialsRoot = path.resolve(argv[++i]);
    else if (arg === "--json-output") args.jsonOutput = path.resolve(argv[++i]);
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/importMaterialsFromDocx.js [options]

Options:
  --dry-run             Parse, validate, match images, and save JSON only
  --no-embed            Skip OpenAI embedding generation
  --skip-images         Do not upload or update material images
  --update-images-only  Only update images on existing MongoDB materials
  --image-mode MODE     static (default), firebase, or cloudinary
  --materials-root DIR  Override the source Materials directory
  --json-output FILE    Override the JSON export file path
`);
      process.exit(0);
    }
  }

  if (!["static", "firebase", "cloudinary"].includes(args.imageMode)) {
    throw new Error("--image-mode must be static, firebase, or cloudinary");
  }

  if (args.updateImagesOnly) {
    args.skipEmbeddings = true;
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
  return String(value || "material")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "material";
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(
      /(?=(?:Material Name|Company Name|Material Price|Material Category|Sub Category)\s*:)/gi,
      "\n"
    )
    .replace(/(?<!Material )(?<!Company )(?=(?:Name)\s*:)/gi, "\n")
    .replace(/(?<!Material )(?=(?:Price)\s*:)/gi, "\n")
    .replace(/(?<!Material )(?<!Sub )(?=(?:Category)\s*:)/gi, "\n")
    .replace(/(?=(?:Company|Description|Color|Type|Size|Link)\s*:)/gi, "\n");
}

function getField(recordText, label) {
  const regex = new RegExp(
    `(?:^|\\n)\\s*${escapeRegExp(label)}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:${LABEL_PATTERN})\\s*:|$)`,
    "i"
  );
  const match = String(recordText || "").match(regex);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function parsePrice(rawPrice) {
  const cleaned = String(rawPrice || "").replace(/[^\d.]/g, "");
  const price = Number(cleaned);
  return Number.isFinite(price) ? price : NaN;
}

function splitOptionValues(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildOptions({ color, type, size }) {
  const options = [];

  splitOptionValues(color).forEach((option) => {
    options.push({ type: "color", option, addToPrice: 0 });
  });

  splitOptionValues(type).forEach((option) => {
    options.push({ type: "type", option, addToPrice: 0 });
  });

  splitOptionValues(size).forEach((option) => {
    options.push({ type: "size", option, addToPrice: 0 });
  });

  return uniqueBy(options, (item) => `${item.type}:${item.option.toLowerCase()}`);
}

function buildAttributes(record) {
  const entries = [
    ["Color", record.color],
    ["Type", record.type],
    ["Size", record.size],
    ["Link", record.link],
    [
      "Document Material Name",
      record.extractedName && record.extractedName !== record.name
        ? record.extractedName
        : "",
    ],
    ["Source Document", record.sourceDocument],
    ["Source Folder", record.sourceFolder],
  ];

  if (record.localImageFiles.length > 0) {
    entries.push([
      "Original Image Files",
      record.localImageFiles.map((file) => path.basename(file)).join(", "),
    ]);
  }

  return entries
    .filter(([, value]) => value != null && String(value).trim() !== "")
    .map(([key, value]) => ({ key, value: String(value).trim() }));
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

async function findMatchingProductFolder(parentFolder, materialName) {
  try {
    const entries = await fsp.readdir(parentFolder, { withFileTypes: true });
    const directories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(parentFolder, entry.name));
    const materialKey = normalizeKey(materialName);

    return (
      directories.find((dir) => path.basename(dir).toLowerCase() === materialName.toLowerCase()) ||
      directories.find((dir) => normalizeKey(path.basename(dir)) === materialKey) ||
      null
    );
  } catch {
    return null;
  }
}

function toRelative(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

async function parseDocx(docxPath, materialsRoot) {
  const { value } = await mammoth.extractRawText({ path: docxPath });
  const text = normalizeText(value);
  const chunks = text
    .split(/(?=^\s*(?:Material\s+)?Name\s*:)/gim)
    .map((chunk) => chunk.trim())
    .filter((chunk) => /^\s*(?:Material\s+)?Name\s*:/i.test(chunk));
  const isSingleProductDoc = chunks.length === 1;
  const folderName = path.basename(path.dirname(docxPath));

  const records = chunks.map((chunk) => {
    const extractedName =
      getField(chunk, "Material Name") || getField(chunk, "Name");
    const raw = {
      name: isSingleProductDoc && folderName ? folderName : extractedName,
      extractedName,
      company: getField(chunk, "Company Name") || getField(chunk, "Company"),
      priceRaw: getField(chunk, "Material Price") || getField(chunk, "Price"),
      description: getField(chunk, "Description"),
      color: getField(chunk, "Color"),
      type: getField(chunk, "Type"),
      size: getField(chunk, "Size"),
      category:
        getField(chunk, "Material Category") || getField(chunk, "Category"),
      subCategory: getField(chunk, "Sub Category"),
      link: getField(chunk, "Link"),
    };

    return {
      ...raw,
      price: parsePrice(raw.priceRaw),
      sourceDocument: toRelative(materialsRoot, docxPath),
      sourceFolder: toRelative(materialsRoot, path.dirname(docxPath)),
      docxPath,
      docxDir: path.dirname(docxPath),
      localImageFiles: [],
      image: [],
      options: buildOptions(raw),
    };
  });

  return records;
}

function validateRecord(record) {
  const missing = [];
  if (!record.name) missing.push("name");
  if (!record.company) missing.push("company");
  if (!Number.isFinite(record.price) || record.price <= 0) missing.push("price");
  if (!record.description) missing.push("description");
  if (!record.category) missing.push("category");
  return missing;
}

async function attachImageFiles(records, materialsRoot) {
  const recordsByDoc = records.reduce((map, record) => {
    const list = map.get(record.docxPath) || [];
    list.push(record);
    map.set(record.docxPath, list);
    return map;
  }, new Map());

  for (const docRecords of recordsByDoc.values()) {
    const isCatalogDoc = docRecords.length > 1;

    for (const record of docRecords) {
      const productFolder = isCatalogDoc
        ? await findMatchingProductFolder(record.docxDir, record.name)
        : record.docxDir;

      record.productFolder = productFolder
        ? toRelative(materialsRoot, productFolder)
        : "";
      record.localImageFiles = productFolder
        ? await listImageFiles(productFolder)
        : [];
      record.attributes = buildAttributes(record);
    }
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function getStaticImageBaseUrl() {
  const explicit = process.env.MATERIAL_IMAGE_BASE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  return `http://localhost:${process.env.PORT || 3000}/material-images`;
}

function toStaticImageUrl(materialsRoot, imageFile) {
  const relativePath = toRelative(materialsRoot, imageFile)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${getStaticImageBaseUrl()}/${relativePath}`;
}

function getFirebaseStorage() {
  if (!process.env.FIREBASE_STORAGEBUCKET) {
    throw new Error("Missing FIREBASE_STORAGEBUCKET in backend/.env");
  }

  if (getApps().length === 0) {
    initializeApp({ storageBucket: process.env.FIREBASE_STORAGEBUCKET });
  }

  return getStorage();
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

async function uploadMaterialImagesToFirebase(record, storage) {
  const urls = [];
  const materialSlug = slugify(record.name);

  for (const imageFile of record.localImageFiles) {
    const buffer = await fsp.readFile(imageFile);
    const fileName = `${slugify(path.basename(imageFile, path.extname(imageFile)))}${path
      .extname(imageFile)
      .toLowerCase()}`;
    const storagePath = `materials/imported/${materialSlug}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: getContentType(imageFile),
    });
    urls.push(await getDownloadURL(snapshot.ref));
  }

  return urls;
}

async function uploadMaterialImagesToCloudinary(record) {
  const urls = [];
  const materialSlug = slugify(record.name);

  for (const imageFile of record.localImageFiles) {
    const buffer = await fsp.readFile(imageFile);
    const fileName = slugify(path.basename(imageFile, path.extname(imageFile)));
    const url = await uploadBufferToCloudinary(buffer, {
      folder: `materials/imported/${materialSlug}`,
      public_id: fileName,
    });
    urls.push(url);
  }

  return urls;
}

async function buildImageUrls(record, args, storage) {
  if (record.localImageFiles.length === 0) return [];

  if (args.imageMode === "firebase") {
    return uploadMaterialImagesToFirebase(record, storage);
  }

  if (args.imageMode === "cloudinary") {
    return uploadMaterialImagesToCloudinary(record);
  }

  return record.localImageFiles.map((file) =>
    toStaticImageUrl(args.materialsRoot, file)
  );
}

async function buildEmbedding(record, existing) {
  if (!process.env.OPENAI_API_KEY) return existing?.embedding || [];

  try {
    return await generateEmbedding(
      [
        record.name,
        record.company,
        record.category,
        record.subCategory,
        record.description,
        record.color,
        record.type,
        record.size,
      ]
        .filter(Boolean)
        .join(" ")
    );
  } catch (error) {
    console.warn(
      `Embedding failed for "${record.name}", keeping existing/empty embedding: ${error.message}`
    );
    return existing?.embedding || [];
  }
}

function toMaterialPayload(record, imageUrls, embedding) {
  return {
    name: record.name,
    company: record.company,
    price: record.price,
    description: record.description,
    category: record.category,
    subCategory: record.subCategory,
    options: record.options,
    attributes: record.attributes,
    image: imageUrls,
    embedding,
  };
}

async function saveJson(outputPath, payload) {
  await fsp.mkdir(path.dirname(outputPath), { recursive: true });
  await fsp.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function publicRecord(record) {
  return {
    name: record.name,
    company: record.company,
    price: record.price,
    description: record.description,
    category: record.category,
    subCategory: record.subCategory,
    options: record.options,
    attributes: record.attributes,
    image: record.image,
    localImageFiles: record.localImageFiles.map((file) => path.basename(file)),
    productFolder: record.productFolder,
    sourceDocument: record.sourceDocument,
  };
}

async function loadRecords(materialsRoot) {
  const docxFiles = (
    await walkFiles(
      materialsRoot,
      (file) => path.extname(file).toLowerCase() === ".docx"
    )
  ).sort((a, b) => a.localeCompare(b));

  const records = [];
  for (const docxFile of docxFiles) {
    records.push(...(await parseDocx(docxFile, materialsRoot)));
  }

  await attachImageFiles(records, materialsRoot);
  return { docxFiles, records };
}

async function importRecords(records, args) {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 20000,
  });
  const storage =
    !args.skipImages && args.imageMode === "firebase"
      ? getFirebaseStorage()
      : null;
  const summary = {
    dryRun: args.dryRun,
    updateImagesOnly: args.updateImagesOnly,
    inserted: 0,
    updated: 0,
    matched: 0,
    failed: 0,
    imageLinks: 0,
    imageMode: args.skipImages ? "skipped" : args.imageMode,
    noImages: [],
    missingMongoMatches: [],
    errors: [],
  };

  try {
    for (const record of records) {
      try {
        const existing = await Material.findOne({
          name: record.name,
          company: record.company,
          category: record.category,
        });

        if (args.updateImagesOnly) {
          if (!existing) {
            summary.missingMongoMatches.push({
              name: record.name,
              company: record.company,
              category: record.category,
              sourceDocument: record.sourceDocument,
            });
            continue;
          }

          summary.matched += 1;

          if (record.localImageFiles.length === 0) {
            summary.noImages.push(record.name);
            continue;
          }

          let imageUrls = existing.image || [];
          if (!args.skipImages && !args.dryRun) {
            imageUrls = await buildImageUrls(record, args, storage);
            await Material.findByIdAndUpdate(
              existing._id,
              { $set: { image: imageUrls } },
              { new: true, runValidators: true }
            );
            record.image = imageUrls;
            summary.updated += 1;
          } else {
            record.image = imageUrls;
          }

          summary.imageLinks += record.localImageFiles.length;
          continue;
        }

        let imageUrls = existing?.image || [];
        if (!args.skipImages && record.localImageFiles.length > 0) {
          imageUrls = await buildImageUrls(record, args, storage);
          summary.imageLinks += imageUrls.length;
        } else if (record.localImageFiles.length === 0) {
          summary.noImages.push(record.name);
        }

        const embedding = args.skipEmbeddings
          ? existing?.embedding || []
          : await buildEmbedding(record, existing);
        const payload = toMaterialPayload(record, imageUrls, embedding);

        const saved = existing
          ? await Material.findByIdAndUpdate(existing._id, payload, {
              new: true,
              runValidators: true,
            })
          : await Material.create(payload);

        record.image = saved.image || [];
        if (existing) summary.updated += 1;
        else summary.inserted += 1;
      } catch (error) {
        summary.failed += 1;
        summary.errors.push({ name: record.name, message: error.message });
        console.error(`Failed to import "${record.name}": ${error.message}`);
      }
    }
  } finally {
    await mongoose.disconnect();
  }

  return summary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.materialsRoot)) {
    throw new Error(`Materials root not found: ${args.materialsRoot}`);
  }

  const { docxFiles, records } = await loadRecords(args.materialsRoot);
  const invalid = records
    .map((record) => ({ record, missing: validateRecord(record) }))
    .filter((entry) => entry.missing.length > 0);
  const missingImages = records.filter((record) => record.localImageFiles.length === 0);

  if (invalid.length > 0) {
    await saveJson(args.jsonOutput, {
      generatedAt: new Date().toISOString(),
      dryRun: args.dryRun,
      docxCount: docxFiles.length,
      materialCount: records.length,
      invalid: invalid.map((entry) => ({
        name: entry.record.name,
        sourceDocument: entry.record.sourceDocument,
        missing: entry.missing,
      })),
      materials: records.map(publicRecord),
    });
    throw new Error(
      `Parsed ${invalid.length} invalid material records. See ${args.jsonOutput}`
    );
  }

  let importSummary = null;
  if (!args.dryRun || args.updateImagesOnly) {
    importSummary = await importRecords(records, args);
  }

  await saveJson(args.jsonOutput, {
    generatedAt: new Date().toISOString(),
    dryRun: args.dryRun,
    docxCount: docxFiles.length,
    materialCount: records.length,
    missingImageCount: missingImages.length,
    missingImages: missingImages.map((record) => ({
      name: record.name,
      sourceDocument: record.sourceDocument,
      expectedFolder: record.productFolder,
    })),
    importSummary,
    materials: records.map(publicRecord),
  });

  console.log(
    JSON.stringify(
      {
        mode: args.dryRun ? "dry-run" : "import",
        docxCount: docxFiles.length,
        materialCount: records.length,
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
