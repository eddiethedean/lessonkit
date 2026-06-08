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
  const [values, setValues] = useState<Record<string, string>>({});
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

  const scoreEntry = (entry: CrosswordEntry): boolean => {
    for (let i = 0; i < entry.answer.length; i += 1) {
      const row = entry.direction === "down" ? entry.row + i : entry.row;
      const col = entry.direction === "across" ? entry.col + i : entry.col;
      const expected = entry.answer[i]?.toUpperCase() ?? "";
      const actual = (values[cellKey(row, col)] ?? "").toUpperCase();
      if (actual !== expected) return false;
    }
    return true;
  };

  const maxScore = props.entries.length;
  const score = props.entries.filter((entry) => scoreEntry(entry)).length;
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
        getCurrentState: () => ({ values, passed, submitted, showSolutions }),
        resume: (state) => {
          const raw = state.values;
          if (raw && typeof raw === "object" && !Array.isArray(raw)) {
            setValues(raw as Record<string, string>);
          }
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            completedRef.current = value;
          });
          readBooleanStateField(state, "submitted", setSubmitted);
          readBooleanStateField(state, "showSolutions", setShowSolutions);
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
    setSubmitted(true);
    const ok = score === maxScore && maxScore > 0;
    if (ok) {
      setPassed(true);
      completedRef.current = true;
    }
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: values,
      correct: ok,
    });
    assessment.complete({
      checkId,
      interactionType: INTERACTION,
      score,
      maxScore,
      passingScore: props.passingScore ?? maxScore,
    });
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

  return (
    <section aria-label="Crossword" data-lk-check-id={checkId} data-testid="crossword">
      <div role="grid" aria-rowcount={props.rows} aria-colcount={props.cols}>
        {Array.from({ length: props.rows }, (_, row) => (
          <div key={`row-${row}`} role="row" aria-rowindex={row + 1}>
            {Array.from({ length: props.cols }, (_, col) => {
              const key = cellKey(row, col);
              if (!occupied.has(key)) {
                return <span key={key} role="gridcell" aria-hidden="true" style={{ width: 28, height: 28 }} />;
              }
              return (
                <input
                  key={key}
                  role="gridcell"
                  aria-rowindex={row + 1}
                  aria-colindex={col + 1}
                  maxLength={1}
                  value={showSolutions ? solutionForCell(row, col) : (values[key] ?? "")}
                  data-testid={`crossword-cell-${row}-${col}`}
                  onChange={(event) => setCell(row, col, event.target.value)}
                />
              );
            })}
          </div>
        ))}
      </div>
      <ul>
        {props.entries.map((entry) => (
          <li key={entry.id}>
            <strong>{entry.direction}</strong>: {entry.clue}
          </li>
        ))}
      </ul>
      <button type="button" data-testid="crossword-check" onClick={check}>
        Check
      </button>
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
