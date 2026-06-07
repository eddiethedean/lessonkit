import { describe, expect, it } from "vitest";
import { validateBranchGraph } from "../src/branchGraph";

describe("validateBranchGraph", () => {
  const graph = [
    { nodeId: "start", choices: [{ targetNodeId: "a" }, { targetNodeId: "b" }] },
    { nodeId: "a", choices: [] },
    { nodeId: "b", choices: [] },
  ] as const;

  it("accepts a valid graph", () => {
    const result = validateBranchGraph("start", graph);
    expect(result.ok).toBe(true);
    expect(result.reachableNodeIds.sort()).toEqual(["a", "b", "start"]);
  });

  it("rejects missing start node", () => {
    const result = validateBranchGraph("missing", graph);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "start_not_found")).toBe(true);
  });

  it("rejects unknown target", () => {
    const result = validateBranchGraph("start", [
      { nodeId: "start", choices: [{ targetNodeId: "ghost" }] },
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "unknown_target")).toBe(true);
  });

  it("warns on unreachable nodes", () => {
    const result = validateBranchGraph("start", [
      { nodeId: "start", choices: [] },
      { nodeId: "orphan", choices: [] },
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "unreachable_node")).toBe(true);
  });

  it("rejects duplicate node ids", () => {
    const result = validateBranchGraph("start", [
      { nodeId: "start", choices: [] },
      { nodeId: "start", choices: [] },
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "duplicate_node_id")).toBe(true);
  });

  it("rejects start node with no choices in multi-node graphs", () => {
    const result = validateBranchGraph("start", [
      { nodeId: "start", choices: [] },
      { nodeId: "next", choices: [] },
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "start_no_choices")).toBe(true);
  });

  it("allows single-node start with no choices", () => {
    const result = validateBranchGraph("start", [{ nodeId: "start", choices: [] }]);
    expect(result.ok).toBe(true);
    expect(result.issues.some((i) => i.code === "start_no_choices")).toBe(false);
  });
});
