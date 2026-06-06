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

export type SequencingImage = {
  id: string;
  src: string;
  alt: string;
};

export type ImageSequencingProps = AssessmentBaseProps & {
  images: SequencingImage[];
  correctOrder: string[];
};

const INTERACTION: AssessmentInteractionType = "imageSequencing";

function ImageSequencingInner(
  props: ImageSequencingProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const imagesKey = props.images.map((i) => i.id).join("\0");
  const orderKey = props.correctOrder.join("\0");

  const [order, setOrder] = useState<string[]>(() => props.images.map((i) => i.id));
  const [passed, setPassed] = useState(false);
  const [checked, setChecked] = useState(false);
  const completedRef = useRef(false);
  const telemetryReplayedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    telemetryReplayedRef.current = false;
    setOrder(props.images.map((i) => i.id));
    setPassed(false);
    setChecked(false);
  };

  useEffect(() => {
    reset();
  }, [checkId, imagesKey, orderKey]);

  const isCorrect = order.every((id, i) => id === props.correctOrder[i]);
  const maxScore = props.correctOrder.length || 1;
  const score = isCorrect ? maxScore : 0;
  const passedThreshold = meetsPassingThreshold(score, maxScore, props.passingScore);

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
        getScore: () => (passed ? score : 0),
        getMaxScore: () => maxScore,
        getAnswerGiven: () => order.length > 0,
        resetTask: reset,
        showSolutions: () => {},
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: order,
          correct: passedThreshold,
          score: passed ? score : 0,
          maxScore,
        }),
        getCurrentState: () => ({ order, passed, checked }),
        resume: (state) => {
          let nextOrder = order;
          if (Array.isArray(state.order)) {
            nextOrder = [...(state.order as string[])];
            setOrder(nextOrder);
          }
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            completedRef.current = value;
            if (value && !telemetryReplayedRef.current) {
              telemetryReplayedRef.current = true;
              const nextIsCorrect = nextOrder.every((id, i) => id === props.correctOrder[i]);
              const nextScore = nextIsCorrect ? maxScore : 0;
              assessment.answer({
                checkId,
                interactionType: INTERACTION,
                response: nextOrder,
                correct: nextIsCorrect,
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
        },
      }),
    [checkId, checked, maxScore, order, passed, passedThreshold, score],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const check = () => {
    setChecked(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: order,
      correct: passedThreshold,
    });
    if (passedThreshold && !completedRef.current) {
      completedRef.current = true;
      setPassed(true);
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
    <section aria-label="Image Sequencing" data-lk-check-id={checkId} data-testid="image-sequencing">
      <p>Reorder the images into the correct sequence.</p>
      <ol data-testid="image-sequencing-list">
        {order.map((id, index) => {
          const image = props.images.find((i) => i.id === id);
          if (!image) return null;
          return (
            <li key={id} data-testid={`sequencing-item-${id}`}>
              <img src={image.src} alt={image.alt} style={{ maxWidth: "8rem", verticalAlign: "middle" }} />
              <button
                type="button"
                data-testid={`sequencing-up-${id}`}
                aria-label={`Move ${image.alt} up`}
                disabled={index === 0 || (passed && !props.enableRetry)}
                onClick={() => move(index, -1)}
              >
                Up
              </button>
              <button
                type="button"
                data-testid={`sequencing-down-${id}`}
                aria-label={`Move ${image.alt} down`}
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
        data-testid="image-sequencing-check"
        disabled={passed && !props.enableRetry}
        onClick={check}
      >
        Check
      </button>
      {checked ? (
        <p role="status" aria-live="polite" data-testid="image-sequencing-feedback">
          {passedThreshold ? "Correct" : "Try again"}
        </p>
      ) : null}
      {props.enableRetry && passed ? (
        <button type="button" data-testid="image-sequencing-retry" onClick={reset}>
          Try again
        </button>
      ) : null}
    </section>
  );
}

const ImageSequencingInnerForwarded = forwardRef(ImageSequencingInner);

export const ImageSequencing = forwardRef<AssessmentHandle, ImageSequencingProps>(
  function ImageSequencing(props, ref) {
    return (
      <AssessmentLessonGuard blockLabel="ImageSequencing" checkId={props.checkId}>
        {(lessonId) => (
          <ImageSequencingInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />
        )}
      </AssessmentLessonGuard>
    );
  },
);

setLessonkitBlockType(ImageSequencing, "ImageSequencing");
