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

export type WordSearchProps = AssessmentBaseProps & {
  words: string[];
  size?: number;
};

const INTERACTION: AssessmentInteractionType = "wordSearch";

function buildGrid(words: string[], size: number): { grid: string[][]; placed: string[] } {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ""),
  );
  const placed: string[] = [];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (const raw of words) {
    const word = raw.toUpperCase().replace(/[^A-Z]/g, "");
    if (word.length === 0 || word.length > size) continue;
    let done = false;
    for (let attempt = 0; attempt < 50 && !done; attempt += 1) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * (size - word.length + 1));
      let fits = true;
      for (let i = 0; i < word.length; i += 1) {
        const cell = grid[row]![col + i]!;
        if (cell && cell !== word[i]) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;
      for (let i = 0; i < word.length; i += 1) {
        grid[row]![col + i] = word[i]!;
      }
      placed.push(word);
      done = true;
    }
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (!grid[r]![c]) {
        grid[r]![c] = alphabet[Math.floor(Math.random() * alphabet.length)]!;
      }
    }
  }

  return { grid, placed };
}

function WordSearchInner(
  props: WordSearchProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const size = props.size ?? 10;
  const wordsKey = props.words.join("\0");
  const { grid, placed } = useMemo(() => buildGrid(props.words, size), [wordsKey, size]);
  const [found, setFound] = useState<Set<string>>(() => new Set());
  const [selection, setSelection] = useState<string[]>([]);
  const [passed, setPassed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const completedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    setPassed(false);
    setSubmitted(false);
    setFound(new Set());
    setSelection([]);
  };

  useEffect(() => {
    reset();
  }, [checkId, wordsKey, size]);

  const maxScore = placed.length;
  const score = found.size;
  const passedThreshold = meetsPassingThreshold(score, maxScore || 1, props.passingScore);

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => (passed ? maxScore : score),
        getMaxScore: () => maxScore || 1,
        getAnswerGiven: () => found.size > 0,
        resetTask: reset,
        showSolutions: () => {},
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: [...found],
          correct: passedThreshold,
          score: passed ? maxScore : score,
          maxScore: maxScore || 1,
        }),
        getCurrentState: () => ({ found: [...found], passed, submitted }),
        resume: (state) => {
          const raw = state.found;
          if (Array.isArray(raw)) {
            setFound(new Set(raw.filter((w): w is string => typeof w === "string")));
          }
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            completedRef.current = value;
          });
          readBooleanStateField(state, "submitted", setSubmitted);
        },
      }),
    [checkId, found, maxScore, passed, passedThreshold, score, submitted],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const toggleCell = (row: number, col: number) => {
    const key = `${row}:${col}`;
    setSelection((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      const letters = next
        .sort()
        .map((k) => {
          const [r, c] = k.split(":").map(Number);
          return grid[r!]?.[c!] ?? "";
        })
        .join("");
      const match = placed.find((word) => word === letters);
      if (match) {
        setFound((f) => new Set([...f, match]));
        return [];
      }
      return next;
    });
  };

  const check = () => {
    setSubmitted(true);
    const ok = found.size === maxScore && maxScore > 0;
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: [...found],
      correct: ok,
    });
    if ((ok || props.enableRetry === false) && !completedRef.current) {
      completedRef.current = true;
      if (ok) setPassed(true);
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
    <section aria-label="Word search" data-lk-check-id={checkId} data-testid="word-search">
      <div role="grid">
        {grid.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} role="row">
            {row.map((letter, colIndex) => {
              const key = `${rowIndex}:${colIndex}`;
              const selected = selection.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  aria-pressed={selected}
                  data-testid={`word-search-cell-${rowIndex}-${colIndex}`}
                  onClick={() => toggleCell(rowIndex, colIndex)}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <ul data-testid="word-search-bank">
        {placed.map((word) => (
          <li key={word} aria-checked={found.has(word)}>
            {word}
          </li>
        ))}
      </ul>
      <button type="button" data-testid="word-search-check" onClick={check}>
        Check
      </button>
    </section>
  );
}

const WordSearchInnerForwarded = forwardRef(WordSearchInner);

export const WordSearch = forwardRef<AssessmentHandle, WordSearchProps>(function WordSearch(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="WordSearch" checkId={props.checkId}>
      {(lessonId) => <WordSearchInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});

setLessonkitBlockType(WordSearch, "WordSearch");
