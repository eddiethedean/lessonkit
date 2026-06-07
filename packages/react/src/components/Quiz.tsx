import React, { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { visuallyHiddenStyle } from "@lessonkit/accessibility";
import type { AssessmentHandle, LessonId } from "@lessonkit/core";
import type { McqAssessmentProps } from "@lessonkit/core";
import { AssessmentLessonGuard, resetAssessmentWarningsForTests } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import {
  readBooleanField,
  readNumberField,
  readStringField,
} from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { usePluginScoring } from "../assessment/internal/usePluginScoring";
import { useLessonkit, useQuizState } from "../hooks";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type QuizProps = McqAssessmentProps;

function QuizInner(
  props: QuizProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const { enclosingLessonId } = props;
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const quiz = useQuizState(enclosingLessonId);
  const { config } = useLessonkit();
  const { scoreResponse } = usePluginScoring(checkId, enclosingLessonId);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectionCorrect, setSelectionCorrect] = useState<boolean | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const [completedMaxScore, setCompletedMaxScore] = useState<number | null>(null);
  const completedRef = useRef(false);
  const telemetryReplayedRef = useRef(false);
  const questionId = useId();
  const choicesKey = props.choices.join("\0");

  useEffect(() => {
    completedRef.current = false;
    telemetryReplayedRef.current = false;
    setQuizPassed(false);
    setSelected(null);
    setSelectionCorrect(null);
    setCompletedScore(null);
    setCompletedMaxScore(null);
  }, [checkId, props.answer, props.question, choicesKey]);

  const passed = quizPassed;

  const resolveScores = () => {
    const maxScore = completedMaxScore ?? 1;
    if (quizPassed) {
      return { score: completedScore ?? maxScore, maxScore };
    }
    if (selected !== null && selectionCorrect) {
      return { score: completedMaxScore ?? maxScore, maxScore };
    }
    return { score: 0, maxScore };
  };

  const replayTelemetry = (
    nextSelected: string | null,
    nextCorrect: boolean | null,
    nextPassed: boolean,
    nextScore: number,
    nextMaxScore: number,
  ) => {
    if (!nextPassed || telemetryReplayedRef.current) return;
    telemetryReplayedRef.current = true;
    if (nextSelected !== null) {
      quiz.answer({
        checkId,
        question: props.question,
        choice: nextSelected,
        correct: nextCorrect ?? false,
      });
    }
    quiz.complete({
      checkId,
      score: nextScore,
      maxScore: nextMaxScore,
      passingScore: props.passingScore ?? nextMaxScore,
    });
  };

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => resolveScores().score,
        getMaxScore: () => resolveScores().maxScore,
        getAnswerGiven: () => selected !== null,
        resetTask: () => {
          completedRef.current = false;
          telemetryReplayedRef.current = false;
          setQuizPassed(false);
          setSelected(null);
          setSelectionCorrect(null);
          setCompletedScore(null);
          setCompletedMaxScore(null);
        },
        showSolutions: () => {},
        getXAPIData: () => {
          const { score, maxScore } = resolveScores();
          return {
            checkId,
            interactionType: "mcq" as const,
            response: selected ?? undefined,
            correct: selectionCorrect ?? undefined,
            score,
            maxScore,
          };
        },
        getCurrentState: () => ({
          selected,
          selectionCorrect,
          quizPassed,
          completedScore,
          completedMaxScore,
        }),
        resume: (state) => {
          const nextSelected = readStringField(state, "selected");
          if (typeof nextSelected === "string" || nextSelected === null) setSelected(nextSelected);
          const nextCorrect = readBooleanField(state, "selectionCorrect");
          if (nextCorrect === true || nextCorrect === false || nextCorrect === null) {
            setSelectionCorrect(nextCorrect);
          }
          const nextCompletedScore = readNumberField(state, "completedScore");
          if (typeof nextCompletedScore === "number") setCompletedScore(nextCompletedScore);
          const nextCompletedMaxScore = readNumberField(state, "completedMaxScore");
          if (typeof nextCompletedMaxScore === "number") setCompletedMaxScore(nextCompletedMaxScore);
          const nextPassed = readBooleanField(state, "quizPassed");
          if (nextPassed === true || nextPassed === false) {
            setQuizPassed(nextPassed);
            completedRef.current = nextPassed;
            if (nextPassed && config.tracking?.replayResumeEvents === true) {
              const maxScore = nextCompletedMaxScore ?? 1;
              const score = nextCompletedScore ?? (nextPassed ? maxScore : 0);
              replayTelemetry(
                nextSelected ?? null,
                nextCorrect ?? null,
                nextPassed,
                score,
                maxScore,
              );
            }
          }
        },
      }),
    [
      checkId,
      completedMaxScore,
      completedScore,
      config.tracking?.replayResumeEvents,
      props.passingScore,
      props.question,
      quiz,
      quizPassed,
      selected,
      selectionCorrect,
    ],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  return (
    <section aria-label="Quiz" data-lk-check-id={checkId}>
      <p id={questionId}>{props.question}</p>
      <fieldset aria-labelledby={questionId}>
        <legend style={visuallyHiddenStyle}>Quiz choices</legend>
        {props.choices.map((c, i) => (
          <label key={`${questionId}-${i}`} style={{ display: "block" }}>
            <input
              type="radio"
              name={questionId}
              value={c}
              checked={selected === c}
              disabled={passed && !props.enableRetry}
              aria-invalid={selected === c && selectionCorrect === false ? true : undefined}
              onChange={() => {
                if (passed && !props.enableRetry) return;
                setSelected(c);
                const defaultCorrect = c === props.answer;
                const scored = scoreResponse(c, defaultCorrect, 1, props.passingScore);
                setSelectionCorrect(scored.passed);
                quiz.answer({
                  checkId,
                  question: props.question,
                  choice: c,
                  correct: scored.passed,
                });
                if (scored.passed && !completedRef.current) {
                  completedRef.current = true;
                  setQuizPassed(true);
                  setCompletedScore(scored.score);
                  setCompletedMaxScore(scored.maxScore);
                  quiz.complete({
                    checkId,
                    score: scored.score,
                    maxScore: scored.maxScore,
                    passingScore: props.passingScore ?? scored.maxScore,
                  });
                } else if (!scored.passed && props.enableRetry === false && !completedRef.current) {
                  completedRef.current = true;
                  setCompletedScore(scored.score);
                  setCompletedMaxScore(scored.maxScore);
                  quiz.complete({
                    checkId,
                    score: scored.score,
                    maxScore: scored.maxScore,
                    passingScore: props.passingScore ?? scored.maxScore,
                  });
                }
              }}
            />
            {c}
          </label>
        ))}
      </fieldset>
      {selected && selectionCorrect !== null ? (
        <p role="status" aria-live="polite">
          {selectionCorrect ? "Correct" : "Try again"}
        </p>
      ) : null}
      {props.enableRetry && passed ? (
        <button
          type="button"
          data-testid="quiz-retry"
          onClick={() => {
            completedRef.current = false;
            telemetryReplayedRef.current = false;
            setQuizPassed(false);
            setSelected(null);
            setSelectionCorrect(null);
            setCompletedScore(null);
            setCompletedMaxScore(null);
          }}
        >
          Try again
        </button>
      ) : null}
    </section>
  );
}

const QuizInnerForwarded = forwardRef(QuizInner);

export const Quiz = forwardRef<AssessmentHandle, QuizProps>(function Quiz(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="Quiz" checkId={props.checkId}>
      {(lessonId) => <QuizInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});

export function KnowledgeCheck(props: QuizProps) {
  return <Quiz {...props} />;
}

/** @internal Reset module warnings between tests. */
export function resetQuizWarningsForTests(): void {
  resetAssessmentWarningsForTests();
}
