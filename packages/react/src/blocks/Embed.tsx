import React, { useEffect } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";
import {
  buildEmbedSandbox,
  resolveEmbedAspectRatio,
  resolveEmbedSrc,
  telemetryEmbedSrc,
} from "./embedSecurity";

export type EmbedProps = {
  blockId: BlockId;
  src: string;
  title: string;
  /** Space-separated sandbox tokens beyond the default restrictive set. */
  allow?: string;
  aspectRatio?: string;
};

export function Embed(props: EmbedProps) {
  const blockId = normalizeComponentId(props.blockId, "blockId") as BlockId;
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const resolvedSrc = resolveEmbedSrc(props.src);
  const sandbox = buildEmbedSandbox(props.allow);
  const aspectRatio = resolveEmbedAspectRatio(props.aspectRatio);

  useEffect(() => {
    if (!resolvedSrc) return;
    track(
      "interaction",
      { kind: "embed_viewed", blockId, src: telemetryEmbedSrc(resolvedSrc) },
      lessonId ? { lessonId } : undefined,
    );
  }, [blockId, lessonId, resolvedSrc, track]);

  if (!resolvedSrc) {
    return (
      <figure data-lk-block-id={blockId} data-testid={`embed-${blockId}`}>
        <p role="alert">This embed URL is not allowed.</p>
      </figure>
    );
  }

  return (
    <figure data-lk-block-id={blockId} data-testid={`embed-${blockId}`}>
      <iframe
        title={props.title}
        src={resolvedSrc}
        sandbox={sandbox}
        referrerPolicy="no-referrer"
        style={aspectRatio ? { aspectRatio, width: "100%", border: 0 } : { width: "100%", border: 0 }}
      />
      <figcaption className="lk-visually-hidden">{props.title}</figcaption>
    </figure>
  );
}

setLessonkitBlockType(Embed, "Embed");
