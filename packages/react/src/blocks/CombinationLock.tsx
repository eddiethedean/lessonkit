import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import {
  readBooleanStateField,
  restoreCompletedRefFromResumeState,
} from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { meetsPassingThreshold } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { setLessonkitBlockType } from "../compound/blockType";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type CombinationLockProps = AssessmentBaseProps & {
  combination: string;
  label?: string;
};

const INTERACTION: AssessmentInteractionType = "combinationLock";

function emptyDigits(count: number): string[] {
  return Array(count).fill("");
}

function normalizeDigitInput(incoming: string): string {
  const digits = incoming.replace(/\D/g, "");
  return digits.length === 0 ? "" : digits.slice(-1);
}

function CombinationLockInner(
  props: CombinationLockProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const digitCount = props.combination.length;
  const [digits, setDigits] = useState<string[]>(() => emptyDigits(digitCount));
  const [passed, setPassed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const completedRef = useRef(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const reset = () => {
    completedRef.current = false;
    setPassed(false);
    setSubmitted(false);
    setShowSolutions(false);
    setDigits(emptyDigits(digitCount));
  };

  useEffect(() => {
    reset();
  }, [checkId, props.combination, digitCount]);

  const entry = digits.join("");
  const correct = entry === props.combination;
  const maxScore = 1;
  const score = correct && submitted ? 1 : 0;
  const passedThreshold = meetsPassingThreshold(score, maxScore, props.passingScore);
  const allDigitsFilled = digits.every((digit) => digit.length === 1);

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => (passed ? 1 : score),
        getMaxScore: () => maxScore,
        getAnswerGiven: () => submitted,
        resetTask: reset,
        showSolutions: () => setShowSolutions(true),
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: entry,
          correct: passedThreshold,
          score: passed ? 1 : score,
          maxScore,
        }),
        getCurrentState: () => ({
          digits,
          passed,
          submitted,
          showSolutions,
          completed: completedRef.current,
        }),
        resume: (state) => {
          const raw = state.digits;
          if (Array.isArray(raw)) {
            setDigits(
              Array.from({ length: digitCount }, (_, index) => {
                const value = raw[index];
                return typeof value === "string" ? normalizeDigitInput(value) : "";
              }),
            );
          }
          readBooleanStateField(state, "passed", setPassed);
          readBooleanStateField(state, "submitted", setSubmitted);
          readBooleanStateField(state, "showSolutions", setShowSolutions);
          restoreCompletedRefFromResumeState(completedRef, state, {
            enableRetry: props.enableRetry,
          });
        },
      }),
    [checkId, digitCount, digits, entry, passed, passedThreshold, score, submitted, showSolutions],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const setDigit = (index: number, value: string) => {
    const next = [...digits];
    next[index] = normalizeDigitInput(value);
    setDigits(next);
  };

  const focusDigit = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const check = () => {
    if (!allDigitsFilled) return;
    setSubmitted(true);
    const ok = digits.join("") === props.combination;
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: digits.join(""),
      correct: ok,
    });
    if ((ok || props.enableRetry === false) && !completedRef.current) {
      completedRef.current = true;
      if (ok) setPassed(true);
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: ok ? 1 : 0,
        maxScore: 1,
        passingScore: props.passingScore ?? 1,
      });
    }
  };

  return (
    <section
      aria-label={props.label ?? "Combination lock"}
      className="lk-combination-lock"
      data-lk-check-id={checkId}
      data-testid="combination-lock"
    >
      <p className="lk-combination-lock-label">{props.label ?? "Enter the combination"}</p>
      <p className="lk-combination-lock-hint" data-testid="combination-lock-hint">
        Enter each digit, then press Check.
      </p>
      <div className="lk-combination-lock-digits" role="group" aria-label="Lock digits">
        {digits.map((digit, index) => (
          <input
            key={`digit-${index}`}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            className="lk-combination-lock-digit"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={1}
            placeholder="0"
            value={showSolutions ? (props.combination[index] ?? digit) : digit}
            aria-label={`Digit ${index + 1}`}
            data-testid={`lock-digit-${index}`}
            disabled={passed && !props.enableRetry}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              const nextDigit = normalizeDigitInput(event.target.value);
              setDigit(index, event.target.value);
              if (nextDigit && index < digitCount - 1) {
                focusDigit(index + 1);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digits[index] && index > 0) {
                event.preventDefault();
                focusDigit(index - 1);
              }
            }}
          />
        ))}
      </div>
      <div className="lk-combination-lock-actions">
        <button
          type="button"
          data-testid="lock-check"
          disabled={!allDigitsFilled || (passed && !props.enableRetry)}
          onClick={check}
        >
          Check
        </button>
        {props.enableSolutionsButton ? (
          <button type="button" data-testid="lock-solutions" onClick={() => setShowSolutions(true)}>
            Show solution
          </button>
        ) : null}
      </div>
      {submitted ? (
        <p role="status" className="lk-combination-lock-feedback">
          {correct ? "Correct" : "Try again"}
        </p>
      ) : null}
    </section>
  );
}

const CombinationLockInnerForwarded = forwardRef(CombinationLockInner);

export const CombinationLock = forwardRef<AssessmentHandle, CombinationLockProps>(function CombinationLock(
  props,
  ref,
) {
  return (
    <AssessmentLessonGuard blockLabel="CombinationLock" checkId={props.checkId}>
      {(lessonId) => <CombinationLockInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});

setLessonkitBlockType(CombinationLock, "CombinationLock");
