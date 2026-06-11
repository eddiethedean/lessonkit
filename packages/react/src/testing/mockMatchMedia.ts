export type MockMatchMediaOptions = {
  /** When true, `(pointer: coarse)` and combined coarse queries match. */
  coarse?: boolean;
  /** When true, `(hover: none)` matches. Defaults to `coarse`. */
  hoverNone?: boolean;
};

/**
 * Stub `window.matchMedia` for touch/coarse-pointer tests.
 * Returns a restore function — call in `afterEach`.
 */
export function mockMatchMedia(options: MockMatchMediaOptions = {}): () => void {
  const coarse = options.coarse ?? false;
  const hoverNone = options.hoverNone ?? coarse;
  const original = window.matchMedia;

  window.matchMedia = (query: string) => {
    const matches =
      (query.includes("pointer: coarse") && coarse) ||
      (query.includes("hover: none") && hoverNone);
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mql = {
      matches,
      media: query,
      onchange: null as ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null,
      addEventListener: (
        _type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        if (typeof listener === "function") {
          listeners.add(listener as (event: MediaQueryListEvent) => void);
        }
      },
      removeEventListener: (
        _type: string,
        listener: EventListenerOrEventListenerObject,
      ) => {
        if (typeof listener === "function") {
          listeners.delete(listener as (event: MediaQueryListEvent) => void);
        }
      },
      addListener: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeListener: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      dispatchEvent: () => false,
    } as MediaQueryList;
    return mql;
  };

  return () => {
    window.matchMedia = original;
  };
}
