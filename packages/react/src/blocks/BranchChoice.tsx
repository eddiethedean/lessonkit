import React, { useId } from "react";
import { setLessonkitBlockType } from "../compound/blockType";
import { useBranchingScenarioOptional } from "../compound/useBranchingScenario";

export type BranchChoiceProps = {
  label: string;
  targetNodeId: string;
  scoreWeight?: number;
  disabled?: boolean;
  /** Source node id (set by BranchNode). */
  fromNodeId?: string;
};

export function BranchChoice(props: BranchChoiceProps) {
  const ctx = useBranchingScenarioOptional();
  const groupId = useId();
  const fromNodeId = props.fromNodeId ?? ctx?.activeNodeId ?? "";
  const isActiveNode = ctx ? ctx.activeNodeId === fromNodeId : true;
  const locked = ctx?.choicesLocked ?? false;

  const onSelect = () => {
    if (!ctx || !fromNodeId || props.disabled || locked || !isActiveNode) return;
    ctx.navigateToNode({
      fromNodeId,
      toNodeId: props.targetNodeId,
      label: props.label,
      scoreWeight: props.scoreWeight,
    });
  };

  return (
    <button
      type="button"
      className="lk-button lk-branch-choice"
      role="radio"
      aria-checked={false}
      aria-labelledby={groupId}
      data-testid={`branch-choice-${props.targetNodeId}`}
      disabled={props.disabled || locked || !isActiveNode}
      onClick={onSelect}
    >
      <span id={groupId}>{props.label}</span>
    </button>
  );
}

setLessonkitBlockType(BranchChoice, "BranchChoice");
