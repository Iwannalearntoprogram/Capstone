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

    normalizedKeyword.split(/\s+/).forEach((word) => {
      const cleanedWord = word.replace(/[^a-z0-9-]/g, "");
      if (cleanedWord.length < 2) return;
      normalized.push(cleanedWord);
      if (expansions[cleanedWord]) {
        normalized.push(...expansions[cleanedWord]);
      }
    });
  });

  return [...new Set(normalized)];
};

const ROOM_TYPE_OPTIONS =
  DesignRecommendation.schema.path("type")?.enumValues || [];
const PRIORITY_OPTIONS = ["Budget", "Style"];
const WHOLE_HOUSE_ROOMS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Home Office",
  "Dining Room",
];
const GENERIC_ROOM_TERMS = new Set([
  "area",
  "commercial",
  "home",
  "room",
  "space",
]);

const getTextTokens = (value) =>
  String(value || "")
    .toLowerCase()
    .match(/[a-z]{2,}/g) || [];

const hasRepeatedJunkPattern = (value) => {
  const cleaned = String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "");
  return (
    cleaned.length >= 6 &&
    (/^(.)\1+$/.test(cleaned) || /^(.{1,3})\1+$/.test(cleaned))
  );
};

const validatePreferenceText = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return "Enter design preferences before requesting recommendations.";
  }
  if (text.length < 4) {
    return "Design preferences must be at least 4 characters.";
  }
  if (text.length > 2000) {
    return "Design preferences must be 2000 characters or fewer.";
  }
  if (/^\d+$/.test(text) || !/[a-z]/i.test(text)) {
    return "Enter valid design preferences such as style, colors, materials, or room requirements.";
  }

  const tokens = getTextTokens(text);
  if (tokens.length < 2 || hasRepeatedJunkPattern(text)) {
    return "Describe preferences using valid design-related words.";
  }
  // Note: we intentionally do NOT require the text to contain a word from a
  // fixed vocabulary. Whether the preferences are meaningful is decided by
  // matching against the actual tags/preferences stored on the design
  // recommendations (see hasDatasetPreferenceMatch). This lets clients match
  // on any custom tag defined in the Design Recommendation Manager.
  return null;
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasDatasetPreferenceMatch = async (roomType, normalizedPreferences) => {
  const recommendations = await DesignRecommendation.find({ type: roomType })
    .select("designPreferences tags")
    .lean();

  const datasetTerms = new Set();
  recommendations.forEach((recommendation) => {
    [...(recommendation.designPreferences || []), ...(recommendation.tags || [])]
      .flatMap((term) => normalizeAndExpandKeywords(String(term)))
      .forEach((term) => datasetTerms.add(term));
  });

  if (datasetTerms.size === 0 || normalizedPreferences.length === 0) {
    return false;
  }

  return normalizedPreferences.some((preference) => {
    if (preference.length < 3) return false;
    if (GENERIC_ROOM_TERMS.has(preference)) return false;
    if (datasetTerms.has(preference)) return true;
    return [...datasetTerms].some(
      (term) =>
        term.length >= 3 &&
        (term.includes(preference) || preference.includes(term))
    );
  });
};

// Returns the distinct set of tags/preferences across ALL design
// recommendations. Used by clients to validate that a typed design preference
// contains at least one known tag before allowing a recommendation request.
const design_recommendation_tags = catchAsync(async (req, res) => {
  const recommendations = await DesignRecommendation.find({})
    .select("tags designPreferences")
    .lean();

  const tagSet = new Set();
  recommendations.forEach((recommendation) => {
    [
      ...(recommendation.tags || []),
      ...(recommendation.designPreferences || []),
    ].forEach((term) => {
      if (typeof term === "string" && term.trim()) {
        tagSet.add(term.trim().toLowerCase());
      }
    });
  });

  return res.status(200).json({
    message: "Design recommendation tags fetched successfully",
    tags: [...tagSet],
  });
});

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

  if (!roomType || !budget || !designPreferences || !priority) {
    return next(
      new AppError(
        "Room type, budget, priority, and design preferences are required for matching",
        400
      )
    );
  }

  if (!ROOM_TYPE_OPTIONS.includes(roomType)) {
    return next(new AppError("Room type is invalid.", 400));
  }

  const budgetNum = Number(budget);
  if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
    return next(new AppError("Budget must be greater than 0.", 400));
  }

  if (!PRIORITY_OPTIONS.includes(priority)) {
    return next(new AppError("Priority is invalid.", 400));
  }

  const preferenceError = validatePreferenceText(designPreferences);
  if (preferenceError) {
    return next(new AppError(preferenceError, 400));
  }

  const normalizedPreferences = normalizeAndExpandKeywords(designPreferences);
  let hasPreferenceMatch;
  if (roomType === "Whole House") {
    const roomMatchChecks = await Promise.all(
      WHOLE_HOUSE_ROOMS.map((room) =>
        hasDatasetPreferenceMatch(room, normalizedPreferences)
      )
    );
    hasPreferenceMatch = roomMatchChecks.some(Boolean);
  } else {
    hasPreferenceMatch = await hasDatasetPreferenceMatch(
      roomType,
      normalizedPreferences
    );
  }

  if (!hasPreferenceMatch) {
    return res.status(200).json(
      roomType === "Whole House"
        ? {
            message:
              "No matching design recommendations found. Please revise your preferences.",
            grouped: true,
            groups: [],
            criteria: {
              roomType,
              designPreferences,
              normalizedPreferences,
              budget: budgetNum,
              priority,
            },
          }
        : {
            message:
              "No matching design recommendations found. Please revise your preferences.",
            grouped: false,
            recommendations: [],
            hasMatch: false,
            isCheaperAlternative: false,
            criteria: {
              roomType,
              designPreferences,
              normalizedPreferences,
              budget: budgetNum,
              priority,
            },
          }
    );
  }

  const normalizedRegexPreferences = normalizedPreferences.map(escapeRegex);
  const normalizedPriority = priority;
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
                      input: normalizedRegexPreferences,
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
                          input: normalizedRegexPreferences,
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

  // Only keep items that actually match at least one of the user's stated
  // preferences (exact preference/tag match or a partial/regex match). This
  // prevents the budget fallbacks (and the in-budget top results) from padding
  // the response with designs that fit the room type + budget but are unrelated
  // to what the user typed.
  const preferenceRelevanceStage = {
    $match: {
      $expr: {
        $gt: [
          {
            $add: [
              "$preferenceMatchCount",
              "$tagMatchCount",
              "$partialMatchScore",
            ],
          },
          0,
        ],
      },
    },
  };

  const matchForRoomType = async (targetRoomType, limit) => {
    const topPipeline = [
      {
        $match: {
          type: targetRoomType,
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
      preferenceRelevanceStage,
      buildSortStage("budgetFitScore"),
      { $limit: limit },
      buildProjectionStage("budgetFitScore"),
    ];

    const cheaperPipeline = (excludeIds, remaining) => [
      {
        $match: {
          type: targetRoomType,
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
      preferenceRelevanceStage,
      buildSortStage("budgetClosenessScore", { includeBudgetMax: true }),
      { $limit: remaining },
      buildProjectionStage("budgetClosenessScore"),
    ];

    const relaxedPipeline = (excludeIds, remaining) => [
      {
        $match: {
          type: targetRoomType,
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
      preferenceRelevanceStage,
      buildSortStage("budgetClosenessScore"),
      { $limit: remaining },
      buildProjectionStage("budgetClosenessScore"),
    ];

    let matches = await DesignRecommendation.aggregate(topPipeline);

    const fillStages =
      normalizedPriority === "Budget"
        ? [cheaperPipeline, relaxedPipeline]
        : [relaxedPipeline, cheaperPipeline];

    for (const buildPipeline of fillStages) {
      const remaining = limit - matches.length;
      if (remaining <= 0) break;
      const excludeIds = matches.map((item) => item._id);
      matches = matches.concat(
        await DesignRecommendation.aggregate(buildPipeline(excludeIds, remaining))
      );
    }

    return matches.slice(0, limit);
  };

  if (roomType === "Whole House") {
    const groupResults = await Promise.all(
      WHOLE_HOUSE_ROOMS.map(async (room) => {
        const recs = await matchForRoomType(room, 2);
        return recs.length > 0 ? { roomType: room, recommendations: recs } : null;
      })
    );
    const groups = groupResults.filter(Boolean);

    return res.status(200).json({
      message:
        groups.length > 0
          ? "Best design recommendations matched successfully"
          : "No matching design recommendations found",
      grouped: true,
      groups,
      criteria: {
        roomType,
        designPreferences,
        normalizedPreferences,
        budget: budgetNum,
        priority: normalizedPriority,
      },
    });
  }

  const topMatches = await matchForRoomType(roomType, 3);

  return res.status(200).json({
    message:
      topMatches.length > 0
        ? topMatches[0].budgetRange && topMatches[0].budgetRange.max < budgetNum
          ? "Best cheaper design recommendations matched successfully"
          : "Best design recommendations matched successfully"
        : "No matching design recommendations found",
    grouped: false,
    recommendations: topMatches,
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
  design_recommendation_tags,
  design_recommendation_match,
  design_recommendation_post,
  design_recommendation_put,
  design_recommendation_delete,
};
