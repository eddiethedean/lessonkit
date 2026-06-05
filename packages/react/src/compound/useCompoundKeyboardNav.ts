import { useEffect, type RefObject } from "react";

const INTERACTIVE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (INTERACTIVE_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  if (target.closest("[role='slider'], [role='listbox'], [data-lk-assessment-interactive]")) {
    return true;
  }
  return false;
}

/** Keyboard navigation for compound slide/page decks (Arrow keys, Home, End). */
export function useCompoundKeyboardNav(opts: {
  containerRef: RefObject<HTMLElement | null>;
  visibleIndex: number;
  pageCount: number;
  goNext: () => void;
  goPrev: () => void;
  setIndex: (index: number) => void;
}): void {
  const { containerRef, visibleIndex, pageCount, goNext, goPrev, setIndex } = opts;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || pageCount === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!el.contains(document.activeElement) && document.activeElement !== document.body) {
        return;
      }
      if (isEditableTarget(event.target)) return;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          if (visibleIndex < pageCount - 1) {
            event.preventDefault();
            goNext();
          }
          break;
        case "ArrowLeft":
        case "ArrowUp":
          if (visibleIndex > 0) {
            event.preventDefault();
            goPrev();
          }
          break;
        case "Home":
          if (visibleIndex !== 0) {
            event.preventDefault();
            setIndex(0);
          }
          break;
        case "End":
          if (visibleIndex !== pageCount - 1) {
            event.preventDefault();
            setIndex(pageCount - 1);
          }
          break;
        default:
          break;
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [containerRef, visibleIndex, pageCount, goNext, goPrev, setIndex]);
}
