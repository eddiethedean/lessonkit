import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanStateField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { meetsPassingThreshold } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type DragItem = { id: string; label: string };
export type DropTarget = { id: string; label: string; accepts: string };

export type DragAndDropProps = AssessmentBaseProps & {
  items: DragItem[];
  targets: DropTarget[];
};

const INTERACTION: AssessmentInteractionType = "dragAndDrop";

function normalizeDragAndDropState(
  rawAssignments: unknown,
  rawPool: unknown,
  items: DragItem[],
  targets: DropTarget[],
): { assignments: Record<string, string>; pool: string[] } {
  const itemIds = new Set(items.map((i) => i.id));
  const targetIds = targets.map((t) => t.id);
  const assignments = Object.fromEntries(targetIds.map((id) => [id, ""]));

  if (rawAssignments && typeof rawAssignments === "object") {
    for (const targetId of targetIds) {
      const value = (rawAssignments as Record<string, unknown>)[targetId];
      if (typeof value === "string" && (value === "" || itemIds.has(value))) {
        assignments[targetId] = value;
      }
    }
  }

  const assigned = new Set(Object.values(assignments).filter(Boolean));
  const pool: string[] = [];
  const seen = new Set<string>();

  if (Array.isArray(rawPool)) {
    for (const id of rawPool) {
      if (typeof id === "string" && itemIds.has(id) && !assigned.has(id) && !seen.has(id)) {
        pool.push(id);
        seen.add(id);
      }
    }
  }

  for (const item of items) {
    if (!assigned.has(item.id) && !seen.has(item.id)) {
      pool.push(item.id);
      seen.add(item.id);
    }
  }

  return { assignments, pool };
}

function DragAndDropInner(
  props: DragAndDropProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(props.targets.map((t) => [t.id, ""])),
  );
  const [pool, setPool] = useState<string[]>(() => props.items.map((i) => i.id));
  const [keyboardItem, setKeyboardItem] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const [checked, setChecked] = useState(false);
  const completedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    setPassed(false);
    setChecked(false);
    setAssignments(Object.fromEntries(props.targets.map((t) => [t.id, ""])));
    setPool(props.items.map((i) => i.id));
    setKeyboardItem(null);
  };

  useEffect(() => {
    reset();
  }, [checkId, props.items.map((i) => i.id).join(","), props.targets.map((t) => t.id).join(",")]);

  const hasTargets = props.targets.length > 0;
  const allFilled = hasTargets && props.targets.every((t) => (assignments[t.id] ?? "").length > 0);
  let score = 0;
  props.targets.forEach((t) => {
    if (assignments[t.id] === t.accepts) score += 1;
  });
  const maxScore = props.targets.length || 1;
  const passedThreshold = meetsPassingThreshold(score, maxScore, props.passingScore);

  const handle = useMemo(() => {
    return buildAssessmentHandle({
      checkId,
      getScore: () => score,
      getMaxScore: () => maxScore,
      getAnswerGiven: () => hasTargets && allFilled,
      resetTask: reset,
      showSolutions: () => {},
      getXAPIData: () => ({
        checkId,
        interactionType: INTERACTION,
        response: assignments,
        correct: passedThreshold,
        score,
        maxScore,
      }),
      getCurrentState: () => ({ assignments, pool, passed, checked, keyboardItem }),
      resume: (state) => {
        const normalized = normalizeDragAndDropState(
          state.assignments,
          state.pool,
          props.items,
          props.targets,
        );
        setAssignments(normalized.assignments);
        setPool(normalized.pool);
        readBooleanStateField(state, "passed", (value) => {
          setPassed(value);
          completedRef.current = value;
        });
        readBooleanStateField(state, "checked", setChecked);
        const item = state.keyboardItem;
        if (item === null || typeof item === "string") setKeyboardItem(item ?? null);
      },
    });
  }, [allFilled, assignments, checkId, checked, hasTargets, keyboardItem, maxScore, passed, passedThreshold, pool, props.targets, score]);

  useAssessmentHandleRegistration(checkId, handle, ref);

  const place = (targetId: string, itemId: string) => {
    if (passed && !props.enableRetry) return;
    setChecked(false);
    const prev = assignments[targetId];
    setAssignments((a) => ({ ...a, [targetId]: itemId }));
    setPool((p) => {
      const next = p.filter((id) => id !== itemId);
      if (prev) next.push(prev);
      return next;
    });
    setKeyboardItem(null);
  };

  const check = () => {
    if (!allFilled) return;
    setChecked(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: assignments,
      correct: passedThreshold,
    });
    if ((passedThreshold || props.enableRetry === false) && !completedRef.current) {
      completedRef.current = true;
      if (passedThreshold) setPassed(true);
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
    <section aria-label="Drag and Drop" data-lk-check-id={checkId}>
      <p>Match each item to the correct target (drag or use keyboard: select item, then activate target).</p>
      <div role="list" aria-label="Draggable items">
        {pool.flatMap((id) => {
          const item = props.items.find((i) => i.id === id);
          if (!item) return [];
          return (
            <button
              key={id}
              type="button"
              draggable
              data-testid={`drag-item-${id}`}
              aria-pressed={keyboardItem === id}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", id)}
              onClick={() => setKeyboardItem(keyboardItem === id ? null : id)}
              style={{ margin: "0.25rem" }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <ul>
        {props.targets.map((target) => {
          const assigned = assignments[target.id];
          const label = assigned
            ? props.items.find((i) => i.id === assigned)?.label ?? assigned
            : "Drop here";
          return (
            <li key={target.id}>
              <strong>{target.label}</strong>{" "}
              <span
                role="button"
                tabIndex={0}
                data-testid={`drop-${target.id}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) place(target.id, id);
                }}
                onClick={() => keyboardItem && place(target.id, keyboardItem)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && keyboardItem) place(target.id, keyboardItem);
                }}
                style={{
                  display: "inline-block",
                  minWidth: "8em",
                  border: "1px dashed currentColor",
                  padding: "0.25em",
                }}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        data-testid="check-drag-drop"
        disabled={!hasTargets || !allFilled || (passed && !props.enableRetry)}
        onClick={check}
      >
        Check
      </button>
      {checked ? (
        <p role="status" aria-live="polite">
          {passedThreshold ? "Correct" : "Try again"}
        </p>
      ) : null}
    </section>
  );
}

const DragAndDropInnerForwarded = forwardRef(DragAndDropInner);

export const DragAndDrop = forwardRef<AssessmentHandle, DragAndDropProps>(function DragAndDrop(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="DragAndDrop" checkId={props.checkId}>
      {(lessonId) => <DragAndDropInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});
