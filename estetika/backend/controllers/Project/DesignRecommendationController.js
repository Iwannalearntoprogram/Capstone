const DesignRecommendation = require("../../models/Project/DesignRecommendation");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

const normalizeAndExpandKeywords = (keywords) => {
  if (!keywords) return [];

  let keywordArray = [];
  if (Array.isArray(keywords)) {
    keywordArray = keywords;
  } else if (typeof keywords === "string") {
    keywordArray = keywords
      .split(/[,;]|and|&|\+/)
      .map((k) => k.trim())
      .filter((k) => k);
  }

  const expansions = {
    modern: ["contemporary", "current", "sleek", "modern-loft-style"],
    traditional: ["classic", "timeless", "conventional"],
    minimalist: ["minimal", "simple", "clean", "nordic"],
    industrial: ["urban", "loft", "exposed", "loft-style"],
    rustic: ["countryside", "farmhouse", "rural"],
    luxurious: ["luxury", "high-end", "premium", "elegant", "sophisticated"],
    cozy: ["comfortable", "warm", "inviting", "warm-contemporary"],
    elegant: ["sophisticated", "refined", "graceful", "hotel-style"],
    scandinavian: ["nordic", "nordic-influence", "scandinavian-vibe"],
    contemporary: ["modern", "current", "warm-contemporary"],
    black: ["dark", "charcoal", "ebony"],
    white: ["light", "cream", "ivory"],
    neutral: ["beige", "taupe", "grey", "gray"],
  };

  const normalized = [];
  keywordArray.forEach((keyword) => {
    const normalizedKeyword = keyword
      .toLowerCase()
      .trim()
      .replace(/[-_]/g, "-");
    normalized.push(normalizedKeyword);

    if (expansions[normalizedKeyword]) {
      normalized.push(...expansions[normalizedKeyword]);
    }

    const compounds = normalizedKeyword.split("-");
    if (compounds.length > 1) {
      compounds.forEach((compound) => {
        normalized.push(compound);
        if (expansions[compound]) {
          normalized.push(...expansions[compound]);
        }
      });
    }
  });

  return [...new Set(normalized)];
};

const design_recommendation_get = catchAsync(async (req, res, next) => {
  const {
    id,
    roomType,
    designPreferences,
    budget,
    minBudget,
    maxBudget,
    all,
    page = 1,
    limit = 50,
  } = req.query;

  let recommendations = [];

  if (id) {
    const recommendation = await DesignRecommendation.findById(id);
    if (!recommendation) {
      return next(new AppError("Design Recommendation not found", 404));
    }
    recommendations = [recommendation];
  } else if (String(all).toLowerCase() === "true" || String(all) === "1") {
    // Admin listing: return a paginated list of recommendations without the 3-item limit
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.max(parseInt(limit) || 50, 1);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (roomType) filter.type = roomType;
    if (designPreferences) {
      const normalizedPreferences =
        normalizeAndExpandKeywords(designPreferences);
      filter.$or = [
        { designPreferences: { $in: normalizedPreferences } },
        { tags: { $in: normalizedPreferences } },
        ...normalizedPreferences.map((pref) => ({
          $or: [
            { designPreferences: { $regex: pref, $options: "i" } },
            { tags: { $regex: pref, $options: "i" } },
          ],
        })),
      ];
    }

    const [items, total] = await Promise.all([
      DesignRecommendation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      DesignRecommendation.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Design Recommendations fetched successfully",
      recommendations: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } else {
    let filter = {};

    if (roomType) {
      filter.type = roomType;
    }
    if (designPreferences) {
      const normalizedPreferences =
        normalizeAndExpandKeywords(designPreferences);

      filter.$or = [
        { designPreferences: { $in: normalizedPreferences } },
        { tags: { $in: normalizedPreferences } },
        ...normalizedPreferences.map((pref) => ({
          $or: [
            { designPreferences: { $regex: pref, $options: "i" } },
            { tags: { $regex: pref, $options: "i" } },
          ],
        })),
      ];
    }

    if (budget || (minBudget && maxBudget)) {
      const budgetNum = budget ? Number(budget) : null;
      const minBudgetNum = minBudget ? Number(minBudget) : null;
      const maxBudgetNum = maxBudget ? Number(maxBudget) : null;

      if (budgetNum) {
        filter.$and = [
          { "budgetRange.min": { $lte: budgetNum } },
          { "budgetRange.max": { $gte: budgetNum } },
        ];
      } else if (minBudgetNum && maxBudgetNum) {
        filter.$or = [
          {
            $and: [
              { "budgetRange.min": { $lte: maxBudgetNum } },
              { "budgetRange.max": { $gte: minBudgetNum } },
            ],
          },
        ];
      }
    }
    const allRecommendations = await DesignRecommendation.find(filter)
      .sort({ popularity: -1, createdAt: -1 })
      .limit(3);

    recommendations = [...allRecommendations];

    // If fewer than 3 found within budget, try cheaper alternatives to fill
    if (recommendations.length < 3 && budget) {
      const budgetNum = Number(budget);
      const cheaperFilter = { ...filter };
      // Remove in-budget constraint and search cheaper
      delete cheaperFilter.$and;
      cheaperFilter["budgetRange.max"] = { $lt: budgetNum };
      cheaperFilter._id = { $nin: recommendations.map((r) => r._id) };

      const remaining = 3 - recommendations.length;
      const cheaperRecommendations = await DesignRecommendation.find(
        cheaperFilter
      )
        .sort({ "budgetRange.max": -1, popularity: -1, createdAt: -1 })
        .limit(remaining);

      recommendations.push(...cheaperRecommendations);
    }

    // If still fewer than 3, relax budget but keep type and preference signals
    if (recommendations.length < 3) {
      const relaxedFilter = {};
      if (roomType) relaxedFilter.type = roomType;
      if (designPreferences) {
        const normalizedPreferences =
          normalizeAndExpandKeywords(designPreferences);
        relaxedFilter.$or = [
          { designPreferences: { $in: normalizedPreferences } },
          { tags: { $in: normalizedPreferences } },
        ];
      }
      relaxedFilter._id = { $nin: recommendations.map((r) => r._id) };

      const remaining = 3 - recommendations.length;
      const fillers = await DesignRecommendation.find(relaxedFilter)
        .sort({ popularity: -1, createdAt: -1 })
        .limit(remaining);

      recommendations.push(...fillers);
    }

    // Final fallback: fill with most popular regardless of filters
    if (recommendations.length < 3) {
      const remaining = 3 - recommendations.length;
      const fallback = await DesignRecommendation.find({
        _id: { $nin: recommendations.map((r) => r._id) },
      })
        .sort({ popularity: -1, createdAt: -1 })
        .limit(remaining);
      recommendations.push(...fallback);
    }
  }

  return res.status(200).json({
    message:
      recommendations.length > 0
        ? budget &&
          recommendations[0].budgetRange &&
          recommendations[0].budgetRange.max < Number(budget)
          ? "Best cheaper design recommendations found"
          : "Best design recommendations found"
        : "No design recommendations found",
    recommendations: recommendations.slice(0, 3),
    hasMatch: recommendations.length > 0,
    isCheaperAlternative:
      recommendations.length > 0 && budget && recommendations[0].budgetRange
        ? recommendations[0].budgetRange.max < Number(budget)
        : false,
  });
});

const design_recommendation_match = catchAsync(async (req, res, next) => {
  const { roomType, designPreferences, budget, priority } = req.query;

  if (!roomType || !budget) {
    return next(
      new AppError("Room type and budget are required for matching", 400)
    );
  }

  const budgetNum = Number(budget);
  const normalizedPreferences = normalizeAndExpandKeywords(designPreferences);
  const normalizedPriority = priority === "Budget" ? "Budget" : "Style";
  const scoreWeights =
    normalizedPriority === "Budget"
      ? {
          preference: 4,
          tag: 2,
          partial: 1,
          budget: 5,
        }
      : {
          preference: 7,
          tag: 4,
          partial: 2,
          budget: 1.5,
        };

  const buildScoringStage = (budgetScoreField, budgetScoreExpression) => ({
    $addFields: {
      preferenceMatchCount: {
        $size: {
          $setIntersection: ["$designPreferences", normalizedPreferences],
        },
      },
      tagMatchCount: {
        $size: {
          $setIntersection: ["$tags", normalizedPreferences],
        },
      },
      partialMatchScore: {
        $add: [
          {
            $size: {
              $filter: {
                input: "$designPreferences",
                cond: {
                  $anyElementTrue: {
                    $map: {
                      input: normalizedPreferences,
                      as: "pref",
                      in: {
                        $or: [
                          {
                            $regexMatch: {
                              input: "$$this",
                              regex: "$$pref",
                              options: "i",
                            },
                          },
                          {
                            $regexMatch: {
                              input: "$$pref",
                              regex: "$$this",
                              options: "i",
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $multiply: [
              0.5,
              {
                $size: {
                  $filter: {
                    input: "$tags",
                    cond: {
                      $anyElementTrue: {
                        $map: {
                          input: normalizedPreferences,
                          as: "pref",
                          in: {
                            $or: [
                              {
                                $regexMatch: {
                                  input: "$$this",
                                  regex: "$$pref",
                                  options: "i",
                                },
                              },
                              {
                                $regexMatch: {
                                  input: "$$pref",
                                  regex: "$$this",
                                  options: "i",
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      [budgetScoreField]: budgetScoreExpression,
      totalScore: {
        $add: [
          { $multiply: ["$preferenceMatchCount", scoreWeights.preference] },
          { $multiply: ["$tagMatchCount", scoreWeights.tag] },
          { $multiply: ["$partialMatchScore", scoreWeights.partial] },
          { $multiply: [`$${budgetScoreField}`, scoreWeights.budget] },
          { $divide: ["$popularity", 100] },
        ],
      },
    },
  });

  const buildSortStage = (
    budgetScoreField,
    { includeBudgetMax = false } = {}
  ) => {
    const sort =
      normalizedPriority === "Budget"
        ? {
            totalScore: -1,
            [budgetScoreField]: -1,
            preferenceMatchCount: -1,
            tagMatchCount: -1,
            partialMatchScore: -1,
            popularity: -1,
            createdAt: -1,
          }
        : {
            totalScore: -1,
            preferenceMatchCount: -1,
            tagMatchCount: -1,
            partialMatchScore: -1,
            popularity: -1,
            [budgetScoreField]: -1,
            createdAt: -1,
          };

    if (includeBudgetMax) {
      sort["budgetRange.max"] = -1;
    }

    return { $sort: sort };
  };

  const buildProjectionStage = (budgetScoreField) => ({
    $project: {
      title: 1,
      imageLink: 1,
      specification: 1,
      budgetRange: 1,
      designPreferences: 1,
      type: 1,
      popularity: 1,
      tags: 1,
      createdAt: 1,
      updatedAt: 1,
      matchScore: "$totalScore",
      preferenceMatches: "$preferenceMatchCount",
      tagMatches: "$tagMatchCount",
      partialMatches: "$partialMatchScore",
      budgetCompatibility: `$${budgetScoreField}`,
    },
  });

  const topMatchesPipeline = [
    {
      $match: {
        type: roomType,
        $and: [
          { "budgetRange.min": { $lte: budgetNum } },
          { "budgetRange.max": { $gte: budgetNum } },
        ],
      },
    },
    buildScoringStage("budgetFitScore", {
      $cond: {
        if: {
          $and: [
            { $gte: [budgetNum, "$budgetRange.min"] },
            { $lte: [budgetNum, "$budgetRange.max"] },
          ],
        },
        then: {
          $subtract: [
            1,
            {
              $abs: {
                $divide: [
                  {
                    $subtract: [
                      budgetNum,
                      { $avg: ["$budgetRange.min", "$budgetRange.max"] },
                    ],
                  },
                  { $subtract: ["$budgetRange.max", "$budgetRange.min"] },
                ],
              },
            },
          ],
        },
        else: 0,
      },
    }),
    buildSortStage("budgetFitScore"),
    { $limit: 3 },
    buildProjectionStage("budgetFitScore"),
  ];

  const buildCheaperPipeline = (excludeIds, remaining) => [
    {
      $match: {
        type: roomType,
        "budgetRange.max": { $lt: budgetNum },
        _id: { $nin: excludeIds },
      },
    },
    buildScoringStage("budgetClosenessScore", {
      $subtract: [
        1,
        {
          $divide: [
            { $subtract: [budgetNum, "$budgetRange.max"] },
            { $max: [budgetNum, 1] },
          ],
        },
      ],
    }),
    buildSortStage("budgetClosenessScore", { includeBudgetMax: true }),
    { $limit: remaining },
    buildProjectionStage("budgetClosenessScore"),
  ];

  const buildRelaxedPipeline = (excludeIds, remaining) => [
    {
      $match: {
        type: roomType,
        _id: { $nin: excludeIds },
      },
    },
    buildScoringStage("budgetClosenessScore", {
      $subtract: [
        1,
        {
          $abs: {
            $divide: [
              {
                $subtract: [
                  budgetNum,
                  { $avg: ["$budgetRange.min", "$budgetRange.max"] },
                ],
              },
              { $max: [budgetNum, 1] },
            ],
          },
        },
      ],
    }),
    buildSortStage("budgetClosenessScore"),
    { $limit: remaining },
    buildProjectionStage("budgetClosenessScore"),
  ];

  let topMatches = await DesignRecommendation.aggregate(topMatchesPipeline);

  const fillStageFactories =
    normalizedPriority === "Budget"
      ? [buildCheaperPipeline, buildRelaxedPipeline]
      : [buildRelaxedPipeline, buildCheaperPipeline];

  for (const buildPipeline of fillStageFactories) {
    const remaining = 3 - topMatches.length;
    if (remaining <= 0) break;

    const excludeIds = topMatches.map((item) => item._id);
    const additions = await DesignRecommendation.aggregate(
      buildPipeline(excludeIds, remaining)
    );
    topMatches = topMatches.concat(additions);
  }

  return res.status(200).json({
    message:
      topMatches.length > 0
        ? topMatches[0].budgetRange && topMatches[0].budgetRange.max < budgetNum
          ? "Best cheaper design recommendations matched successfully"
          : "Best design recommendations matched successfully"
        : "No matching design recommendations found",
    recommendations: topMatches.slice(0, 3),
    hasMatch: topMatches.length > 0,
    isCheaperAlternative:
      topMatches.length > 0 && topMatches[0].budgetRange
        ? topMatches[0].budgetRange.max < budgetNum
        : false,
    criteria: {
      roomType,
      designPreferences,
      normalizedPreferences,
      budget: budgetNum,
      priority: normalizedPriority,
    },
  });
});

const design_recommendation_post = catchAsync(async (req, res, next) => {
  const {
    title,
    imageLink,
    specification,
    budgetRange,
    designPreferences,
    type,
    tags,
  } = req.body;

  if (!title || !budgetRange || !budgetRange.min || !budgetRange.max) {
    return next(
      new AppError("Title and budget range (min/max) are required", 400)
    );
  }

  if (budgetRange.min >= budgetRange.max) {
    return next(
      new AppError("Minimum budget must be less than maximum budget", 400)
    );
  }

  const newRecommendation = new DesignRecommendation({
    title,
    imageLink,
    specification,
    budgetRange,
    designPreferences: designPreferences || ["modern"],
    type: type || "Living Room",
    tags: tags || [],
  });

  await newRecommendation.save();

  return res.status(201).json({
    message: "Design Recommendation created successfully",
    recommendation: newRecommendation,
  });
});

const design_recommendation_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const {
    title,
    imageLink,
    specification,
    budgetRange,
    designPreferences,
    type,
    popularity,
    tags,
  } = req.body;

  if (!id) {
    return next(new AppError("Design Recommendation ID is required", 400));
  }

  const recommendation = await DesignRecommendation.findById(id);
  if (!recommendation) {
    return next(new AppError("Design Recommendation not found", 404));
  }

  const updates = {};
  if (title) updates.title = title;
  if (imageLink !== undefined) updates.imageLink = imageLink;
  if (specification !== undefined) updates.specification = specification;
  if (budgetRange) {
    if (budgetRange.min >= budgetRange.max) {
      return next(
        new AppError("Minimum budget must be less than maximum budget", 400)
      );
    }
    updates.budgetRange = budgetRange;
  }
  if (designPreferences) updates.designPreferences = designPreferences;
  if (type) updates.type = type;
  if (popularity !== undefined) updates.popularity = popularity;
  if (tags) updates.tags = tags;

  const updatedRecommendation = await DesignRecommendation.findByIdAndUpdate(
    id,
    updates,
    { new: true }
  );

  return res.status(200).json({
    message: "Design Recommendation updated successfully",
    recommendation: updatedRecommendation,
  });
});

const design_recommendation_delete = catchAsync(async (req, res, next) => {
  const { id } = req.query;

  if (!id) {
    return next(new AppError("Design Recommendation ID is required", 400));
  }

  const recommendation = await DesignRecommendation.findById(id);
  if (!recommendation) {
    return next(new AppError("Design Recommendation not found", 404));
  }

  const deletedRecommendation = await DesignRecommendation.findByIdAndDelete(
    id
  );

  return res.status(200).json({
    message: "Design Recommendation deleted successfully",
    recommendation: deletedRecommendation,
  });
});

module.exports = {
  design_recommendation_get,
  design_recommendation_match,
  design_recommendation_post,
  design_recommendation_put,
  design_recommendation_delete,
};
