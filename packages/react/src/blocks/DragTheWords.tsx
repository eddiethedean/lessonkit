import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { parseStarDelimitedTemplate } from "../assessment/internal/parseStarDelimitedTemplate";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanStateField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { meetsPassingThreshold } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { isDevEnvironment, normalizeComponentId } from "../runtime/validateComponentId";

export type DragTheWordsProps = AssessmentBaseProps & {
  /** Sentence with `*` around drop zones; `words` are draggable options. */
  template: string;
  words: string[];
};

const INTERACTION: AssessmentInteractionType = "dragTheWords";

function parseZones(template: string): { parts: string[]; answers: string[] } {
  const { parts, values } = parseStarDelimitedTemplate(template, "zone");
  return { parts, answers: values };
}

function DragTheWordsInner(
  props: DragTheWordsProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const { parts, answers } = useMemo(() => parseZones(props.template), [props.template]);
  const [zones, setZones] = useState<Record<string, string>>(() =>
    Object.fromEntries(answers.map((_, i) => [`zone-${i}`, ""])),
  );
  const [pool, setPool] = useState<string[]>(() => [...props.words]);
  const [keyboardWord, setKeyboardWord] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const completedRef = useRef(false);
  const answeredRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    answeredRef.current = false;
    setPassed(false);
    setZones(Object.fromEntries(answers.map((_, i) => [`zone-${i}`, ""])));
    setPool([...props.words]);
    setKeyboardWord(null);
  };

  useEffect(() => {
    reset();
  }, [checkId, props.template, props.words.join("\0")]);

  const hasZones = answers.length > 0;
  const allFilled = hasZones && answers.every((_, i) => (zones[`zone-${i}`] ?? "").length > 0);
  let score = 0;
  answers.forEach((ans, i) => {
    if ((zones[`zone-${i}`] ?? "").trim().toLowerCase() === ans.toLowerCase()) score += 1;
  });
  const maxScore = answers.length;
  const passedThreshold = meetsPassingThreshold(score, maxScore || 1, props.passingScore);

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => score,
        getMaxScore: () => maxScore || 1,
        getAnswerGiven: () => allFilled,
        resetTask: reset,
        showSolutions: () => {},
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: zones,
          correct: passedThreshold,
          score,
          maxScore: maxScore || 1,
        }),
        getCurrentState: () => ({ zones, pool, passed, keyboardWord }),
        resume: (state) => {
          const rawZones = state.zones;
          if (rawZones && typeof rawZones === "object") setZones({ ...(rawZones as Record<string, string>) });
          if (Array.isArray(state.pool)) setPool([...(state.pool as string[])]);
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            completedRef.current = value;
            answeredRef.current = value;
          });
          const kw = state.keyboardWord;
          if (kw === null || typeof kw === "string") setKeyboardWord(kw ?? null);
        },
      }),
    [allFilled, checkId, keyboardWord, maxScore, passed, passedThreshold, pool, score, zones],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const placeInZone = (zoneId: string, word: string) => {
    if (passed && !props.enableRetry) return;
    const prev = zones[zoneId];
    setZones((z) => ({ ...z, [zoneId]: word }));
    setPool((p) => {
      const next = p.filter((w) => w !== word);
      if (prev) next.push(prev);
      return next;
    });
    setKeyboardWord(null);
  };

  const onDragStart = (word: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", word);
  };

  const onDrop = (zoneId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const word = e.dataTransfer.getData("text/plain");
    if (word) placeInZone(zoneId, word);
  };

  const check = () => {
    if (!hasZones) {
      if (isDevEnvironment()) {
        console.warn("[lessonkit] DragTheWords has no drop zones in template");
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
        response: zones,
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
  }, [allFilled, props.autoCheck, zones, passedThreshold]);

  return (
    <section aria-label="Drag the Words" data-lk-check-id={checkId}>
      <p>Drag words into the blanks (or select a word, then activate a blank).</p>
      <div role="list" aria-label="Word bank" data-testid="word-bank">
        {pool.map((word) => (
          <button
            key={word}
            type="button"
            draggable
            data-testid={`word-${word}`}
            aria-pressed={keyboardWord === word}
            onDragStart={onDragStart(word)}
            onClick={() => setKeyboardWord(keyboardWord === word ? null : word)}
            style={{ margin: "0.25rem" }}
          >
            {word}
          </button>
        ))}
      </div>
      <p>
        {parts.map((part, i) => {
          if (!part.startsWith("zone-")) return <React.Fragment key={i}>{part}</React.Fragment>;
          return (
            <span
              key={part}
              role="button"
              tabIndex={0}
              data-testid={part}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop(part)}
              onClick={() => keyboardWord && placeInZone(part, keyboardWord)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && keyboardWord) placeInZone(part, keyboardWord);
              }}
              style={{
                display: "inline-block",
                minWidth: "6em",
                border: "1px dashed currentColor",
                padding: "0.2em 0.5em",
                margin: "0 0.2em",
              }}
            >
              {zones[part] || "___"}
            </span>
          );
        })}
      </p>
      <button type="button" data-testid="check-drag-words" disabled={!allFilled || passed} onClick={check}>
        Check
      </button>
      {!hasZones ? (
        <p role="alert">This activity has no drop zones. Wrap answers in asterisks in the template.</p>
      ) : null}
      {allFilled ? (
        <p role="status" aria-live="polite">
          {passed || passedThreshold ? "Correct" : "Try again"}
        </p>
      ) : null}
    </section>
  );
}

const DragTheWordsInnerForwarded = forwardRef(DragTheWordsInner);

export const DragTheWords = forwardRef<AssessmentHandle, DragTheWordsProps>(function DragTheWords(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="DragTheWords" checkId={props.checkId}>
      {(lessonId) => <DragTheWordsInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});
