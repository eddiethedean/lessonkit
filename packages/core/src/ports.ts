export type StoragePort = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
  /** @internal Test helper to clear in-memory fallback state. */
  resetForTests?: () => void;
};

export type ClockPort = {
  nowMs: () => number;
  nowIso: () => string;
};

export type TimerPort = {
  setInterval: (fn: () => void, ms: number) => ReturnType<typeof globalThis.setInterval>;
  clearInterval: (id: ReturnType<typeof globalThis.setInterval>) => void;
};

export function createDefaultClock(): ClockPort {
  return {
    nowMs: () => Date.now(),
    nowIso: () => new Date().toISOString(),
  };
}

export function createNoopStorage(): StoragePort {
  return {
    getItem: () => null,
    setItem: () => {},
  };
}

function createMemoryBackedSessionStorage(
  session: Pick<Storage, "getItem" | "setItem" | "removeItem">,
): StoragePort {
  const memory = new Map<string, string>();
  let warnedPersistFailure = false;

  const warnPersistFailure = () => {
    if (warnedPersistFailure) return;
    warnedPersistFailure = true;
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
      console.warn(
        "[lessonkit] sessionStorage is unavailable or failed; using in-memory session dedupe for this tab (may reset on full reload).",
      );
    }
  };

  return {
    getItem: (key) => {
      if (memory.has(key)) return memory.get(key)!;
      try {
        const value = session.getItem(key);
        if (value !== null) memory.set(key, value);
        return value;
      } catch {
        return memory.get(key) ?? null;
      }
    },
    setItem: (key, value) => {
      memory.set(key, value);
      try {
        session.setItem(key, value);
      } catch {
        warnPersistFailure();
      }
    },
    removeItem: (key) => {
      memory.delete(key);
      try {
        session.removeItem(key);
      } catch {
        warnPersistFailure();
      }
    },
    resetForTests: () => {
      memory.clear();
    },
  };
}

export function resetStoragePortForTests(storage: StoragePort): void {
  storage.resetForTests?.();
}

export function createSessionStoragePort(): StoragePort {
  if (typeof sessionStorage === "undefined") {
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
      removeItem: (key) => {
        memory.delete(key);
      },
      resetForTests: () => {
        memory.clear();
      },
    };
  }
  return createMemoryBackedSessionStorage(sessionStorage);
}

export function createGlobalTimer(): TimerPort {
  return {
    setInterval: (fn, ms) => globalThis.setInterval(fn, ms),
    clearInterval: (id) => globalThis.clearInterval(id),
  };
}
