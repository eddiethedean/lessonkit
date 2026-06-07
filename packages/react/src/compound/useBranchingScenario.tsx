import React, { createContext, useContext } from "react";

export type BranchingScenarioContextValue = {
  compoundBlockId: string;
  activeNodeId: string;
  visitedNodeIds: readonly string[];
  visitedLabels: readonly string[];
  navigateToNode: (opts: {
    fromNodeId: string;
    toNodeId: string;
    label: string;
    scoreWeight?: number;
  }) => void;
  isTerminal: boolean;
  choicesLocked: boolean;
};

const BranchingScenarioContext = createContext<BranchingScenarioContextValue | null>(null);

export function BranchingScenarioProvider(props: {
  value: BranchingScenarioContextValue;
  children: React.ReactNode;
}) {
  return (
    <BranchingScenarioContext.Provider value={props.value}>
      {props.children}
    </BranchingScenarioContext.Provider>
  );
}

export function useBranchingScenario(): BranchingScenarioContextValue {
  const ctx = useContext(BranchingScenarioContext);
  if (!ctx) {
    throw new Error("useBranchingScenario must be used within BranchingScenario");
  }
  return ctx;
}

export function useBranchingScenarioOptional(): BranchingScenarioContextValue | null {
  return useContext(BranchingScenarioContext);
}
