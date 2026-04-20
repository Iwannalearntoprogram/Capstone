const configuredServerUrl = import.meta.env.VITE_SERVER_URL?.trim();

const fallbackServerUrl = import.meta.env.DEV
  ? "http://localhost:3000"
  : window.location.origin;

export const SERVER_URL = (configuredServerUrl || fallbackServerUrl).replace(
  /\/+$/,
  ""
);

export const API_BASE_URL = `${SERVER_URL}/api`;
