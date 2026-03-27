import { useEffect, useState } from "react";

import { PROFILE_FALLBACK_SRC } from "../../utils/imageFallback";

export default function ProfileImage({
  src,
  alt = "Profile",
  className = "",
  ...rest
}) {
  const [currentSrc, setCurrentSrc] = useState(src || PROFILE_FALLBACK_SRC);

  useEffect(() => {
    setCurrentSrc(src || PROFILE_FALLBACK_SRC);
  }, [src]);

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== PROFILE_FALLBACK_SRC) {
          setCurrentSrc(PROFILE_FALLBACK_SRC);
        }
      }}
    />
  );
}
