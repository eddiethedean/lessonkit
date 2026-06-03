import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import type { BlockId, CompoundHandle } from "@lessonkit/core";
import { CompoundProvider, useCompoundHandleRef, useCompoundRegistry } from "../compound/CompoundProvider";
import { useCompoundNavigation } from "../compound/useCompoundNavigation";
import { useCompoundResume } from "../compound/useCompoundResume";
import { validateCompoundChildren } from "../compound/validateChildren";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";
import type { PageProps } from "./Page";

export type InteractiveBookProps = {
  blockId: BlockId;
  title: string;
  showBookScore?: boolean;
  children: React.ReactElement<PageProps> | React.ReactElement<PageProps>[];
};

const InteractiveBookInner = forwardRef<CompoundHandle, InteractiveBookProps>(function InteractiveBookInner(
  props,
  ref,
) {
  const blockId = useMemo(() => normalizeComponentId(props.blockId, "blockId") as BlockId, [props.blockId]);
  validateCompoundChildren("InteractiveBook", props.children);

  const pages = React.Children.toArray(props.children).filter(React.isValidElement) as React.ReactElement<PageProps>[];
  const { config, track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const ctx = useCompoundRegistry();

  const { index, setIndex, goNext, goPrev, progress } = useCompoundNavigation(pages.length, 0);

  useCompoundResume({
    courseId: config.courseId,
    compoundId: blockId,
    enabled: config.session?.persistCompoundState !== false,
    onResume: (state) => setIndex(state.activePageIndex),
  });

  useCompoundHandleRef(ref, {
    activePageIndex: index,
    setActivePageIndex: setIndex,
    getHandles: () => ctx?.getHandles() ?? new Map(),
  });

  useEffect(() => {
    if (!lessonId) return;
    const page = pages[index];
    track(
      "book_page_viewed",
      {
        blockId,
        pageIndex: index,
        pageTitle: page?.props.title,
      },
      { lessonId },
    );
  }, [index, blockId, lessonId, pages, track]);

  const current = pages[index] ?? null;

  return (
    <section aria-label={props.title} data-testid="interactive-book" data-lk-block-id={blockId}>
      <h3>{props.title}</h3>
      <p>
        Page {progress.current} of {progress.total}
      </p>
      {props.showBookScore && ctx ? (
        <p data-testid="book-score">
          Score: {Array.from(ctx.getHandles().values()).reduce((s, h) => s + h.getScore(), 0)} /{" "}
          {Array.from(ctx.getHandles().values()).reduce((s, h) => s + h.getMaxScore(), 0)}
        </p>
      ) : null}
      <div data-testid="interactive-book-page">{current}</div>
      <nav aria-label="Book navigation">
        <button type="button" data-testid="book-prev" disabled={index === 0} onClick={goPrev}>
          Previous
        </button>
        <button
          type="button"
          data-testid="book-next"
          disabled={index >= pages.length - 1}
          onClick={goNext}
        >
          Next
        </button>
      </nav>
    </section>
  );
});

export const InteractiveBook = forwardRef<CompoundHandle, InteractiveBookProps>(function InteractiveBook(
  props,
  ref,
) {
  const [index, setIndex] = useState(0);
  const setIndexStable = useCallback((i: number) => setIndex(i), []);

  return (
    <CompoundProvider activePageIndex={index} onActivePageIndexChange={setIndexStable}>
      <InteractiveBookInner {...props} ref={ref} />
    </CompoundProvider>
  );
});

setLessonkitBlockType(InteractiveBook, "InteractiveBook");
