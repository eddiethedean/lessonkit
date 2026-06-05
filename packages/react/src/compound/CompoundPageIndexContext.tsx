import React, { createContext, useContext } from "react";

const CompoundPageIndexContext = createContext<number | undefined>(undefined);

export function CompoundPageIndexProvider({
  pageIndex,
  children,
}: {
  pageIndex: number;
  children: React.ReactNode;
}) {
  return (
    <CompoundPageIndexContext.Provider value={pageIndex}>{children}</CompoundPageIndexContext.Provider>
  );
}

export function useCompoundPageIndex(): number | undefined {
  return useContext(CompoundPageIndexContext);
}
