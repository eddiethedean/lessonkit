import React from "react";
import { validateBranchGraph } from "@lessonkit/core";
import { isDevEnvironment, normalizeComponentId } from "../runtime/validateComponentId";
import { getLessonkitBlockType } from "./blockType";
import type { BranchNodeProps } from "../blocks/BranchNode";

export function extractBranchGraph(nodes: React.ReactElement<BranchNodeProps>[]) {
  return nodes.map((node) => {
    const choices: { targetNodeId: string }[] = [];
    React.Children.forEach(node.props.children, (child) => {
      if (!React.isValidElement(child)) return;
      if (getLessonkitBlockType(child.type) !== "BranchChoice") return;
      const targetNodeId = (child.props as { targetNodeId?: string }).targetNodeId;
      if (typeof targetNodeId === "string") {
        choices.push({ targetNodeId: normalizeComponentId(targetNodeId, "blockId") });
      }
    });
    return { nodeId: normalizeComponentId(node.props.nodeId, "blockId"), choices };
  });
}

export function validateBranchGraphAtMount(
  startNodeId: string,
  nodes: React.ReactElement<BranchNodeProps>[],
  strict?: boolean,
): void {
  if (!isDevEnvironment() && !strict) return;
  const graph = extractBranchGraph(nodes);
  const result = validateBranchGraph(startNodeId, graph);
  for (const issue of result.issues) {
    const msg = `[lessonkit] BranchingScenario: ${issue.message}`;
    if (strict) throw new Error(msg);
    console.warn(msg);
  }
}

export function buildNodeIndexMap(nodes: React.ReactElement<BranchNodeProps>[]): Map<string, number> {
  const map = new Map<string, number>();
  nodes.forEach((node, index) => {
    map.set(normalizeComponentId(node.props.nodeId, "blockId"), index);
  });
  return map;
}

export function buildNodeLabels(nodes: React.ReactElement<BranchNodeProps>[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const node of nodes) {
    const nodeId = normalizeComponentId(node.props.nodeId, "blockId");
    map.set(nodeId, node.props.title ?? nodeId);
  }
  return map;
}

export function filterBranchNodeContent(children: React.ReactNode): React.ReactNode {
  const filtered: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      filtered.push(child);
      return;
    }
    if (getLessonkitBlockType(child.type) === "BranchChoice") return;
    filtered.push(child);
  });
  return filtered;
}

export function nodeHasChoices(node: React.ReactElement<BranchNodeProps>): boolean {
  let hasChoice = false;
  React.Children.forEach(node.props.children, (child) => {
    if (!React.isValidElement(child)) return;
    if (getLessonkitBlockType(child.type) === "BranchChoice") hasChoice = true;
  });
  return hasChoice;
}
