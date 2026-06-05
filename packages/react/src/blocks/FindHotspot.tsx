import React, { forwardRef, useMemo, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanStateField, readStringField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { setLessonkitBlockType } from "../compound/blockType";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type HotspotTarget = {
  id: string;
  label: string;
  x: number;
  y: number;
};

export type FindHotspotProps = AssessmentBaseProps & {
  src: string;
  alt: string;
  targets: HotspotTarget[];
  correctTargetId: string;
};

const INTERACTION: AssessmentInteractionType = "findHotspot";

function FindHotspotInner(
  props: FindHotspotProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const assessment = useAssessmentState(props.enclosingLessonId);

  const correct = selected === props.correctTargetId;

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => (checked && correct ? 1 : 0),
        getMaxScore: () => 1,
        getAnswerGiven: () => selected !== null,
        resetTask: () => {
          setSelected(null);
          setChecked(false);
        },
        showSolutions: () => setSelected(props.correctTargetId),
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: selected ?? undefined,
          correct: checked ? correct : undefined,
          score: checked && correct ? 1 : 0,
          maxScore: 1,
        }),
        getCurrentState: () => ({ selected, checked }),
        resume: (state) => {
          const nextSelected = readStringField(state, "selected");
          if (typeof nextSelected === "string") setSelected(nextSelected);
          readBooleanStateField(state, "checked", setChecked);
        },
      }),
    [checkId, selected, checked, correct, props.correctTargetId],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const selectTarget = (id: string) => {
    setSelected(id);
    setChecked(false);
  };

  const submit = () => {
    if (!selected || checked) return;
    setChecked(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: selected,
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
    <section aria-label="Find the hotspot" data-lk-check-id={checkId} data-testid="find-hotspot">
      <div style={{ position: "relative", display: "inline-block" }}>
        <img src={props.src} alt={props.alt} style={{ maxWidth: "100%" }} />
        {props.targets.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-label={t.label}
            aria-pressed={selected === t.id}
            data-testid={`target-${t.id}`}
            style={{
              position: "absolute",
              left: `${t.x}%`,
              top: `${t.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => selectTarget(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button type="button" data-testid="check-hotspot" disabled={!selected} onClick={submit}>
        Check
      </button>
      {checked ? (
        <p role="status">{correct ? "Correct" : "Try again"}</p>
      ) : null}
    </section>
  );
}

const FindHotspotInnerForwarded = forwardRef(FindHotspotInner);

export const FindHotspot = forwardRef<AssessmentHandle, FindHotspotProps>(function FindHotspot(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="FindHotspot" checkId={props.checkId}>
      {(enclosingLessonId) => (
        <FindHotspotInnerForwarded {...props} enclosingLessonId={enclosingLessonId} ref={ref} />
      )}
    </AssessmentLessonGuard>
  );
});

setLessonkitBlockType(FindHotspot, "FindHotspot");
