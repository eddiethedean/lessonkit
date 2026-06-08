import React, { useMemo, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";
import { resolveMediaSrc } from "./embedSecurity";

export type ImageJuxtapositionProps = {
  blockId: BlockId;
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  label?: string;
};

export function ImageJuxtaposition(props: ImageJuxtapositionProps) {
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const [position, setPosition] = useState(50);
  const { track, config } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const mediaOptions = { allowedHosts: config.embed?.allowedHosts };
  const beforeSrc = resolveMediaSrc(props.beforeSrc, mediaOptions);
  const afterSrc = resolveMediaSrc(props.afterSrc, mediaOptions);

  const onChange = (value: number) => {
    setPosition(value);
    track(
      "image_juxtaposition_changed",
      { blockId, position: value },
      lessonId ? { lessonId } : undefined,
    );
  };

  return (
    <section
      aria-label={props.label ?? "Image juxtaposition"}
      data-lk-block-id={blockId}
      data-testid="image-juxtaposition"
    >
      <div
        style={{
          position: "relative",
          maxWidth: "100%",
          aspectRatio: "16 / 9",
          overflow: "hidden",
        }}
      >
        {afterSrc ? (
          <img
            src={afterSrc}
            alt={props.afterAlt}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
        {beforeSrc ? (
          <img
            src={beforeSrc}
            alt={props.beforeAlt}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              clipPath: `inset(0 ${100 - position}% 0 0)`,
            }}
          />
        ) : null}
      </div>
      <label>
        <span>Compare before and after</span>
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={position}
          data-testid="juxtaposition-slider"
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    </section>
  );
}

setLessonkitBlockType(ImageJuxtaposition, "ImageJuxtaposition");
