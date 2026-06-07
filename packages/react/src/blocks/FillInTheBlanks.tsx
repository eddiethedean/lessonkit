import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { parseStarDelimitedTemplate } from "../assessment/internal/parseStarDelimitedTemplate";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanStateField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { meetsPassingThreshold } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { useLessonkit } from "../hooks";
import { isDevEnvironment, normalizeComponentId } from "../runtime/validateComponentId";

export type FillInBlankSpec = { id: string; answer: string };

export type FillInTheBlanksProps = AssessmentBaseProps & {
  /** Text with `*` wrapping each blank answer, e.g. "The *capital* of France is *Paris*." */
  template: string;
  /** Optional explicit blanks (overrides parsing from template). */
  blanks?: FillInBlankSpec[];
};

const INTERACTION: AssessmentInteractionType = "fillInBlanks";

function parseTemplate(template: string): { parts: string[]; blanks: FillInBlankSpec[] } {
  const { parts, values } = parseStarDelimitedTemplate(template, "blank");
  return {
    parts,
    blanks: values.map((answer, i) => ({ id: `blank-${i}`, answer })),
  };
}

function FillInTheBlanksInner(
  props: FillInTheBlanksProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const { config } = useLessonkit();
  const { parts, blanks } = useMemo(() => {
    const parsed = parseTemplate(props.template);
    if (!props.blanks) {
      return { parts: parsed.parts, blanks: parsed.blanks };
    }
    let blankIdx = 0;
    const interleavedParts = parsed.parts.map((part) => {
      if (part.startsWith("blank-")) {
        const id = props.blanks![blankIdx]?.id;
        blankIdx += 1;
        return id ?? part;
      }
      return part;
    });
    return { parts: interleavedParts, blanks: props.blanks };
  }, [props.template, props.blanks]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(blanks.map((b) => [b.id, ""])),
  );
  const [passed, setPassed] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const completedRef = useRef(false);
  const answeredRef = useRef(false);
  const checkSnapshotRef = useRef<string | null>(null);
  const telemetryReplayedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    answeredRef.current = false;
    checkSnapshotRef.current = null;
    telemetryReplayedRef.current = false;
    setPassed(false);
    setValues(Object.fromEntries(blanks.map((b) => [b.id, ""])));
    setShowSolutions(false);
    setSubmitted(false);
  };

  useEffect(() => {
    reset();
  }, [checkId, props.template, blanks.map((b) => b.answer).join("\0")]);

  const hasBlanks = blanks.length > 0;
  const allFilled = hasBlanks && blanks.every((b) => (values[b.id] ?? "").trim().length > 0);
  let score = 0;
  blanks.forEach((b) => {
    if ((values[b.id] ?? "").trim().toLowerCase() === b.answer.toLowerCase()) score += 1;
  });
  const maxScore = blanks.length;
  const passedThreshold = meetsPassingThreshold(score, maxScore || 1, props.passingScore);

  const replayTelemetry = (
    nextValues: Record<string, string>,
    nextPassed: boolean,
    nextSubmitted: boolean,
    nextScore: number,
    nextMaxScore: number,
  ) => {
    if (telemetryReplayedRef.current || (!nextSubmitted && !nextPassed)) return;
    telemetryReplayedRef.current = true;
    const nextPassedThreshold = meetsPassingThreshold(
      nextScore,
      nextMaxScore || 1,
      props.passingScore,
    );
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      question: props.template,
      response: nextValues,
      correct: nextPassedThreshold,
    });
    if (nextPassed || nextPassedThreshold) {
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
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
        getScore: () => score,
        getMaxScore: () => maxScore || 1,
        getAnswerGiven: () => allFilled,
        resetTask: reset,
        showSolutions: () => setShowSolutions(true),
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: values,
          correct: passedThreshold,
          score,
          maxScore: maxScore || 1,
        }),
        getCurrentState: () => ({ values, passed, showSolutions, submitted }),
        resume: (state) => {
          const raw = state.values;
          let nextValues = values;
          if (raw && typeof raw === "object") {
            nextValues = { ...(raw as Record<string, string>) };
            setValues(nextValues);
          }
          let nextPassed = passed;
          let nextSubmitted = submitted;
          readBooleanStateField(state, "passed", (value) => {
            nextPassed = value;
            setPassed(value);
            completedRef.current = value;
            answeredRef.current = value;
          });
          readBooleanStateField(state, "showSolutions", setShowSolutions);
          readBooleanStateField(state, "submitted", (value) => {
            nextSubmitted = value;
            setSubmitted(value);
            if (value) answeredRef.current = true;
          });
          let nextScore = 0;
          blanks.forEach((b) => {
            if ((nextValues[b.id] ?? "").trim().toLowerCase() === b.answer.toLowerCase()) nextScore += 1;
          });
          if (config.tracking?.replayResumeEvents === true) {
            replayTelemetry(nextValues, nextPassed, nextSubmitted, nextScore, blanks.length);
          }
        },
      }),
    [allFilled, assessment, blanks, checkId, config.tracking?.replayResumeEvents, maxScore, passed, passedThreshold, props.passingScore, props.template, score, showSolutions, submitted, values],
  );

  const check = useCallback(() => {
    if (!hasBlanks) {
      if (isDevEnvironment()) {
        console.warn("[lessonkit] FillInTheBlanks has no blanks in template");
      }
      return;
    }
    if (!allFilled) return;
    if (passed) return;
    const snapshot = JSON.stringify(values);
    if (checkSnapshotRef.current === snapshot) return;
    checkSnapshotRef.current = snapshot;
    answeredRef.current = true;
    setSubmitted(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      question: props.template,
      response: values,
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
  }, [
    allFilled,
    assessment,
    blanks.length,
    checkId,
    hasBlanks,
    maxScore,
    passed,
    passedThreshold,
    props.passingScore,
    props.template,
    score,
    values,
  ]);

  useAssessmentHandleRegistration(checkId, handle, ref);

  useEffect(() => {
    if (!allFilled) {
      answeredRef.current = false;
      checkSnapshotRef.current = null;
      setSubmitted(false);
    }
  }, [allFilled]);

  useEffect(() => {
    if (props.autoCheck && allFilled && !passed) check();
  }, [allFilled, check, passed, props.autoCheck]);

  const reveal = showSolutions || (passed && props.enableSolutionsButton);

  return (
    <section aria-label="Fill in the Blanks" data-lk-check-id={checkId}>
      <p>
        {parts.map((part, i) => {
          const blank = blanks.find((b) => b.id === part);
          if (!blank) return <React.Fragment key={i}>{part}</React.Fragment>;
          return (
            <label key={blank.id} style={{ margin: "0 0.25em" }}>
              <span className="lk-visually-hidden">Blank {blank.id}</span>
              <input
                type="text"
                data-testid={`blank-${blank.id}`}
                aria-label={`Blank ${blank.id}`}
                value={reveal ? blank.answer : (values[blank.id] ?? "")}
                readOnly={reveal}
                disabled={passed && !props.enableRetry}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [blank.id]: e.target.value }))
                }
                onBlur={() => props.autoCheck && check()}
                size={Math.max(8, blank.answer.length + 2)}
              />
            </label>
          );
        })}
      </p>
      {!props.autoCheck ? (
        <button type="button" data-testid="check-blanks" disabled={!allFilled || passed} onClick={check}>
          Check
        </button>
      ) : null}
      {!hasBlanks ? (
        <p role="alert">This activity has no blanks. Add text wrapped in asterisks, e.g. The *answer* here.</p>
      ) : null}
      {submitted ? (
        <p role="status" aria-live="polite">
          {passed || passedThreshold ? "Correct" : "Try again"}
        </p>
      ) : null}
      {props.enableRetry && passed ? (
        <button type="button" onClick={reset}>
          Try again
        </button>
      ) : null}
      {props.enableSolutionsButton && !reveal ? (
        <button type="button" onClick={() => setShowSolutions(true)}>
          Show solution
        </button>
      ) : null}
    </section>
  );
}

const FillInTheBlanksInnerForwarded = forwardRef(FillInTheBlanksInner);

export const FillInTheBlanks = forwardRef<AssessmentHandle, FillInTheBlanksProps>(
  function FillInTheBlanks(props, ref) {
    return (
      <AssessmentLessonGuard blockLabel="FillInTheBlanks" checkId={props.checkId}>
        {(lessonId) => (
          <FillInTheBlanksInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />
        )}
      </AssessmentLessonGuard>
    );
  },
);
