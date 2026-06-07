const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9_]{3,30}$/;
const DIGIT_REGEX = /\d/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const SIX_DIGIT_OTP_REGEX = /^\d{6}$/;
const PH_PHONE_REGEX = /^(\+63\d{10})$/;

export const trimValue = (value) =>
  typeof value === "string" ? value.trim() : value ?? "";

export const isBlank = (value) => trimValue(value) === "";

export const validateRequiredText = (
  value,
  label,
  { minLength = 1, maxLength } = {}
) => {
  const trimmed = trimValue(value);
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }
  if (maxLength && trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return "";
};

export const sanitizeNameInput = (value) =>
  typeof value === "string" ? value.replace(/\d/g, "") : value ?? "";

export const validateNameWithoutNumbers = (
  value,
  label,
  options = {}
) => {
  const trimmed = trimValue(value);
  if (!trimmed) return `${label} is required.`;
  if (DIGIT_REGEX.test(trimmed)) {
    return `${label} cannot contain numbers.`;
  }
  if (options.minLength && trimmed.length < options.minLength) {
    return `${label} must be at least ${options.minLength} characters.`;
  }
  if (options.maxLength && trimmed.length > options.maxLength) {
    return `${label} must be ${options.maxLength} characters or fewer.`;
  }
  return "";
};

export const validateEmail = (value) => {
  const trimmed = trimValue(value).toLowerCase();
  if (!trimmed) return "Email is required.";
  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address.";
  return "";
};

export const validateUsername = (value) => {
  const trimmed = trimValue(value);
  if (!trimmed) return "Username is required.";
  if (!USERNAME_REGEX.test(trimmed)) {
    return "Username must be 3-30 characters and use only letters, numbers, or underscores.";
  }
  return "";
};

export const validateStrongPassword = (value) => {
  if (!value) return "Password is required.";
  if (!STRONG_PASSWORD_REGEX.test(value)) {
    return "Password must be at least 8 characters and include an uppercase letter, number, and symbol.";
  }
  return "";
};

export const validateMinPassword = (value, minLength = 6) => {
  if (!value) return "Password is required.";
  if (value.length < minLength) {
    return `Password must be at least ${minLength} characters.`;
  }
  return "";
};

export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) return "Please confirm your password.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return "";
};

export const validateOtp = (value, label = "OTP") => {
  const trimmed = trimValue(value);
  if (!trimmed) return `${label} is required.`;
  if (!SIX_DIGIT_OTP_REGEX.test(trimmed)) {
    return `${label} must be exactly 6 digits.`;
  }
  return "";
};

export const normalizePhone = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, "") : value || "";

export const validatePhilippinePhone = (value) => {
  const normalized = normalizePhone(value);
  if (!normalized) return "Phone number is required.";
  if (!PH_PHONE_REGEX.test(normalized)) {
    return "Phone number must start with +63 and include 10 digits after it.";
  }
  return "";
};

export const validatePositiveNumber = (
  value,
  label,
  { allowZero = false } = {}
) => {
  if (value === "" || value === null || value === undefined) {
    return `${label} is required.`;
  }

  const number = Number(value);
  if (Number.isNaN(number)) return `${label} must be a valid number.`;
  if (allowZero ? number < 0 : number <= 0) {
    return allowZero
      ? `${label} cannot be negative.`
      : `${label} must be greater than 0.`;
  }
  return "";
};

export const validateIntegerMin = (value, label, min = 1) => {
  if (value === "" || value === null || value === undefined) {
    return `${label} is required.`;
  }

  const number = Number(value);
  if (!Number.isInteger(number)) return `${label} must be a whole number.`;
  if (number < min) return `${label} must be at least ${min}.`;
  return "";
};

export const validateDateRequired = (value, label) => {
  if (!value) return `${label} is required.`;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return `${label} is invalid.`;
  return "";
};

export const validateDateOrder = (startValue, endValue, labels = {}) => {
  const startLabel = labels.startLabel || "Start date";
  const endLabel = labels.endLabel || "End date";

  const startError = validateDateRequired(startValue, startLabel);
  if (startError) return startError;

  const endError = validateDateRequired(endValue, endLabel);
  if (endError) return endError;

  const start = startValue instanceof Date ? startValue : new Date(startValue);
  const end = endValue instanceof Date ? endValue : new Date(endValue);
  if (end < start) return `${endLabel} cannot be before ${startLabel.toLowerCase()}.`;
  return "";
};

export const validateNotPastDate = (value, label) => {
  const requiredError = validateDateRequired(value, label);
  if (requiredError) return requiredError;

  const input = value instanceof Date ? value : new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalizedInput = new Date(input);
  normalizedInput.setHours(0, 0, 0, 0);

  if (normalizedInput < today) return `${label} cannot be in the past.`;
  return "";
};

export const validateUrl = (value, label, { allowBlank = true } = {}) => {
  const trimmed = trimValue(value);
  if (!trimmed && allowBlank) return "";
  if (!trimmed) return `${label} is required.`;

  try {
    new URL(trimmed);
    return "";
  } catch {
    return `Enter a valid ${label.toLowerCase()}.`;
  }
};

export const validateFile = (
  file,
  {
    label = "File",
    allowedMimePrefixes = [],
    allowedMimeTypes = [],
    maxSizeMb,
  } = {}
) => {
  if (!file) return `${label} is required.`;

  const matchesType =
    allowedMimeTypes.includes(file.type) ||
    allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix));

  if (
    (allowedMimeTypes.length > 0 || allowedMimePrefixes.length > 0) &&
    !matchesType
  ) {
    return `${label} type is not supported.`;
  }

  if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
    return `${label} must be ${maxSizeMb}MB or smaller.`;
  }

  return "";
};

export const validateOptionRows = (options = []) => {
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index] || {};
    const rowNumber = index + 1;

    if (!trimValue(option.type)) {
      return `Option ${rowNumber} must include a type.`;
    }
    if (!trimValue(option.option)) {
      return `Option ${rowNumber} must include an option name.`;
    }
    const priceError = validatePositiveNumber(
      option.addToPrice,
      `Option ${rowNumber} price addition`,
      { allowZero: true }
    );
    if (priceError) return priceError;
  }

  return "";
};

export const validateAttributeGroups = (groups = [], { required = false } = {}) => {
  const normalized = groups
    .map((group) => ({
      key: trimValue(group?.key),
      values: Array.isArray(group?.values)
        ? group.values.map((value) => trimValue(value)).filter(Boolean)
        : [],
    }))
    .filter((group) => group.key || group.values.length > 0);

  if (required && normalized.length === 0) {
    return "Add at least one attribute with a value.";
  }

  for (let index = 0; index < normalized.length; index += 1) {
    const group = normalized[index];
    const rowNumber = index + 1;

    if (!group.key) return `Attribute ${rowNumber} must include a key.`;
    if (group.values.length === 0) {
      return `Attribute ${rowNumber} must include at least one value.`;
    }
  }

  return "";
};

export const getFirstError = (errors = {}) =>
  Object.values(errors).find(Boolean) || "";

