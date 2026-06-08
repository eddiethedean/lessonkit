import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanStateField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { meetsPassingThreshold } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { isDevEnvironment, normalizeComponentId } from "../runtime/validateComponentId";

export type MarkTheWordsProps = AssessmentBaseProps & {
  /** Plain text; words listed in `correctWords` are selectable targets. */
  text: string;
  correctWords: string[];
};

const INTERACTION: AssessmentInteractionType = "markTheWords";

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

function MarkTheWordsInner(
  props: MarkTheWordsProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const tokens = useMemo(() => tokenize(props.text), [props.text]);
  const correctSet = useMemo(
    () => new Set(props.correctWords.map((w) => w.toLowerCase())),
    [props.correctWords],
  );
  const [marked, setMarked] = useState<Set<number>>(() => new Set());
  const [passed, setPassed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const completedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    setPassed(false);
    setSubmitted(false);
    setMarked(new Set());
    setShowSolutions(false);
  };

  useEffect(() => {
    reset();
  }, [checkId, props.text, props.correctWords.join("\0")]);

  const selectableIndices = useMemo(() => {
    const indices: number[] = [];
    tokens.forEach((t, i) => {
      if (!/^\s+$/.test(t) && correctSet.has(t.toLowerCase())) indices.push(i);
    });
    return indices;
  }, [tokens, correctSet]);

  const hasTargets = selectableIndices.length > 0;
  const allMarked = hasTargets && selectableIndices.every((i) => marked.has(i));
  const maxScore = selectableIndices.length;
  const score = allMarked ? maxScore : marked.size;
  const passedThreshold = meetsPassingThreshold(score, maxScore || 1, props.passingScore);

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => score,
        getMaxScore: () => maxScore || 1,
        getAnswerGiven: () => submitted,
        resetTask: reset,
        showSolutions: () => setShowSolutions(true),
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: [...marked].map((i) => tokens[i]),
          correct: passedThreshold,
          score,
          maxScore: maxScore || 1,
        }),
        getCurrentState: () => ({ marked: [...marked], passed, showSolutions, submitted }),
        resume: (state) => {
          const raw = state.marked;
          if (Array.isArray(raw)) setMarked(new Set(raw.filter((i): i is number => typeof i === "number")));
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            completedRef.current = value;
          });
          readBooleanStateField(state, "submitted", setSubmitted);
          readBooleanStateField(state, "showSolutions", setShowSolutions);
        },
      }),
    [checkId, marked, maxScore, passed, passedThreshold, score, showSolutions, tokens],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const toggle = (index: number) => {
    if (passed && !props.enableRetry) return;
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const submitMarks = () => {
    if (!hasTargets || completedRef.current || marked.size === 0) return;
    completedRef.current = true;
    setSubmitted(true);
    const didPass = passedThreshold;
    if (didPass) setPassed(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      question: props.text,
      response: [...marked].map((i) => tokens[i]),
      correct: didPass,
    });
    assessment.complete({
      checkId,
      interactionType: INTERACTION,
      score,
      maxScore,
      passingScore: props.passingScore ?? maxScore,
    });
  };

  useEffect(() => {
    if (!hasTargets) {
      if (isDevEnvironment()) {
        console.warn(
          "[lessonkit] MarkTheWords: no tokens match correctWords",
          props.correctWords,
        );
      }
      return;
    }
    if (props.enableRetry === false) return;
    if (!passedThreshold || completedRef.current) return;
    completedRef.current = true;
    setSubmitted(true);
    setPassed(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      question: props.text,
      response: [...marked].map((i) => tokens[i]),
      correct: passedThreshold,
    });
    assessment.complete({
      checkId,
      interactionType: INTERACTION,
      score,
      maxScore,
      passingScore: props.passingScore ?? maxScore,
    });
  }, [
    assessment,
    checkId,
    hasTargets,
    marked,
    maxScore,
    passedThreshold,
    props.enableRetry,
    props.passingScore,
    props.correctWords,
    props.text,
    score,
    tokens,
  ]);

  return (
    <section aria-label="Mark the Words" data-lk-check-id={checkId}>
      {!hasTargets ? (
        <p role="alert">
          No words in this sentence match <code>correctWords</code>. Check spelling and capitalization
          in the source text.
        </p>
      ) : null}
      <p id={`${checkId}-hint`}>Select the correct words in the sentence.</p>
      <p aria-describedby={`${checkId}-hint`}>
        {tokens.map((token, i) => {
          const isWord = !/^\s+$/.test(token);
          const isTarget = isWord && correctSet.has(token.toLowerCase());
          if (!isTarget) return <React.Fragment key={i}>{token}</React.Fragment>;
          const selected = marked.has(i);
          const solution = showSolutions || (passed && props.enableSolutionsButton);
          return (
            <button
              key={i}
              type="button"
              data-testid={`mark-word-${i}`}
              aria-pressed={selected}
              disabled={passed && !props.enableRetry}
              onClick={() => toggle(i)}
              style={{
                margin: "0 0.1em",
                textDecoration: solution ? "underline" : undefined,
                fontWeight: selected || solution ? "bold" : undefined,
              }}
            >
              {token}
            </button>
          );
        })}
      </p>
      {passedThreshold ? (
        <p role="status" aria-live="polite">
          Correct
        </p>
      ) : null}
      {props.enableRetry === false && hasTargets && marked.size > 0 && !submitted ? (
        <button type="button" data-testid="mark-the-words-submit" onClick={submitMarks}>
          Submit
        </button>
      ) : null}
      {props.enableRetry && passed ? (
        <button type="button" onClick={reset}>
          Try again
        </button>
      ) : null}
      {props.enableSolutionsButton && !showSolutions ? (
        <button type="button" onClick={() => setShowSolutions(true)}>
          Show solution
        </button>
      ) : null}
    </section>
  );
}

const MarkTheWordsInnerForwarded = forwardRef(MarkTheWordsInner);

export const MarkTheWords = forwardRef<AssessmentHandle, MarkTheWordsProps>(function MarkTheWords(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="MarkTheWords" checkId={props.checkId}>
      {(lessonId) => <MarkTheWordsInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});
