/**
 * Convert legacy material attributes from key/value records into string tags.
 *
 * Dry run:
 *   node scripts/migrateAttributesToTags.js
 *
 * Apply:
 *   node scripts/migrateAttributesToTags.js --apply
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Material = require("../models/Project/Material");
const MaterialRequest = require("../models/Project/MaterialRequest");
const Project = require("../models/Project/Project");
const { normalizeAttributeTags } = require("../utils/attributeTags");

const apply = process.argv.includes("--apply");

const connect = async () => {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE ||
    process.env.DB_URI;

  if (!uri) {
    throw new Error("Missing MongoDB connection string env var.");
  }

  await mongoose.connect(uri);
};

const updateCollection = async (Model, label) => {
  const docs = await Model.find().select("attributes").lean();
  let changed = 0;

  for (const doc of docs) {
    const tags = normalizeAttributeTags(doc.attributes);
    const current = JSON.stringify(doc.attributes || []);
    const next = JSON.stringify(tags);

    if (current === next) continue;
    changed += 1;

    if (apply) {
      await Model.updateOne({ _id: doc._id }, { $set: { attributes: tags } });
    }
  }

  console.log(`${label}: ${changed} document(s) ${apply ? "updated" : "would update"}.`);
};

const updateProjectMaterialLists = async () => {
  const projects = await Project.find().select("materialsList").lean();
  let changed = 0;

  for (const project of projects) {
    const nextList = (project.materialsList || []).map((item) => {
      const tags = normalizeAttributeTags(item.attributes);
      return {
        ...item,
        attributes: tags.length ? tags : undefined,
      };
    });

    const current = JSON.stringify(project.materialsList || []);
    const next = JSON.stringify(nextList);
    if (current === next) continue;
    changed += 1;

    if (apply) {
      await Project.updateOne(
        { _id: project._id },
        { $set: { materialsList: nextList } }
      );
    }
  }

  console.log(
    `Project material needs: ${changed} project(s) ${
      apply ? "updated" : "would update"
    }.`
  );
};

const run = async () => {
  await connect();
  await updateCollection(Material, "Materials");
  await updateCollection(MaterialRequest, "Material requests");
  await updateProjectMaterialLists();
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
