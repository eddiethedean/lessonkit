export type BranchGraphNodeInput = {
  nodeId: string;
  choices: readonly { targetNodeId: string }[];
};

export type BranchGraphValidationIssue = {
  code:
    | "duplicate_node_id"
    | "start_not_found"
    | "start_no_choices"
    | "unknown_target"
    | "unreachable_node"
    | "empty_graph";
  message: string;
  nodeId?: string;
};

export type BranchGraphValidationResult = {
  ok: boolean;
  issues: BranchGraphValidationIssue[];
  reachableNodeIds: string[];
};

export function validateBranchGraph(
  startNodeId: string,
  nodes: readonly BranchGraphNodeInput[],
): BranchGraphValidationResult {
  const issues: BranchGraphValidationIssue[] = [];

  if (nodes.length === 0) {
    issues.push({ code: "empty_graph", message: "Branch graph has no nodes" });
    return { ok: false, issues, reachableNodeIds: [] };
  }

  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.nodeId)) {
      issues.push({
        code: "duplicate_node_id",
        message: `Duplicate nodeId "${node.nodeId}"`,
        nodeId: node.nodeId,
      });
    }
    nodeIds.add(node.nodeId);
  }

  if (!nodeIds.has(startNodeId)) {
    issues.push({
      code: "start_not_found",
      message: `startNodeId "${startNodeId}" does not match any BranchNode`,
      nodeId: startNodeId,
    });
  }

  if (nodes.length > 1 && nodeIds.has(startNodeId)) {
    const startNode = nodes.find((n) => n.nodeId === startNodeId);
    if (startNode && startNode.choices.length === 0) {
      issues.push({
        code: "start_no_choices",
        message: `startNodeId "${startNodeId}" has no BranchChoice children in a multi-node scenario`,
        nodeId: startNodeId,
      });
    }
  }

  for (const node of nodes) {
    for (const choice of node.choices) {
      if (!nodeIds.has(choice.targetNodeId)) {
        issues.push({
          code: "unknown_target",
          message: `Choice from "${node.nodeId}" references unknown target "${choice.targetNodeId}"`,
          nodeId: node.nodeId,
        });
      }
    }
  }

  const reachable = new Set<string>();
  if (nodeIds.has(startNodeId)) {
    const queue = [startNodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      reachable.add(current);
      const node = nodes.find((n) => n.nodeId === current);
      if (!node) continue;
      for (const choice of node.choices) {
        if (!reachable.has(choice.targetNodeId)) queue.push(choice.targetNodeId);
      }
    }
  }

  for (const nodeId of nodeIds) {
    if (!reachable.has(nodeId)) {
      issues.push({
        code: "unreachable_node",
        message: `Node "${nodeId}" is not reachable from startNodeId "${startNodeId}"`,
        nodeId,
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    reachableNodeIds: [...reachable],
  };
}
