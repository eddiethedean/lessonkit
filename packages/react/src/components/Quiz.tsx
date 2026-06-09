import React, { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { visuallyHiddenStyle } from "@lessonkit/accessibility";
import type { AssessmentHandle, LessonId } from "@lessonkit/core";
import type { McqAssessmentProps } from "@lessonkit/core";
import {
  isMultiSelectMcq,
  orderChoicesByIndices,
  resolveMcqCorrectAnswers,
  resolveMcqShuffleSeed,
  scoreMcqSelection,
  shuffleChoiceIndices,
} from "@lessonkit/core";
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
import { isDevEnvironment, normalizeComponentId } from "../runtime/validateComponentId";

export type QuizProps = McqAssessmentProps;

function readSelectedArray(state: Record<string, unknown>): string[] | undefined {
  const value = state.selected;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return undefined;
}

function readChoiceOrder(state: Record<string, unknown>): number[] | undefined {
  const value = state.choiceOrder;
  if (!Array.isArray(value)) return undefined;
  return value.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
}

function QuizInner(
  props: QuizProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const { enclosingLessonId } = props;
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const quiz = useQuizState(enclosingLessonId);
  const { config } = useLessonkit();
  const { scoreResponse } = usePluginScoring(checkId, enclosingLessonId);
  const multi = isMultiSelectMcq(props);
  const correctAnswers = useMemo(
    () => resolveMcqCorrectAnswers(props),
    [props.answer, props.answers],
  );
  const choicesKey = props.choices.join("\0");
  const shuffleKey = `${props.shuffleChoices ?? false}\0${String(props.shuffleSeed ?? checkId)}`;
  const defaultOrder = useMemo(
    () =>
      props.shuffleChoices
        ? shuffleChoiceIndices(props.choices.length, resolveMcqShuffleSeed({ ...props, checkId }))
        : props.choices.map((_, i) => i),
    [checkId, choicesKey, props.shuffleChoices, props.shuffleSeed, props.choices.length],
  );

  const [choiceOrder, setChoiceOrder] = useState<number[]>(defaultOrder);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [selectionPassed, setSelectionPassed] = useState<boolean | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const [completedMaxScore, setCompletedMaxScore] = useState<number | null>(null);
  const [feedbackAnnouncement, setFeedbackAnnouncement] = useState("");
  const completedRef = useRef(false);
  const telemetryReplayedRef = useRef(false);
  const questionId = useId();
  const feedbackRegionId = useId();

  const displayChoices = useMemo(
    () => orderChoicesByIndices(props.choices, choiceOrder),
    [choiceOrder, props.choices],
  );

  useEffect(() => {
    completedRef.current = false;
    telemetryReplayedRef.current = false;
    setQuizPassed(false);
    setSelected(null);
    setSelectedMulti([]);
    setChecked(false);
    setAnswerCorrect(null);
    setSelectionPassed(null);
    setCompletedScore(null);
    setCompletedMaxScore(null);
    setFeedbackAnnouncement("");
    setChoiceOrder(defaultOrder);
  }, [checkId, props.answer, props.question, choicesKey, shuffleKey, defaultOrder]);

  if (
    isDevEnvironment() &&
    props.choiceFeedback &&
    Object.keys(props.choiceFeedback).some((key) => !props.choices.includes(key))
  ) {
    console.warn(
      `[lessonkit] Quiz checkId="${checkId}": choiceFeedback keys must match choice labels.`,
    );
  }

  const passed = quizPassed;
  const currentSelection = multi ? selectedMulti : selected;

  const computeScore = () =>
    scoreMcqSelection(currentSelection, correctAnswers, multi, props.passingScore);

  const resolveScores = () => {
    const outcome = computeScore();
    const maxScore = completedMaxScore ?? outcome.maxScore;
    if (quizPassed) {
      return { score: completedScore ?? maxScore, maxScore };
    }
    if (multi && checked && selectionPassed) {
      return { score: completedScore ?? outcome.score, maxScore };
    }
    if (!multi && selected !== null && selectionPassed) {
      return { score: completedScore ?? maxScore, maxScore };
    }
    return { score: 0, maxScore: outcome.maxScore };
  };

  const applyOutcome = (outcome: ReturnType<typeof scoreMcqSelection>, response: string | string[]) => {
    const factualCorrect = outcome.exactMatch && !outcome.hasWrongSelection;
    setAnswerCorrect(factualCorrect);
    setSelectionPassed(outcome.passedThreshold);
    quiz.answer({
      checkId,
      question: props.question,
      choice: Array.isArray(response) ? response.join(", ") : response,
      correct: factualCorrect,
    });
    if ((outcome.passedThreshold || props.enableRetry === false) && !completedRef.current) {
      completedRef.current = true;
      if (outcome.passedThreshold) setQuizPassed(true);
      setCompletedScore(outcome.score);
      setCompletedMaxScore(outcome.maxScore);
      quiz.complete({
        checkId,
        score: outcome.score,
        maxScore: outcome.maxScore,
        passingScore: props.passingScore ?? outcome.maxScore,
      });
    } else if (!outcome.passedThreshold && props.enableRetry === false && !completedRef.current) {
      completedRef.current = true;
      setCompletedScore(outcome.score);
      setCompletedMaxScore(outcome.maxScore);
      quiz.complete({
        checkId,
        score: outcome.score,
        maxScore: outcome.maxScore,
        passingScore: props.passingScore ?? outcome.maxScore,
      });
    }
  };

  const replayTelemetry = (
    response: string | string[] | null,
    nextCorrect: boolean | null,
    nextPassed: boolean,
    nextScore: number,
    nextMaxScore: number,
  ) => {
    if (telemetryReplayedRef.current || response === null) return;
    if (Array.isArray(response) && response.length === 0) return;
    telemetryReplayedRef.current = true;
    quiz.answer({
      checkId,
      question: props.question,
      choice: Array.isArray(response) ? response.join(", ") : response,
      correct: nextCorrect ?? false,
    });
    if (nextPassed || props.enableRetry === false) {
      quiz.complete({
        checkId,
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
        getAnswerGiven: () => (multi ? checked : selected !== null),
        resetTask: () => {
          completedRef.current = false;
          telemetryReplayedRef.current = false;
          setQuizPassed(false);
          setSelected(null);
          setSelectedMulti([]);
          setChecked(false);
          setAnswerCorrect(null);
          setSelectionPassed(null);
          setCompletedScore(null);
          setCompletedMaxScore(null);
          setFeedbackAnnouncement("");
          setChoiceOrder(defaultOrder);
        },
        showSolutions: () => {},
        getXAPIData: () => {
          const { score, maxScore } = resolveScores();
          const response = multi
            ? selectedMulti.length > 0
              ? selectedMulti
              : undefined
            : (selected ?? undefined);
          return {
            checkId,
            interactionType: "mcq" as const,
            response,
            correct: answerCorrect ?? undefined,
            score,
            maxScore,
          };
        },
        getCurrentState: () => ({
          selected: multi ? selectedMulti : selected,
          choiceOrder: props.shuffleChoices ? choiceOrder : undefined,
          checked,
          answerCorrect,
          selectionPassed,
          selectionCorrect: selectionPassed,
          quizPassed,
          completedScore,
          completedMaxScore,
        }),
        resume: (state) => {
          if (multi) {
            const nextMulti = readSelectedArray(state);
            if (nextMulti) setSelectedMulti(nextMulti);
          } else {
            const nextSelected = readStringField(state, "selected");
            if (typeof nextSelected === "string" || nextSelected === null) setSelected(nextSelected);
          }
          const nextOrder = readChoiceOrder(state);
          if (nextOrder && nextOrder.length === props.choices.length) setChoiceOrder(nextOrder);
          const nextChecked = readBooleanField(state, "checked");
          if (nextChecked === true || nextChecked === false) setChecked(nextChecked);
          const nextAnswerCorrect = readBooleanField(state, "answerCorrect");
          if (nextAnswerCorrect === true || nextAnswerCorrect === false || nextAnswerCorrect === null) {
            setAnswerCorrect(nextAnswerCorrect);
          }
          const nextSelectionPassed =
            readBooleanField(state, "selectionPassed") ??
            readBooleanField(state, "selectionCorrect");
          if (
            nextSelectionPassed === true ||
            nextSelectionPassed === false ||
            nextSelectionPassed === null
          ) {
            setSelectionPassed(nextSelectionPassed);
          }
          const nextCompletedScore = readNumberField(state, "completedScore");
          if (typeof nextCompletedScore === "number") setCompletedScore(nextCompletedScore);
          const nextCompletedMaxScore = readNumberField(state, "completedMaxScore");
          if (typeof nextCompletedMaxScore === "number") setCompletedMaxScore(nextCompletedMaxScore);
          const nextQuizPassed = readBooleanField(state, "quizPassed");
          if (nextQuizPassed === true || nextQuizPassed === false) {
            setQuizPassed(nextQuizPassed);
            completedRef.current =
              nextQuizPassed ||
              (multi
                ? nextChecked === true && props.enableRetry === false
                : Boolean(readStringField(state, "selected")) && props.enableRetry === false);
            if (config.tracking?.replayResumeEvents === true) {
              const response = multi
                ? readSelectedArray(state) ?? []
                : readStringField(state, "selected");
              const maxScore = nextCompletedMaxScore ?? computeScore().maxScore;
              const score = nextCompletedScore ?? (nextQuizPassed ? maxScore : 0);
              replayTelemetry(
                multi ? response ?? [] : response ?? null,
                nextAnswerCorrect ?? nextSelectionPassed ?? null,
                nextQuizPassed,
                score,
                maxScore,
              );
            }
          }
        },
      }),
    [
      answerCorrect,
      checkId,
      checked,
      choiceOrder,
      completedMaxScore,
      completedScore,
      config.tracking?.replayResumeEvents,
      defaultOrder,
      multi,
      props.choices.length,
      props.enableRetry,
      props.passingScore,
      props.question,
      props.shuffleChoices,
      quiz,
      quizPassed,
      selected,
      selectedMulti,
      selectionPassed,
    ],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const onSelectSingle = (choice: string) => {
    if (passed && !props.enableRetry) return;
    setSelected(choice);
    const outcome = scoreMcqSelection(choice, correctAnswers, false, props.passingScore);
    const scored = scoreResponse(
      choice,
      outcome.exactMatch && !outcome.hasWrongSelection,
      outcome.maxScore,
      props.passingScore,
    );
    const feedback = props.choiceFeedback?.[choice];
    if (feedback) setFeedbackAnnouncement(feedback);
    applyOutcome(
      {
        ...outcome,
        score: scored.score,
        maxScore: scored.maxScore,
        passedThreshold: scored.passed,
      },
      choice,
    );
  };

  const onToggleMulti = (choice: string) => {
    if (passed && !props.enableRetry) return;
    setChecked(false);
    setAnswerCorrect(null);
    setSelectionPassed(null);
    setSelectedMulti((prev) =>
      prev.includes(choice) ? prev.filter((c) => c !== choice) : [...prev, choice],
    );
    const feedback = props.choiceFeedback?.[choice];
    if (feedback) setFeedbackAnnouncement(feedback);
  };

  const onCheckMulti = () => {
    setChecked(true);
    applyOutcome(computeScore(), selectedMulti);
  };

  return (
    <section aria-label="Quiz" data-lk-check-id={checkId} data-testid="quiz">
      <p id={questionId}>{props.question}</p>
      {feedbackAnnouncement ? (
        <p
          id={feedbackRegionId}
          role="status"
          aria-live="polite"
          data-testid="quiz-choice-feedback"
        >
          {feedbackAnnouncement}
        </p>
      ) : null}
      <fieldset aria-labelledby={questionId}>
        <legend style={visuallyHiddenStyle}>
          {multi ? "Quiz choices — select all that apply" : "Quiz choices"}
        </legend>
        {displayChoices.map((c, i) => (
          <label key={`${questionId}-${choiceOrder[i] ?? i}-${c}`} style={{ display: "block" }}>
            <input
              type={multi ? "checkbox" : "radio"}
              name={multi ? `${questionId}-${c}` : questionId}
              value={c}
              checked={multi ? selectedMulti.includes(c) : selected === c}
              disabled={passed && !props.enableRetry}
              aria-invalid={
                !multi && selected === c && answerCorrect === false ? true : undefined
              }
              onChange={() => (multi ? onToggleMulti(c) : onSelectSingle(c))}
            />
            {c}
          </label>
        ))}
      </fieldset>
      {multi ? (
        <button
          type="button"
          data-testid="quiz-check"
          disabled={(passed && !props.enableRetry) || selectedMulti.length === 0}
          onClick={onCheckMulti}
        >
          Check
        </button>
      ) : null}
      {(multi ? checked : selected !== null) && answerCorrect !== null ? (
        <p role="status" aria-live="polite" data-testid="quiz-feedback">
          {answerCorrect ? "Correct" : "Try again"}
        </p>
      ) : null}
      {props.enableRetry && passed ? (
        <button
          type="button"
          data-testid="quiz-retry"
          onClick={() => handle.resetTask()}
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
