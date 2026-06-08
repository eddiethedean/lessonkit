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

export type CombinationLockProps = AssessmentBaseProps & {
  combination: string;
  label?: string;
};

const INTERACTION: AssessmentInteractionType = "combinationLock";

function CombinationLockInner(
  props: CombinationLockProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const digitCount = props.combination.length;
  const [digits, setDigits] = useState<string[]>(() => Array(digitCount).fill("0"));
  const [passed, setPassed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const completedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    setPassed(false);
    setSubmitted(false);
    setShowSolutions(false);
    setDigits(Array(digitCount).fill("0"));
  };

  useEffect(() => {
    reset();
  }, [checkId, props.combination, digitCount]);

  const entry = digits.join("");
  const correct = entry === props.combination;
  const maxScore = 1;
  const score = correct && submitted ? 1 : 0;
  const passedThreshold = meetsPassingThreshold(score, maxScore, props.passingScore);

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
        getCurrentState: () => ({ digits, passed, submitted, showSolutions }),
        resume: (state) => {
          const raw = state.digits;
          if (Array.isArray(raw)) {
            setDigits(raw.map((d) => (typeof d === "string" ? d : "0")).slice(0, digitCount));
          }
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            completedRef.current = value;
          });
          readBooleanStateField(state, "submitted", setSubmitted);
          readBooleanStateField(state, "showSolutions", setShowSolutions);
        },
      }),
    [checkId, digitCount, digits, entry, passed, passedThreshold, score, submitted, showSolutions],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const setDigit = (index: number, value: string) => {
    const next = [...digits];
    next[index] = value.slice(-1) || "0";
    setDigits(next);
  };

  const check = () => {
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
    <section aria-label={props.label ?? "Combination lock"} data-lk-check-id={checkId} data-testid="combination-lock">
      <p>{props.label ?? "Enter the combination"}</p>
      <div role="group" aria-label="Lock digits">
        {digits.map((digit, index) => (
          <input
            key={`digit-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={showSolutions ? props.combination[index] ?? digit : digit}
            aria-label={`Digit ${index + 1}`}
            data-testid={`lock-digit-${index}`}
            disabled={passed && !props.enableRetry}
            onChange={(event) => setDigit(index, event.target.value.replace(/\D/g, ""))}
          />
        ))}
      </div>
      <button type="button" data-testid="lock-check" disabled={passed && !props.enableRetry} onClick={check}>
        Check
      </button>
      {props.enableSolutionsButton ? (
        <button type="button" data-testid="lock-solutions" onClick={() => setShowSolutions(true)}>
          Show solution
        </button>
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
