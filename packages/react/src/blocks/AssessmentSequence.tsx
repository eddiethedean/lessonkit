import React, { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { deriveId } from "@lessonkit/core";
import type { AssessmentBehaviour, BlockId, CompoundHandle } from "@lessonkit/core";
import { CompoundProvider } from "../compound/CompoundProvider";
import { useCompoundInitialIndex, useCompoundShell } from "../compound/useCompoundShell";
import { CompoundPageIndexProvider } from "../compound/CompoundPageIndexContext";
import { validateCompoundChildren } from "../compound/validateChildren";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { normalizeComponentId } from "../runtime/validateComponentId";
import {
  DEFAULT_ASSESSMENT_SEQUENCE_COMPOUND_ID,
  warnSharedCompoundStorageKey,
} from "../compound/warnPersistence";

export type AssessmentSequenceProps = AssessmentBehaviour & {
  children: React.ReactNode;
  /** Show one child assessment at a time (Question Set). */
  sequential?: boolean;
  blockId?: BlockId;
};

type AssessmentSequenceInnerProps = AssessmentSequenceProps & {
  compoundId: BlockId;
  childArray: React.ReactElement[];
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
  persistEnabled: boolean;
};

const AssessmentSequenceInner = forwardRef<CompoundHandle, AssessmentSequenceInnerProps>(
  function AssessmentSequenceInner(props, ref) {
    const { compoundId, childArray, index, setIndex, persistEnabled } = props;
    const sequential = props.sequential !== false;
    const { config } = useLessonkit();

    const { visibleIndex, goNext, goPrev, progress } = useCompoundShell({
      courseId: config.courseId,
      compoundId,
      pageCount: childArray.length,
      index,
      setIndex,
      persistEnabled,
      ref,
      enableSolutionsButton: props.enableSolutionsButton,
    });

    validateCompoundChildren("AssessmentSequence", props.children);

    if (!sequential) {
      return (
        <section aria-label="Assessment sequence" data-testid="assessment-sequence">
          {props.children}
        </section>
      );
    }

    return (
      <section aria-label="Assessment sequence" data-testid="assessment-sequence">
        <p>
          Question {progress.current} of {progress.total}
        </p>
        <div data-testid="assessment-sequence-step">
          {childArray.map((child, i) => (
            <div key={child.key ?? i} hidden={i !== visibleIndex}>
              <CompoundPageIndexProvider pageIndex={i}>{child}</CompoundPageIndexProvider>
            </div>
          ))}
        </div>
        <nav aria-label="Sequence navigation">
          <button
            type="button"
            data-testid="sequence-prev"
            disabled={visibleIndex === 0 || childArray.length === 0}
            onClick={goPrev}
          >
            Previous
          </button>
          <button
            type="button"
            data-testid="sequence-next"
            disabled={visibleIndex >= childArray.length - 1 || childArray.length === 0}
            onClick={goNext}
          >
            Next
          </button>
        </nav>
      </section>
    );
  },
);

export const AssessmentSequence = forwardRef<CompoundHandle, AssessmentSequenceProps>(
  function AssessmentSequence(props, ref) {
    const reactInstanceId = useId();
    const autoCompoundIdRef = useRef<BlockId | null>(null);
    if (!props.blockId && !autoCompoundIdRef.current) {
      autoCompoundIdRef.current = deriveId(`assessment-sequence-${reactInstanceId}`) as BlockId;
    }
    const compoundId = useMemo(
      () =>
        props.blockId
          ? (normalizeComponentId(props.blockId, "blockId") as BlockId)
          : (autoCompoundIdRef.current ?? (DEFAULT_ASSESSMENT_SEQUENCE_COMPOUND_ID as BlockId)),
      [props.blockId],
    );
    const childArray = React.Children.toArray(props.children).filter(
      React.isValidElement,
    ) as React.ReactElement[];
    const { config } = useLessonkit();
    const persistEnabled = config.session?.persistCompoundState !== false;

    useEffect(() => {
      warnSharedCompoundStorageKey({
        persistEnabled,
        hasExplicitBlockId: Boolean(props.blockId),
        componentName: "AssessmentSequence",
      });
    }, [persistEnabled, props.blockId]);

    const initialIndex = useCompoundInitialIndex({
      courseId: config.courseId,
      compoundId,
      pageCount: childArray.length,
      persistEnabled,
    });

    const [index, setIndex] = useState(initialIndex);
    const setIndexStable = useCallback((i: number) => setIndex(i), []);

    useEffect(() => {
      setIndex(initialIndex);
    }, [config.courseId, compoundId, initialIndex]);

    return (
      <CompoundProvider activePageIndex={index} onActivePageIndexChange={setIndexStable}>
        <AssessmentSequenceInner
          {...props}
          ref={ref}
          compoundId={compoundId}
          childArray={childArray}
          index={index}
          setIndex={setIndex}
          persistEnabled={persistEnabled}
        />
      </CompoundProvider>
    );
  },
);

setLessonkitBlockType(AssessmentSequence, "AssessmentSequence");
