const Material = require("../../models/Project/Material");
const Project = require("../../models/Project/Project");
const User = require("../../models/User/User");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const { generateEmbedding } = require("../../utils/embed");
const { openai } = require("../../utils/openaiClient");
const {
  rankMaterialsForProjectContext,
} = require("../../utils/materialRecommendation");

const getProjectSearchContext = (project) => {
  if (!project || typeof project !== "object") return "";

  const designRecommendation =
    project.designRecommendation &&
    typeof project.designRecommendation === "object" &&
    !Array.isArray(project.designRecommendation)
      ? project.designRecommendation
      : null;

  return [
    project.roomType ? `Room type: ${project.roomType}` : "",
    project.projectType ? `Project type: ${project.projectType}` : "",
    project.priority ? `Priority: ${project.priority}` : "",
    project.designPreference
      ? `Project preference: ${project.designPreference}`
      : "",
    project.description ? `Project brief: ${project.description}` : "",
    designRecommendation?.title
      ? `Design recommendation: ${designRecommendation.title}`
      : "",
    designRecommendation?.specification
      ? `Design recommendation details: ${designRecommendation.specification}`
      : "",
    Array.isArray(designRecommendation?.designPreferences) &&
    designRecommendation.designPreferences.length > 0
      ? `Design recommendation preferences: ${designRecommendation.designPreferences.join(
          ", "
        )}`
      : "",
    Array.isArray(designRecommendation?.tags) && designRecommendation.tags.length > 0
      ? `Design recommendation tags: ${designRecommendation.tags.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
};

// Get Material by Id or DesignerId
const material_get = catchAsync(async (req, res, next) => {
  const { id, designerId } = req.query;

  let material;

  if (id) {
    material = await Material.findById(id)
      .populate("designerId", "-password")
      .select("-embedding");
    if (!material)
      return next(
        new AppError("Material not found. Invalid Material Identifier.", 404)
      );
  } else if (designerId) {
    material = await Material.find({ designerId })
      .populate("designerId", "-password")
      .select("-embedding");
    if (!material || material.length === 0)
      return next(
        new AppError("Material not found. Invalid Material Identifier.", 404)
      );
  } else {
    material = await Material.find()
      .populate("designerId", "-password")
      .select("-embedding");
  }

  return res
    .status(200)
    .json({ message: "Material Successfully Fetched", material });
});

// Create Material
const material_post = catchAsync(async (req, res, next) => {
  const designerId = req.id;
  const {
    name,
    company,
    price,
    description,
    image,
    options,
    category,
    subCategory,
    attributes,
  } = req.body; // added category

  const isDesignerValid = await User.findById(designerId);
  if (!isDesignerValid)
    return next(new AppError("Designer not found. Invalid Designer ID.", 404));

  // Required field validation (allow price 0 check explicitly)
  if (
    name == null ||
    company == null ||
    price == null ||
    description == null ||
    category == null
  ) {
    return next(
      new AppError(
        "Missing required fields: name, company, price, description, category.",
        400
      )
    );
  }
  if (typeof price !== "number" || Number.isNaN(price) || price <= 0) {
    return next(new AppError("Price must be a positive number.", 400));
  }

  // Options: allow empty array; if provided validate structure
  if (options !== undefined) {
    if (!Array.isArray(options)) {
      return next(new AppError("Options must be an array.", 400));
    }
    for (const option of options) {
      if (!option || typeof option !== "object") {
        return next(new AppError("Each option must be an object.", 400));
      }
      const { type, option: optValue, addToPrice } = option;
      if (!type || !optValue || typeof addToPrice !== "number") {
        return next(
          new AppError(
            "Each option must include 'type', 'option', and numeric 'addToPrice'.",
            400
          )
        );
      }
      if (!["color", "type", "size"].includes(type)) {
        return next(
          new AppError(
            "Option type must be one of: 'color', 'type', 'size'.",
            400
          )
        );
      }
    }
  }

  let embedding = [];
  try {
    embedding = await generateEmbedding(`${name} ${description}`);
  } catch (e) {
    console.warn(
      "Embedding generation failed, proceeding without vector:",
      e?.message
    );
  }

  const newMaterial = new Material({
    designerId,
    name,
    company,
    price,
    description,
    image: Array.isArray(image) ? image : image ? [image] : [],
    options: Array.isArray(options) ? options : [],
    category,
    subCategory,
    attributes: Array.isArray(attributes)
      ? attributes.filter((a) => a && a.key && a.value)
      : [],
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
  const {
    name,
    company,
    price,
    description,
    image,
    options,
    category,
    subCategory,
    attributes,
  } = req.body;

  if (!id) return next(new AppError("Material identifier not found", 400));

  // Only storage_admin can update materials
  if (req.role !== "storage_admin") {
    return next(
      new AppError("You are not authorized to update this material", 403)
    );
  }

  if (
    !name &&
    !company &&
    !price &&
    !description &&
    !image &&
    !options &&
    !category &&
    !subCategory &&
    !attributes
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
  if (description) updates.description = description;
  if (image) updates.image = image;
  if (category) updates.category = category;
  if (subCategory) updates.subCategory = subCategory;
  if (attributes) updates.attributes = attributes;

  if (price !== undefined) {
    if (typeof price !== "number" || price <= 0) {
      return next(new AppError("Price must be a positive number.", 400));
    }
    updates.price = price;
  }

  if (options !== undefined) {
    if (!Array.isArray(options)) {
      return next(new AppError("Options must be an array.", 400));
    }

    // Validate each option object
    for (const option of options) {
      if (
        !option.type ||
        !option.option ||
        typeof option.addToPrice !== "number"
      ) {
        return next(
          new AppError(
            "Each option must have type, option, and addToPrice fields.",
            400
          )
        );
      }
      if (!["color", "type", "size"].includes(option.type)) {
        return next(
          new AppError("Option type must be 'color', 'type', or 'size'.", 400)
        );
      }
    }
    updates.options = options;
  }

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

  // Only storage_admin can delete materials
  if (req.role !== "storage_admin") {
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
  const { query, max } = req.query;

  if (!query) return res.status(400).json({ error: "Query is required." });
  if (!max) return res.status(400).json({ error: "Max is required." });

  const maxInt = parseInt(max, 10);
  const vector = await generateEmbedding(query);

  const results = await Material.aggregate([
    {
      $vectorSearch: {
        queryVector: vector,
        path: "embedding",
        numCandidates: 100,
        limit: maxInt,
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
        )}\n\nReturn only the relevant ones as a JSON array. . Do not include any markdown formatting.`,
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

const material_search = catchAsync(async (req, res) => {
  const { query, projectId } = req.query;

  if (!query) return res.status(400).json({ error: "Query is required." });

  const project = projectId
    ? await Project.findById(projectId).populate("designRecommendation").lean()
    : null;

  if (projectId && !project) {
    return res.status(404).json({ error: "Project not found." });
  }

  const projectContext = getProjectSearchContext(project);
  const getMinPrice = (item) => {
    if (typeof item.price === "number") {
      // Base price
      const basePrice = item.price;

      // If there are options, find the minimum addToPrice
      if (Array.isArray(item.options) && item.options.length > 0) {
        const minOptionPrice = Math.min(
          ...item.options.map((opt) => opt.addToPrice || 0)
        );
        return basePrice + minOptionPrice;
      }

      return basePrice;
    }
    return 0;
  };

  const percentDiff = (a, b) =>
    b === 0 ? null : Math.round(((a - b) / b) * 100);

  const isSameMaterial = (left, right) =>
    String(left?._id || "") === String(right?._id || "");

  const searchSingleItem = async (itemQuery) => {
    const searchPrompt = projectContext
      ? `${itemQuery}\n${projectContext}`
      : itemQuery;
    const vector = await generateEmbedding(searchPrompt);

    const results = await Material.aggregate([
      {
        $vectorSearch: {
          queryVector: vector,
          path: "embedding",
          numCandidates: 100,
          limit: 10,
          index: "materials_search",
        },
      },
    ]);

    if (!results.length) {
      return null;
    }

    const sanitized = results.map(({ embedding, ...rest }) => rest);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that filters search results. Keep items only if they match the requested material and, when project context is provided, the project design direction as well. Return only JSON.",
        },
        {
          role: "user",
          content: `${
            projectContext
              ? `Project context:\n${projectContext}\n\n`
              : ""
          }Requested material: "${itemQuery}"\n\nResults:\n${JSON.stringify(
            sanitized,
            null,
            2
          )}\n\nReturn only the relevant ones as a JSON array. Do not include any markdown formatting.`,
        },
      ],
      temperature: 0.2,
    });

    const filteredResults = JSON.parse(response.choices[0].message.content);

    if (!filteredResults.length) {
      return null;
    }

    const rankedResults = project
      ? rankMaterialsForProjectContext(project, filteredResults, {
          extraSources: [itemQuery],
        }).map((entry) => entry.material)
      : filteredResults;

    const sortedByPrice = [...rankedResults].sort(
      (a, b) => getMinPrice(a) - getMinPrice(b)
    );

    const bestMatch = rankedResults[0];
    const bestMatchPrice = getMinPrice(bestMatch);

    let cheaper = sortedByPrice.find(
      (item) => getMinPrice(item) < bestMatchPrice && !isSameMaterial(item, bestMatch)
    );
    let moreExpensive = [...sortedByPrice]
      .reverse()
      .find(
        (item) => getMinPrice(item) > bestMatchPrice && !isSameMaterial(item, bestMatch)
      );
    let optionsComparison = null;
    if (
      !cheaper &&
      !moreExpensive &&
      Array.isArray(bestMatch.options) &&
      bestMatch.options.length > 0
    ) {
      optionsComparison = bestMatch.options.map((option) => ({
        type: option.type,
        option: option.option,
        totalPrice: bestMatch.price + (option.addToPrice || 0),
        addToPrice: option.addToPrice || 0,
      }));
    }

    return {
      query: itemQuery,
      bestMatch: {
        ...bestMatch,
        minPrice: bestMatchPrice,
      },
      cheaper: cheaper
        ? {
            ...cheaper,
            minPrice: getMinPrice(cheaper),
            percentCheaper: percentDiff(bestMatchPrice, getMinPrice(cheaper)),
          }
        : null,
      moreExpensive: moreExpensive
        ? {
            ...moreExpensive,
            minPrice: getMinPrice(moreExpensive),
            percentMoreExpensive: percentDiff(
              getMinPrice(moreExpensive),
              bestMatchPrice
            ),
          }
        : null,
      optionsComparison: optionsComparison,
    };
  };

  const itemDetectionResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant that analyzes search queries to detect if they contain multiple distinct material/product items. Return a JSON object with 'isMultiple' (boolean) and 'items' (array of individual item names if multiple, or the original query if single).",
      },
      {
        role: "user",
        content: `Analyze this query and determine if it contains multiple distinct material items: "${query}"\n\nExamples:\n- "wood and steel" -> multiple items\n- "wood planks and metal screws" -> multiple items\n- "red oak wood" -> single item\n- "cement, brick, and tiles" -> multiple items\n\nReturn JSON only, no markdown formatting.`,
      },
    ],
    temperature: 0.1,
  });

  const itemDetection = JSON.parse(
    itemDetectionResponse.choices[0].message.content
  );

  if (itemDetection.isMultiple && Array.isArray(itemDetection.items)) {
    const results = [];
    const notFound = [];

    for (const item of itemDetection.items) {
      const itemResult = await searchSingleItem(item.trim());
      if (itemResult) {
        results.push(itemResult);
      } else {
        notFound.push(item.trim());
      }
    }

    return res.json({
      message: `Found materials for ${results.length} out of ${itemDetection.items.length} requested items.`,
      results: results,
      notFound: notFound.length > 0 ? notFound : undefined,
    });
  } else {
    const result = await searchSingleItem(query);

    if (!result) {
      return res.json({ message: "No relevant results found.", results: [] });
    }

    return res.json({
      message: "Found this material.",
      result: result,
    });
  }
});

// Similar materials for the material details page. Uses the material's OWN
// stored embedding as the query vector, so it never calls OpenAI at request
// time (no quota/429 dependency). Falls back to same-category matches for
// materials that don't have an embedding yet.
const material_similar = catchAsync(async (req, res) => {
  const { id, max } = req.query;

  if (!id) return res.status(400).json({ error: "id is required." });

  const maxInt = Math.min(Math.max(parseInt(max, 10) || 8, 1), 24);

  const material = await Material.findById(id)
    .select("name category subCategory embedding")
    .lean();

  if (!material) return res.status(404).json({ error: "Material not found." });

  const hasEmbedding =
    Array.isArray(material.embedding) && material.embedding.length > 0;

  // 1) Vector similarity using the material's stored embedding (no OpenAI).
  if (hasEmbedding) {
    try {
      const results = await Material.aggregate([
        {
          $vectorSearch: {
            queryVector: material.embedding,
            path: "embedding",
            numCandidates: 100,
            // Fetch a few extra so we can drop the material itself and still
            // return up to maxInt neighbors.
            limit: maxInt + 1,
            index: "materials_search",
          },
        },
      ]);

      const sanitized = results
        .map(({ embedding, ...rest }) => rest)
        .filter((item) => String(item._id) !== String(material._id))
        .slice(0, maxInt);

      if (sanitized.length > 0) {
        return res.json({
          message: `Found ${sanitized.length} similar materials.`,
          results: sanitized,
          source: "vector",
        });
      }
    } catch (err) {
      // Fall through to the category-based fallback below.
      console.error("material_similar vector search failed:", err.message);
    }
  }

  // 2) Fallback: same category (then subCategory), excluding self.
  const orConditions = [];
  if (material.category) orConditions.push({ category: material.category });
  if (material.subCategory)
    orConditions.push({ subCategory: material.subCategory });

  const fallbackQuery = {
    _id: { $ne: material._id },
    ...(orConditions.length > 0 ? { $or: orConditions } : {}),
  };

  let fallback = await Material.find(fallbackQuery)
    .select("-embedding")
    .sort({ sales: -1, price: 1 })
    .limit(maxInt)
    .lean();

  // If category yielded nothing, surface other popular materials so the
  // section is never empty.
  if (fallback.length === 0) {
    fallback = await Material.find({ _id: { $ne: material._id } })
      .select("-embedding")
      .sort({ sales: -1, price: 1 })
      .limit(maxInt)
      .lean();
  }

  return res.json({
    message: `Found ${fallback.length} related materials.`,
    results: fallback,
    source: "category",
  });
});

module.exports = {
  material_get,
  material_post,
  material_put,
  material_delete,
  vector_search,
  material_search,
  material_similar,
};
