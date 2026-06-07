import React, { forwardRef, useEffect, useMemo, useState } from "react";
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

  const correctSet = useMemo(
    () => new Set(props.correctTargetIds),
    [props.correctTargetIds],
  );
  const targetIdsKey = props.targets.map((t) => t.id).join("\0");
  const correctIdsKey = props.correctTargetIds.join("\0");

  useEffect(() => {
    setSelected(new Set());
    setChecked(false);
  }, [checkId, correctIdsKey, targetIdsKey]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setChecked(false);
  };

  const maxScore = props.correctTargetIds.length || 1;
  const score = props.correctTargetIds.filter((id) => selected.has(id)).length;
  const wrongSelected = [...selected].filter((id) => !correctSet.has(id)).length;
  const passedThreshold =
    meetsPassingThreshold(score, maxScore, props.passingScore) && wrongSelected === 0;
  const isFactuallyCorrect = (sel: Set<string>) => {
    const wrong = [...sel].filter((id) => !correctSet.has(id)).length;
    const matched = props.correctTargetIds.filter((id) => sel.has(id)).length;
    return (
      wrong === 0 &&
      sel.size === props.correctTargetIds.length &&
      matched === maxScore
    );
  };
  const factualCorrect = checked ? isFactuallyCorrect(selected) : false;
  const validTargetIds = useMemo(
    () => new Set(props.targets.map((t) => t.id)),
    [props.targets],
  );

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
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
          correct: checked ? factualCorrect : undefined,
          score: checked ? score : 0,
          maxScore,
        }),
        getCurrentState: () => ({ selected: [...selected], checked }),
        resume: (state) => {
          const raw = state.selected;
          if (Array.isArray(raw)) {
            setSelected(
              new Set(
                raw.filter(
                  (id): id is string =>
                    typeof id === "string" && validTargetIds.has(id),
                ),
              ),
            );
          }
          readBooleanStateField(state, "checked", setChecked);
        },
      }),
    [
      checkId,
      checked,
      factualCorrect,
      maxScore,
      props.correctTargetIds,
      score,
      selected,
      validTargetIds,
    ],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  const submit = () => {
    if (selected.size === 0 || checked) return;
    const correctAtSubmit = isFactuallyCorrect(selected);
    setChecked(true);
    assessment.answer({
      checkId,
      interactionType: INTERACTION,
      response: [...selected],
      correct: correctAtSubmit,
    });
    if (passedThreshold) {
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score,
        maxScore,
        passingScore: props.passingScore ?? maxScore,
      });
    } else if (props.enableRetry === false) {
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
        <p role="status">{passedThreshold ? "Correct" : "Try again"}</p>
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
