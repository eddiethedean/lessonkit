import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BlockId, CompoundHandle } from "@lessonkit/core";
import { CompoundProvider } from "../compound/CompoundProvider";
import { CompoundNav } from "../compound/CompoundNav";
import { useCompoundInitialIndex, useCompoundShell } from "../compound/useCompoundShell";
import { useCompoundKeyboardNav } from "../compound/useCompoundKeyboardNav";
import { validateCompoundChildren } from "../compound/validateChildren";
import { requireCompoundBlockIdWhenPersisting } from "../compound/requireCompoundBlockId";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";
import type { SlideProps } from "./Slide";

export type SlideDeckProps = {
  blockId: BlockId;
  title: string;
  showDeckScore?: boolean;
  children: React.ReactElement<SlideProps> | React.ReactElement<SlideProps>[];
};

type SlideDeckInnerProps = SlideDeckProps & {
  blockId: BlockId;
  slides: React.ReactElement<SlideProps>[];
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
  persistEnabled: boolean;
};

const SlideDeckInner = forwardRef<CompoundHandle, SlideDeckInnerProps>(function SlideDeckInner(
  props,
  ref,
) {
  const { blockId, slides, index, setIndex, persistEnabled } = props;
  validateCompoundChildren("SlideDeck", slides);

  const { config, track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const containerRef = useRef<HTMLElement>(null);

  const { visibleIndex, goNext, goPrev, progress, ctx } = useCompoundShell({
    courseId: config.courseId,
    compoundId: blockId,
    pageCount: slides.length,
    index,
    setIndex,
    persistEnabled,
    ref,
  });

  const setIndexStable = useCallback((i: number) => setIndex(i), [setIndex]);

  useCompoundKeyboardNav({
    containerRef,
    visibleIndex,
    pageCount: slides.length,
    goNext,
    goPrev,
    setIndex: setIndexStable,
  });

  const slideTitles = useMemo(
    () => slides.map((slide) => slide.props.title),
    [slides],
  );

  useEffect(() => {
    if (!lessonId || slides.length === 0) return;
    track(
      "slide_viewed",
      {
        blockId,
        slideIndex: visibleIndex,
        slideTitle: slideTitles[visibleIndex],
      },
      { lessonId },
    );
  }, [visibleIndex, blockId, lessonId, slides.length, slideTitles, track]);

  return (
    <section
      ref={containerRef}
      tabIndex={-1}
      aria-label={props.title}
      data-testid="slide-deck"
      data-lk-block-id={blockId}
    >
      <h3>{props.title}</h3>
      <p>
        Slide {progress.current} of {progress.total}
      </p>
      {props.showDeckScore && ctx ? (
        <p data-testid="deck-score">
          Score: {Array.from(ctx.getHandles().values()).reduce((s, h) => s + h.getScore(), 0)} /{" "}
          {Array.from(ctx.getHandles().values()).reduce((s, h) => s + h.getMaxScore(), 0)}
        </p>
      ) : null}
      <div data-testid="slide-deck-slide">
        {slides.map((slide, i) =>
          React.cloneElement(slide, {
            key: slide.key ?? slide.props.blockId,
            hidden: i !== visibleIndex,
            slideIndex: i,
            parentType: "SlideDeck",
          }),
        )}
      </div>
      <CompoundNav
        ariaLabel="Slide navigation"
        prevLabel="Previous slide"
        nextLabel="Next slide"
        prevTestId="slide-prev"
        nextTestId="slide-next"
        prevDisabled={visibleIndex === 0 || slides.length === 0}
        nextDisabled={visibleIndex >= slides.length - 1 || slides.length === 0}
        onPrev={goPrev}
        onNext={goNext}
      />
    </section>
  );
});

export const SlideDeck = forwardRef<CompoundHandle, SlideDeckProps>(function SlideDeck(props, ref) {
  const slides = React.Children.toArray(props.children).filter(
    React.isValidElement,
  ) as React.ReactElement<SlideProps>[];
  const { config, storage } = useLessonkit();
  const persistEnabled = config.session?.persistCompoundState !== false;

  requireCompoundBlockIdWhenPersisting({
    persistEnabled,
    blockId: props.blockId,
    componentName: "SlideDeck",
  });

  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );

  const initialIndex = useCompoundInitialIndex({
    courseId: config.courseId,
    compoundId: blockId,
    pageCount: slides.length,
    persistEnabled,
    storage,
  });

    const [index, setIndex] = useState(initialIndex);
    const setIndexStable = useCallback((i: number) => setIndex(i), []);

    useEffect(() => {
      setIndex(initialIndex);
    }, [config.courseId, blockId, initialIndex]);

    return (
    <CompoundProvider activePageIndex={index} onActivePageIndexChange={setIndexStable}>
      <SlideDeckInner
        {...props}
        ref={ref}
        blockId={blockId}
        slides={slides}
        index={index}
        setIndex={setIndex}
        persistEnabled={persistEnabled}
      />
    </CompoundProvider>
  );
});

setLessonkitBlockType(SlideDeck, "SlideDeck");
