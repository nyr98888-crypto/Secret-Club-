"use client";

import {
  getWashiSwatch,
  WASHI_TORN_CLIP,
  type WashiPatternId,
} from "@/lib/washiTapes";

type WashiStripProps = {
  patternId: WashiPatternId | string;
  label?: string;
  className?: string;
};

/** Procedural washi tape strip with torn edges + paper blend */
export function WashiStrip({
  patternId,
  label,
  className = "",
}: WashiStripProps) {
  const swatch = getWashiSwatch(patternId);
  const style = swatch?.style ?? {
    backgroundColor: "#fce7f3",
    backgroundImage:
      "repeating-linear-gradient(90deg, #fda4af 0 6px, #fecdd3 6px 12px)",
  };

  return (
    <div
      className={`relative h-7 w-full shadow-[0_2px_6px_rgba(74,43,69,0.12)] ${className}`}
      style={{
        ...style,
        opacity: 0.88,
        mixBlendMode: "multiply",
        clipPath: WASHI_TORN_CLIP,
        WebkitClipPath: WASHI_TORN_CLIP,
      }}
      aria-label={label || swatch?.label || "Washi tape"}
      role="img"
    />
  );
}

export default WashiStrip;
