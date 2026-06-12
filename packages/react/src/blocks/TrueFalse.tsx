import { visuallyHiddenStyle } from "@lessonkit/accessibility";
import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import {
  isTerminalAssessmentResumeState,
  readBooleanField,
  readBooleanStateField,
  readNumberField,
  restoreCompletedRefFromResumeState,
  shouldReplayAssessmentComplete,
} from "../assessment/internal/resumeState";
import { shouldReplayResumeTelemetry } from "../assessment/shouldReplayResumeTelemetry";
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
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [selectionCorrect, setSelectionCorrect] = useState<boolean | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);
  const [passed, setPassed] = useState(false);
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const [completedMaxScore, setCompletedMaxScore] = useState<number | null>(null);
  const completedRef = useRef(false);
  const telemetryReplayedRef = useRef(false);
  const questionId = React.useId();

  const reset = () => {
    completedRef.current = false;
    telemetryReplayedRef.current = false;
    setPassed(false);
    setSelected(null);
    setAnswerCorrect(null);
    setSelectionCorrect(null);
    setShowSolutions(false);
    setCompletedScore(null);
    setCompletedMaxScore(null);
  };

  useEffect(() => {
    reset();
  }, [checkId, props.answer, props.question, config.courseId, enclosingLessonId]);

  const resolveScores = () => {
    const maxScore = completedMaxScore ?? 1;
    if (passed) {
      return { score: completedScore ?? maxScore, maxScore };
    }
    if (selected !== null && selectionCorrect) {
      return { score: completedMaxScore ?? maxScore, maxScore };
    }
    return { score: 0, maxScore };
  };

  const replayTelemetry = (
    nextSelected: boolean | null,
    nextCorrect: boolean | null,
    nextPassed: boolean,
    nextScore: number,
    nextMaxScore: number,
  ) => {
    if (telemetryReplayedRef.current) return;
    telemetryReplayedRef.current = true;
    if (nextSelected !== null) {
      assessment.answer({
        checkId,
        interactionType: INTERACTION,
        question: props.question,
        response: nextSelected,
        correct: nextCorrect ?? false,
      });
    }
    if (shouldReplayAssessmentComplete(nextPassed, props.enableRetry)) {
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: nextScore,
        maxScore: nextMaxScore,
        passingScore: props.passingScore ?? nextMaxScore,
      });
    }
  };

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => resolveScores().score,
        getMaxScore: () => resolveScores().maxScore,
        getAnswerGiven: () => selected !== null,
        resetTask: reset,
        showSolutions: () => setShowSolutions(true),
        getXAPIData: () => {
          const { score, maxScore } = resolveScores();
          return {
            checkId,
            interactionType: INTERACTION,
            response: selected ?? undefined,
            correct: answerCorrect ?? undefined,
            score,
            maxScore,
          };
        },
        getCurrentState: () => ({
          selected,
          answerCorrect,
          selectionCorrect,
          passed,
          showSolutions,
          completedScore,
          completedMaxScore,
          completed: completedRef.current,
        }),
        resume: (state) => {
          const nextSelected = readBooleanField(state, "selected");
          if (nextSelected === true || nextSelected === false || nextSelected === null) {
            setSelected(nextSelected);
          }
          const nextAnswerCorrect = readBooleanField(state, "answerCorrect");
          if (nextAnswerCorrect === true || nextAnswerCorrect === false || nextAnswerCorrect === null) {
            setAnswerCorrect(nextAnswerCorrect);
          }
          const nextCorrect = readBooleanField(state, "selectionCorrect");
          if (nextCorrect === true || nextCorrect === false || nextCorrect === null) {
            setSelectionCorrect(nextCorrect);
          }
          const nextCompletedScore = readNumberField(state, "completedScore");
          if (typeof nextCompletedScore === "number") setCompletedScore(nextCompletedScore);
          const nextCompletedMaxScore = readNumberField(state, "completedMaxScore");
          if (typeof nextCompletedMaxScore === "number") setCompletedMaxScore(nextCompletedMaxScore);
          const nextPassed = readBooleanField(state, "passed");
          if (nextPassed === true || nextPassed === false) {
            setPassed(nextPassed);
          }
          readBooleanStateField(state, "showSolutions", setShowSolutions);
          restoreCompletedRefFromResumeState(completedRef, state, {
            enableRetry: props.enableRetry,
          });
          if (
            shouldReplayResumeTelemetry(config) &&
            isTerminalAssessmentResumeState(state, props.enableRetry) &&
            !telemetryReplayedRef.current
          ) {
            const maxScore = nextCompletedMaxScore ?? completedMaxScore ?? 1;
            const score =
              nextPassed === true
                ? (nextCompletedScore ?? completedScore ?? maxScore)
                : (nextCompletedScore ?? 0);
            const replayCorrect =
              nextAnswerCorrect ??
              (nextSelected === true || nextSelected === false
                ? nextSelected === props.answer
                : null);
            replayTelemetry(
              nextSelected ?? null,
              replayCorrect,
              nextPassed === true,
              score,
              maxScore,
            );
          }
        },
      }),
    [
      answerCorrect,
      assessment,
      checkId,
      completedMaxScore,
      completedScore,
      passed,
      props.answer,
      props.passingScore,
      props.question,
      selected,
      selectionCorrect,
      showSolutions,
      config,
    ],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const submit = (value: boolean) => {
    if (passed && !props.enableRetry) return;
    setSelected(value);
    const correct = value === props.answer;
    const scored = scoreResponse(value, correct, 1, props.passingScore);
    setAnswerCorrect(correct);
    setSelectionCorrect(scored.passed);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      question: props.question,
      response: value,
      correct,
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
    } else if (!scored.passed && props.enableRetry === false && !completedRef.current) {
      completedRef.current = true;
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
        <legend style={visuallyHiddenStyle}>True or False</legend>
        <label className="lk-quiz-choice">
          <input
            type="radio"
            name={`${questionId}-tf`}
            checked={selected === true}
            disabled={passed && !props.enableRetry}
            onChange={() => submit(true)}
          />
          True
        </label>
        <label className="lk-quiz-choice">
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
