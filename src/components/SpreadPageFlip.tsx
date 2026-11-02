"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";

export type FlipDirection = "next" | "prev";

type SpreadPageFlipProps = {
  direction: FlipDirection;
  /** Face shown on the flipping leaf (current page half) */
  faceStyle: CSSProperties;
  onComplete: () => void;
};

/**
 * 3D page-leaf overlay for scrapbook spread transitions.
 * Next: right leaf flips left (rotateY -180, origin left).
 * Prev: left leaf flips right (rotateY +180, origin right).
 */
export function SpreadPageFlip({
  direction,
  faceStyle,
  onComplete,
}: SpreadPageFlipProps) {
  const isNext = direction === "next";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden rounded-xl"
      style={{ perspective: 1400 }}
      aria-hidden
    >
      <motion.div
        className={`absolute inset-y-0 w-1/2 ${
          isNext ? "right-0 origin-left" : "left-0 origin-right"
        }`}
        style={{
          transformStyle: "preserve-3d",
          ...faceStyle,
          boxShadow: "0 8px 28px rgba(40,18,36,0.28)",
        }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isNext ? -180 : 180 }}
        transition={{ duration: 0.7, ease: [0.4, 0.05, 0.2, 1] }}
        onAnimationComplete={onComplete}
      >
        {/* Fold shadow that darkens mid-flip then fades */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.45, 0.15, 0] }}
          transition={{ duration: 0.7, times: [0, 0.35, 0.7, 1] }}
          style={{
            background: isNext
              ? "linear-gradient(90deg, rgba(40,18,36,0.55) 0%, rgba(40,18,36,0.05) 55%, transparent 100%)"
              : "linear-gradient(270deg, rgba(40,18,36,0.55) 0%, rgba(40,18,36,0.05) 55%, transparent 100%)",
          }}
        />
      </motion.div>
    </div>
  );
}

export default SpreadPageFlip;
