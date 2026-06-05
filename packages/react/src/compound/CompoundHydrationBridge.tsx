import React, { createContext, useContext, useRef } from "react";
import type { CompoundResumeState } from "@lessonkit/core";

export type CompoundHydrationBridge = {
  /** Called after imperative CompoundHandle.resume() to unblock persistence saves. */
  notifyImperativeResume: (state: CompoundResumeState) => void;
};

const CompoundHydrationBridgeContext = createContext<React.MutableRefObject<CompoundHydrationBridge | null> | null>(
  null,
);

export function CompoundHydrationBridgeProvider({ children }: { children: React.ReactNode }) {
  const bridgeRef = useRef<CompoundHydrationBridge | null>(null);
  return (
    <CompoundHydrationBridgeContext.Provider value={bridgeRef}>{children}</CompoundHydrationBridgeContext.Provider>
  );
}

export function useCompoundHydrationBridgeRef() {
  return useContext(CompoundHydrationBridgeContext);
}
