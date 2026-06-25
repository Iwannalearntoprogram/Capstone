const toDataUri = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const profileSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none">
    <rect width="96" height="96" rx="24" fill="#F1F5F9"/>
    <circle cx="48" cy="35" r="15" fill="#94A3B8"/>
    <path d="M24 77c4.8-13.6 15-20.4 24-20.4S67.2 63.4 72 77" fill="#94A3B8"/>
  </svg>
`;

const genericSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" fill="none">
    <rect width="160" height="120" rx="18" fill="#F8FAFC"/>
    <rect x="24" y="24" width="112" height="72" rx="12" stroke="#94A3B8" stroke-width="4"/>
    <circle cx="56" cy="50" r="8" fill="#94A3B8"/>
    <path d="M42 84 66 61l16 15 18-22 18 30" stroke="#94A3B8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

export const PROFILE_FALLBACK_SRC = toDataUri(profileSvg);
export const GENERIC_FALLBACK_SRC = toDataUri(genericSvg);

const MAX_RETRIES = 1;

export function applyImageFallback(img) {
  if (!(img instanceof HTMLImageElement)) return;
  if (img.dataset.fallbackApplied === "true") return;

  // Transient failures (throttled/dropped requests during a burst of card
  // images) shouldn't stick permanently. Retry the original URL once with a
  // cache-busting param before swapping in the placeholder.
  const currentSrc = img.currentSrc || img.src;
  const retries = Number(img.dataset.retryCount || 0);
  if (/^https?:/i.test(currentSrc) && retries < MAX_RETRIES) {
    const base = img.dataset.originalSrc || currentSrc;
    img.dataset.originalSrc = base;
    img.dataset.retryCount = String(retries + 1);
    const separator = base.includes("?") ? "&" : "?";
    const retrySrc = `${base}${separator}_retry=${retries + 1}`;
    setTimeout(() => {
      // Guard against a fallback that was applied in the meantime.
      if (img.dataset.fallbackApplied !== "true") img.src = retrySrc;
    }, 500 * (retries + 1));
    return;
  }

  const fallbackType =
    img.dataset.fallback === "profile" || /\bprofile\b/i.test(img.alt || "")
      ? "profile"
      : "generic";

  img.dataset.fallbackApplied = "true";
  img.removeAttribute("srcset");
  img.src = fallbackType === "profile" ? PROFILE_FALLBACK_SRC : GENERIC_FALLBACK_SRC;

  if (!img.alt) {
    img.alt =
      fallbackType === "profile" ? "Profile placeholder" : "Image unavailable";
  }
}
