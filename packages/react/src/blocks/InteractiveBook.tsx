import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import type { BlockId, CompoundHandle } from "@lessonkit/core";
import { CompoundProvider, useCompoundHandleRef, useCompoundRegistry } from "../compound/CompoundProvider";
import { useCompoundNavigation } from "../compound/useCompoundNavigation";
import {
  readCompoundInitialIndex,
  useCompoundPersistence,
} from "../compound/useCompoundPersistence";
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

type InteractiveBookInnerProps = InteractiveBookProps & {
  blockId: BlockId;
  pages: React.ReactElement<PageProps>[];
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
};

const InteractiveBookInner = forwardRef<CompoundHandle, InteractiveBookInnerProps>(
  function InteractiveBookInner(props, ref) {
    const { blockId, pages, index, setIndex } = props;
    validateCompoundChildren("InteractiveBook", pages);

    const { config, track } = useLessonkit();
    const lessonId = useEnclosingLessonId();
    const ctx = useCompoundRegistry();
    const persistEnabled = config.session?.persistCompoundState !== false;

    useCompoundPersistence({
      courseId: config.courseId,
      compoundId: blockId,
      index,
      setIndex,
      enabled: persistEnabled,
    });

    const { goNext, goPrev, progress } = useCompoundNavigation(pages.length, index, setIndex);

    useCompoundHandleRef(ref, {
      activePageIndex: index,
      setActivePageIndex: setIndex,
      getHandles: () => ctx?.getHandles() ?? new Map(),
    });

    const pageTitles = useMemo(
      () => pages.map((page) => page.props.title),
      [pages],
    );

    useEffect(() => {
      if (!lessonId || pages.length === 0) return;
      track(
        "book_page_viewed",
        {
          blockId,
          pageIndex: index,
          pageTitle: pageTitles[index],
        },
        { lessonId },
      );
    }, [index, blockId, lessonId, pages.length, pageTitles, track]);

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
        <div data-testid="interactive-book-page">
          {pages.map((page, i) =>
            React.cloneElement(page, {
              key: page.key ?? page.props.blockId,
              hidden: i !== index,
              pageIndex: i,
              parentType: "InteractiveBook",
            }),
          )}
        </div>
        <nav aria-label="Book navigation">
          <button
            type="button"
            data-testid="book-prev"
            disabled={index === 0 || pages.length === 0}
            onClick={goPrev}
          >
            Previous
          </button>
          <button
            type="button"
            data-testid="book-next"
            disabled={index >= pages.length - 1 || pages.length === 0}
            onClick={goNext}
          >
            Next
          </button>
        </nav>
      </section>
    );
  },
);

export const InteractiveBook = forwardRef<CompoundHandle, InteractiveBookProps>(function InteractiveBook(
  props,
  ref,
) {
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const pages = React.Children.toArray(props.children).filter(
    React.isValidElement,
  ) as React.ReactElement<PageProps>[];
  const { config } = useLessonkit();
  const persistEnabled = config.session?.persistCompoundState !== false;

  const initialIndex = useMemo(
    () => readCompoundInitialIndex(config.courseId, blockId, pages.length, persistEnabled),
    [config.courseId, blockId, pages.length, persistEnabled],
  );

  const [index, setIndex] = useState(initialIndex);
  const setIndexStable = useCallback((i: number) => setIndex(i), []);

  return (
    <CompoundProvider activePageIndex={index} onActivePageIndexChange={setIndexStable}>
      <InteractiveBookInner
        {...props}
        ref={ref}
        blockId={blockId}
        pages={pages}
        index={index}
        setIndex={setIndex}
      />
    </CompoundProvider>
  );
});

setLessonkitBlockType(InteractiveBook, "InteractiveBook");
