import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanStateField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { meetsPassingThreshold } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { setLessonkitBlockType } from "../compound/blockType";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type SummaryProps = AssessmentBaseProps & {
  statements: string[];
  /** Ordered correct summary statements. */
  correct: string[];
};

const INTERACTION: AssessmentInteractionType = "summary";

function SummaryInner(
  props: SummaryProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [passed, setPassed] = useState(false);
  const [checked, setChecked] = useState(false);
  const completedRef = useRef(false);
  const telemetryReplayedRef = useRef(false);

  const correctKey = props.correct.join("\0");
  const statementsKey = props.statements.join("\0");

  const selected = selectedIndices.map((i) => props.statements[i] ?? "");

  const reset = () => {
    completedRef.current = false;
    telemetryReplayedRef.current = false;
    setSelectedIndices([]);
    setPassed(false);
    setChecked(false);
  };

  useEffect(() => {
    reset();
  }, [checkId, correctKey, statementsKey]);

  const isCorrect =
    selected.length === props.correct.length &&
    selected.every((s, i) => s === props.correct[i]);
  const maxScore = props.correct.length || 1;
  const score = isCorrect ? maxScore : 0;
  const passedThreshold = meetsPassingThreshold(score, maxScore, props.passingScore);
  const availableIndices = props.statements
    .map((_, i) => i)
    .filter((i) => !selectedIndices.includes(i));

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => (passed ? score : 0),
        getMaxScore: () => maxScore,
        getAnswerGiven: () => selectedIndices.length > 0,
        resetTask: reset,
        showSolutions: () => {},
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: selected,
          correct: passedThreshold,
          score: passed ? score : 0,
          maxScore,
        }),
        getCurrentState: () => ({ selectedIndices, passed, checked }),
        resume: (state) => {
          let nextIndices: number[] = [];
          if (Array.isArray(state.selectedIndices)) {
            nextIndices = [...(state.selectedIndices as number[])];
          } else if (Array.isArray(state.selected)) {
            const legacy = state.selected as string[];
            nextIndices = legacy
              .map((text) => props.statements.indexOf(text))
              .filter((i) => i >= 0);
          }
          setSelectedIndices(nextIndices);
          const nextSelected = nextIndices.map((i) => props.statements[i] ?? "");
          const nextIsCorrect =
            nextSelected.length === props.correct.length &&
            nextSelected.every((s, i) => s === props.correct[i]);
          const nextScore = nextIsCorrect ? maxScore : 0;
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            completedRef.current = value;
            if (value) {
              if (!telemetryReplayedRef.current) {
                telemetryReplayedRef.current = true;
                assessment.answer({
                  checkId,
                  interactionType: INTERACTION,
                  response: nextSelected,
                  correct: true,
                });
                assessment.complete({
                  checkId,
                  interactionType: INTERACTION,
                  score: nextScore,
                  maxScore,
                  passingScore: props.passingScore ?? maxScore,
                });
              }
            }
          });
          readBooleanStateField(state, "checked", setChecked);
        },
      }),
    [
      assessment,
      checkId,
      checked,
      maxScore,
      passed,
      passedThreshold,
      props.passingScore,
      props.statements,
      score,
      selected,
      selectedIndices.length,
    ],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const addStatement = (statementIndex: number) => {
    if (passed && !props.enableRetry) return;
    setChecked(false);
    setSelectedIndices((prev) => [...prev, statementIndex]);
  };

  const removeLast = () => {
    if (passed && !props.enableRetry) return;
    setChecked(false);
    setSelectedIndices((prev) => prev.slice(0, -1));
  };

  const check = () => {
    if (selectedIndices.length === 0) return;
    setChecked(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: selected,
      correct: passedThreshold,
    });
    if (passedThreshold && !completedRef.current) {
      completedRef.current = true;
      setPassed(true);
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score,
        maxScore,
        passingScore: props.passingScore ?? maxScore,
      });
    }
  };

  return (
    <section aria-label="Summary" data-lk-check-id={checkId} data-testid="summary">
      <p>Select statements in order to build the summary.</p>
      <ol data-testid="summary-selected">
        {selected.map((s, i) => (
          <li key={`${i}-${selectedIndices[i]}`}>{s}</li>
        ))}
      </ol>
      <div role="group" aria-label="Available statements">
        {availableIndices.map((statementIndex) => (
          <button
            key={statementIndex}
            type="button"
            data-testid={`summary-statement-${statementIndex}`}
            disabled={passed && !props.enableRetry}
            onClick={() => addStatement(statementIndex)}
            style={{ display: "block", margin: "0.25rem 0" }}
          >
            {props.statements[statementIndex]}
          </button>
        ))}
      </div>
      <button
        type="button"
        data-testid="summary-undo"
        disabled={(passed && !props.enableRetry) || selectedIndices.length === 0}
        onClick={removeLast}
      >
        Remove last
      </button>
      <button
        type="button"
        data-testid="summary-check"
        disabled={selectedIndices.length === 0 || (passed && !props.enableRetry)}
        onClick={check}
      >
        Check
      </button>
      {checked ? (
        <p role="status" aria-live="polite" data-testid="summary-feedback">
          {passedThreshold ? "Correct" : "Try again"}
        </p>
      ) : null}
      {props.enableRetry && passed ? (
        <button type="button" data-testid="summary-retry" onClick={reset}>
          Try again
        </button>
      ) : null}
    </section>
  );
}

const SummaryInnerForwarded = forwardRef(SummaryInner);

export const Summary = forwardRef<AssessmentHandle, SummaryProps>(function Summary(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="Summary" checkId={props.checkId}>
      {(lessonId) => <SummaryInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});

setLessonkitBlockType(Summary, "Summary");
