import React, { useEffect } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type EmbedProps = {
  blockId: BlockId;
  src: string;
  title: string;
  /** Space-separated sandbox tokens beyond the default restrictive set. */
  allow?: string;
  aspectRatio?: string;
};

const DEFAULT_SANDBOX = "allow-scripts allow-same-origin";

export function Embed(props: EmbedProps) {
  const blockId = normalizeComponentId(props.blockId, "blockId") as BlockId;
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const sandbox = props.allow ? `${DEFAULT_SANDBOX} ${props.allow}` : DEFAULT_SANDBOX;

  useEffect(() => {
    track("interaction", { kind: "embed_viewed", blockId, src: props.src }, lessonId ? { lessonId } : undefined);
  }, [blockId, lessonId, props.src, track]);

  return (
    <figure data-lk-block-id={blockId} data-testid={`embed-${blockId}`}>
      <iframe
        title={props.title}
        src={props.src}
        sandbox={sandbox}
        referrerPolicy="no-referrer"
        style={props.aspectRatio ? { aspectRatio: props.aspectRatio, width: "100%", border: 0 } : { width: "100%", border: 0 }}
      />
      <figcaption className="lk-visually-hidden">{props.title}</figcaption>
    </figure>
  );
}

setLessonkitBlockType(Embed, "Embed");
