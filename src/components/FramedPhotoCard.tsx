"use client";

import {
  CssPhotoFrame,
  resolveCssFrame,
  type CssFrameArchetype,
} from "./canvas/CssPhotoFrame";
import type { FramePreset } from "@/lib/scrapbookAssets";

export type { FramePreset };

export type FramedPhotoCardProps = {
  frameSrc?: string;
  preset?: FramePreset | CssFrameArchetype;
  photoSrc?: string | null;
  photoOffsetX?: number;
  photoOffsetY?: number;
  titleStamp?: string;
  alt?: string;
  className?: string;
  adjusting?: boolean;
  onRequestAdjust?: () => void;
  onEndAdjust?: () => void;
  onPhotoChange?: (src: string) => void;
  onPhotoOffsetChange?: (x: number, y: number) => void;
};

/**
 * Back-compat wrapper — delegates to pure-CSS frame shells.
 * `frameSrc` is ignored (kept for older call sites).
 */
export function FramedPhotoCard({
  preset = "polaroid",
  photoSrc,
  photoOffsetX = 0,
  photoOffsetY = 0,
  titleStamp = "besties ♡",
  alt = "Scrapbook photo",
  className = "",
  adjusting = false,
  onRequestAdjust,
  onEndAdjust,
  onPhotoChange,
  onPhotoOffsetChange,
}: FramedPhotoCardProps) {
  return (
    <CssPhotoFrame
      archetype={resolveCssFrame(preset)}
      photoSrc={photoSrc}
      photoOffsetX={photoOffsetX}
      photoOffsetY={photoOffsetY}
      caption={titleStamp}
      alt={alt}
      className={className}
      adjusting={adjusting}
      onRequestAdjust={onRequestAdjust}
      onEndAdjust={onEndAdjust}
      onPhotoChange={onPhotoChange}
      onPhotoOffsetChange={onPhotoOffsetChange}
    />
  );
}

export default FramedPhotoCard;
