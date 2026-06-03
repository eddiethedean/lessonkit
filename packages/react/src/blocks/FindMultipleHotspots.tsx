import React, { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { useRegisterAssessmentHandle } from "../assessment/AssessmentSequenceContext";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { setLessonkitBlockType } from "../compound/blockType";
import { normalizeComponentId } from "../runtime/validateComponentId";
import type { HotspotTarget } from "./FindHotspot";

export type FindMultipleHotspotsProps = AssessmentBaseProps & {
  src: string;
  alt: string;
  targets: HotspotTarget[];
  correctTargetIds: string[];
};

const INTERACTION: AssessmentInteractionType = "findMultipleHotspots";

function FindMultipleHotspotsInner(
  props: FindMultipleHotspotsProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const assessment = useAssessmentState(props.enclosingLessonId);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const correct =
    selected.size === props.correctTargetIds.length &&
    props.correctTargetIds.every((id) => selected.has(id));

  const handle = useMemo((): AssessmentHandle => {
    const maxScore = 1;
    const score = checked && correct ? 1 : 0;
    return {
      getScore: () => score,
      getMaxScore: () => maxScore,
      getAnswerGiven: () => selected.size > 0,
      resetTask: () => {
        setSelected(new Set());
        setChecked(false);
      },
      showSolutions: () => setSelected(new Set(props.correctTargetIds)),
      getXAPIData: () => ({
        checkId,
        interactionType: INTERACTION,
        response: [...selected],
        correct: checked ? correct : undefined,
        score,
        maxScore,
      }),
      getCurrentState: () => ({ selected: [...selected], checked }),
      resume: (state) => {
        const s = state as { selected?: string[]; checked?: boolean };
        if (Array.isArray(s.selected)) setSelected(new Set(s.selected));
        if (typeof s.checked === "boolean") setChecked(s.checked);
      },
    };
  }, [checkId, selected, checked, correct, props.correctTargetIds]);

  useImperativeHandle(ref, () => handle, [handle]);
  useRegisterAssessmentHandle(checkId, handle);

  const submit = () => {
    if (selected.size === 0) return;
    setChecked(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: [...selected],
      correct,
    });
    if (correct) {
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: 1,
        maxScore: 1,
        passingScore: props.passingScore,
      });
    }
  };

  return (
    <section aria-label="Find multiple hotspots" data-lk-check-id={checkId} data-testid="find-multiple-hotspots">
      <div style={{ position: "relative", display: "inline-block" }}>
        <img src={props.src} alt={props.alt} style={{ maxWidth: "100%" }} />
        {props.targets.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-label={t.label}
            aria-pressed={selected.has(t.id)}
            data-testid={`target-${t.id}`}
            style={{
              position: "absolute",
              left: `${t.x}%`,
              top: `${t.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => toggle(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button type="button" data-testid="check-hotspots" disabled={selected.size === 0} onClick={submit}>
        Check
      </button>
      {checked ? (
        <p role="status">{correct ? "Correct" : "Try again"}</p>
      ) : null}
    </section>
  );
}

const FindMultipleHotspotsInnerForwarded = forwardRef(FindMultipleHotspotsInner);

export const FindMultipleHotspots = forwardRef<AssessmentHandle, FindMultipleHotspotsProps>(
  function FindMultipleHotspots(props, ref) {
    return (
      <AssessmentLessonGuard blockLabel="FindMultipleHotspots" checkId={props.checkId}>
        {(enclosingLessonId) => (
          <FindMultipleHotspotsInnerForwarded {...props} enclosingLessonId={enclosingLessonId} ref={ref} />
        )}
      </AssessmentLessonGuard>
    );
  },
);

setLessonkitBlockType(FindMultipleHotspots, "FindMultipleHotspots");
