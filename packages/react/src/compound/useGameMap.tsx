import React, { createContext, useContext } from "react";

export type GameMapContextValue = {
  compoundBlockId: string;
  activeStageId: string;
  visitedStageIds: readonly string[];
  navigateToStage: (opts: {
    fromStageId: string;
    toStageId: string;
    label: string;
    scoreWeight?: number;
  }) => void;
  exitsLocked: boolean;
};

const GameMapContext = createContext<GameMapContextValue | null>(null);

export function GameMapProvider(props: { value: GameMapContextValue; children: React.ReactNode }) {
  return <GameMapContext.Provider value={props.value}>{props.children}</GameMapContext.Provider>;
}

export function useGameMap(): GameMapContextValue {
  const ctx = useContext(GameMapContext);
  if (!ctx) {
    throw new Error("useGameMap must be used within GameMap");
  }
  return ctx;
}

export function useGameMapOptional(): GameMapContextValue | null {
  return useContext(GameMapContext);
}
