export type Focusable = { focus: () => void };

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

