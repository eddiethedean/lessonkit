import React, { Suspense, lazy } from "react";
import { renderBlock } from "@lessonkit/studio-renderer";
import type { StudioBlock } from "@lessonkit/studio-schema";

const HeavyBlockPreview = lazy(async () => {
  const mod = await import("@lessonkit/studio-renderer");
  return {
    default: function HeavyBlockPreview({ block }: { block: StudioBlock }) {
      return <>{mod.renderBlock(block)}</>;
    },
  };
});

const HEAVY_BLOCK_TYPES = new Set<StudioBlock["type"]>(["quiz", "scenario", "video"]);

export function BlockPreview({ block }: { block: StudioBlock }) {
  if (HEAVY_BLOCK_TYPES.has(block.type)) {
    return (
      <Suspense fallback={<div className="lk-studio-block-skeleton" aria-hidden />}>
        <HeavyBlockPreview block={block} />
      </Suspense>
    );
  }
  return <>{renderBlock(block)}</>;
}
