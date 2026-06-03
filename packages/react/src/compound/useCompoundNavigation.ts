import { useCallback, useState } from "react";

export function useCompoundNavigation(pageCount: number, initialIndex = 0) {
  const [index, setIndex] = useState(() => Math.min(Math.max(0, initialIndex), Math.max(0, pageCount - 1)));

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, pageCount - 1));
  }, [pageCount]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const clampedIndex = Math.min(index, Math.max(0, pageCount - 1));

  return {
    index: clampedIndex,
    setIndex,
    goNext,
    goPrev,
    progress: { current: clampedIndex + 1, total: pageCount },
  };
}
