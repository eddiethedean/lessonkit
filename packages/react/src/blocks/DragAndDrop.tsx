import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import {
  readBooleanStateField,
  restoreCompletedRefFromResumeState,
} from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { usePluginScoring } from "../assessment/internal/usePluginScoring";
import { meetsPassingThreshold } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { useLessonkit } from "../hooks";
import { TouchHint, useDualModeDrag } from "../interaction";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type DragItem = { id: string; label: string };
export type DropTarget = { id: string; label: string; accepts: string };

export type DragAndDropProps = AssessmentBaseProps & {
  items: DragItem[];
  targets: DropTarget[];
};

const INTERACTION: AssessmentInteractionType = "dragAndDrop";

function flyItemToPool(
  label: string,
  fromX: number,
  fromY: number,
  poolSlot: HTMLElement,
  onComplete: () => void,
): void {
  const toRect = poolSlot.getBoundingClientRect();
  const toX = toRect.left + toRect.width / 2;
  const toY = toRect.top + toRect.height / 2;
  const flyer = document.createElement("span");
  flyer.className = "lk-drag-flyer";
  flyer.textContent = label;
  flyer.style.left = `${fromX}px`;
  flyer.style.top = `${fromY}px`;
  document.body.appendChild(flyer);

  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  const animation = flyer.animate(
    [
      { transform: "translate(-50%, -50%)", opacity: 1 },
      { transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`, opacity: 1 },
    ],
    { duration: 260, easing: "ease-out", fill: "forwards" },
  );

  const finish = () => {
    flyer.remove();
    onComplete();
  };

  animation.onfinish = finish;
  animation.oncancel = finish;
}

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
    const claimed = new Set<string>();
    for (const targetId of targetIds) {
      const value = (rawAssignments as Record<string, unknown>)[targetId];
      if (typeof value !== "string" || value === "" || !itemIds.has(value) || claimed.has(value)) {
        continue;
      }
      assignments[targetId] = value;
      claimed.add(value);
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
  const { config } = useLessonkit();
  const { scoreResponse } = usePluginScoring(checkId, props.enclosingLessonId);
  const itemIds = useMemo(() => new Set(props.items.map((i) => i.id)), [props.items]);
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(props.targets.map((t) => [t.id, ""])),
  );
  const [pool, setPool] = useState<string[]>(() => props.items.map((i) => i.id));
  const [htmlDraggingItemId, setHtmlDraggingItemId] = useState<string | null>(null);
  const [flyingItemId, setFlyingItemId] = useState<string | null>(null);
  const [htmlHoverDropId, setHtmlHoverDropId] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const [checked, setChecked] = useState(false);
  const completedRef = useRef(false);
  const dragDroppedRef = useRef(false);
  const draggingItemIdRef = useRef<string | null>(null);
  const telemetryReplayedRef = useRef(false);
  const pointerDragCancelRef = useRef<() => void>(() => {});
  const placeRef = useRef<(targetId: string, itemId: string) => void>(() => {});
  const animateReturnToPoolRef = useRef<(itemId: string, fromX: number, fromY: number) => void>(() => {});
  const findTargetForItemRef = useRef<(itemId: string) => string | undefined>(() => undefined);
  const clearDragStateRef = useRef<() => void>(() => {});
  const passedRetryRef = useRef({ passed: false, enableRetry: props.enableRetry });

  const dualMode = useDualModeDrag<string>({
    onHover: (dropId) => setHtmlHoverDropId(dropId),
    onDrop: (itemId, dropId) => {
      dragDroppedRef.current = true;
      placeRef.current(dropId, itemId);
      clearDragStateRef.current();
    },
    onReturnToPool: (itemId, clientX, clientY) => {
      if (findTargetForItemRef.current(itemId)) {
        animateReturnToPoolRef.current(itemId, clientX, clientY);
      }
      clearDragStateRef.current();
    },
    canStart: () => !(passedRetryRef.current.passed && !passedRetryRef.current.enableRetry),
  });
  const { pickAndPlace: pickPlace, pointerDrag, useHtmlDrag, showTouchHint } = dualMode;
  const keyboardItem = pickPlace.selected;
  passedRetryRef.current = { passed, enableRetry: props.enableRetry };

  const reset = () => {
    completedRef.current = false;
    telemetryReplayedRef.current = false;
    setPassed(false);
    setChecked(false);
    setAssignments(Object.fromEntries(props.targets.map((t) => [t.id, ""])));
    setPool(props.items.map((i) => i.id));
    pickPlace.clear();
    setHtmlDraggingItemId(null);
    setFlyingItemId(null);
    setHtmlHoverDropId(null);
    pointerDragCancelRef.current();
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

  const replayTelemetry = (
    nextAssignments: Record<string, string>,
    nextPassed: boolean,
    nextChecked: boolean,
    nextScore: number,
    nextMaxScore: number,
  ) => {
    if (telemetryReplayedRef.current || (!nextChecked && !nextPassed)) return;
    telemetryReplayedRef.current = true;
    const nextPassedThreshold = meetsPassingThreshold(
      nextScore,
      nextMaxScore,
      props.passingScore,
    );
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: nextAssignments,
      correct: nextPassedThreshold,
    });
    if (nextPassedThreshold || props.enableRetry === false) {
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: nextScore,
        maxScore: nextMaxScore,
        passingScore: props.passingScore ?? nextMaxScore,
      });
    }
  };

  const handle = useMemo(() => {
    return buildAssessmentHandle({
      checkId,
      getScore: () => score,
      getMaxScore: () => maxScore,
      getAnswerGiven: () => checked,
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
      getCurrentState: () => ({
        assignments,
        pool,
        passed,
        checked,
        keyboardItem,
        completed: completedRef.current,
      }),
      resume: (state) => {
        const normalized = normalizeDragAndDropState(
          state.assignments,
          state.pool,
          props.items,
          props.targets,
        );
        setAssignments(normalized.assignments);
        setPool(normalized.pool);
        let nextPassed = passed;
        readBooleanStateField(state, "passed", (value) => {
          nextPassed = value;
          setPassed(value);
        });
        let nextChecked = checked;
        readBooleanStateField(state, "checked", (value) => {
          nextChecked = value;
          setChecked(value);
        });
        const item = state.keyboardItem;
        if (item === null || typeof item === "string") pickPlace.setSelected(item ?? null);
        restoreCompletedRefFromResumeState(completedRef, state, {
          enableRetry: props.enableRetry,
        });
        let nextScore = 0;
        props.targets.forEach((t) => {
          if (normalized.assignments[t.id] === t.accepts) nextScore += 1;
        });
        if (config.tracking?.replayResumeEvents === true) {
          replayTelemetry(
            normalized.assignments,
            nextPassed,
            nextChecked,
            nextScore,
            props.targets.length || 1,
          );
        }
      },
    });
  }, [assignments, checkId, checked, config.tracking?.replayResumeEvents, keyboardItem, maxScore, passed, passedThreshold, pool, props.items, props.targets, score]);

  useAssessmentHandleRegistration(checkId, handle, ref);

  const findTargetForItem = (itemId: string): string | undefined =>
    props.targets.find((target) => assignments[target.id] === itemId)?.id;

  const place = (targetId: string, itemId: string) => {
    if (!itemIds.has(itemId)) return;
    if (passed && !props.enableRetry) return;
    setChecked(false);
    const sourceTargetId = findTargetForItem(itemId);
    const prev = assignments[targetId];
    setAssignments((a) => {
      const next = { ...a, [targetId]: itemId };
      if (sourceTargetId) next[sourceTargetId] = "";
      return next;
    });
    setPool((p) => {
      const next = p.filter((id) => id !== itemId);
      if (prev && prev !== itemId) next.push(prev);
      return next;
    });
    pickPlace.clear();
  };

  const returnToPool = (itemId: string) => {
    if (passed && !props.enableRetry) return;
    const sourceTargetId = findTargetForItem(itemId);
    if (!sourceTargetId) return;
    setChecked(false);
    setAssignments((a) => ({ ...a, [sourceTargetId]: "" }));
    setPool((p) => (p.includes(itemId) ? p : [...p, itemId]));
    pickPlace.clear();
  };

  const animateReturnToPool = (itemId: string, fromX: number, fromY: number) => {
    const label = props.items.find((entry) => entry.id === itemId)?.label ?? "";
    flushSync(() => {
      returnToPool(itemId);
    });
    const poolSlot = document.querySelector(`[data-pool-slot="${itemId}"]`);
    if (poolSlot instanceof HTMLElement && typeof poolSlot.animate === "function") {
      setFlyingItemId(itemId);
      flyItemToPool(label, fromX, fromY, poolSlot, () => setFlyingItemId(null));
    }
  };

  const clearDragState = () => {
    dragDroppedRef.current = false;
    draggingItemIdRef.current = null;
    setHtmlDraggingItemId(null);
    setHtmlHoverDropId(null);
  };

  const finishDragOutside = (itemId: string | null, clientX: number, clientY: number) => {
    if (!dragDroppedRef.current && itemId && findTargetForItem(itemId)) {
      animateReturnToPool(itemId, clientX, clientY);
    }
    clearDragState();
    pointerDragCancelRef.current();
  };

  const endDrag = (event?: React.DragEvent) => {
    const itemId = draggingItemIdRef.current;
    finishDragOutside(itemId, event?.clientX ?? 0, event?.clientY ?? 0);
  };

  placeRef.current = place;
  animateReturnToPoolRef.current = animateReturnToPool;
  findTargetForItemRef.current = findTargetForItem;
  clearDragStateRef.current = clearDragState;
  pointerDragCancelRef.current = pointerDrag.cancel;

  const commitDrop = () => {
    dragDroppedRef.current = true;
  };

  const startDrag = (event: React.DragEvent, itemId: string) => {
    event.dataTransfer.setData("text/plain", itemId);
    event.dataTransfer.effectAllowed = "move";
    dragDroppedRef.current = false;
    draggingItemIdRef.current = itemId;
    setHtmlDraggingItemId(itemId);
  };

  const draggingItemId = pointerDrag.draggingItemId ?? htmlDraggingItemId;
  const hoverDropId = pointerDrag.hoverDropId ?? htmlHoverDropId;

  const isDropHover = (dropId: string) => draggingItemId !== null && hoverDropId === dropId;

  const isPoolReturnHover = Boolean(
    draggingItemId && isDropHover("pool") && findTargetForItem(draggingItemId),
  );

  const poolItemClassName = (itemId: string) =>
    ["lk-drag-item", flyingItemId === itemId ? "lk-drag-item--in-flight" : ""].filter(Boolean).join(" ");

  const leaveDropZone = (event: React.DragEvent, dropId: string) => {
    const related = event.relatedTarget;
    if (related instanceof Node && event.currentTarget.contains(related)) return;
    setHtmlHoverDropId((current) => (current === dropId ? null : current));
  };

  const renderDragPreview = (itemId: string) => {
    const item = props.items.find((entry) => entry.id === itemId);
    if (!item) return null;
    return (
      <span className="lk-drag-item lk-drag-item--ghost" aria-hidden="true">
        {item.label}
      </span>
    );
  };

  const check = () => {
    if (!allFilled) return;
    setChecked(true);
    const scored = scoreResponse(assignments, passedThreshold, maxScore, props.passingScore);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: assignments,
      correct: scored.passed,
    });
    if ((scored.passed || props.enableRetry === false) && !completedRef.current) {
      completedRef.current = true;
      if (scored.passed) setPassed(true);
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: scored.score,
        maxScore: scored.maxScore,
        passingScore: props.passingScore ?? scored.maxScore,
      });
    }
  };

  return (
    <section aria-label="Drag and Drop" data-lk-check-id={checkId}>
      <p>
        Match each item to the correct target. Drag items back to the item bank to remove them, or select
        an item then activate a target or the item bank.
      </p>
      {showTouchHint ? (
        <TouchHint>
          Tap an item, then tap a target. Tap the item bank to return a placed item.
        </TouchHint>
      ) : null}
      <div
        role="list"
        aria-label="Draggable items"
        data-testid="drag-pool"
        data-lk-drop-id="pool"
        className={["lk-drag-pool", isPoolReturnHover ? "lk-drag-pool--hover" : ""]
          .filter(Boolean)
          .join(" ")}
        onDragOver={useHtmlDrag ? (event) => event.preventDefault() : undefined}
        onDragEnter={
          useHtmlDrag
            ? () => {
                if (draggingItemId && findTargetForItem(draggingItemId)) {
                  setHtmlHoverDropId("pool");
                }
              }
            : undefined
        }
        onDragLeave={useHtmlDrag ? (event) => leaveDropZone(event, "pool") : undefined}
        onDrop={
          useHtmlDrag
            ? (event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/plain");
                if (id && itemIds.has(id)) {
                  commitDrop();
                  returnToPool(id);
                }
                endDrag(event);
              }
            : undefined
        }
        onClick={() => {
          if (keyboardItem && findTargetForItem(keyboardItem)) returnToPool(keyboardItem);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && keyboardItem && findTargetForItem(keyboardItem)) {
            returnToPool(keyboardItem);
          }
        }}
      >
        {pool.flatMap((id) => {
          const item = props.items.find((i) => i.id === id);
          if (!item) return [];
          return (
            <button
              key={id}
              type="button"
              draggable={useHtmlDrag}
              className={poolItemClassName(id)}
              data-testid={`drag-item-${id}`}
              data-pool-slot={id}
              aria-pressed={keyboardItem === id}
              onDragStart={useHtmlDrag ? (event) => startDrag(event, id) : undefined}
              onDragEnd={useHtmlDrag ? (event) => endDrag(event) : undefined}
              onPointerDown={(event) => pointerDrag.start(event, id)}
              onPointerMove={pointerDrag.move}
              onPointerUp={pointerDrag.end}
              onPointerCancel={pointerDrag.cancel}
              onClick={() => {
                if (pointerDrag.shouldSuppressClick()) return;
                pickPlace.toggle(id);
              }}
            >
              {item.label}
            </button>
          );
        })}
        {isPoolReturnHover && draggingItemId ? renderDragPreview(draggingItemId) : null}
        {pool.length === 0 && !isPoolReturnHover ? (
          <span className="lk-drag-pool-placeholder" aria-hidden="true">
            Drop items here to return them
          </span>
        ) : null}
      </div>
      <ul>
        {props.targets.map((target) => {
          const assigned = assignments[target.id];
          const assignedItem = assigned
            ? props.items.find((i) => i.id === assigned)
            : undefined;
          return (
            <li key={target.id} className="lk-drag-target-row">
              <strong>{target.label}</strong>{" "}
              <span
                role="button"
                tabIndex={0}
                className={[
                  "lk-drag-target",
                  isDropHover(target.id) ? "lk-drag-target--hover" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-testid={`drop-${target.id}`}
                data-lk-drop-id={target.id}
                onDragEnter={useHtmlDrag ? () => draggingItemId && setHtmlHoverDropId(target.id) : undefined}
                onDragLeave={useHtmlDrag ? (event) => leaveDropZone(event, target.id) : undefined}
                onDragOver={useHtmlDrag ? (event) => event.preventDefault() : undefined}
                onDrop={
                  useHtmlDrag
                    ? (event) => {
                        event.preventDefault();
                        const id = event.dataTransfer.getData("text/plain");
                        if (id && itemIds.has(id)) {
                          commitDrop();
                          place(target.id, id);
                        }
                        endDrag(event);
                      }
                    : undefined
                }
                onClick={() => keyboardItem && place(target.id, keyboardItem)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && keyboardItem) place(target.id, keyboardItem);
                }}
              >
                {assignedItem ? (
                  <button
                    type="button"
                    draggable={useHtmlDrag}
                    className="lk-drag-item"
                    data-testid={`drag-item-${assignedItem.id}`}
                    aria-pressed={keyboardItem === assignedItem.id}
                    onDragStart={
                      useHtmlDrag
                        ? (event) => {
                            event.stopPropagation();
                            startDrag(event, assignedItem.id);
                          }
                        : undefined
                    }
                    onDragEnd={useHtmlDrag ? (event) => endDrag(event) : undefined}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      pointerDrag.start(event, assignedItem.id);
                    }}
                    onPointerMove={pointerDrag.move}
                    onPointerUp={pointerDrag.end}
                    onPointerCancel={pointerDrag.cancel}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (pointerDrag.shouldSuppressClick()) return;
                      pickPlace.toggle(assignedItem.id);
                    }}
                  >
                    {assignedItem.label}
                  </button>
                ) : isDropHover(target.id) && draggingItemId ? (
                  renderDragPreview(draggingItemId)
                ) : (
                  <span className="lk-drag-target-placeholder">Drop here</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="lk-button"
        data-testid="check-drag-drop"
        disabled={!hasTargets || !allFilled || (!props.enableRetry && (passed || checked))}
        onClick={check}
      >
        Check
      </button>
      {checked ? (
        <p role="status" aria-live="polite">
          {passed ? "Correct" : "Try again"}
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
