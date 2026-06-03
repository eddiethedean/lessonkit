import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { useRegisterAssessmentHandle } from "../assessment/AssessmentSequenceContext";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type DragTheWordsProps = AssessmentBaseProps & {
  /** Sentence with `*` around drop zones; `words` are draggable options. */
  template: string;
  words: string[];
};

const INTERACTION: AssessmentInteractionType = "dragTheWords";

function parseZones(template: string): { parts: string[]; answers: string[] } {
  const parts: string[] = [];
  const answers: string[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let n = 0;
  while ((match = re.exec(template)) !== null) {
    parts.push(template.slice(last, match.index));
    answers.push(match[1]!.trim());
    parts.push(`zone-${n++}`);
    last = match.index + match[0].length;
  }
  parts.push(template.slice(last));
  return { parts, answers };
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

  const reset = () => {
    completedRef.current = false;
    setPassed(false);
    setZones(Object.fromEntries(answers.map((_, i) => [`zone-${i}`, ""])));
    setPool([...props.words]);
    setKeyboardWord(null);
  };

  useEffect(() => {
    reset();
  }, [checkId, props.template, props.words.join("\0")]);

  const allFilled = answers.every((_, i) => (zones[`zone-${i}`] ?? "").length > 0);
  const allCorrect = answers.every(
    (ans, i) => (zones[`zone-${i}`] ?? "").trim().toLowerCase() === ans.toLowerCase(),
  );

  const handle = useMemo((): AssessmentHandle => {
    const maxScore = answers.length || 1;
    let score = 0;
    answers.forEach((ans, i) => {
      if ((zones[`zone-${i}`] ?? "").trim().toLowerCase() === ans.toLowerCase()) score += 1;
    });
    return {
      getScore: () => score,
      getMaxScore: () => maxScore,
      getAnswerGiven: () => allFilled,
      resetTask: reset,
      showSolutions: () => {},
      getXAPIData: () => ({
        checkId,
        interactionType: INTERACTION,
        response: zones,
        correct: allCorrect,
        score,
        maxScore,
      }),
    };
  }, [allCorrect, allFilled, answers, checkId, zones]);

  useImperativeHandle(ref, () => handle, [handle]);
  useRegisterAssessmentHandle(checkId, handle);

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
    if (!allFilled) return;
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      question: props.template,
      response: zones,
      correct: allCorrect,
    });
    if (allCorrect && !completedRef.current) {
      completedRef.current = true;
      setPassed(true);
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: answers.length,
        maxScore: answers.length,
        passingScore: props.passingScore ?? answers.length,
      });
    }
  };

  useEffect(() => {
    if (props.autoCheck && allFilled) check();
  }, [allFilled, props.autoCheck, zones]);

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
      {allFilled ? (
        <p role="status" aria-live="polite">
          {passed || allCorrect ? "Correct" : "Try again"}
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
