export type Focusable = HTMLElement & { focus: () => void };

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function focusFirst(container: HTMLElement | null): boolean {
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

