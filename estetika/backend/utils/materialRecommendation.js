const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "along",
  "also",
  "among",
  "and",
  "are",
  "because",
  "been",
  "before",
  "being",
  "between",
  "both",
  "can",
  "could",
  "from",
  "have",
  "into",
  "more",
  "much",
  "must",
  "need",
  "our",
  "should",
  "that",
  "their",
  "them",
  "there",
  "these",
  "they",
  "this",
  "those",
  "very",
  "want",
  "with",
  "would",
  "your",
]);

const KEYWORD_EXPANSIONS = {
  budget: ["affordable", "value", "practical", "cost-effective", "laminate"],
  modern: ["contemporary", "sleek", "minimalist", "clean", "quartz", "glass"],
  contemporary: ["modern", "sleek", "warm", "quartz", "engineered"],
  minimalist: ["minimal", "clean", "simple", "matte", "neutral", "quartz"],
  industrial: ["concrete", "metal", "steel", "iron", "matte", "exposed"],
  rustic: ["wood", "oak", "walnut", "stone", "textured", "timber"],
  luxury: ["luxurious", "premium", "marble", "granite", "brass", "polished"],
  luxurious: ["luxury", "premium", "marble", "granite", "brass", "polished"],
  elegant: ["premium", "marble", "brass", "refined", "polished"],
  scandinavian: ["nordic", "oak", "light", "natural", "white", "matte"],
  classic: ["traditional", "timeless", "wood", "marble", "ceramic"],
  traditional: ["classic", "timeless", "wood", "marble", "ceramic"],
  warm: ["oak", "walnut", "beige", "natural", "textured", "travertine"],
  neutral: ["beige", "taupe", "gray", "grey", "white", "cream"],
  durable: ["porcelain", "ceramic", "quartz", "granite", "stainless", "vinyl"],
  sustainable: ["bamboo", "recycled", "natural", "rattan", "wood"],
  kitchen: [
    "quartz",
    "granite",
    "tile",
    "ceramic",
    "porcelain",
    "backsplash",
    "countertop",
    "cabinet",
    "stainless",
    "laminate",
  ],
  bathroom: [
    "porcelain",
    "ceramic",
    "tile",
    "marble",
    "quartz",
    "waterproof",
    "stone",
  ],
  bedroom: ["wood", "upholstered", "fabric", "soft", "warm", "oak"],
  living: ["wood", "stone", "marble", "fabric", "accent", "feature"],
  dining: ["wood", "marble", "stone", "walnut", "oak"],
  office: ["laminate", "wood", "acoustic", "glass", "metal", "durable"],
  commercial: ["durable", "vinyl", "laminate", "porcelain", "steel"],
  hospitality: ["luxury", "marble", "wood", "brass", "premium"],
  residential: ["warm", "comfortable", "wood", "ceramic", "natural"],
  renovation: ["versatile", "durable", "laminate", "engineered", "practical"],
};

const ROOM_TYPE_KEYWORDS = {
  "Living Room": ["living", "feature", "accent", "wood", "stone", "marble"],
  Bedroom: ["bedroom", "soft", "warm", "wood", "fabric", "oak"],
  Kitchen: [
    "kitchen",
    "countertop",
    "backsplash",
    "cabinet",
    "quartz",
    "granite",
    "tile",
    "stainless",
  ],
  Bathroom: [
    "bathroom",
    "waterproof",
    "tile",
    "porcelain",
    "ceramic",
    "marble",
  ],
  "Home Office": ["office", "workspace", "durable", "wood", "laminate"],
  "Dining Room": ["dining", "wood", "walnut", "marble", "stone"],
  "Whole House": ["durable", "versatile", "cohesive", "neutral", "wood"],
  "Commercial Space": [
    "commercial",
    "durable",
    "traffic",
    "vinyl",
    "laminate",
    "porcelain",
  ],
};

const PROJECT_TYPE_KEYWORDS = {
  Residential: ["warm", "comfortable", "natural", "wood", "ceramic"],
  Commercial: ["durable", "functional", "traffic", "vinyl", "laminate"],
  Hospitality: ["luxury", "premium", "marble", "wood", "brass"],
  Retail: ["durable", "clean", "feature", "laminate", "porcelain"],
  Healthcare: ["clean", "hygienic", "durable", "vinyl", "porcelain"],
  Educational: ["durable", "practical", "laminate", "vinyl"],
  Institutional: ["durable", "practical", "porcelain", "laminate"],
  "Event Spaces": ["feature", "dramatic", "premium", "marble", "wood"],
  Renovation: ["versatile", "practical", "engineered", "laminate"],
};

const ROOM_BUDGET_FACTORS = {
  "Living Room": 0.09,
  Bedroom: 0.08,
  Kitchen: 0.12,
  Bathroom: 0.1,
  "Home Office": 0.07,
  "Dining Room": 0.08,
  "Whole House": 0.18,
  "Commercial Space": 0.14,
};

const ROOM_CONTEXT_ALIASES = {
  kitchen: ["kitchen"],
  bathroom: ["bathroom", "powder", "washroom", "vanity"],
  bedroom: ["bedroom"],
  living: ["living", "lounge"],
  dining: ["dining"],
  office: ["office", "workspace", "study"],
  commercial: ["commercial", "retail", "store", "shop"],
};

const STRICT_ROOM_CONTEXT_RULES = {
  kitchen: [
    "kitchen",
    "cabinet",
    "countertop",
    "backsplash",
    "island",
    "pendant",
    "barstool",
    "stool",
    "sink",
    "faucet",
    "tile",
    "pantry",
    "dining",
  ],
  bathroom: [
    "bathroom",
    "vanity",
    "mirror",
    "shower",
    "bathtub",
    "toilet",
    "faucet",
    "sink",
    "tile",
    "soap",
  ],
  bedroom: [
    "bedroom",
    "bed",
    "headboard",
    "mattress",
    "nightstand",
    "dresser",
    "wardrobe",
    "closet",
    "bedding",
  ],
  living: [
    "living",
    "sofa",
    "sectional",
    "armchair",
    "coffee",
    "console",
    "tv",
    "media",
    "accent",
    "side",
  ],
  dining: [
    "dining",
    "table",
    "chair",
    "sideboard",
    "buffet",
    "barstool",
    "stool",
    "pendant",
  ],
  office: [
    "office",
    "desk",
    "workspace",
    "ergonomic",
    "bookcase",
    "shelf",
    "cabinet",
    "drawer",
    "task",
  ],
  commercial: [
    "commercial",
    "retail",
    "display",
    "fixture",
    "shelving",
    "durable",
    "traffic",
  ],
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeToken = (token) => {
  if (!token || typeof token !== "string") return "";

  let normalized = token.toLowerCase().trim();
  normalized = normalized.replace(/[^a-z0-9-]/g, "");

  if (normalized.length > 4 && normalized.endsWith("s")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
};

const tokenize = (value) => {
  if (!value || typeof value !== "string") return [];

  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map(normalizeToken)
    .filter(
      (token) => token && token.length > 2 && !STOP_WORDS.has(token)
    );
};

const addWeightedToken = (map, token, weight) => {
  if (!token || !weight) return;
  map.set(token, (map.get(token) || 0) + weight);
};

const addWeightedTokens = (map, source, weight) => {
  const rawTokens = Array.isArray(source) ? source : tokenize(source);

  rawTokens.forEach((rawToken) => {
    const token = normalizeToken(rawToken);
    if (!token || STOP_WORDS.has(token)) return;

    addWeightedToken(map, token, weight);

    if (token.includes("-")) {
      token
        .split("-")
        .map(normalizeToken)
        .filter(Boolean)
        .forEach((compound) => addWeightedToken(map, compound, weight * 0.6));
    }

    const expansions = KEYWORD_EXPANSIONS[token] || [];
    expansions.forEach((expansion) =>
      addWeightedToken(map, normalizeToken(expansion), weight * 0.75)
    );
  });
};

const buildMaterialTokenSet = (material) => {
  const parts = [
    material.name,
    material.company,
    material.category,
    material.subCategory,
    material.description,
    ...(Array.isArray(material.options)
      ? material.options.map((option) => option?.option)
      : []),
    ...(Array.isArray(material.attributes)
      ? material.attributes.flatMap((attribute) => [
          attribute?.key,
          attribute?.value,
        ])
      : []),
  ].filter(Boolean);

  return new Set(tokenize(parts.join(" ")));
};

const scoreKeywordMatch = (weightedKeywords, materialTokens) => {
  const totalWeight = [...weightedKeywords.values()].reduce(
    (sum, weight) => sum + weight,
    0
  );

  if (!totalWeight) {
    return { score: 0, matchedKeywords: [] };
  }

  const materialTokenArray = [...materialTokens];
  let matchedWeight = 0;
  const matchedKeywords = [];

  for (const [token, weight] of weightedKeywords.entries()) {
    if (materialTokens.has(token)) {
      matchedWeight += weight;
      matchedKeywords.push(token);
      continue;
    }

    if (token.length < 4) continue;

    const partialMatch = materialTokenArray.some(
      (materialToken) =>
        materialToken.includes(token) || token.includes(materialToken)
    );

    if (partialMatch) {
      matchedWeight += weight * 0.55;
      matchedKeywords.push(token);
    }
  }

  return {
    score: clamp(matchedWeight / totalWeight, 0, 1),
    matchedKeywords: [...new Set(matchedKeywords)].slice(0, 6),
  };
};

const scoreRoomFit = (roomType, materialTokens) => {
  const roomKeywords = ROOM_TYPE_KEYWORDS[roomType] || tokenize(roomType);
  if (!roomKeywords.length) return 0.45;

  let matches = 0;
  roomKeywords.forEach((keyword) => {
    const normalizedKeyword = normalizeToken(keyword);
    if (!normalizedKeyword) return;

    if (
      materialTokens.has(normalizedKeyword) ||
      [...materialTokens].some(
        (token) =>
          token.includes(normalizedKeyword) || normalizedKeyword.includes(token)
      )
    ) {
      matches += 1;
    }
  });

  return clamp(matches / roomKeywords.length, 0, 1);
};

const scoreBudgetFit = (material, project) => {
  const projectBudget = Number(project?.budget);
  const materialPrice = Number(material?.price);

  if (!Number.isFinite(projectBudget) || projectBudget <= 0) {
    return {
      score: 0.5,
      estimatedTarget: null,
      estimatedCeiling: null,
    };
  }

  if (!Number.isFinite(materialPrice) || materialPrice <= 0) {
    return {
      score: 0.2,
      estimatedTarget: null,
      estimatedCeiling: null,
    };
  }

  const roomFactor = ROOM_BUDGET_FACTORS[project.roomType] || 0.09;
  const priorityFactor = project.priority === "Budget" ? 0.8 : 1.12;
  const sizeFactor = project.projectSize
    ? clamp(Math.sqrt(Number(project.projectSize) / 180), 0.85, 1.6)
    : 1;

  const estimatedCeiling =
    projectBudget * roomFactor * priorityFactor * sizeFactor;
  const estimatedTarget =
    estimatedCeiling * (project.priority === "Budget" ? 0.52 : 0.82);

  let score = 0;

  if (materialPrice <= estimatedCeiling) {
    if (project.priority === "Budget") {
      const savingsScore =
        1 - materialPrice / Math.max(estimatedCeiling, materialPrice, 1);
      const proximityScore =
        1 -
        Math.min(
          Math.abs(materialPrice - estimatedTarget) / Math.max(estimatedTarget, 1),
          1
        );
      score = 0.68 + savingsScore * 0.22 + proximityScore * 0.1;
    } else {
      const proximityScore =
        1 -
        Math.min(
          Math.abs(materialPrice - estimatedTarget) / Math.max(estimatedTarget, 1),
          1
        );
      const premiumScore = Math.min(
        materialPrice / Math.max(estimatedTarget, 1),
        1
      );
      score = 0.62 + proximityScore * 0.24 + premiumScore * 0.14;
    }
  } else {
    const overspendRatio =
      (materialPrice - estimatedCeiling) / Math.max(estimatedCeiling, 1);
    score = Math.max(0, 0.6 - overspendRatio * 1.5);
  }

  return {
    score: clamp(score, 0, 1),
    estimatedTarget,
    estimatedCeiling,
  };
};

const scorePopularity = (material, maxSales) => {
  const sales = Number(material?.sales) || 0;
  if (maxSales <= 0) return 0.5;
  return clamp(sales / maxSales, 0, 1);
};

const buildReasons = ({
  material,
  project,
  matchedKeywords,
  keywordScore,
  roomScore,
  popularityScore,
  estimatedCeiling,
}) => {
  const reasons = [];

  if (keywordScore >= 0.35 && matchedKeywords.length > 0) {
    reasons.push(
      `Matches project cues like ${matchedKeywords.slice(0, 3).join(", ")}.`
    );
  }

  if (roomScore >= 0.35 && project.roomType) {
    reasons.push(`Fits common ${project.roomType.toLowerCase()} material needs.`);
  }

  if (estimatedCeiling) {
    reasons.push(
      material.price <= estimatedCeiling
        ? `Stays within the estimated material allowance at ${formatCurrency(
            material.price
          )}.`
        : "Exceeds the ideal allowance, but still outperformed other catalog options overall."
    );
  }

  if (popularityScore >= 0.45) {
    reasons.push("Shows stronger past usage than most catalog alternatives.");
  }

  return reasons.slice(0, 3);
};

const toPublicMaterial = (material) => ({
  _id: material._id,
  name: material.name,
  company: material.company,
  category: material.category,
  subCategory: material.subCategory,
  price: material.price,
  description: material.description,
  image: material.image,
});

const getProjectDesignRecommendation = (project) =>
  project?.designRecommendation &&
  typeof project.designRecommendation === "object" &&
  !Array.isArray(project.designRecommendation)
    ? project.designRecommendation
    : null;

const getStrictProjectContexts = (project) => {
  const designRecommendation = getProjectDesignRecommendation(project);
  const sourceTokens = new Set(
    tokenize(
      [
        project?.roomType,
        project?.projectType,
        project?.description,
        designRecommendation?.title,
        designRecommendation?.specification,
        ...(Array.isArray(designRecommendation?.designPreferences)
          ? designRecommendation.designPreferences
          : []),
        ...(Array.isArray(designRecommendation?.tags)
          ? designRecommendation.tags
          : []),
      ]
        .filter(Boolean)
        .join(" ")
    )
  );

  return Object.entries(ROOM_CONTEXT_ALIASES)
    .filter(([, aliases]) =>
      aliases.some((alias) => sourceTokens.has(normalizeToken(alias)))
    )
    .map(([context]) => context);
};

const getStrictContextKeywordsForProject = (project) => {
  const activeContexts = getStrictProjectContexts(project);

  if (!activeContexts.length) {
    return [];
  }

  return [...new Set(
    activeContexts.flatMap(
      (context) => STRICT_ROOM_CONTEXT_RULES[context] || []
    )
  )].map(normalizeToken);
};

const getStrictContextMatchCount = (materialTokens, strictContextKeywords) => {
  if (!strictContextKeywords.length) {
    return 0;
  }

  let matches = 0;
  strictContextKeywords.forEach((keyword) => {
    if (!keyword) return;

    if (
      materialTokens.has(keyword) ||
      [...materialTokens].some(
        (token) => token.includes(keyword) || keyword.includes(token)
      )
    ) {
      matches += 1;
    }
  });

  return matches;
};

const buildWeightedKeywordsForProject = (
  project,
  { extraSources = [] } = {}
) => {
  const designRecommendation = getProjectDesignRecommendation(project);
  const weightedKeywords = new Map();
  addWeightedTokens(weightedKeywords, project?.designPreference, 3.8);
  addWeightedTokens(weightedKeywords, project?.description, 2.4);
  addWeightedTokens(weightedKeywords, ROOM_TYPE_KEYWORDS[project?.roomType], 2.8);
  addWeightedTokens(
    weightedKeywords,
    PROJECT_TYPE_KEYWORDS[project?.projectType],
    1.7
  );
  addWeightedTokens(
    weightedKeywords,
    designRecommendation?.designPreferences,
    2.6
  );
  addWeightedTokens(weightedKeywords, designRecommendation?.tags, 1.8);
  addWeightedTokens(weightedKeywords, designRecommendation?.title, 1.2);
  addWeightedTokens(weightedKeywords, designRecommendation?.specification, 1.4);

  extraSources.forEach((source) => addWeightedTokens(weightedKeywords, source, 5));

  return weightedKeywords;
};

const getBaseWeights = (projectPriority, keywordWeightTotal) => {
  const priority = projectPriority === "Budget" ? "Budget" : "Style";
  const baseWeights =
    priority === "Budget"
      ? { keyword: 0.28, room: 0.18, budget: 0.42, popularity: 0.12 }
      : { keyword: 0.44, room: 0.22, budget: 0.24, popularity: 0.1 };

  if (!keywordWeightTotal) {
    baseWeights.room += baseWeights.keyword * 0.6;
    baseWeights.budget += baseWeights.keyword * 0.4;
    baseWeights.keyword = 0;
  }

  return { priority, baseWeights };
};

const rankMaterialsForProjectContext = (
  project,
  materials,
  { extraSources = [] } = {}
) => {
  if (!Array.isArray(materials) || materials.length === 0) {
    return [];
  }

  const weightedKeywords = buildWeightedKeywordsForProject(project, {
    extraSources,
  });
  const keywordWeightTotal = [...weightedKeywords.values()].reduce(
    (sum, weight) => sum + weight,
    0
  );
  const { priority, baseWeights } = getBaseWeights(
    project?.priority,
    keywordWeightTotal
  );
  const strictContextKeywords = getStrictContextKeywordsForProject(project);
  const maxSales = materials.reduce(
    (max, material) => Math.max(max, Number(material?.sales) || 0),
    0
  );

  return materials
    .map((material) => {
      const materialTokens = buildMaterialTokenSet(material);
      const keywordMatch = scoreKeywordMatch(weightedKeywords, materialTokens);
      const roomScore = scoreRoomFit(project?.roomType, materialTokens);
      const budgetMatch = scoreBudgetFit(material, project);
      const popularityScore = scorePopularity(material, maxSales);
      const strictContextMatchCount = getStrictContextMatchCount(
        materialTokens,
        strictContextKeywords
      );

      const totalScore =
        keywordMatch.score * baseWeights.keyword +
        roomScore * baseWeights.room +
        budgetMatch.score * baseWeights.budget +
        popularityScore * baseWeights.popularity;

      return {
        material,
        totalScore,
        keywordScore: keywordMatch.score,
        roomScore,
        budgetScore: budgetMatch.score,
        popularityScore,
        strictContextMatchCount,
        estimatedTarget: budgetMatch.estimatedTarget,
        estimatedCeiling: budgetMatch.estimatedCeiling,
        matchedKeywords: keywordMatch.matchedKeywords,
      };
    })
    .sort((left, right) => {
      if (right.strictContextMatchCount !== left.strictContextMatchCount) {
        return right.strictContextMatchCount - left.strictContextMatchCount;
      }
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }
      if (right.keywordScore !== left.keywordScore) {
        return right.keywordScore - left.keywordScore;
      }
      if (right.roomScore !== left.roomScore) {
        return right.roomScore - left.roomScore;
      }
      if (right.budgetScore !== left.budgetScore) {
        return right.budgetScore - left.budgetScore;
      }
      if (right.popularityScore !== left.popularityScore) {
        return right.popularityScore - left.popularityScore;
      }
      if (priority === "Budget") {
        return (left.material.price || 0) - (right.material.price || 0);
      }
      return (right.material.sales || 0) - (left.material.sales || 0);
    });
};

const getRecommendedMaterialsForProject = async (project, materialsOverride) => {
  const Material = require("../models/Project/Material");

  const materials = Array.isArray(materialsOverride)
    ? materialsOverride
    : await Material.find().lean();

  if (!Array.isArray(materials) || materials.length === 0) {
    return null;
  }

  const priority = project?.priority === "Budget" ? "Budget" : "Style";
  const scoredMaterials = rankMaterialsForProjectContext(project, materials);
  const strictContextKeywords = getStrictContextKeywordsForProject(project);
  const contextFilteredMaterials =
    strictContextKeywords.length > 0
      ? scoredMaterials.filter((item) => item.strictContextMatchCount > 0)
      : scoredMaterials;
  const eligibleMaterials =
    contextFilteredMaterials.length > 0
      ? contextFilteredMaterials
      : scoredMaterials;

  if (eligibleMaterials.length === 0) return [];

  const INVALID_CATEGORIES = new Set([
    "Bedroom",
    "Dining Room",
    "Entryway",
    "Hallway",
    "Kitchen",
    "Living Room",
    "Office",
    "Outdoor",
    "Test",
    "Other"
  ]);

  // Group by category to recommend 1 per category
  const topByCategory = new Map();
  for (const item of eligibleMaterials) {
    let rawCategory = item.material.category;
    if (!rawCategory || typeof rawCategory !== "string") continue;
    
    // Normalize to prevent duplicates (e.g., "sofa" vs "Sofa", "Storage cabinet" vs "Storage Cabinet")
    const category = rawCategory
      .trim()
      .replace(/\s+/g, " ")
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    if (INVALID_CATEGORIES.has(category)) continue;

    // Since scoredMaterials is already sorted highest-to-lowest,
    // the first one we encounter for a category is the top result.
    if (!topByCategory.has(category)) {
      item.material.category = category; // Override the material payload to use clean title casing
      topByCategory.set(category, item);
    }
  }

  // Map the top results into the expected format
  const recommendations = Array.from(topByCategory.values()).map(topResult => ({
    material: toPublicMaterial(topResult.material),
    score: {
      total: Number(topResult.totalScore.toFixed(3)),
      keywordFit: Number(topResult.keywordScore.toFixed(3)),
      roomFit: Number(topResult.roomScore.toFixed(3)),
      budgetFit: Number(topResult.budgetScore.toFixed(3)),
      popularity: Number(topResult.popularityScore.toFixed(3)),
    },
    analysis: {
      priority,
      matchedKeywords: topResult.matchedKeywords,
      estimatedTarget: topResult.estimatedTarget
        ? Math.round(topResult.estimatedTarget)
        : null,
      estimatedCeiling: topResult.estimatedCeiling
        ? Math.round(topResult.estimatedCeiling)
        : null,
      reasons: buildReasons({
        material: topResult.material,
        project,
        matchedKeywords: topResult.matchedKeywords,
        keywordScore: topResult.keywordScore,
        roomScore: topResult.roomScore,
        popularityScore: topResult.popularityScore,
        estimatedCeiling: topResult.estimatedCeiling,
      }),
    },
  }));

  return recommendations;
};

module.exports = {
  getRecommendedMaterialsForProject,
  rankMaterialsForProjectContext,
};
