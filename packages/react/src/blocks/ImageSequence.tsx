import React, { useEffect, useMemo, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";
import { buildMediaOptions, resolveMediaSrc } from "./embedSecurity";

export type SequenceFrame = {
  src: string;
  alt: string;
  label?: string;
};

export type ImageSequenceProps = {
  blockId: BlockId;
  frames: SequenceFrame[];
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function ImageSequence(props: ImageSequenceProps) {
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const [index, setIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const { track, config } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const mediaOptions = buildMediaOptions(config);
  const frame = props.frames[index];
  const resolvedSrc = frame ? resolveMediaSrc(frame.src, mediaOptions) : null;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(props.frames.length - 1, next));
    setIndex(clamped);
    track(
      "image_sequence_changed",
      { blockId, frameIndex: clamped },
      lessonId ? { lessonId } : undefined,
    );
  };

  if (!frame) return null;

  return (
    <section aria-label="Image sequence" data-lk-block-id={blockId} data-testid="image-sequence">
      {resolvedSrc ? (
        <img src={resolvedSrc} alt={frame.alt} style={{ maxWidth: "100%" }} data-testid="sequence-frame" />
      ) : null}
      {frame.label ? <p>{frame.label}</p> : null}
      {reducedMotion ? (
        <div role="group" aria-label="Sequence steps">
          {props.frames.map((item, i) => (
            <button
              key={`${item.src}-${i}`}
              type="button"
              className="lk-image-sequence-thumb"
              aria-pressed={i === index}
              data-testid={`sequence-step-${i}`}
              onClick={() => goTo(i)}
            >
              {item.label ?? `Step ${i + 1}`}
            </button>
          ))}
        </div>
      ) : (
        <label>
          <span>Blend sequence</span>
          <input
            type="range"
            min={0}
            max={Math.max(0, props.frames.length - 1)}
            value={index}
            data-testid="sequence-slider"
            onChange={(event) => goTo(Number(event.target.value))}
          />
        </label>
      )}
    </section>
  );
}

setLessonkitBlockType(ImageSequence, "ImageSequence");
