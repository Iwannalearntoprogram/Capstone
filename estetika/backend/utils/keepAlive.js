const axios = require("axios");

// Resolve the public URL of this server. On Render this is injected
// automatically as RENDER_EXTERNAL_URL; otherwise set SELF_PING_URL.
const resolveBaseUrl = () =>
  (process.env.SELF_PING_URL || process.env.RENDER_EXTERNAL_URL || "")
    .trim()
    .replace(/\/+$/, "");

// Pings the server's own /api/alive endpoint so Render's free tier never
// reaches its ~15 minute idle threshold and spins the instance down.
const pingSelf = async () => {
  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    return; // No public URL configured (e.g. local dev) — nothing to ping.
  }

  try {
    const res = await axios.get(`${baseUrl}/api/alive`, { timeout: 10000 });
    console.log(`Keep-alive ping ok (${res.status})`);
  } catch (err) {
    console.error("Keep-alive ping failed:", err.message);
  }
};

module.exports = { pingSelf, resolveBaseUrl };
