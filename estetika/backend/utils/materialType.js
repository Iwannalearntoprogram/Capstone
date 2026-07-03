// The `category` field is a mix of room groupings ("Office", "Living Room")
// and real furniture types ("Chair", "Table"), so materials of very different
// types (e.g. desks and chairs) often share the same category. Infer the
// actual product type from the name instead, which reliably names the item.
const TYPE_KEYWORDS = [
  ["Stool", ["bar stool", "stool"]],
  ["Chair", ["chair"]],
  ["Desk", ["desk"]],
  ["Table", ["table"]],
  ["Sofa", ["sofa", "couch", "loveseat", "sectional"]],
  ["Bed", ["bed frame", "bed"]],
  ["Dresser", ["dresser"]],
  ["Wardrobe", ["wardrobe"]],
  ["Cabinet", ["cabinet", "cupboard"]],
  ["Shelf", ["shelf", "shelving", "bookcase"]],
  ["Nightstand", ["nightstand"]],
  ["Mirror", ["mirror"]],
  ["Rug", ["rug", "carpet"]],
  ["Lighting", ["lamp", "chandelier", "light"]],
  ["Sink", ["sink", "faucet"]],
  ["Toilet", ["toilet"]],
  ["Tv Stand", ["tv stand"]],
  ["Counter", ["counter"]],
  ["Ottoman", ["ottoman", "bench"]],
];

function inferProductType(material) {
  const name = (material?.name || "").toLowerCase();
  for (const [type, keywords] of TYPE_KEYWORDS) {
    if (keywords.some((kw) => name.includes(kw))) return type;
  }
  return material?.category || null;
}

module.exports = { inferProductType };
