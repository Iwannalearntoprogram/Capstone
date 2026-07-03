/**
 * Backfill embeddings for materials that have a missing or empty `embedding`.
 *
 * Requires a funded OPENAI_API_KEY (uses text-embedding-3-small). Safe to re-run:
 * it only touches documents that still lack an embedding, throttles requests, and
 * retries 429s with exponential backoff.
 *
 * Usage:
 *   node scripts/backfillEmbeddings.js                 # all materials missing an embedding
 *   node scripts/backfillEmbeddings.js --since 2026-06-25   # only those created on/after a date
 *   node scripts/backfillEmbeddings.js --delay 1000    # ms between requests (default 700)
 */
const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const { generateEmbedding } = require("../utils/embed");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs(argv) {
  const args = { since: null, delay: 700 };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--since") args.since = new Date(argv[++i]);
    else if (argv[i] === "--delay") args.delay = Number(argv[++i]);
  }
  return args;
}

function embeddingText(m) {
  const opt = (t) =>
    (m.options || []).filter((o) => o.type === t).map((o) => o.option).join(", ");
  return [
    m.name,
    m.company,
    m.category,
    m.subCategory,
    m.description,
    opt("color"),
    opt("type"),
    opt("size"),
  ]
    .filter(Boolean)
    .join(" ");
}

async function embedWithRetry(text, label) {
  const max = 6;
  for (let attempt = 1; attempt <= max; attempt += 1) {
    try {
      return await generateEmbedding(text);
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.error?.code;
      if (code === "insufficient_quota") {
        throw new Error(
          "OpenAI returned insufficient_quota — add credits/billing to the OPENAI_API_KEY before running this."
        );
      }
      if (status === 429 && attempt < max) {
        const wait = Math.min(60000, 2000 * 2 ** (attempt - 1));
        console.log(`  429 on "${label}", retry ${attempt}/${max} after ${wait}ms`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!process.env.MONGO_URI) throw new Error("Missing MONGO_URI in backend/.env");
  if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY in backend/.env");

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  const Materials = mongoose.connection.db.collection("materials");

  const query = {
    $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }],
  };
  if (args.since && !Number.isNaN(args.since.getTime())) {
    query.createdAt = { $gte: args.since };
  }

  const targets = await Materials.find(query).toArray();
  console.log(`Materials missing embedding: ${targets.length}`);

  let ok = 0;
  const failed = [];
  for (const m of targets) {
    try {
      const vec = await embedWithRetry(embeddingText(m), m.name);
      await Materials.updateOne({ _id: m._id }, { $set: { embedding: vec } });
      ok += 1;
      if (ok % 10 === 0) console.log(`  ...embedded ${ok}/${targets.length}`);
      await sleep(args.delay);
    } catch (err) {
      failed.push({ name: m.name, message: err.message });
      console.error(`  FAIL "${m.name}": ${err.message}`);
      if (/insufficient_quota/.test(err.message)) break; // pointless to continue
    }
  }

  console.log(`\nEmbedded OK: ${ok} | Failed: ${failed.length}`);
  if (failed.length) console.log(JSON.stringify(failed, null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
