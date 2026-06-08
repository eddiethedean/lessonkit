import React, { useId } from "react";
import { setLessonkitBlockType } from "../compound/blockType";
import { useGameMapOptional } from "../compound/useGameMap";

export type MapExitProps = {
  label: string;
  targetStageId: string;
  scoreWeight?: number;
  disabled?: boolean;
  fromStageId?: string;
};

export function MapExit(props: MapExitProps) {
  const ctx = useGameMapOptional();
  const groupId = useId();
  const fromStageId = props.fromStageId ?? ctx?.activeStageId ?? "";
  const isActiveStage = ctx ? ctx.activeStageId === fromStageId : true;
  const locked = ctx?.exitsLocked ?? false;

  const onSelect = () => {
    if (!ctx || !fromStageId || props.disabled || locked || !isActiveStage) return;
    ctx.navigateToStage({
      fromStageId,
      toStageId: props.targetStageId,
      label: props.label,
      scoreWeight: props.scoreWeight,
    });
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={false}
      aria-labelledby={groupId}
      data-testid={`map-exit-${props.targetStageId}`}
      disabled={props.disabled || locked || !isActiveStage}
      onClick={onSelect}
    >
      <span id={groupId}>{props.label}</span>
    </button>
  );
}

setLessonkitBlockType(MapExit, "MapExit");
