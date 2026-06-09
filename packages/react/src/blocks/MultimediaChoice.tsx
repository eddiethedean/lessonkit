import React, { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { visuallyHiddenStyle } from "@lessonkit/accessibility";
import type { AssessmentBaseProps, AssessmentHandle } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanStateField, readStringField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { usePluginScoring } from "../assessment/internal/usePluginScoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { isDevEnvironment, normalizeComponentId } from "../runtime/validateComponentId";
import { resolveMediaSrc } from "./embedSecurity";

export type MultimediaChoiceOption = {
  label: string;
  mediaUrl: string;
  mediaKind: "image" | "audio";
  altText: string;
};

export type MultimediaChoiceProps = AssessmentBaseProps & {
  question: string;
  choices: MultimediaChoiceOption[];
  answer: string;
};

function validateChoices(choices: MultimediaChoiceOption[]): void {
  if (!isDevEnvironment()) return;
  for (const choice of choices) {
    if (!choice.label.trim() || !choice.altText.trim()) {
      throw new Error("[lessonkit] <MultimediaChoice> choices require non-empty label and altText");
    }
  }
}

function MultimediaChoiceInner(
  props: MultimediaChoiceProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  validateChoices(props.choices);
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const { config } = useLessonkit();
  const mediaOptions = { allowedHosts: config.embed?.allowedHosts };
  const assessment = useAssessmentState(props.enclosingLessonId);
  const { scoreResponse } = usePluginScoring(checkId, props.enclosingLessonId);
  const questionId = useId();
  const choicesKey = props.choices.map((c) => `${c.label}\0${c.mediaUrl}`).join("\n");
  const [selected, setSelected] = useState<string | null>(null);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [selectionPassed, setSelectionPassed] = useState<boolean | null>(null);
  const [passed, setPassed] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    setPassed(false);
    setSelected(null);
    setAnswerCorrect(null);
    setSelectionPassed(null);
  }, [checkId, props.answer, props.question, choicesKey]);

  const resolveScores = () => {
    const maxScore = 1;
    if (passed) return { score: maxScore, maxScore };
    if (selected !== null && selectionPassed) return { score: maxScore, maxScore };
    return { score: 0, maxScore };
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
          setPassed(false);
          setSelected(null);
          setAnswerCorrect(null);
          setSelectionPassed(null);
        },
        showSolutions: () => {},
        getXAPIData: () => {
          const { score, maxScore } = resolveScores();
          return {
            checkId,
            interactionType: "mcq" as const,
            response: selected ?? undefined,
            correct: answerCorrect ?? undefined,
            score,
            maxScore,
          };
        },
        getCurrentState: () => ({ selected, answerCorrect, selectionPassed, passed }),
        resume: (state) => {
          const nextSelected = readStringField(state, "selected");
          if (typeof nextSelected === "string" || nextSelected === null) setSelected(nextSelected);
          readBooleanStateField(state, "answerCorrect", setAnswerCorrect);
          readBooleanStateField(state, "selectionPassed", setSelectionPassed);
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            completedRef.current = value;
          });
        },
      }),
    [answerCorrect, checkId, passed, props.passingScore, selected, selectionPassed],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const selectChoice = (label: string) => {
    if (passed && !props.enableRetry) return;
    setSelected(label);
    const defaultCorrect = label === props.answer;
    const scored = scoreResponse(label, defaultCorrect, 1, props.passingScore);
    setAnswerCorrect(defaultCorrect);
    setSelectionPassed(scored.passed);
    assessment.answer({
      checkId,
      interactionType: "mcq",
      response: label,
      correct: defaultCorrect,
    });
    if (scored.passed && !completedRef.current) {
      completedRef.current = true;
      setPassed(true);
      assessment.complete({
        checkId,
        interactionType: "mcq",
        score: scored.score,
        maxScore: scored.maxScore,
        passingScore: props.passingScore ?? scored.maxScore,
      });
    } else if (!scored.passed && props.enableRetry === false && !completedRef.current) {
      completedRef.current = true;
      assessment.complete({
        checkId,
        interactionType: "mcq",
        score: scored.score,
        maxScore: scored.maxScore,
        passingScore: props.passingScore ?? scored.maxScore,
      });
    }
  };

  return (
    <section aria-label="Multimedia Choice" data-lk-check-id={checkId} data-testid="multimedia-choice">
      <p id={questionId}>{props.question}</p>
      <fieldset aria-labelledby={questionId}>
        <legend style={visuallyHiddenStyle}>Multimedia choices</legend>
        {props.choices.map((choice) => {
          const resolved = resolveMediaSrc(choice.mediaUrl, mediaOptions);
          return (
            <label key={choice.label} style={{ display: "block" }} data-testid={`multimedia-choice-${choice.label}`}>
              <input
                type="radio"
                name={questionId}
                value={choice.label}
                checked={selected === choice.label}
                disabled={passed && !props.enableRetry}
                onChange={() => selectChoice(choice.label)}
              />
              <span>{choice.label}</span>
              {choice.mediaKind === "image" && resolved ? (
                <img src={resolved} alt={choice.altText} style={{ display: "block", maxWidth: "12rem" }} />
              ) : null}
              {choice.mediaKind === "audio" && resolved ? (
                <audio controls src={resolved} aria-label={choice.altText} />
              ) : null}
            </label>
          );
        })}
      </fieldset>
      {selected && answerCorrect !== null ? (
        <p role="status" aria-live="polite" data-testid="multimedia-choice-feedback">
          {answerCorrect ? "Correct" : "Try again"}
        </p>
      ) : null}
      {props.enableRetry && passed ? (
        <button
          type="button"
          data-testid="multimedia-choice-retry"
          onClick={() => {
            completedRef.current = false;
            setPassed(false);
            setSelected(null);
            setAnswerCorrect(null);
            setSelectionPassed(null);
          }}
        >
          Try again
        </button>
      ) : null}
    </section>
  );
}

const MultimediaChoiceInnerForwarded = forwardRef(MultimediaChoiceInner);

export const MultimediaChoice = forwardRef<AssessmentHandle, MultimediaChoiceProps>(
  function MultimediaChoice(props, ref) {
    return (
      <AssessmentLessonGuard blockLabel="MultimediaChoice" checkId={props.checkId}>
        {(lessonId) => (
          <MultimediaChoiceInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />
        )}
      </AssessmentLessonGuard>
    );
  },
);

setLessonkitBlockType(MultimediaChoice, "MultimediaChoice");
