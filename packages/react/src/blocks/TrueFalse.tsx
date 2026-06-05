import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanField, readBooleanStateField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { usePluginScoring } from "../assessment/internal/usePluginScoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { useLessonkit } from "../hooks";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type TrueFalseProps = AssessmentBaseProps & {
  question: string;
  answer: boolean;
};

const INTERACTION: AssessmentInteractionType = "trueFalse";

function TrueFalseInner(
  props: TrueFalseProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const { enclosingLessonId } = props;
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(enclosingLessonId);
  const { config } = useLessonkit();
  const { scoreResponse } = usePluginScoring(checkId, enclosingLessonId);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [selectionCorrect, setSelectionCorrect] = useState<boolean | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);
  const [passed, setPassed] = useState(false);
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const [completedMaxScore, setCompletedMaxScore] = useState<number | null>(null);
  const completedRef = useRef(false);
  const questionId = React.useId();

  const reset = () => {
    completedRef.current = false;
    setPassed(false);
    setSelected(null);
    setSelectionCorrect(null);
    setShowSolutions(false);
    setCompletedScore(null);
    setCompletedMaxScore(null);
  };

  useEffect(() => {
    reset();
  }, [checkId, props.answer, props.question, config.courseId, enclosingLessonId]);

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => {
          if (passed) return completedScore ?? 1;
          const maxScore = completedMaxScore ?? 1;
          return selectionCorrect ? maxScore : 0;
        },
        getMaxScore: () => completedMaxScore ?? 1,
        getAnswerGiven: () => selected !== null,
        resetTask: reset,
        showSolutions: () => setShowSolutions(true),
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: selected ?? undefined,
          correct: selectionCorrect ?? undefined,
          score: passed ? 1 : selectionCorrect ? 1 : 0,
          maxScore: 1,
        }),
        getCurrentState: () => ({ selected, selectionCorrect, passed, showSolutions }),
        resume: (state) => {
          const nextSelected = readBooleanField(state, "selected");
          if (nextSelected === true || nextSelected === false || nextSelected === null) {
            setSelected(nextSelected);
          }
          const nextCorrect = readBooleanField(state, "selectionCorrect");
          if (nextCorrect === true || nextCorrect === false || nextCorrect === null) {
            setSelectionCorrect(nextCorrect);
          }
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            completedRef.current = value;
          });
          readBooleanStateField(state, "showSolutions", setShowSolutions);
        },
      }),
    [checkId, completedMaxScore, completedScore, passed, props.answer, selected, selectionCorrect, showSolutions],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const submit = (value: boolean) => {
    if (passed && !props.enableRetry) return;
    setSelected(value);
    const correct = value === props.answer;
    const scored = scoreResponse(value, correct, 1, props.passingScore);
    setSelectionCorrect(scored.passed);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      question: props.question,
      response: value,
      correct: scored.passed,
    });
    if (scored.passed && !completedRef.current) {
      completedRef.current = true;
      setPassed(true);
      setCompletedScore(scored.score);
      setCompletedMaxScore(scored.maxScore);
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: scored.score,
        maxScore: scored.maxScore,
        passingScore: props.passingScore ?? scored.maxScore,
      });
    }
  };

  const reveal = showSolutions || (passed && props.enableSolutionsButton);

  return (
    <section aria-label="True or False" data-lk-check-id={checkId}>
      <p id={questionId}>{props.question}</p>
      <fieldset aria-labelledby={questionId}>
        <legend className="lk-visually-hidden">True or False</legend>
        <label style={{ display: "block", marginRight: "1rem" }}>
          <input
            type="radio"
            name={`${questionId}-tf`}
            checked={selected === true}
            disabled={passed && !props.enableRetry}
            onChange={() => submit(true)}
          />
          True
        </label>
        <label style={{ display: "block" }}>
          <input
            type="radio"
            name={`${questionId}-tf`}
            checked={selected === false}
            disabled={passed && !props.enableRetry}
            onChange={() => submit(false)}
          />
          False
        </label>
      </fieldset>
      {reveal ? (
        <p>
          Correct answer: <strong>{props.answer ? "True" : "False"}</strong>
        </p>
      ) : null}
      {selected !== null && selectionCorrect !== null ? (
        <p role="status" aria-live="polite">
          {selectionCorrect ? "Correct" : "Try again"}
        </p>
      ) : null}
      {props.enableRetry && passed ? (
        <button type="button" onClick={reset}>
          Try again
        </button>
      ) : null}
      {props.enableSolutionsButton && !reveal ? (
        <button type="button" onClick={() => setShowSolutions(true)}>
          Show solution
        </button>
      ) : null}
    </section>
  );
}

const TrueFalseInnerForwarded = forwardRef(TrueFalseInner);

export const TrueFalse = forwardRef<AssessmentHandle, TrueFalseProps>(function TrueFalse(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="TrueFalse" checkId={props.checkId}>
      {(lessonId) => <TrueFalseInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});
