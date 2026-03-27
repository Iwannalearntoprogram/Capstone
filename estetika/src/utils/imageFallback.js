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

export function applyImageFallback(img) {
  if (!(img instanceof HTMLImageElement)) return;
  if (img.dataset.fallbackApplied === "true") return;

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
