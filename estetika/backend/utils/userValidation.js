const trimValue = (value) =>
  typeof value === "string" ? value.trim() : value ?? "";

const validateName = (value, label) => {
  const trimmed = trimValue(value);
  if (!trimmed) return `${label} is required.`;
  if (!/^[A-Za-z]+$/.test(trimmed)) {
    return `${label} can only contain letters.`;
  }
  return "";
};

// Strip everything except letters. Used to coerce externally-sourced names
// (e.g. Google OAuth) into the letters-only format the User model requires.
const sanitizeNameLettersOnly = (value) =>
  typeof value === "string" ? value.replace(/[^A-Za-z]/g, "") : "";

const normalizePhilippinePhone = (value) => {
  const trimmed = trimValue(value).replace(/\s+/g, "");
  // Convert 09XXXXXXXXX → +63XXXXXXXXX
  if (/^09\d{9}$/.test(trimmed)) return `+63${trimmed.slice(1)}`;
  return trimmed;
};

const validatePhilippinePhone = (value) => {
  const normalized = normalizePhilippinePhone(value);
  if (!normalized) return "Phone number is required.";
  if (!/^\+63\d{10}$/.test(normalized)) {
    return "Phone number must start with +63 and include 10 digits after it.";
  }
  return "";
};

module.exports = {
  normalizePhilippinePhone,
  sanitizeNameLettersOnly,
  trimValue,
  validateName,
  validatePhilippinePhone,
};
