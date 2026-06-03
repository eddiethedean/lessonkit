import React, { forwardRef, useCallback, useMemo, useState } from "react";
import type { AssessmentBehaviour, BlockId, CompoundHandle } from "@lessonkit/core";
import { CompoundProvider, useCompoundHandleRef, useCompoundRegistry } from "../compound/CompoundProvider";
import { useCompoundNavigation } from "../compound/useCompoundNavigation";
import {
  readCompoundInitialIndex,
  useCompoundPersistence,
} from "../compound/useCompoundPersistence";
import { validateCompoundChildren } from "../compound/validateChildren";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { normalizeComponentId } from "../runtime/validateComponentId";

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
};

const AssessmentSequenceInner = forwardRef<CompoundHandle, AssessmentSequenceInnerProps>(
  function AssessmentSequenceInner(props, ref) {
    const { compoundId, childArray, index, setIndex } = props;
    const sequential = props.sequential !== false;
    const ctx = useCompoundRegistry();
    const { config } = useLessonkit();
    const persistEnabled = config.session?.persistCompoundState !== false;

    useCompoundPersistence({
      courseId: config.courseId,
      compoundId,
      index,
      setIndex,
      enabled: persistEnabled,
    });

    const { goNext, goPrev, progress } = useCompoundNavigation(childArray.length, index, setIndex);

    useCompoundHandleRef(ref, {
      activePageIndex: index,
      setActivePageIndex: setIndex,
      getHandles: () => ctx?.getHandles() ?? new Map(),
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
            <div key={child.key ?? i} hidden={i !== index}>
              {child}
            </div>
          ))}
        </div>
        <nav aria-label="Sequence navigation">
          <button
            type="button"
            data-testid="sequence-prev"
            disabled={index === 0 || childArray.length === 0}
            onClick={goPrev}
          >
            Previous
          </button>
          <button
            type="button"
            data-testid="sequence-next"
            disabled={index >= childArray.length - 1 || childArray.length === 0}
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
    const compoundId = useMemo(
      () =>
        props.blockId
          ? (normalizeComponentId(props.blockId, "blockId") as BlockId)
          : ("assessment-sequence" as BlockId),
      [props.blockId],
    );
    const childArray = React.Children.toArray(props.children).filter(
      React.isValidElement,
    ) as React.ReactElement[];
    const { config } = useLessonkit();
    const persistEnabled = config.session?.persistCompoundState !== false;

    const initialIndex = useMemo(
      () => readCompoundInitialIndex(config.courseId, compoundId, childArray.length, persistEnabled),
      [config.courseId, compoundId, childArray.length, persistEnabled],
    );

    const [index, setIndex] = useState(initialIndex);
    const setIndexStable = useCallback((i: number) => setIndex(i), []);

    return (
      <CompoundProvider activePageIndex={index} onActivePageIndexChange={setIndexStable}>
        <AssessmentSequenceInner
          {...props}
          ref={ref}
          compoundId={compoundId}
          childArray={childArray}
          index={index}
          setIndex={setIndex}
        />
      </CompoundProvider>
    );
  },
);

setLessonkitBlockType(AssessmentSequence, "AssessmentSequence");
