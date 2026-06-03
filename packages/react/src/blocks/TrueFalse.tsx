import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { useRegisterAssessmentHandle } from "../assessment/AssessmentSequenceContext";
import { scoreFromCustom } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { useLessonkit } from "../hooks";
import { buildPluginContext } from "../runtime/plugins";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type TrueFalseProps = AssessmentBaseProps & {
  question: string;
  answer: boolean;
};

const INTERACTION: AssessmentInteractionType = "trueFalse";

function TrueFalseInner(
  props: TrueFalseProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const { enclosingLessonId } = props;
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(enclosingLessonId);
  const { plugins, config, session } = useLessonkit();
  const [selected, setSelected] = useState<boolean | null>(null);
  const [selectionCorrect, setSelectionCorrect] = useState<boolean | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);
  const [passed, setPassed] = useState(false);
  const completedRef = useRef(false);
  const questionId = React.useId();

  const reset = () => {
    completedRef.current = false;
    setPassed(false);
    setSelected(null);
    setSelectionCorrect(null);
    setShowSolutions(false);
  };

  useEffect(() => {
    reset();
  }, [checkId, props.answer, props.question, config.courseId, enclosingLessonId]);

  const handle = useMemo((): AssessmentHandle => {
    const maxScore = 1;
    const score = passed ? maxScore : selected === null ? 0 : selected === props.answer ? maxScore : 0;
    return {
      getScore: () => score,
      getMaxScore: () => maxScore,
      getAnswerGiven: () => selected !== null,
      resetTask: reset,
      showSolutions: () => setShowSolutions(true),
      getXAPIData: () => ({
        checkId,
        interactionType: INTERACTION,
        response: selected ?? undefined,
        correct: selected === props.answer,
        score,
        maxScore,
      }),
    };
  }, [checkId, passed, props.answer, selected]);

  useImperativeHandle(ref, () => handle, [handle]);
  useRegisterAssessmentHandle(checkId, handle);

  const submit = (value: boolean) => {
    if (passed && !props.enableRetry) return;
    setSelected(value);
    const pluginCtx = buildPluginContext({
      courseId: config.courseId,
      sessionId: session.sessionId,
      attemptId: session.attemptId,
      user: session.user,
    });
    const custom =
      plugins?.scoreAssessment(
        { checkId, lessonId: enclosingLessonId, response: value },
        pluginCtx,
      ) ?? null;
    const correct = value === props.answer;
    const scored = scoreFromCustom(custom, correct, 1, props.passingScore);
    setSelectionCorrect(scored.passed);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      question: props.question,
      response: value,
      correct: scored.passed,
    });
    if (scored.passed && !completedRef.current) {
      completedRef.current = true;
      setPassed(true);
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: scored.score,
        maxScore: scored.maxScore,
        passingScore: props.passingScore ?? scored.maxScore,
      });
    }
  };

  const reveal = showSolutions || (passed && props.enableSolutionsButton);

  return (
    <section aria-label="True or False" data-lk-check-id={checkId}>
      <p id={questionId}>{props.question}</p>
      <fieldset aria-labelledby={questionId}>
        <legend className="lk-visually-hidden">True or False</legend>
        <label style={{ display: "block", marginRight: "1rem" }}>
          <input
            type="radio"
            name={`${questionId}-tf`}
            checked={selected === true}
            disabled={passed && !props.enableRetry}
            onChange={() => submit(true)}
          />
          True
        </label>
        <label style={{ display: "block" }}>
          <input
            type="radio"
            name={`${questionId}-tf`}
            checked={selected === false}
            disabled={passed && !props.enableRetry}
            onChange={() => submit(false)}
          />
          False
        </label>
      </fieldset>
      {reveal ? (
        <p>
          Correct answer: <strong>{props.answer ? "True" : "False"}</strong>
        </p>
      ) : null}
      {selected !== null && selectionCorrect !== null ? (
        <p role="status" aria-live="polite">
          {selectionCorrect ? "Correct" : "Try again"}
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

const TrueFalseInnerForwarded = forwardRef(TrueFalseInner);

export const TrueFalse = forwardRef<AssessmentHandle, TrueFalseProps>(function TrueFalse(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="TrueFalse" checkId={props.checkId}>
      {(lessonId) => <TrueFalseInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});
