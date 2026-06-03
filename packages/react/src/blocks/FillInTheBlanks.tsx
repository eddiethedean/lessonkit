import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { useRegisterAssessmentHandle } from "../assessment/AssessmentSequenceContext";
import { meetsPassingThreshold } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
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
  const parts: string[] = [];
  const blanks: FillInBlankSpec[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let n = 0;
  while ((match = re.exec(template)) !== null) {
    parts.push(template.slice(last, match.index));
    const id = `blank-${n++}`;
    blanks.push({ id, answer: match[1]!.trim() });
    parts.push(id);
    last = match.index + match[0].length;
  }
  parts.push(template.slice(last));
  return { parts, blanks };
}

function FillInTheBlanksInner(
  props: FillInTheBlanksProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const parsed = useMemo(() => parseTemplate(props.template), [props.template]);
  const blanks = props.blanks ?? parsed.blanks;
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(blanks.map((b) => [b.id, ""])),
  );
  const [passed, setPassed] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const completedRef = useRef(false);
  const answeredRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    answeredRef.current = false;
    setPassed(false);
    setValues(Object.fromEntries(blanks.map((b) => [b.id, ""])));
    setShowSolutions(false);
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

  const handle = useMemo((): AssessmentHandle => {
    const handleMax = maxScore || 1;
    return {
      getScore: () => score,
      getMaxScore: () => handleMax,
      getAnswerGiven: () => allFilled,
      resetTask: reset,
      showSolutions: () => setShowSolutions(true),
      getXAPIData: () => ({
        checkId,
        interactionType: INTERACTION,
        response: values,
        correct: passedThreshold,
        score,
        maxScore: handleMax,
      }),
    };
  }, [allFilled, blanks.length, checkId, maxScore, passedThreshold, score, values]);

  useImperativeHandle(ref, () => handle, [handle]);
  useRegisterAssessmentHandle(checkId, handle);

  const check = () => {
    if (!hasBlanks) {
      if (isDevEnvironment()) {
        console.warn("[lessonkit] FillInTheBlanks has no blanks in template");
      }
      return;
    }
    if (!allFilled) return;
    if (!answeredRef.current) {
      answeredRef.current = true;
      assessment.answer({
        checkId,
        interactionType: INTERACTION,
        question: props.template,
        response: values,
        correct: passedThreshold,
      });
    }
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

  useEffect(() => {
    if (!allFilled) answeredRef.current = false;
  }, [allFilled]);

  useEffect(() => {
    if (props.autoCheck && allFilled) check();
  }, [allFilled, props.autoCheck, values, passedThreshold]);

  const reveal = showSolutions || (passed && props.enableSolutionsButton);

  return (
    <section aria-label="Fill in the Blanks" data-lk-check-id={checkId}>
      <p>
        {parsed.parts.map((part, i) => {
          const blank = blanks.find((b) => b.id === part);
          if (!blank) return <React.Fragment key={i}>{part}</React.Fragment>;
          return (
            <label key={blank.id} style={{ margin: "0 0.25em" }}>
              <span className="lk-visually-hidden">{blank.answer}</span>
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
      {allFilled ? (
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
