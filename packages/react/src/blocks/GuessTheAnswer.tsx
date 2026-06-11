import React, { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { visuallyHiddenStyle } from "@lessonkit/accessibility";
import type { AssessmentBehaviour, AssessmentHandle, AssessmentInteractionType, CheckId, LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import {
  readBooleanStateField,
  readStringField,
  restoreCompletedRefFromResumeState,
} from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { meetsPassingThreshold } from "../assessment/scoring";
import { shouldReplayResumeTelemetry } from "../assessment/shouldReplayResumeTelemetry";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type GuessTheAnswerProps = AssessmentBehaviour & {
  prompt: string;
  answer: string;
  /** When false, reveal-only content with no scoring or checkId requirement. Default true. */
  scored?: boolean;
  checkId?: CheckId;
  passingScore?: number;
};

const INTERACTION: AssessmentInteractionType = "guessTheAnswer";

function normalizeGuess(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function GuessTheAnswerScoredInner(
  props: GuessTheAnswerProps & { checkId: CheckId; enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const { config } = useLessonkit();
  const assessment = useAssessmentState(props.enclosingLessonId);
  const answerKey = props.answer;
  const promptId = useId();
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [passed, setPassed] = useState(false);
  const completedRef = useRef(false);
  const telemetryReplayedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    telemetryReplayedRef.current = false;
    setGuess("");
    setRevealed(false);
    setChecked(false);
    setPassed(false);
  };

  useEffect(() => {
    reset();
  }, [checkId, answerKey, props.prompt]);

  const isCorrect = normalizeGuess(guess) === normalizeGuess(props.answer);
  const maxScore = 1;
  const score = isCorrect ? maxScore : 0;
  const passedThreshold = meetsPassingThreshold(score, maxScore, props.passingScore);

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => (checked ? score : 0),
        getMaxScore: () => maxScore,
        getAnswerGiven: () => checked || revealed,
        resetTask: reset,
        showSolutions: () => setRevealed(true),
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: guess,
          correct: checked ? isCorrect : undefined,
          score: checked ? score : undefined,
          maxScore,
        }),
        getCurrentState: () => ({ guess, revealed, checked, passed, completed: completedRef.current }),
        resume: (state) => {
          const nextGuess = readStringField(state, "guess");
          if (typeof nextGuess === "string") setGuess(nextGuess);
          readBooleanStateField(state, "revealed", setRevealed);
          readBooleanStateField(state, "checked", setChecked);
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            if (value && !telemetryReplayedRef.current && shouldReplayResumeTelemetry(config)) {
              telemetryReplayedRef.current = true;
              const replayGuess = readStringField(state, "guess") ?? guess;
              const nextCorrect = normalizeGuess(replayGuess) === normalizeGuess(props.answer);
              assessment.answer({
                checkId,
                interactionType: INTERACTION,
                response: replayGuess,
                correct: nextCorrect,
              });
              assessment.complete({
                checkId,
                interactionType: INTERACTION,
                score: nextCorrect ? maxScore : 0,
                maxScore,
                passingScore: props.passingScore ?? maxScore,
              });
            }
          });
          restoreCompletedRefFromResumeState(completedRef, state, {
            enableRetry: props.enableRetry,
          });
        },
      }),
    [assessment, checkId, checked, config, guess, isCorrect, passed, props.answer, props.passingScore, revealed, score],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const check = () => {
    setChecked(true);
    setRevealed(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: guess,
      correct: isCorrect,
    });
    if ((passedThreshold || props.enableRetry === false) && !completedRef.current) {
      completedRef.current = true;
      if (passedThreshold) setPassed(true);
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
    <section aria-label="Guess the Answer" data-lk-check-id={checkId} data-testid="guess-the-answer">
      <p id={promptId}>{props.prompt}</p>
      <label htmlFor={`${promptId}-guess`}>
        <span style={visuallyHiddenStyle}>Your guess</span>
        <input
          id={`${promptId}-guess`}
          type="text"
          value={guess}
          disabled={(passed && !props.enableRetry) || revealed}
          data-testid="guess-input"
          onChange={(event) => setGuess(event.target.value)}
        />
      </label>
      <button
        type="button"
        className="lk-button"
        data-testid="guess-check"
        disabled={(!props.enableRetry && (passed || checked)) || !guess.trim()}
        onClick={check}
      >
        Check
      </button>
      {props.enableSolutionsButton ? (
        <button
          type="button"
          className="lk-button"
          data-testid="guess-reveal"
          onClick={() => setRevealed(true)}
        >
          Show answer
        </button>
      ) : null}
      {revealed ? (
        <p role="status" aria-live="polite" data-testid="guess-answer-reveal">
          Answer: {props.answer}
        </p>
      ) : null}
      {checked ? (
        <p role="status" aria-live="polite" data-testid="guess-feedback">
          {passedThreshold ? "Correct" : "Try again"}
        </p>
      ) : null}
      {props.enableRetry && passed ? (
        <button type="button" className="lk-button" data-testid="guess-retry" onClick={reset}>
          Try again
        </button>
      ) : null}
    </section>
  );
}

const GuessTheAnswerScoredInnerForwarded = forwardRef(GuessTheAnswerScoredInner);

function GuessTheAnswerUnscored(props: GuessTheAnswerProps) {
  const promptId = useId();
  const { track } = useLessonkit();
  const enclosingLessonId = useEnclosingLessonId();
  const [revealed, setRevealed] = useState(false);

  return (
    <section aria-label="Guess the Answer" data-testid="guess-the-answer-unscored">
      <p id={promptId}>{props.prompt}</p>
      <button
        type="button"
        className="lk-button"
        data-testid="guess-reveal-unscored"
        aria-expanded={revealed}
        onClick={() => {
          setRevealed(true);
          if (enclosingLessonId) {
            track("interaction", {
              lessonId: enclosingLessonId,
              action: "guess_the_answer_revealed",
            });
          }
        }}
      >
        Reveal answer
      </button>
      {revealed ? (
        <p role="status" aria-live="polite" data-testid="guess-answer-reveal-unscored">
          Answer: {props.answer}
        </p>
      ) : null}
    </section>
  );
}

export const GuessTheAnswer = forwardRef<AssessmentHandle, GuessTheAnswerProps>(
  function GuessTheAnswer(props, ref) {
    const scored = props.scored !== false;
    if (!scored) {
      return <GuessTheAnswerUnscored {...props} />;
    }
    if (!props.checkId) {
      throw new Error("[lessonkit] <GuessTheAnswer scored> requires checkId");
    }
    return (
      <AssessmentLessonGuard blockLabel="GuessTheAnswer" checkId={props.checkId}>
        {(lessonId) => (
          <GuessTheAnswerScoredInnerForwarded
            {...props}
            checkId={props.checkId!}
            enclosingLessonId={lessonId}
            ref={ref}
          />
        )}
      </AssessmentLessonGuard>
    );
  },
);

setLessonkitBlockType(GuessTheAnswer, "GuessTheAnswer");
