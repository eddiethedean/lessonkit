import React, { forwardRef, useCallback, useState } from "react";
import type { AssessmentBehaviour, CompoundHandle } from "@lessonkit/core";
import { CompoundProvider, useCompoundHandleRef, useCompoundRegistry } from "../compound/CompoundProvider";
import { useCompoundNavigation } from "../compound/useCompoundNavigation";
import { useCompoundResume } from "../compound/useCompoundResume";
import { validateCompoundChildren } from "../compound/validateChildren";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";

export type AssessmentSequenceProps = AssessmentBehaviour & {
  children: React.ReactNode;
  /** Show one child assessment at a time (Question Set). */
  sequential?: boolean;
  blockId?: string;
};

const AssessmentSequenceInner = forwardRef<CompoundHandle, AssessmentSequenceProps>(
  function AssessmentSequenceInner(props, ref) {
    const sequential = props.sequential !== false;
    const childArray = React.Children.toArray(props.children).filter(React.isValidElement);
    const { index, setIndex, goNext, goPrev, progress } = useCompoundNavigation(childArray.length, 0);
    const ctx = useCompoundRegistry();
    const { config } = useLessonkit();
    const compoundId = props.blockId ?? "assessment-sequence";

    useCompoundResume({
      courseId: config.courseId,
      compoundId,
      enabled: config.session?.persistCompoundState !== false,
      onResume: (state) => setIndex(state.activePageIndex),
    });

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
          <button type="button" data-testid="sequence-prev" disabled={index === 0} onClick={goPrev}>
            Previous
          </button>
          <button
            type="button"
            data-testid="sequence-next"
            disabled={index >= childArray.length - 1}
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
    const [index, setIndex] = useState(0);
    const setIndexStable = useCallback((i: number) => setIndex(i), []);

    return (
      <CompoundProvider activePageIndex={index} onActivePageIndexChange={setIndexStable}>
        <AssessmentSequenceInner {...props} ref={ref} />
      </CompoundProvider>
    );
  },
);

setLessonkitBlockType(AssessmentSequence, "AssessmentSequence");
