const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const CategoryTemplate = require("../../models/Project/CategoryTemplate");

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

// GET templates or one by category
const category_get = catchAsync(async (req, res, next) => {
  const { category } = req.query;
  if (category) {
    const doc = await CategoryTemplate.findOne({
      category: toTitleCase(category),
    });
    return res.status(200).json({ message: "Template fetched", template: doc });
  }
  const docs = await CategoryTemplate.find();
  res.status(200).json({ message: "Templates fetched", templates: docs });
});

// POST create or upsert template for a category
const category_post = catchAsync(async (req, res, next) => {
  const { category, attributes } = req.body;
  if (!category) return next(new AppError("category is required", 400));
  const keys = Array.isArray(attributes)
    ? attributes
        .filter((a) => a && a.key)
        .map((a) => ({ key: toTitleCase(a.key) }))
    : [];
  const doc = await CategoryTemplate.findOneAndUpdate(
    { category: toTitleCase(category) },
    { $set: { category: toTitleCase(category), attributes: keys } },
    { new: true, upsert: true }
  );
  res.status(200).json({ message: "Template saved", template: doc });
});

// PUT update existing template attributes by id or category
const category_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const { category, attributes } = req.body;
  const update = {};
  if (category) update.category = toTitleCase(category);
  if (Array.isArray(attributes)) {
    update.attributes = attributes
      .filter((a) => a && a.key)
      .map((a) => ({ key: toTitleCase(a.key) }));
  }
  const doc = id
    ? await CategoryTemplate.findByIdAndUpdate(id, update, { new: true })
    : await CategoryTemplate.findOneAndUpdate(
        { category: toTitleCase(category) },
        update,
        { new: true }
      );
  if (!doc) return next(new AppError("Template not found", 404));
  res.status(200).json({ message: "Template updated", template: doc });
});

module.exports = { category_get, category_post, category_put };
