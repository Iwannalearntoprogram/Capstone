const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const AttributeRegistry = require("../../models/Project/AttributeRegistry");

const toTitleCase = (s) =>
  typeof s === "string"
    ? s
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : s;

// GET all keys or values for a key
const registry_get = catchAsync(async (req, res, next) => {
  const { key } = req.query;
  if (key) {
    const doc = await AttributeRegistry.findOne({ key: toTitleCase(key) });
    return res.status(200).json({ message: "Registry fetched", registry: doc });
  }
  const docs = await AttributeRegistry.find();
  res.status(200).json({ message: "Registries fetched", registries: docs });
});

// POST append a value to a key, creating key if missing
const registry_post = catchAsync(async (req, res, next) => {
  const { key, value } = req.body;
  if (!key || !value)
    return next(new AppError("key and value are required", 400));
  const doc = await AttributeRegistry.findOneAndUpdate(
    { key: toTitleCase(key) },
    { $addToSet: { values: value.toString().trim() } },
    { new: true, upsert: true }
  );
  res.status(200).json({ message: "Registry updated", registry: doc });
});

module.exports = { registry_get, registry_post };
