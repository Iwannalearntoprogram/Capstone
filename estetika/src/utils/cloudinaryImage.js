// Insert on-the-fly delivery transformations into a Cloudinary image URL so we
// serve a compressed, right-sized, modern-format (WebP/AVIF) image instead of
// the multi-MB original. Non-Cloudinary URLs are returned unchanged.
//
//   https://res.cloudinary.com/<cloud>/image/upload/v123/design/x.jpg
//     -> https://res.cloudinary.com/<cloud>/image/upload/f_auto,q_auto,c_limit,w_600,dpr_auto/v123/design/x.jpg

const UPLOAD_MARKER = "/image/upload/";

export function optimizeCloudinaryUrl(url, { width = 600 } = {}) {
  if (!url || typeof url !== "string") return url;

  const markerIndex = url.indexOf(UPLOAD_MARKER);
  if (markerIndex === -1) return url; // not a Cloudinary delivery URL

  const insertAt = markerIndex + UPLOAD_MARKER.length;
  const rest = url.slice(insertAt);

  // Don't double-insert if a transformation segment is already present.
  const firstSegment = rest.split("/")[0] || "";
  if (/(?:^|,)(?:f_|q_|w_|c_|dpr_)/.test(firstSegment)) return url;

  const transformation = `f_auto,q_auto,c_limit,w_${width},dpr_auto`;
  return `${url.slice(0, insertAt)}${transformation}/${rest}`;
}
