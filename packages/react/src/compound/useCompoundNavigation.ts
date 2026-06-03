import { useCallback } from "react";

export function useCompoundNavigation(
  pageCount: number,
  index: number,
  setIndex: (index: number | ((prev: number) => number)) => void,
) {
  const goNext = useCallback(() => {
    if (pageCount < 1) return;
    setIndex((i) => Math.min(i + 1, pageCount - 1));
  }, [pageCount, setIndex]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, [setIndex]);

  const clampedIndex = pageCount < 1 ? 0 : Math.min(index, pageCount - 1);

  return {
    index: clampedIndex,
    setIndex,
    goNext,
    goPrev,
    progress: { current: pageCount < 1 ? 0 : clampedIndex + 1, total: pageCount },
  };
}
