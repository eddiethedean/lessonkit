import React, { useEffect } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { validateCompoundChildren } from "../compound/validateChildren";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";

export type SlideProps = {
  blockId: BlockId;
  title?: string;
  /** When true, slide is used in a deck but hidden until navigated (SlideDeck). */
  hidden?: boolean;
  /** Index within a compound parent (set by SlideDeck). */
  slideIndex?: number;
  /** Compound parent type for telemetry (e.g. SlideDeck). */
  parentType?: string;
  children: React.ReactNode;
};

export function Slide(props: SlideProps) {
  validateCompoundChildren("Slide", props.children);
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();

  useEffect(() => {
    if (props.hidden || !lessonId) return;
    track(
      "compound_page_viewed",
      {
        blockId: props.blockId,
        pageIndex: props.slideIndex ?? 0,
        parentType: props.parentType,
      },
      { lessonId },
    );
  }, [props.hidden, props.slideIndex, props.parentType, props.blockId, lessonId, track]);

  return (
    <section
      aria-label={props.title ?? "Slide"}
      data-lk-block-id={props.blockId}
      data-testid={`slide-${props.blockId}`}
      hidden={props.hidden ? true : undefined}
    >
      {props.title ? <h3>{props.title}</h3> : null}
      <div>{props.children}</div>
    </section>
  );
}

setLessonkitBlockType(Slide, "Slide");
