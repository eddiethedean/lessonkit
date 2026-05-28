export type Focusable = { focus: () => void };

/** Screen-reader-only styles (no external CSS required). */
export const visuallyHiddenStyle: Record<string, string | number> = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export type FocusContainer = {
  querySelector<T>(selectors: string): T | null;
};

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function focusFirst(container: FocusContainer | null): boolean {
  if (!container) return false;
  const el = container.querySelector<Focusable>(
    [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(","),
  );
  el?.focus();
  return Boolean(el);
}

