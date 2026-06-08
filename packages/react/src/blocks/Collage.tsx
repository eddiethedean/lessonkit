import React, { useMemo } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { normalizeComponentId } from "../runtime/validateComponentId";
import { buildMediaOptions, resolveMediaSrc } from "./embedSecurity";

export type CollageCell = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
};

export type CollageProps = {
  blockId: BlockId;
  columns?: number;
  cells: CollageCell[];
};

export function Collage(props: CollageProps) {
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const { config } = useLessonkit();
  const mediaOptions = buildMediaOptions(config);
  const columns = props.columns ?? 2;

  return (
    <section aria-label="Collage" data-lk-block-id={blockId} data-testid="collage-block">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: "0.5rem",
        }}
      >
        {props.cells.map((cell) => {
          const src = resolveMediaSrc(cell.src, mediaOptions);
          return (
            <figure key={cell.id} data-testid={`collage-cell-${cell.id}`}>
              {src ? <img src={src} alt={cell.alt} style={{ width: "100%", height: "auto" }} /> : null}
              {cell.caption ? <figcaption>{cell.caption}</figcaption> : null}
            </figure>
          );
        })}
      </div>
    </section>
  );
}

setLessonkitBlockType(Collage, "Collage");
