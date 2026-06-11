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
import {
  buildGrid,
  buildGridSeed,
  cellKey,
  cellsAlongHorizontalLine,
  matchPlacement,
  placementCellKeys,
  restoreWordSearchLayout,
  type GridCell,
  type WordPlacement,
  type WordSearchGrid,
} from "./wordSearchUtils";

export type WordSearchProps = AssessmentBaseProps & {
  words: string[];
  size?: number;
};

const INTERACTION: AssessmentInteractionType = "wordSearch";

function foundCellsForWords(
  foundWords: Iterable<string>,
  placementsByWord: Map<string, WordPlacement>,
): Set<string> {
  const nextFoundCells = new Set<string>();
  for (const word of foundWords) {
    const placement = placementsByWord.get(word);
    if (placement) {
      for (const key of placementCellKeys(placement)) {
        nextFoundCells.add(key);
      }
    }
  }
  return nextFoundCells;
}

function WordSearchInner(
  props: WordSearchProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const size = props.size ?? 10;
  const wordsKey = props.words.join("\0");
  const layoutSeed = useMemo(
    () => buildGridSeed(checkId, wordsKey, size),
    [checkId, wordsKey, size],
  );
  const [layout, setLayout] = useState<WordSearchGrid>(() =>
    buildGrid(props.words, size, layoutSeed),
  );
  const { grid, placed, placements } = layout;
  const placementsByWord = useMemo(
    () => new Map(placements.map((placement) => [placement.word, placement])),
    [placements],
  );
  const [found, setFound] = useState<Set<string>>(() => new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(() => new Set());
  const [selection, setSelection] = useState<GridCell[]>([]);
  const [passed, setPassed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const completedRef = useRef(false);
  const anchorRef = useRef<GridCell | null>(null);
  const draggingRef = useRef(false);
  const selectionRef = useRef<GridCell[]>([]);

  const reset = () => {
    completedRef.current = false;
    setPassed(false);
    setSubmitted(false);
    setFound(new Set());
    setFoundCells(new Set());
    setSelection([]);
    anchorRef.current = null;
    draggingRef.current = false;
  };

  useEffect(() => {
    setLayout(buildGrid(props.words, size, layoutSeed));
    reset();
  }, [checkId, wordsKey, size, layoutSeed, props.words]);

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
        getCurrentState: () => ({
          found: [...found],
          passed,
          submitted,
          completed: completedRef.current,
          grid: layout.grid,
          placed: layout.placed,
          placements: layout.placements,
        }),
        resume: (state) => {
          const restored = restoreWordSearchLayout(state, props.words, size);
          const activeLayout = restored ?? layout;
          if (restored) setLayout(restored);
          const activePlacementsByWord = new Map(
            activeLayout.placements.map((placement) => [placement.word, placement]),
          );
          const raw = state.found;
          if (Array.isArray(raw)) {
            const nextFound = new Set(raw.filter((w): w is string => typeof w === "string"));
            setFound(nextFound);
            setFoundCells(foundCellsForWords(nextFound, activePlacementsByWord));
          }
          readBooleanStateField(state, "passed", setPassed);
          readBooleanStateField(state, "submitted", setSubmitted);
          restoreCompletedRefFromResumeState(completedRef, state, {
            enableRetry: props.enableRetry,
          });
        },
      }),
    [checkId, found, layout, maxScore, passed, passedThreshold, placementsByWord, props.words, score, size, submitted],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const applyFoundWord = (word: string) => {
    const placement = placementsByWord.get(word);
    setFound((prev) => new Set([...prev, word]));
    if (placement) {
      setFoundCells((prev) => new Set([...prev, ...placementCellKeys(placement)]));
    }
  };

  const tryMatch = (cells: GridCell[]) => {
    const match = matchPlacement(placed, grid, cells);
    if (match) {
      applyFoundWord(match);
    }
    selectionRef.current = [];
    setSelection([]);
    anchorRef.current = null;
  };

  const beginSelection = (row: number, col: number, event: React.PointerEvent<HTMLButtonElement>) => {
    if (passed && !props.enableRetry) return;
    event.preventDefault();
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const anchor = { row, col };
    anchorRef.current = anchor;
    draggingRef.current = true;
    selectionRef.current = [anchor];
    setSelection([anchor]);
  };

  const extendSelection = (row: number, col: number) => {
    if (!draggingRef.current || !anchorRef.current) return;
    const path = cellsAlongHorizontalLine(anchorRef.current, { row, col });
    if (path) {
      selectionRef.current = path;
      setSelection(path);
    }
  };

  const endSelection = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    tryMatch(selectionRef.current);
  };

  const check = () => {
    setSubmitted(true);
    const ok = passedThreshold && maxScore > 0;
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

  const selectionKeys = useMemo(() => new Set(selection.map((cell) => cellKey(cell.row, cell.col))), [selection]);

  return (
    <section
      className="lk-word-search"
      aria-label="Word search"
      data-lk-check-id={checkId}
      data-testid="word-search"
    >
      <div
        className="lk-word-search-grid"
        role="grid"
        aria-rowcount={size}
        aria-colcount={size}
      >
        {grid.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="lk-word-search-row"
            role="row"
            aria-rowindex={rowIndex + 1}
          >
            {row.map((letter, colIndex) => {
              const key = cellKey(rowIndex, colIndex);
              const selected = selectionKeys.has(key);
              const discovered = foundCells.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    "lk-word-search-cell",
                    selected ? "lk-word-search-cell--selecting" : "",
                    discovered ? "lk-word-search-cell--found" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  role="gridcell"
                  aria-rowindex={rowIndex + 1}
                  aria-colindex={colIndex + 1}
                  aria-pressed={selected || discovered}
                  data-testid={`word-search-cell-${rowIndex}-${colIndex}`}
                  onPointerDown={(event) => beginSelection(rowIndex, colIndex, event)}
                  onPointerEnter={() => extendSelection(rowIndex, colIndex)}
                  onPointerUp={endSelection}
                  onLostPointerCapture={endSelection}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <ul className="lk-word-search-bank" data-testid="word-search-bank">
        {placed.map((word) => (
          <li
            key={word}
            className={found.has(word) ? "lk-word-search-bank-item--found" : ""}
            aria-checked={found.has(word)}
          >
            {word}
          </li>
        ))}
      </ul>
      <button type="button" className="lk-button" data-testid="word-search-check" onClick={check}>
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
