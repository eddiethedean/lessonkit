export type Focusable = { focus: () => void };

export type VisuallyHiddenStyle = {
  position: "absolute";
  width: string;
  height: string;
  padding: number;
  margin: string;
  overflow: "hidden";
  clip: string;
  whiteSpace: "nowrap";
  border: number;
};

export type TrapFocusOptions = {
  initialFocus?: HTMLElement | "first";
  restoreFocus?: boolean;
  allowOutsideClick?: boolean;
};

export type RovingTabIndexOptions = {
  itemCount: number;
  getId?: (index: number) => string;
  orientation?: "horizontal" | "vertical" | "both";
  loop?: boolean;
  initialIndex?: number;
};

/** Screen-reader-only styles (no external CSS required). */
export const visuallyHiddenStyle: VisuallyHiddenStyle = {
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

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  // Prefer explicit tabindex, but allow contenteditable too.
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(",");

function isHTMLElement(v: unknown): v is HTMLElement {
  return typeof HTMLElement !== "undefined" && v instanceof HTMLElement;
}

export function prefersReducedMotion(): boolean {
  return getPrefersReducedMotionSnapshot();
}

/** One-shot read of the prefers-reduced-motion media query. */
export function getPrefersReducedMotionSnapshot(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Subscribe to OS reduced-motion preference changes; returns an unsubscribe function. */
export function subscribeReducedMotion(listener: (reduce: boolean) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    listener(false);
    return () => {};
  }
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onChange = () => listener(mq.matches);
  listener(mq.matches);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function getReducedMotionPreference(): "reduce" | "no-preference" | "unknown" {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "unknown";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "no-preference";
}

export function shouldAnimate(opts?: { default?: boolean }): boolean {
  const pref = getReducedMotionPreference();
  if (pref === "reduce") return false;
  if (pref === "no-preference") return true;
  return opts?.default ?? true;
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

export function getFocusableElements(container: Element): HTMLElement[] {
  const candidates = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS));
  return candidates.filter((n): n is HTMLElement => isHTMLElement(n) && !n.hasAttribute("disabled"));
}

export function trapFocus(
  container: HTMLElement,
  opts?: TrapFocusOptions,
): { activate: () => void; deactivate: () => void } {
  const restoreFocus = opts?.restoreFocus ?? true;
  const allowOutsideClick = opts?.allowOutsideClick ?? false;

  let active = false;
  let prevFocused: HTMLElement | null = null;
  let removeListeners: (() => void) | null = null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (!active) return;
    if (e.key !== "Tab") return;

    const focusables = getFocusableElements(container);
    if (!focusables.length) {
      e.preventDefault();
      container.focus?.();
      return;
    }

    const current = document.activeElement;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;

    if (e.shiftKey) {
      if (current === first || !container.contains(current)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (current === last || !container.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const onFocusIn = (e: FocusEvent) => {
    if (!active) return;
    const target = e.target;
    if (!isHTMLElement(target)) return;
    if (container.contains(target)) return;

    const focusables = getFocusableElements(container);
    (focusables[0] ?? container).focus?.();
  };

  const onPointerDownCapture = (e: Event) => {
    if (!active) return;
    if (allowOutsideClick) return;
    const target = e.target;
    if (!isHTMLElement(target)) return;
    if (container.contains(target)) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const activate = () => {
    if (active) return;
    active = true;

    prevFocused = restoreFocus && isHTMLElement(document.activeElement) ? document.activeElement : null;

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("pointerdown", onPointerDownCapture, true);
    document.addEventListener("mousedown", onPointerDownCapture, true);

    removeListeners = () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
      document.removeEventListener("mousedown", onPointerDownCapture, true);
    };

    const focusables = getFocusableElements(container);
    const requested = opts?.initialFocus;
    if (requested === "first" || requested === undefined) {
      (focusables[0] ?? container).focus?.();
    } else if (isHTMLElement(requested)) {
      requested.focus();
    }
  };

  const deactivate = () => {
    if (!active) return;
    active = false;
    removeListeners?.();
    removeListeners = null;

    const toRestore = prevFocused;
    prevFocused = null;
    if (restoreFocus) toRestore?.focus?.();
  };

  return { activate, deactivate };
}

export function createRovingTabIndex(opts: RovingTabIndexOptions): {
  get activeIndex(): number;
  setActiveIndex: (next: number) => void;
  getItemProps: (index: number) => {
    tabIndex: 0 | -1;
    onKeyDown: (e: KeyboardEvent | { key: string; preventDefault: () => void }) => void;
    onFocus: () => void;
    id?: string;
  };
} {
  const itemCount = Math.max(0, opts.itemCount);
  const loop = opts.loop ?? true;
  const orientation = opts.orientation ?? "both";
  let activeIndex = clampIndex(opts.initialIndex ?? 0, itemCount);

  const setActiveIndex = (next: number) => {
    activeIndex = clampIndex(next, itemCount);
  };

  const move = (delta: number) => {
    /* v8 ignore start -- onKeyDown returns early when itemCount is 0 */
    if (!itemCount) return;
    /* v8 ignore stop */
    const next = activeIndex + delta;
    if (loop) {
      activeIndex = ((next % itemCount) + itemCount) % itemCount;
      return;
    }
    activeIndex = clampIndex(next, itemCount);
  };

  const onKeyDown = (e: KeyboardEvent | { key: string; preventDefault: () => void }) => {
    if (!itemCount) return;
    switch (e.key) {
      case "Home":
        e.preventDefault();
        activeIndex = 0;
        return;
      case "End":
        e.preventDefault();
        activeIndex = itemCount - 1;
        return;
      case "ArrowLeft":
        if (orientation === "vertical") return;
        e.preventDefault();
        move(-1);
        return;
      case "ArrowRight":
        if (orientation === "vertical") return;
        e.preventDefault();
        move(1);
        return;
      case "ArrowUp":
        if (orientation === "horizontal") return;
        e.preventDefault();
        move(-1);
        return;
      case "ArrowDown":
        if (orientation === "horizontal") return;
        e.preventDefault();
        move(1);
        return;
    }
  };

  const getItemProps = (index: number) => ({
    tabIndex: index === activeIndex ? (0 as const) : (-1 as const),
    id: opts.getId ? opts.getId(index) : undefined,
    onKeyDown,
    onFocus: () => {
      setActiveIndex(index);
    },
  });

  return {
    get activeIndex() {
      return activeIndex;
    },
    setActiveIndex,
    getItemProps,
  };
}

function clampIndex(index: number, itemCount: number): number {
  if (itemCount <= 0) return 0;
  if (index < 0) return 0;
  if (index >= itemCount) return itemCount - 1;
  return index;
}

