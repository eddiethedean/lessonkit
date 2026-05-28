export type StoragePort = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
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

export function createSessionStoragePort(): StoragePort {
  if (typeof sessionStorage === "undefined") return createNoopStorage();
  return {
    getItem: (key) => {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        // ignore
      }
    },
  };
}

export function createGlobalTimer(): TimerPort {
  return {
    setInterval: (fn, ms) => globalThis.setInterval(fn, ms),
    clearInterval: (id) => globalThis.clearInterval(id),
  };
}

