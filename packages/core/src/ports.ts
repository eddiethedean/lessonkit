export type StoragePort = {
  getItem: (key: string) => string | null;
  /** Returns false when the value could not be durably persisted (e.g. sessionStorage quota). */
  setItem: (key: string, value: string) => boolean;
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
    setItem: () => true,
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
    const g = globalThis as typeof globalThis & { process?: { env?: { NODE_ENV?: string } } };
    if (typeof g.process !== "undefined" && g.process.env?.NODE_ENV === "development") {
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
        return true;
      } catch {
        warnPersistFailure();
        return false;
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

function createInMemorySessionStoragePort(): StoragePort {
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
      return true;
    },
    removeItem: (key) => {
      memory.delete(key);
    },
    resetForTests: () => {
      memory.clear();
    },
  };
}

function resolveBrowserSessionStorage(): Storage | null {
  try {
    if (typeof sessionStorage === "undefined" || sessionStorage == null) {
      return null;
    }
    return sessionStorage;
  } catch {
    return null;
  }
}

export function createSessionStoragePort(): StoragePort {
  const session = resolveBrowserSessionStorage();
  if (!session) {
    return createInMemorySessionStoragePort();
  }
  return createMemoryBackedSessionStorage(session);
}

export function createGlobalTimer(): TimerPort {
  return {
    setInterval: (fn, ms) => globalThis.setInterval(fn, ms),
    clearInterval: (id) => globalThis.clearInterval(id),
  };
}
