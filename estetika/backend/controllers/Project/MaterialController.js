const Material = require("../../models/Project/Material");
const User = require("../../models/User/User");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const { generateEmbedding } = require("../../utils/embed");
const { openai } = require("../../utils/openaiClient");


// Get Material by Id or DesignerId
const material_get = catchAsync(async (req, res, next) => {
  const { id, designerId } = req.query;

  let material;

  if (!id && !designerId)
    return next(new AppError("Material identifier not found", 400));

  id
    ? (material = await Material.findById(id).populate(
        "designerId",
        "-password"
      ))
    : (material = await Material.find({ designerId }).populate(
        "designerId",
        "-password"
      ));

  if (!material)
    return next(
      new AppError("Material not found. Invalid Material Identifier.", 404)
    );

  return res
    .status(200)
    .json({ message: "Material Successfully Fetched", material });
});

// Create Material
const material_post = catchAsync(async (req, res, next) => {
  const designerId = req.id;
  const { name, company, price, description, image, options, category } =
    req.body;

  const isDesignerValid = await User.findById(designerId);

  if (!isDesignerValid)
    return next(new AppError("Designer not found. Invalid Designer ID.", 404));

  if (
    !name ||
    !company ||
    !price ||
    !description ||
    !image ||
    !options ||
    !category
  ) {
    return next(new AppError("Cannot create material, missing fields.", 400));
  }

  const embedding = await generateEmbedding(`${name} ${description}`);
  
  const newMaterial = new Material({
    designerId,
    name,
    company,
    price,
    description,
    image,
    options,
    category,
    embedding,
  });

  await newMaterial.save();

  return res
    .status(200)
    .json({ message: "Material Successfully Created", newMaterial });
});

// Update Material
const material_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const { name, company, price, description, image, options, category } =
    req.body;

  if (!id) return next(new AppError("Material identifier not found", 400));

  if (
    !name &&
    !company &&
    !price &&
    !description &&
    !image &&
    !options &&
    !category
  ) {
    return next(new AppError("No data to update", 400));
  }

  const material = await Material.findById(id);

  if (!material) {
    return next(new AppError("Material not found. Invalid Material ID.", 404));
  }

  let updates = {};

  if (name) updates.name = name;
  if (company) updates.company = company;
  if (price) updates.price = price;
  if (description) updates.description = description;
  if (image) updates.image = image;
  if (options) updates.options = options;
  if (category) updates.category = category;

  const updatedMaterial = await Material.findByIdAndUpdate(id, updates, {
    new: true,
  });

  if (!updatedMaterial) {
    return next(new AppError("Material not found", 404));
  }

  return res
    .status(200)
    .json({ message: "Material Updated Successfully", updatedMaterial });
});
// Delete Material
const material_delete = catchAsync(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new AppError("Material identifier not found", 400));

  const material = await Material.findById(id);
  if (!material) return next(new AppError("Material not found", 404));

  if (material.designerId.toString() !== req.id && req.role !== "admin") {
    return next(
      new AppError("You are not authorized to delete this material", 403)
    );
  }

  const deletedMaterial = await Material.findByIdAndDelete(id);

  if (!deletedMaterial) return next(new AppError("Material not found", 404));

  return res
    .status(200)
    .json({ message: "Material Successfully Deleted", deletedMaterial });
});

const vector_search = catchAsync(async (req, res) => {
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: "Query is required." });

  const vector = await generateEmbedding(query);

  const results = await Material.aggregate([
    {
      $vectorSearch: {
        queryVector: vector,
        path: "embedding",
        numCandidates: 100,
        limit: 20,
        index: "materials_search",
      },
    },
  ]);

  if (!results.length) {
    return res.json({ message: "No results found.", results: [] });
  }

  const sanitized = results.map(({ embedding, ...rest }) => rest);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant that filters search results. Only keep items clearly relevant to the query. Remove anything unrelated or weakly related.",
      },
      {
        role: "user",
        content: `Query: "${query}"\n\nResults:\n${JSON.stringify(
          sanitized,
          null,
          2
        )}\n\nReturn only the relevant ones as a JSON array.`,
      },
    ],
    temperature: 0.2,
  });

  const filteredResults = JSON.parse(response.choices[0].message.content);

  return res.json({
    message: `Filtered ${filteredResults.length} relevant results from ${sanitized.length} candidates.`,
    results: filteredResults,
    candidates: sanitized,
  });
});


module.exports = {
  material_get,
  material_post,
  material_put,
  material_delete,
  vector_search,
};
