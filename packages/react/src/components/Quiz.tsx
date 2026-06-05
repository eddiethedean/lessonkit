import React, { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { visuallyHiddenStyle } from "@lessonkit/accessibility";
import type { AssessmentHandle, LessonId } from "@lessonkit/core";
import type { McqAssessmentDescriptor } from "@lessonkit/lxpack";
import { AssessmentLessonGuard, resetAssessmentWarningsForTests } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanField, readBooleanStateField, readStringField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { usePluginScoring } from "../assessment/internal/usePluginScoring";
import { useQuizState } from "../hooks";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type QuizProps = McqAssessmentDescriptor;

function QuizInner(
  props: QuizProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const { enclosingLessonId } = props;
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const quiz = useQuizState(enclosingLessonId);
  const { getPluginScore, isChoiceCorrect } = usePluginScoring(checkId, enclosingLessonId);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectionCorrect, setSelectionCorrect] = useState<boolean | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const [completedMaxScore, setCompletedMaxScore] = useState<number | null>(null);
  const completedRef = useRef(false);
  const questionId = useId();
  const choicesKey = props.choices.join("\0");

  useEffect(() => {
    completedRef.current = false;
    setQuizPassed(false);
    setSelected(null);
    setSelectionCorrect(null);
    setCompletedScore(null);
    setCompletedMaxScore(null);
  }, [checkId, props.answer, props.question, choicesKey]);

  const passed = quizPassed;

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => {
          if (quizPassed) return completedScore ?? 1;
          if (selected === null) return 0;
          const maxScore = completedMaxScore ?? 1;
          return selectionCorrect ? maxScore : 0;
        },
        getMaxScore: () => completedMaxScore ?? 1,
        getAnswerGiven: () => selected !== null,
        resetTask: () => {
          completedRef.current = false;
          setQuizPassed(false);
          setSelected(null);
          setSelectionCorrect(null);
          setCompletedScore(null);
          setCompletedMaxScore(null);
        },
        showSolutions: () => {},
        getXAPIData: () => {
          const maxScore = completedMaxScore ?? 1;
          let score = 0;
          if (quizPassed && selected !== null) {
            score = completedScore ?? maxScore;
          } else if (selected !== null && selectionCorrect) {
            score = completedMaxScore ?? maxScore;
          }
          return {
            checkId,
            interactionType: "mcq" as const,
            response: selected ?? undefined,
            correct: selectionCorrect ?? undefined,
            score,
            maxScore,
          };
        },
        getCurrentState: () => ({ selected, selectionCorrect, quizPassed }),
        resume: (state) => {
          const nextSelected = readStringField(state, "selected");
          if (typeof nextSelected === "string" || nextSelected === null) setSelected(nextSelected);
          const nextCorrect = readBooleanField(state, "selectionCorrect");
          if (nextCorrect === true || nextCorrect === false || nextCorrect === null) {
            setSelectionCorrect(nextCorrect);
          }
          readBooleanStateField(state, "quizPassed", (value) => {
            setQuizPassed(value);
            completedRef.current = value;
          });
        },
      }),
    [checkId, completedMaxScore, completedScore, quizPassed, selected, selectionCorrect],
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
              disabled={passed}
              aria-invalid={selected === c && selectionCorrect === false ? true : undefined}
              onChange={() => {
                if (passed) return;
                setSelected(c);
                const custom = getPluginScore(c);
                const correct = isChoiceCorrect(c, props.answer, custom, props.passingScore);
                setSelectionCorrect(correct);
                quiz.answer({
                  checkId,
                  question: props.question,
                  choice: c,
                  correct,
                });
                if (correct && !completedRef.current) {
                  completedRef.current = true;
                  setQuizPassed(true);
                  const maxScore = custom?.maxScore ?? 1;
                  const score = custom?.score ?? maxScore;
                  setCompletedScore(score);
                  setCompletedMaxScore(maxScore);
                  quiz.complete({
                    checkId,
                    score,
                    maxScore,
                    passingScore: props.passingScore ?? maxScore,
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
  return (
    <Quiz
      checkId={props.checkId}
      question={props.question}
      choices={props.choices}
      answer={props.answer}
      passingScore={props.passingScore}
    />
  );
}

/** @internal Reset module warnings between tests. */
export function resetQuizWarningsForTests(): void {
  resetAssessmentWarningsForTests();
}
