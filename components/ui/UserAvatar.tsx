"use client";

import { useState } from "react";

export function getAvatarStyle(seed: string): { backgroundColor: string; color: string } {
  let hash = 5381;
  const str = seed || "RonanSAT";
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return { backgroundColor: `hsl(${hue} 62% 45%)`, color: "#ffffff" };
}

export function getAvatarInitial(seed: string): string {
  const first = (seed || "").trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

export default function UserAvatar({
  seed,
  imageUrl,
  className = "h-8 w-8 text-xs",
  alt,
}: {
  seed: string;
  imageUrl?: string | null;
  className?: string;
  pixelSize?: number;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);

  const box = `shrink-0 overflow-hidden rounded-full ${className}`;

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={alt ?? ""}
        aria-hidden={alt ? undefined : true}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`${box} bg-paper-bg object-cover`}
      />
    );
  }

  return (
    <span
      className={`${box} flex items-center justify-center font-display font-black select-none shadow-[var(--ui-shadow-xs)]`}
      style={getAvatarStyle(seed)}
      role={alt ? "img" : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
    >
      {getAvatarInitial(seed)}
    </span>
  );
}
