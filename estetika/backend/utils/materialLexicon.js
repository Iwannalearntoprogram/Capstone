/**
 * Shared vocabulary of material/finish and color terms.
 *
 * Used by both the attribute backfill script (scripts/backfillAttributes.js) and
 * the material recommendation style filter (utils/materialRecommendation.js) so
 * the two stay in sync. Keep entries lowercase.
 */

// Materials / finishes commonly found in furniture names & descriptions.
const MATERIAL_KEYWORDS = [
  "velvet", "leather", "leatherette", "suede", "linen", "cotton", "wool",
  "jute", "canvas", "fabric", "rattan", "wicker", "bamboo", "cane",
  "walnut", "oak", "teak", "mahogany", "pine", "birch", "acacia", "ash",
  "plywood", "mdf", "wood", "wooden", "marble", "granite", "stone",
  "concrete", "ceramic", "porcelain", "terracotta", "glass", "acrylic",
  "plastic", "resin", "brass", "copper", "bronze", "chrome", "steel",
  "stainless steel", "iron", "aluminum", "aluminium", "metal", "gold",
];

// Colors / tones.
const COLOR_KEYWORDS = [
  "black", "white", "gray", "grey", "charcoal", "silver", "brown", "walnut",
  "beige", "cream", "ivory", "tan", "taupe", "navy", "blue", "teal", "green",
  "emerald", "olive", "sage", "red", "burgundy", "maroon", "pink", "blush",
  "purple", "lavender", "yellow", "mustard", "gold", "orange", "terracotta",
  "rust",
];

module.exports = { MATERIAL_KEYWORDS, COLOR_KEYWORDS };
