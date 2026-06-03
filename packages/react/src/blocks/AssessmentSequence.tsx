import React, { useCallback, useMemo, useState } from "react";
import type { AssessmentBehaviour } from "@lessonkit/core";
import { AssessmentSequenceProvider } from "../assessment/AssessmentSequenceContext";

export type AssessmentSequenceProps = AssessmentBehaviour & {
  children: React.ReactNode;
  /** Show one child assessment at a time (Question Set). */
  sequential?: boolean;
};

export function AssessmentSequence(props: AssessmentSequenceProps) {
  const sequential = props.sequential !== false;
  const childArray = React.Children.toArray(props.children).filter(React.isValidElement);
  const [index, setIndex] = useState(0);
  const current = childArray[index] ?? null;

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, childArray.length - 1));
  }, [childArray.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const progress = useMemo(
    () => ({ current: index + 1, total: childArray.length }),
    [index, childArray.length],
  );

  if (!sequential) {
    return (
      <AssessmentSequenceProvider>
        <section aria-label="Assessment sequence">{props.children}</section>
      </AssessmentSequenceProvider>
    );
  }

  return (
    <AssessmentSequenceProvider>
      <section aria-label="Assessment sequence" data-testid="assessment-sequence">
        <p>
          Question {progress.current} of {progress.total}
        </p>
        <div data-testid="assessment-sequence-step">{current}</div>
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
    </AssessmentSequenceProvider>
  );
}
