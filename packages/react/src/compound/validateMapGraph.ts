import React from "react";
import { isDevEnvironment, normalizeComponentId } from "../runtime/validateComponentId";
import { getLessonkitBlockType } from "./blockType";
import type { MapStageProps } from "../blocks/MapStage";

export function extractMapGraph(stages: React.ReactElement<MapStageProps>[]) {
  return stages.map((stage) => {
    const exits: { targetStageId: string }[] = [];
    React.Children.forEach(stage.props.children, (child) => {
      if (!React.isValidElement(child)) return;
      if (getLessonkitBlockType(child.type) !== "MapExit") return;
      const targetStageId = (child.props as { targetStageId?: string }).targetStageId;
      if (typeof targetStageId === "string") {
        exits.push({ targetStageId: normalizeComponentId(targetStageId, "blockId") });
      }
    });
    return {
      stageId: normalizeComponentId(stage.props.stageId, "blockId"),
      exits,
    };
  });
}

export function validateMapGraphAtMount(
  startStageId: string,
  stages: React.ReactElement<MapStageProps>[],
): void {
  const graph = extractMapGraph(stages);
  const ids = new Set(graph.map((s) => s.stageId));
  if (!ids.has(startStageId)) {
    const msg = `[lessonkit] GameMap: startStageId "${startStageId}" is not a MapStage`;
    if (isDevEnvironment()) console.warn(msg);
    else throw new Error(msg);
  }
  for (const stage of graph) {
    for (const exit of stage.exits) {
      if (!ids.has(exit.targetStageId)) {
        const msg = `[lessonkit] GameMap: unknown targetStageId "${exit.targetStageId}" from "${stage.stageId}"`;
        if (isDevEnvironment()) console.warn(msg);
        else throw new Error(msg);
      }
    }
  }
}

export function buildStageIndexMap(stages: React.ReactElement<MapStageProps>[]): Map<string, number> {
  const map = new Map<string, number>();
  stages.forEach((stage, index) => {
    map.set(normalizeComponentId(stage.props.stageId, "blockId"), index);
  });
  return map;
}

export function buildStageLabels(stages: React.ReactElement<MapStageProps>[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const stage of stages) {
    const stageId = normalizeComponentId(stage.props.stageId, "blockId");
    map.set(stageId, stage.props.label ?? stageId);
  }
  return map;
}

export function filterMapStageContent(children: React.ReactNode): React.ReactNode {
  const filtered: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      filtered.push(child);
      return;
    }
    if (getLessonkitBlockType(child.type) === "MapExit") return;
    filtered.push(child);
  });
  return filtered;
}

export function stageHasExits(stage: React.ReactElement<MapStageProps>): boolean {
  return extractMapExitsFromStage(stage).length > 0;
}

export type MapStageExit = {
  targetStageId: string;
  label: string;
  scoreWeight?: number;
};

export function extractMapExitsFromStage(
  stage: React.ReactElement<MapStageProps>,
): MapStageExit[] {
  const exits: MapStageExit[] = [];
  React.Children.forEach(stage.props.children, (child) => {
    if (!React.isValidElement(child)) return;
    if (getLessonkitBlockType(child.type) !== "MapExit") return;
    const props = child.props as { targetStageId?: string; label?: string; scoreWeight?: number };
    if (typeof props.targetStageId !== "string" || typeof props.label !== "string") return;
    exits.push({
      targetStageId: normalizeComponentId(props.targetStageId, "blockId"),
      label: props.label,
      scoreWeight: props.scoreWeight,
    });
  });
  return exits;
}
