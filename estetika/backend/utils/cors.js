const LOCAL_ORIGIN_PATTERN =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "");

const configuredOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URLS,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGINS,
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  return (
    configuredOrigins.includes(normalizedOrigin) ||
    LOCAL_ORIGIN_PATTERN.test(normalizedOrigin)
  );
};

const originDelegate = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`Origin ${origin} is not allowed by CORS`));
};

const expressCorsOptions = {
  origin: originDelegate,
  credentials: true,
};

const socketCorsOptions = {
  origin: originDelegate,
  methods: ["GET", "POST"],
  credentials: true,
};

module.exports = {
  expressCorsOptions,
  isAllowedOrigin,
  socketCorsOptions,
};
