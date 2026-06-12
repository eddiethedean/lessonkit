import React, { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import {
  readBooleanStateField,
  restoreCompletedRefFromResumeState,
  shouldReplayAssessmentComplete,
} from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { meetsPassingThreshold } from "../assessment/scoring";
import { shouldReplayResumeTelemetry } from "../assessment/shouldReplayResumeTelemetry";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type SortParagraphsProps = AssessmentBaseProps & {
  paragraphs: string[];
  /** Target order as paragraph indices (same length as paragraphs). */
  correctOrder: number[];
};

const INTERACTION: AssessmentInteractionType = "sortParagraphs";

function SortParagraphsInner(
  props: SortParagraphsProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const { config } = useLessonkit();
  const assessment = useAssessmentState(props.enclosingLessonId);
  const paragraphsKey = props.paragraphs.join("\0");
  const orderKey = props.correctOrder.join("\0");
  const liveRegionId = useId();

  const [order, setOrder] = useState<number[]>(() =>
    props.paragraphs.map((_, index) => index),
  );
  const [passed, setPassed] = useState(false);
  const [checked, setChecked] = useState(false);
  const completedRef = useRef(false);
  const telemetryReplayedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    telemetryReplayedRef.current = false;
    setOrder(props.paragraphs.map((_, index) => index));
    setPassed(false);
    setChecked(false);
  };

  useEffect(() => {
    reset();
  }, [checkId, paragraphsKey, orderKey]);

  const isCorrect =
    order.length === props.correctOrder.length &&
    order.every((value, index) => value === props.correctOrder[index]);
  const maxScore = props.correctOrder.length || 1;
  const score = isCorrect ? maxScore : 0;
  const passedThreshold = meetsPassingThreshold(score, maxScore, props.passingScore);

  const replayTelemetry = (
    nextOrder: number[],
    nextPassed: boolean,
    nextChecked: boolean,
    nextScore: number,
  ) => {
    if (telemetryReplayedRef.current || (!nextChecked && !nextPassed)) return;
    telemetryReplayedRef.current = true;
    const nextPassedThreshold = meetsPassingThreshold(
      nextScore,
      maxScore,
      props.passingScore,
    );
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: nextOrder.map(String),
      correct: nextPassedThreshold,
    });
    if (shouldReplayAssessmentComplete(nextPassedThreshold, props.enableRetry)) {
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: nextScore,
        maxScore,
        passingScore: props.passingScore ?? maxScore,
      });
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    if (passed && !props.enableRetry) return;
    setChecked(false);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
      return next;
    });
  };

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => score,
        getMaxScore: () => maxScore,
        getAnswerGiven: () => checked,
        resetTask: reset,
        showSolutions: () => {},
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: order.map(String),
          correct: passedThreshold,
          score,
          maxScore,
        }),
        getCurrentState: () => ({ order, passed, checked, completed: completedRef.current }),
        resume: (state) => {
          let nextOrder = order;
          if (Array.isArray(state.order)) {
            nextOrder = [...(state.order as number[])];
            setOrder(nextOrder);
          }
          let nextPassed = passed;
          readBooleanStateField(state, "passed", (value) => {
            nextPassed = value;
            setPassed(value);
          });
          let nextChecked = checked;
          readBooleanStateField(state, "checked", (value) => {
            nextChecked = value;
            setChecked(value);
          });
          restoreCompletedRefFromResumeState(completedRef, state, {
            enableRetry: props.enableRetry,
          });
          const nextIsCorrect =
            nextOrder.length === props.correctOrder.length &&
            nextOrder.every((v, i) => v === props.correctOrder[i]);
          const nextScore = nextIsCorrect ? maxScore : 0;
          if (shouldReplayResumeTelemetry(config)) {
            replayTelemetry(nextOrder, nextPassed, nextChecked, nextScore);
          }
        },
      }),
    [
      assessment,
      checkId,
      checked,
      config,
      maxScore,
      order,
      passed,
      passedThreshold,
      props.correctOrder,
      props.passingScore,
      score,
    ],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const check = () => {
    setChecked(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: order.map(String),
      correct: passedThreshold,
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
    <section aria-label="Sort the Paragraphs" data-lk-check-id={checkId} data-testid="sort-paragraphs">
      <p>Put the paragraphs in the correct order.</p>
      <p id={liveRegionId} role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
        {order.map((paragraphIndex, position) => `${position + 1}: ${props.paragraphs[paragraphIndex] ?? ""}`).join(". ")}
      </p>
      <ol data-testid="sort-paragraphs-list">
        {order.map((paragraphIndex, index) => {
          const text = props.paragraphs[paragraphIndex] ?? "";
          return (
            <li key={`${paragraphIndex}-${index}`} data-testid={`sort-item-${paragraphIndex}`}>
              <span>{text}</span>
              <button
                type="button"
                className="lk-button lk-button--icon"
                data-testid={`sort-up-${paragraphIndex}`}
                aria-label={`Move paragraph ${index + 1} up`}
                disabled={index === 0 || (passed && !props.enableRetry)}
                onClick={() => move(index, -1)}
              >
                Up
              </button>
              <button
                type="button"
                className="lk-button lk-button--icon"
                data-testid={`sort-down-${paragraphIndex}`}
                aria-label={`Move paragraph ${index + 1} down`}
                disabled={index >= order.length - 1 || (passed && !props.enableRetry)}
                onClick={() => move(index, 1)}
              >
                Down
              </button>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className="lk-button"
        data-testid="sort-paragraphs-check"
        disabled={!props.enableRetry && (passed || checked)}
        onClick={check}
      >
        Check
      </button>
      {checked ? (
        <p role="status" aria-live="polite" data-testid="sort-paragraphs-feedback">
          {passedThreshold ? "Correct" : "Try again"}
        </p>
      ) : null}
      {props.enableRetry && passed ? (
        <button type="button" data-testid="sort-paragraphs-retry" onClick={reset}>
          Try again
        </button>
      ) : null}
    </section>
  );
}

const SortParagraphsInnerForwarded = forwardRef(SortParagraphsInner);

export const SortParagraphs = forwardRef<AssessmentHandle, SortParagraphsProps>(
  function SortParagraphs(props, ref) {
    return (
      <AssessmentLessonGuard blockLabel="SortParagraphs" checkId={props.checkId}>
        {(lessonId) => (
          <SortParagraphsInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />
        )}
      </AssessmentLessonGuard>
    );
  },
);

setLessonkitBlockType(SortParagraphs, "SortParagraphs");
