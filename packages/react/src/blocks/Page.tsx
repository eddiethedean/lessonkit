import React, { useEffect } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { validateCompoundChildren } from "../compound/validateChildren";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";

export type PageProps = {
  blockId: BlockId;
  title?: string;
  /** When true, page is used as a book chapter but hidden until navigated (InteractiveBook). */
  hidden?: boolean;
  /** Index within a compound parent (set by InteractiveBook). */
  pageIndex?: number;
  /** Compound parent type for telemetry (e.g. InteractiveBook). */
  parentType?: string;
  children: React.ReactNode;
};

export function Page(props: PageProps) {
  validateCompoundChildren("Page", props.children);
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();

  useEffect(() => {
    if (props.hidden || !lessonId) return;
    track(
      "compound_page_viewed",
      {
        blockId: props.blockId,
        pageIndex: props.pageIndex ?? 0,
        parentType: props.parentType,
      },
      { lessonId },
    );
  }, [props.hidden, props.pageIndex, props.parentType, props.blockId, lessonId, track]);

  return (
    <section
      aria-label={props.title ?? "Page"}
      data-lk-block-id={props.blockId}
      data-testid={`page-${props.blockId}`}
      hidden={props.hidden ? true : undefined}
    >
      {props.title ? <h3>{props.title}</h3> : null}
      <div>{props.children}</div>
    </section>
  );
}

setLessonkitBlockType(Page, "Page");
