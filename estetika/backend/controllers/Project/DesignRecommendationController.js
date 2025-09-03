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
  const { id, roomType, designPreferences, budget, minBudget, maxBudget } =
    req.query;

  let recommendations = [];

  if (id) {
    const recommendation = await DesignRecommendation.findById(id);
    if (!recommendation) {
      return next(new AppError("Design Recommendation not found", 404));
    }
    recommendations = [recommendation];
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
  const { roomType, designPreferences, budget } = req.query;

  if (!roomType || !budget) {
    return next(
      new AppError("Room type and budget are required for matching", 400)
    );
  }
  const budgetNum = Number(budget);
  const normalizedPreferences = normalizeAndExpandKeywords(designPreferences);

  // Log incoming request parameters for match endpoint
  // no-op logging removed

  const pipeline = [
    {
      $match: {
        type: roomType,
        $and: [
          { "budgetRange.min": { $lte: budgetNum } },
          { "budgetRange.max": { $gte: budgetNum } },
        ],
      },
    },
    {
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
            // Count partial matches in designPreferences
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
            // Count partial matches in tags (with lower weight)
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
        budgetFitScore: {
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
        },
        totalScore: {
          $add: [
            { $multiply: ["$preferenceMatchCount", 5] },
            { $multiply: ["$tagMatchCount", 3] },
            { $multiply: ["$partialMatchScore", 1] },
            { $multiply: ["$budgetFitScore", 2] },
            { $divide: ["$popularity", 100] },
          ],
        },
      },
    },
    {
      $sort: {
        totalScore: -1,
        preferenceMatchCount: -1,
        tagMatchCount: -1,
        budgetFitScore: -1,
        popularity: -1,
        createdAt: -1,
      },
    },
    {
      $limit: 1,
    },
    {
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
        budgetCompatibility: "$budgetFitScore",
      },
    },
  ];
  // Adjust pipeline to return top 3 matches
  const pipelineTop3 = pipeline.map((stage) => {
    if (stage.$limit !== undefined) {
      return { $limit: 3 };
    }
    return stage;
  });
  const matchedRecommendations = await DesignRecommendation.aggregate(
    pipelineTop3
  );
  let topMatches = matchedRecommendations;

  // Fill to 3: cheaper options first
  let remaining = 3 - topMatches.length;
  if (remaining > 0) {
    const excludeIds = topMatches.map((d) => d._id);
    const cheaperPipeline = [
      {
        $match: {
          type: roomType,
          "budgetRange.max": { $lt: budgetNum },
          _id: { $nin: excludeIds },
        },
      },
      {
        $addFields: {
          preferenceMatchCount: {
            $size: {
              $setIntersection: ["$designPreferences", normalizedPreferences],
            },
          },
          tagMatchCount: {
            $size: { $setIntersection: ["$tags", normalizedPreferences] },
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
          budgetClosenessScore: {
            $subtract: [
              1,
              {
                $divide: [
                  { $subtract: [budgetNum, "$budgetRange.max"] },
                  { $max: [budgetNum, 1] },
                ],
              },
            ],
          },
          totalScore: {
            $add: [
              { $multiply: ["$preferenceMatchCount", 5] },
              { $multiply: ["$tagMatchCount", 3] },
              { $multiply: ["$partialMatchScore", 1] },
              { $multiply: ["$budgetClosenessScore", 2] },
              { $divide: ["$popularity", 100] },
            ],
          },
        },
      },
      {
        $sort: {
          totalScore: -1,
          "budgetRange.max": -1,
          preferenceMatchCount: -1,
          tagMatchCount: -1,
          popularity: -1,
          createdAt: -1,
        },
      },
      { $limit: remaining },
      {
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
          budgetCompatibility: "$budgetClosenessScore",
        },
      },
    ];
    const cheaperRecommendations = await DesignRecommendation.aggregate(
      cheaperPipeline
    );
    topMatches = topMatches.concat(cheaperRecommendations);
  }

  // If still short, relax budget entirely (keep type), score by preferences/popularity
  remaining = 3 - topMatches.length;
  if (remaining > 0) {
    const excludeIds = topMatches.map((d) => d._id);
    const relaxedPipeline = [
      {
        $match: {
          type: roomType,
          _id: { $nin: excludeIds },
        },
      },
      {
        $addFields: {
          preferenceMatchCount: {
            $size: {
              $setIntersection: ["$designPreferences", normalizedPreferences],
            },
          },
          tagMatchCount: {
            $size: { $setIntersection: ["$tags", normalizedPreferences] },
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
          budgetClosenessScore: {
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
          },
          totalScore: {
            $add: [
              { $multiply: ["$preferenceMatchCount", 5] },
              { $multiply: ["$tagMatchCount", 3] },
              { $multiply: ["$partialMatchScore", 1] },
              { $multiply: ["$budgetClosenessScore", 2] },
              { $divide: ["$popularity", 100] },
            ],
          },
        },
      },
      { $sort: { totalScore: -1, popularity: -1, createdAt: -1 } },
      { $limit: remaining },
      {
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
          budgetCompatibility: "$budgetClosenessScore",
        },
      },
    ];
    const relaxed = await DesignRecommendation.aggregate(relaxedPipeline);
    topMatches = topMatches.concat(relaxed);
  }

  return res.status(200).json({
    message:
      topMatches.length > 0
        ? topMatches[0].budgetRange && topMatches[0].budgetRange.max < budgetNum
          ? "Best cheaper design recommendations matched successfully"
          : "Best design recommendations matched successfully"
        : "No matching design recommendations found",
    recommendations: (() => {
      const out = topMatches.slice(0, 3);
      // Log the outgoing response (exactly what we send back)
      // no-op logging removed
      return out;
    })(),
    hasMatch: topMatches.length > 0,
    isCheaperAlternative:
      topMatches.length > 0 && topMatches[0].budgetRange
        ? topMatches[0].budgetRange.max < budgetNum
        : false,
    criteria: {
      roomType,
      designPreferences: designPreferences,
      normalizedPreferences,
      budget: budgetNum,
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
