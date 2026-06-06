import React from "react";
import { describe, expect, it, vi } from "vitest";
import { BranchingScenario } from "../src/blocks/BranchingScenario";
import { BranchChoice } from "../src/blocks/BranchChoice";
import { BranchNode } from "../src/blocks/BranchNode";
import { validateBranchGraphAtMount } from "../src/compound/validateBranchGraph";
import { validateCompoundChildren } from "../src/compound/validateChildren";
import type { BranchNodeProps } from "../src/blocks/BranchNode";

describe("production validation", () => {
  it("throws on invalid branch graph in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const nodes = [
      <BranchNode key="a" nodeId="a" title="A">
        <BranchChoice targetNodeId="missing" label="Go" />
      </BranchNode>,
    ] as React.ReactElement<BranchNodeProps>[];
    expect(() => validateBranchGraphAtMount("a", nodes)).toThrow(/unknown target/);
    vi.unstubAllEnvs();
  });

  it("warns on invalid branch graph in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const nodes = [
      <BranchNode key="a" nodeId="a" title="A">
        <BranchChoice targetNodeId="missing" label="Go" />
      </BranchNode>,
    ] as React.ReactElement<BranchNodeProps>[];
    expect(() => validateBranchGraphAtMount("a", nodes)).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    vi.unstubAllEnvs();
  });

  it("throws on disallowed nested BranchingScenario in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() =>
      validateCompoundChildren(
        "BranchNode",
        <BranchingScenario blockId="nested" title="Nested" startNodeId="start">
          <BranchNode nodeId="start" title="Start">
            <p>Start</p>
          </BranchNode>
        </BranchingScenario>,
      ),
    ).toThrow(/not in the allowlist/);
    vi.unstubAllEnvs();
  });
});
