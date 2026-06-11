import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import {
  readBooleanStateField,
  restoreCompletedRefFromResumeState,
} from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { meetsPassingThreshold } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { setLessonkitBlockType } from "../compound/blockType";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type CrosswordEntry = {
  id: string;
  clue: string;
  answer: string;
  row: number;
  col: number;
  direction: "across" | "down";
};

export type CrosswordProps = AssessmentBaseProps & {
  rows: number;
  cols: number;
  entries: CrosswordEntry[];
};

const INTERACTION: AssessmentInteractionType = "crossword";

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function buildClueNumbers(entries: CrosswordEntry[]): Map<string, number> {
  const startKeys = new Set<string>();
  for (const entry of entries) {
    startKeys.add(cellKey(entry.row, entry.col));
  }
  const sorted = Array.from(startKeys).sort((a, b) => {
    const [ar, ac] = a.split(":").map(Number);
    const [br, bc] = b.split(":").map(Number);
    return ar - br || ac - bc;
  });
  const numbers = new Map<string, number>();
  sorted.forEach((key, index) => numbers.set(key, index + 1));
  return numbers;
}

function buildOccupancy(entries: CrosswordEntry[], rows: number, cols: number): Set<string> {
  const occupied = new Set<string>();
  for (const entry of entries) {
    for (let i = 0; i < entry.answer.length; i += 1) {
      const row = entry.direction === "down" ? entry.row + i : entry.row;
      const col = entry.direction === "across" ? entry.col + i : entry.col;
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        occupied.add(cellKey(row, col));
      }
    }
  }
  return occupied;
}

function CrosswordInner(
  props: CrosswordProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const occupied = useMemo(
    () => buildOccupancy(props.entries, props.rows, props.cols),
    [props.entries, props.rows, props.cols],
  );
  const clueNumbers = useMemo(() => buildClueNumbers(props.entries), [props.entries]);
  const [values, setValues] = useState<Record<string, string>>({});
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const [passed, setPassed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const completedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    setPassed(false);
    setSubmitted(false);
    setShowSolutions(false);
    setValues({});
  };

  useEffect(() => {
    reset();
  }, [checkId, props.entries.map((e) => e.answer).join("\0"), props.rows, props.cols]);

  const scoreEntries = (
    entries: CrosswordEntry[],
    cellValues: Record<string, string>,
  ): number =>
    entries.filter((entry) => {
      for (let i = 0; i < entry.answer.length; i += 1) {
        const row = entry.direction === "down" ? entry.row + i : entry.row;
        const col = entry.direction === "across" ? entry.col + i : entry.col;
        const expected = entry.answer[i]?.toUpperCase() ?? "";
        const actual = (cellValues[cellKey(row, col)] ?? "").toUpperCase();
        if (actual !== expected) return false;
      }
      return true;
    }).length;

  const maxScore = props.entries.length;
  const score = scoreEntries(props.entries, values);
  const passedThreshold = meetsPassingThreshold(score, maxScore || 1, props.passingScore);

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => (passed ? maxScore : score),
        getMaxScore: () => maxScore || 1,
        getAnswerGiven: () => Object.keys(values).length > 0,
        resetTask: reset,
        showSolutions: () => setShowSolutions(true),
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: values,
          correct: passedThreshold,
          score: passed ? maxScore : score,
          maxScore: maxScore || 1,
        }),
        getCurrentState: () => ({
          values,
          passed,
          submitted,
          showSolutions,
          completed: completedRef.current,
        }),
        resume: (state) => {
          const raw = state.values;
          if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            setValues(raw as Record<string, string>);
          }
          readBooleanStateField(state, "passed", setPassed);
          readBooleanStateField(state, "submitted", setSubmitted);
          readBooleanStateField(state, "showSolutions", setShowSolutions);
          restoreCompletedRefFromResumeState(completedRef, state, {
            enableRetry: props.enableRetry,
          });
        },
      }),
    [checkId, maxScore, passed, passedThreshold, score, showSolutions, submitted, values],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const setCell = (row: number, col: number, value: string) => {
    const key = cellKey(row, col);
    setValues((prev) => ({ ...prev, [key]: value.slice(-1).toUpperCase() }));
  };

  const check = () => {
    const currentValues = valuesRef.current;
    const currentScore = scoreEntries(props.entries, currentValues);
    const ok = meetsPassingThreshold(currentScore, maxScore || 1, props.passingScore);
    setSubmitted(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: currentValues,
      correct: ok,
    });
    if ((ok || props.enableRetry === false) && !completedRef.current) {
      completedRef.current = true;
      setPassed(ok);
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: currentScore,
        maxScore: maxScore || 1,
        passingScore: props.passingScore ?? maxScore,
      });
    }
  };

  const solutionForCell = (row: number, col: number): string => {
    for (const entry of props.entries) {
      for (let i = 0; i < entry.answer.length; i += 1) {
        const er = entry.direction === "down" ? entry.row + i : entry.row;
        const ec = entry.direction === "across" ? entry.col + i : entry.col;
        if (er === row && ec === col) return entry.answer[i]?.toUpperCase() ?? "";
      }
    }
    return "";
  };

  const isCellCorrect = (row: number, col: number, cellValues: Record<string, string>): boolean => {
    const key = cellKey(row, col);
    if (!occupied.has(key)) return true;
    const expected = solutionForCell(row, col);
    const actual = (cellValues[key] ?? "").toUpperCase();
    return actual === expected;
  };

  const cellFeedback = (row: number, col: number): "correct" | "incorrect" | null => {
    const key = cellKey(row, col);
    if (!occupied.has(key)) return null;
    if (!submitted && !showSolutions) return null;
    if (showSolutions) return "correct";
    const actual = (values[key] ?? "").toUpperCase();
    if (!actual) return "incorrect";
    return isCellCorrect(row, col, values) ? "correct" : "incorrect";
  };

  const hasWrongLetters = useMemo(() => {
    if (!submitted || passedThreshold) return false;
    for (const key of occupied) {
      const [row, col] = key.split(":").map(Number);
      if (!isCellCorrect(row!, col!, values)) return true;
    }
    return false;
  }, [occupied, passedThreshold, submitted, values]);

  const clearWrongLetters = () => {
    setValues((prev) => {
      const next = { ...prev };
      for (const key of occupied) {
        const [row, col] = key.split(":").map(Number);
        if (!isCellCorrect(row!, col!, prev)) {
          delete next[key];
        }
      }
      return next;
    });
    setSubmitted(false);
  };

  const locked = passed && !props.enableRetry;

  const acrossClues = props.entries.filter((entry) => entry.direction === "across");
  const downClues = props.entries.filter((entry) => entry.direction === "down");

  return (
    <section
      className="lk-crossword"
      aria-label="Crossword"
      data-lk-check-id={checkId}
      data-testid="crossword"
    >
      <div
        className="lk-crossword-grid"
        role="grid"
        aria-rowcount={props.rows}
        aria-colcount={props.cols}
      >
        {Array.from({ length: props.rows }, (_, row) => (
          <div key={`row-${row}`} className="lk-crossword-row" role="row" aria-rowindex={row + 1}>
            {Array.from({ length: props.cols }, (_, col) => {
              const key = cellKey(row, col);
              const clueNum = clueNumbers.get(key);
              if (!occupied.has(key)) {
                return (
                  <span
                    key={key}
                    className="lk-crossword-cell lk-crossword-cell--block"
                    role="gridcell"
                    aria-hidden="true"
                  />
                );
              }
              const feedback = cellFeedback(row, col);
              return (
                <span
                  key={key}
                  className={[
                    "lk-crossword-cell",
                    feedback === "correct" ? "lk-crossword-cell--correct" : "",
                    feedback === "incorrect" ? "lk-crossword-cell--incorrect" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {clueNum ? (
                    <span className="lk-crossword-clue-num" aria-hidden="true">
                      {clueNum}
                    </span>
                  ) : null}
                  <input
                    role="gridcell"
                    aria-rowindex={row + 1}
                    aria-colindex={col + 1}
                    maxLength={1}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="text"
                    readOnly={showSolutions}
                    disabled={locked}
                    value={showSolutions ? solutionForCell(row, col) : (values[key] ?? "")}
                    data-testid={`crossword-cell-${row}-${col}`}
                    onChange={(event) => setCell(row, col, event.target.value)}
                  />
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="lk-crossword-clues">
        {acrossClues.length > 0 ? (
          <section aria-label="Across clues">
            <h4 className="lk-crossword-clues-heading">Across</h4>
            <ol className="lk-crossword-clue-list">
              {acrossClues.map((entry) => (
                <li key={entry.id}>
                  <span className="lk-crossword-clue-label">
                    {clueNumbers.get(cellKey(entry.row, entry.col))}.
                  </span>{" "}
                  {entry.clue}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {downClues.length > 0 ? (
          <section aria-label="Down clues">
            <h4 className="lk-crossword-clues-heading">Down</h4>
            <ol className="lk-crossword-clue-list">
              {downClues.map((entry) => (
                <li key={entry.id}>
                  <span className="lk-crossword-clue-label">
                    {clueNumbers.get(cellKey(entry.row, entry.col))}.
                  </span>{" "}
                  {entry.clue}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
      {submitted ? (
        <p
          role="status"
          aria-live="assertive"
          className={[
            "lk-crossword-feedback",
            passedThreshold ? "lk-crossword-feedback--success" : "lk-crossword-feedback--retry",
          ].join(" ")}
          data-testid="crossword-feedback"
        >
          {passedThreshold
            ? "Correct!"
            : `Try again — ${score} of ${maxScore} word${maxScore === 1 ? "" : "s"} correct`}
        </p>
      ) : null}
      <div className="lk-crossword-actions">
        <button
          type="button"
          className="lk-button"
          data-testid="crossword-check"
          disabled={locked}
          onClick={check}
        >
          Check
        </button>
        {hasWrongLetters ? (
          <button
            type="button"
            className="lk-button lk-crossword-clear-wrong"
            data-testid="crossword-clear-wrong"
            onClick={clearWrongLetters}
          >
            Clear wrong letters
          </button>
        ) : null}
        {props.enableRetry && passed ? (
          <button type="button" className="lk-button" data-testid="crossword-retry" onClick={reset}>
            Try again
          </button>
        ) : null}
        {props.enableSolutionsButton && !showSolutions ? (
          <button
            type="button"
            className="lk-button"
            data-testid="crossword-solutions"
            onClick={() => setShowSolutions(true)}
          >
            Show solution
          </button>
        ) : null}
      </div>
    </section>
  );
}

const CrosswordInnerForwarded = forwardRef(CrosswordInner);

export const Crossword = forwardRef<AssessmentHandle, CrosswordProps>(function Crossword(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="Crossword" checkId={props.checkId}>
      {(lessonId) => <CrosswordInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});

setLessonkitBlockType(Crossword, "Crossword");
