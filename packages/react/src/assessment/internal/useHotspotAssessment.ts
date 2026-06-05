import { useCallback, useMemo, useState } from "react";
import type { AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import { buildAssessmentHandle } from "./buildAssessmentHandle";
import { readBooleanStateField, readStringField } from "./resumeState";

export type HotspotTarget = { id: string; label: string; x: number; y: number };

type SingleHotspotOpts = {
  checkId: string;
  interactionType: AssessmentInteractionType;
  correctTargetId: string;
  getSelected: () => string | null;
  getChecked: () => boolean;
  setSelected: (id: string | null) => void;
  setChecked: (checked: boolean) => void;
  isCorrect: () => boolean;
};

type MultipleHotspotOpts = {
  checkId: string;
  interactionType: AssessmentInteractionType;
  correctTargetIds: string[];
  getSelected: () => Set<string>;
  setSelected: (next: Set<string>) => void;
  getChecked: () => boolean;
  setChecked: (checked: boolean) => void;
  isCorrect: () => boolean;
};

export function useSingleHotspotAssessmentHandle(opts: SingleHotspotOpts): AssessmentHandle {
  const {
    checkId,
    interactionType,
    correctTargetId,
    getSelected,
    getChecked,
    setSelected,
    setChecked,
    isCorrect,
  } = opts;

  return useMemo(() => {
    const maxScore = 1;
    return buildAssessmentHandle({
      checkId,
      getScore: () => (getChecked() && isCorrect() ? 1 : 0),
      getMaxScore: () => maxScore,
      getAnswerGiven: () => getSelected() !== null,
      resetTask: () => {
        setSelected(null);
        setChecked(false);
      },
      showSolutions: () => setSelected(correctTargetId),
      getXAPIData: () => ({
        checkId,
        interactionType,
        response: getSelected() ?? undefined,
        correct: getChecked() ? isCorrect() : undefined,
        score: getChecked() && isCorrect() ? 1 : 0,
        maxScore,
      }),
      getCurrentState: () => ({ selected: getSelected(), checked: getChecked() }),
      resume: (state) => {
        const selected = readStringField(state, "selected");
        if (typeof selected === "string") setSelected(selected);
        readBooleanStateField(state, "checked", setChecked);
      },
    });
  }, [
    checkId,
    correctTargetId,
    getChecked,
    getSelected,
    interactionType,
    isCorrect,
    setChecked,
    setSelected,
  ]);
}

export function useMultipleHotspotAssessmentHandle(opts: MultipleHotspotOpts): AssessmentHandle {
  const {
    checkId,
    interactionType,
    correctTargetIds,
    getSelected,
    setSelected,
    getChecked,
    setChecked,
    isCorrect,
  } = opts;

  return useMemo(() => {
    const maxScore = 1;
    return buildAssessmentHandle({
      checkId,
      getScore: () => (getChecked() && isCorrect() ? 1 : 0),
      getMaxScore: () => maxScore,
      getAnswerGiven: () => getSelected().size > 0,
      resetTask: () => {
        setSelected(new Set());
        setChecked(false);
      },
      showSolutions: () => setSelected(new Set(correctTargetIds)),
      getXAPIData: () => ({
        checkId,
        interactionType,
        response: [...getSelected()],
        correct: getChecked() ? isCorrect() : undefined,
        score: getChecked() && isCorrect() ? 1 : 0,
        maxScore,
      }),
      getCurrentState: () => ({ selected: [...getSelected()], checked: getChecked() }),
      resume: (state) => {
        const raw = state.selected;
        if (Array.isArray(raw)) setSelected(new Set(raw.filter((id): id is string => typeof id === "string")));
        readBooleanStateField(state, "checked", setChecked);
      },
    });
  }, [
    checkId,
    correctTargetIds,
    getChecked,
    getSelected,
    interactionType,
    isCorrect,
    setChecked,
    setSelected,
  ]);
}

export function useHotspotSelection(initial?: string | null) {
  const [selected, setSelectedState] = useState<string | null>(initial ?? null);
  const setSelected = useCallback((id: string | null) => setSelectedState(id), []);
  return { selected, setSelected, getSelected: () => selected };
}

export function useMultipleHotspotSelection() {
  const [selected, setSelectedState] = useState<Set<string>>(() => new Set());
  const setSelected = useCallback((next: Set<string>) => setSelectedState(next), []);
  const toggle = useCallback((id: string) => {
    setSelectedState((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  return { selected, setSelected, toggle, getSelected: () => selected };
}
