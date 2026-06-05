import React, { forwardRef, useMemo, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanStateField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
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
    setChecked(false);
  };

  const correct =
    selected.size === props.correctTargetIds.length &&
    props.correctTargetIds.every((id) => selected.has(id));

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => (checked && correct ? 1 : 0),
        getMaxScore: () => 1,
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
          score: checked && correct ? 1 : 0,
          maxScore: 1,
        }),
        getCurrentState: () => ({ selected: [...selected], checked }),
        resume: (state) => {
          const raw = state.selected;
          if (Array.isArray(raw)) setSelected(new Set(raw.filter((id): id is string => typeof id === "string")));
          readBooleanStateField(state, "checked", setChecked);
        },
      }),
    [checkId, selected, checked, correct, props.correctTargetIds],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const submit = () => {
    if (selected.size === 0 || checked) return;
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
        passingScore: props.passingScore ?? 1,
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
