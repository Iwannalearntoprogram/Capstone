const normalizeSpaces = (value) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const comparable = (value) => normalizeSpaces(value).toLowerCase();

const flattenAttributeInput = (input) => {
  if (!input) return [];

  if (typeof input === "string" || typeof input === "number") {
    return [String(input)];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => flattenAttributeInput(item));
  }

  if (input instanceof Map) {
    return Array.from(input.values()).flatMap((value) =>
      flattenAttributeInput(value)
    );
  }

  if (typeof input === "object") {
    if (Array.isArray(input.values)) {
      return flattenAttributeInput(input.values);
    }

    if (input.value !== undefined && input.value !== null) {
      return flattenAttributeInput(input.value);
    }

    return Object.entries(input)
      .filter(([key]) => !["_id", "id", "__v"].includes(key))
      .flatMap(([, value]) => flattenAttributeInput(value));
  }

  return [];
};

const normalizeAttributeTags = (input) => {
  const seen = new Set();
  const tags = [];

  for (const raw of flattenAttributeInput(input)) {
    const tag = normalizeSpaces(raw);
    const key = comparable(tag);
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }

  return tags;
};

module.exports = {
  normalizeAttributeTags,
  normalizeSpaces,
  comparable,
};
