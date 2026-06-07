import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanStateField, readStringField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { shouldReplayResumeTelemetry } from "../assessment/shouldReplayResumeTelemetry";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type EssayProps = AssessmentBaseProps & {
  question: string;
  minLength?: number;
};

const INTERACTION: AssessmentInteractionType = "essay";

function EssayInner(
  props: EssayProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const { config } = useLessonkit();
  const assessment = useAssessmentState(props.enclosingLessonId);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const completedRef = useRef(false);
  const telemetryReplayedRef = useRef(false);
  const questionId = React.useId();

  const minLength = props.minLength ?? 0;
  const meetsMinLength = text.trim().length >= minLength;

  const reset = () => {
    completedRef.current = false;
    telemetryReplayedRef.current = false;
    setText("");
    setSubmitted(false);
  };

  useEffect(() => {
    reset();
  }, [checkId, props.question, props.minLength]);

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => 0,
        getMaxScore: () => 1,
        getAnswerGiven: () => submitted && meetsMinLength,
        resetTask: reset,
        showSolutions: () => {},
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          question: props.question,
          response: text,
          score: 0,
          maxScore: 1,
        }),
        getCurrentState: () => ({ text, submitted }),
        resume: (state) => {
          const nextText = readStringField(state, "text");
          if (typeof nextText === "string") setText(nextText);
          readBooleanStateField(state, "submitted", (value) => {
            const textVal = typeof nextText === "string" ? nextText : text;
            const meetsMin = textVal.trim().length >= minLength;
            if (value && !meetsMin) {
              setSubmitted(false);
              completedRef.current = false;
              return;
            }
            setSubmitted(value);
            completedRef.current = value;
            if (
              value &&
              !telemetryReplayedRef.current &&
              shouldReplayResumeTelemetry(config)
            ) {
              telemetryReplayedRef.current = true;
              assessment.answer({
                checkId,
                interactionType: INTERACTION,
                question: props.question,
                response: textVal,
                correct: false,
              });
              assessment.complete({
                checkId,
                interactionType: INTERACTION,
                score: 0,
                maxScore: 1,
                passingScore: props.passingScore ?? 1,
              });
            }
          });
        },
      }),
    [assessment, checkId, config, meetsMinLength, minLength, props.passingScore, props.question, submitted, text],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const submit = () => {
    if (!meetsMinLength || (submitted && !props.enableRetry)) return;
    setSubmitted(true);
    if (!completedRef.current) {
      completedRef.current = true;
      assessment.answer({
        checkId,
        interactionType: INTERACTION,
        question: props.question,
        response: text,
        correct: false,
      });
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: 0,
        maxScore: 1,
        passingScore: props.passingScore ?? 1,
      });
    }
  };

  return (
    <section aria-label="Essay" data-lk-check-id={checkId} data-testid="essay">
      <p id={questionId}>{props.question}</p>
      <textarea
        aria-labelledby={questionId}
        data-testid="essay-textarea"
        value={text}
        disabled={submitted && !props.enableRetry}
        onChange={(e) => {
          if (submitted && !props.enableRetry) return;
          setSubmitted(false);
          completedRef.current = false;
          setText(e.target.value);
        }}
        rows={6}
        style={{ width: "100%" }}
      />
      {minLength > 0 ? (
        <p data-testid="essay-min-length">
          Minimum length: {minLength} characters ({text.trim().length}/{minLength})
        </p>
      ) : null}
      <button
        type="button"
        data-testid="essay-submit"
        disabled={!meetsMinLength || (submitted && !props.enableRetry)}
        onClick={submit}
      >
        Submit
      </button>
      {submitted ? (
        <p role="status" aria-live="polite" data-testid="essay-submitted">
          Response submitted for review.
        </p>
      ) : null}
      {props.enableRetry && submitted ? (
        <button type="button" data-testid="essay-retry" onClick={reset}>
          Try again
        </button>
      ) : null}
    </section>
  );
}

const EssayInnerForwarded = forwardRef(EssayInner);

export const Essay = forwardRef<AssessmentHandle, EssayProps>(function Essay(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="Essay" checkId={props.checkId}>
      {(lessonId) => <EssayInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});

setLessonkitBlockType(Essay, "Essay");
