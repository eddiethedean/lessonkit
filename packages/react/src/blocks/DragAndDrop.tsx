import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { useRegisterAssessmentHandle } from "../assessment/AssessmentSequenceContext";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type DragItem = { id: string; label: string };
export type DropTarget = { id: string; label: string; accepts: string };

export type DragAndDropProps = AssessmentBaseProps & {
  items: DragItem[];
  targets: DropTarget[];
};

const INTERACTION: AssessmentInteractionType = "dragAndDrop";

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
  const completedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    setPassed(false);
    setAssignments(Object.fromEntries(props.targets.map((t) => [t.id, ""])));
    setPool(props.items.map((i) => i.id));
    setKeyboardItem(null);
  };

  useEffect(() => {
    reset();
  }, [checkId, props.items.map((i) => i.id).join(","), props.targets.map((t) => t.id).join(",")]);

  const allFilled = props.targets.every((t) => (assignments[t.id] ?? "").length > 0);
  const allCorrect = props.targets.every((t) => assignments[t.id] === t.accepts);

  const handle = useMemo((): AssessmentHandle => {
    const maxScore = props.targets.length || 1;
    let score = 0;
    props.targets.forEach((t) => {
      if (assignments[t.id] === t.accepts) score += 1;
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
        response: assignments,
        correct: allCorrect,
        score,
        maxScore,
      }),
    };
  }, [allCorrect, allFilled, assignments, checkId, props.targets]);

  useImperativeHandle(ref, () => handle, [handle]);
  useRegisterAssessmentHandle(checkId, handle);

  const place = (targetId: string, itemId: string) => {
    if (passed && !props.enableRetry) return;
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
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: assignments,
      correct: allCorrect,
    });
    if (allCorrect && !completedRef.current) {
      completedRef.current = true;
      setPassed(true);
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: props.targets.length,
        maxScore: props.targets.length,
        passingScore: props.passingScore ?? props.targets.length,
      });
    }
  };

  return (
    <section aria-label="Drag and Drop" data-lk-check-id={checkId}>
      <p>Match each item to the correct target (drag or use keyboard: select item, then activate target).</p>
      <div role="list" aria-label="Draggable items">
        {pool.map((id) => {
          const item = props.items.find((i) => i.id === id)!;
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
      <button type="button" data-testid="check-drag-drop" disabled={!allFilled || passed} onClick={check}>
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

const DragAndDropInnerForwarded = forwardRef(DragAndDropInner);

export const DragAndDrop = forwardRef<AssessmentHandle, DragAndDropProps>(function DragAndDrop(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="DragAndDrop" checkId={props.checkId}>
      {(lessonId) => <DragAndDropInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});
