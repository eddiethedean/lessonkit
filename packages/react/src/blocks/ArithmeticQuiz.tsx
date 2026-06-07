import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanStateField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { meetsPassingThreshold } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { shouldReplayResumeTelemetry } from "../assessment/shouldReplayResumeTelemetry";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type ArithmeticProblem = {
  question: string;
  answer: string;
};

export type ArithmeticQuizProps = AssessmentBaseProps & {
  problems: ArithmeticProblem[];
  timeLimitSeconds?: number;
};

const INTERACTION: AssessmentInteractionType = "arithmeticQuiz";

function ArithmeticQuizInner(
  props: ArithmeticQuizProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const { config } = useLessonkit();
  const assessment = useAssessmentState(props.enclosingLessonId);
  const problemsKey = props.problems.map((p) => `${p.question}\0${p.answer}`).join("|");

  const [answers, setAnswers] = useState<Record<number, string>>(() =>
    Object.fromEntries(props.problems.map((_, i) => [i, ""])),
  );
  const [passed, setPassed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    props.timeLimitSeconds ?? null,
  );
  const completedRef = useRef(false);
  const telemetryReplayedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    telemetryReplayedRef.current = false;
    setAnswers(Object.fromEntries(props.problems.map((_, i) => [i, ""])));
    setPassed(false);
    setChecked(false);
    setTimeLeft(props.timeLimitSeconds ?? null);
  };

  useEffect(() => {
    reset();
  }, [checkId, problemsKey, props.timeLimitSeconds]);

  let score = 0;
  props.problems.forEach((p, i) => {
    if ((answers[i] ?? "").trim() === p.answer.trim()) score += 1;
  });
  const maxScore = props.problems.length || 1;
  const passedThreshold = meetsPassingThreshold(score, maxScore, props.passingScore);
  const allFilled = props.problems.every((_, i) => (answers[i] ?? "").trim().length > 0);

  const runCheck = useCallback(
    (force = false) => {
      if (!force && !allFilled) return;
      setChecked(true);
      assessment.answer({
        checkId,
        interactionType: INTERACTION,
        response: answers,
        correct: passedThreshold,
      });
      if ((passedThreshold || props.enableRetry === false) && !completedRef.current) {
        completedRef.current = true;
        setPassed(passedThreshold);
        assessment.complete({
          checkId,
          interactionType: INTERACTION,
          score,
          maxScore,
          passingScore: props.passingScore ?? maxScore,
        });
      }
    },
    [allFilled, answers, assessment, checkId, maxScore, passedThreshold, props.passingScore, score],
  );

  useEffect(() => {
    if (timeLeft === null || passed || checked) return;
    if (timeLeft <= 0) {
      runCheck(true);
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : t)), 1000);
    return () => window.clearTimeout(id);
  }, [checked, passed, runCheck, timeLeft]);

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => score,
        getMaxScore: () => maxScore,
        getAnswerGiven: () => allFilled,
        resetTask: reset,
        showSolutions: () => {},
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: answers,
          correct: passedThreshold,
          score,
          maxScore,
        }),
        getCurrentState: () => ({ answers, passed, checked, timeLeft }),
        resume: (state) => {
          const raw = state.answers;
          let nextAnswers = answers;
          if (raw && typeof raw === "object") {
            nextAnswers = { ...(raw as Record<number, string>) };
            setAnswers(nextAnswers);
          }
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            completedRef.current = value;
            if (
              value &&
              !telemetryReplayedRef.current &&
              shouldReplayResumeTelemetry(config)
            ) {
              telemetryReplayedRef.current = true;
              let nextScore = 0;
              props.problems.forEach((p, i) => {
                if ((nextAnswers[i] ?? "").trim() === p.answer.trim()) nextScore += 1;
              });
              const replayCorrect = nextScore >= (props.passingScore ?? maxScore);
              assessment.answer({
                checkId,
                interactionType: INTERACTION,
                response: nextAnswers,
                correct: replayCorrect,
              });
              assessment.complete({
                checkId,
                interactionType: INTERACTION,
                score: nextScore,
                maxScore,
                passingScore: props.passingScore ?? maxScore,
              });
            }
          });
          readBooleanStateField(state, "checked", setChecked);
          if (typeof state.timeLeft === "number") setTimeLeft(state.timeLeft);
        },
      }),
    [allFilled, answers, checkId, checked, config, maxScore, passed, passedThreshold, props.problems, props.passingScore, score, timeLeft],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const onInput = (index: number, value: string) => {
    if (passed && !props.enableRetry) return;
    setChecked(false);
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  return (
    <section aria-label="Arithmetic Quiz" data-lk-check-id={checkId} data-testid="arithmetic-quiz">
      {props.timeLimitSeconds ? (
        <p data-testid="arithmetic-timer" role="timer" aria-live="polite">
          Time left: {timeLeft ?? 0}s
        </p>
      ) : null}
      <ol data-testid="arithmetic-problems">
        {props.problems.map((problem, index) => (
          <li key={index}>
            <label htmlFor={`${checkId}-problem-${index}`}>{problem.question}</label>
            <input
              id={`${checkId}-problem-${index}`}
              type="text"
              inputMode="numeric"
              data-testid={`arithmetic-answer-${index}`}
              value={answers[index] ?? ""}
              disabled={passed && !props.enableRetry}
              onChange={(e) => onInput(index, e.target.value)}
            />
          </li>
        ))}
      </ol>
      <button
        type="button"
        data-testid="arithmetic-check"
        disabled={(!allFilled && timeLeft !== 0) || (passed && !props.enableRetry)}
        onClick={() => runCheck()}
      >
        Check
      </button>
      {checked ? (
        <p role="status" aria-live="polite" data-testid="arithmetic-feedback">
          {passedThreshold ? "Correct" : "Try again"} ({score}/{maxScore})
        </p>
      ) : null}
      {props.enableRetry && passed ? (
        <button type="button" data-testid="arithmetic-retry" onClick={reset}>
          Try again
        </button>
      ) : null}
    </section>
  );
}

const ArithmeticQuizInnerForwarded = forwardRef(ArithmeticQuizInner);

export const ArithmeticQuiz = forwardRef<AssessmentHandle, ArithmeticQuizProps>(
  function ArithmeticQuiz(props, ref) {
    return (
      <AssessmentLessonGuard blockLabel="ArithmeticQuiz" checkId={props.checkId}>
        {(lessonId) => (
          <ArithmeticQuizInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />
        )}
      </AssessmentLessonGuard>
    );
  },
);

setLessonkitBlockType(ArithmeticQuiz, "ArithmeticQuiz");
