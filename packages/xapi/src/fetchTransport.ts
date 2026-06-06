import type { XAPIStatement, XAPITransport } from "./types";

export type CreateFetchTransportOptions = {
  /** LRS or proxy endpoint (POST). */
  url: string;
  /** Per-request timeout (default 30_000 ms). Uses AbortSignal.timeout when available. */
  timeoutMs?: number;
  /** Static headers merged into each request (e.g. Authorization from a short-lived token). */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** Retries after transport failure (default 2). */
  retries?: number;
  /** Initial backoff in ms (default 250). Doubles each retry up to maxBackoffMs. */
  backoffMs?: number;
  /** Maximum backoff in ms (default 5_000). */
  maxBackoffMs?: number;
  /** Extra fetch init merged into each request. */
  init?: Omit<RequestInit, "method" | "body" | "signal" | "keepalive">;
};

export type FetchTransportBundle = {
  transport: XAPITransport;
  /** Best-effort synchronous delivery for pagehide (keepalive fetch). */
  exitTransport: (statement: XAPIStatement) => void;
};

function resolveHeaders(
  headers?: Record<string, string> | (() => Record<string, string>),
): Record<string, string> {
  if (!headers) return { "Content-Type": "application/json" };
  const resolved = typeof headers === "function" ? headers() : headers;
  return { "Content-Type": "application/json", ...resolved };
}

function createAbortSignal(timeoutMs: number): AbortSignal | undefined {
  if (timeoutMs <= 0) return undefined;
  const timeout = AbortSignal as typeof AbortSignal & {
    timeout?: (ms: number) => AbortSignal;
  };
  if (typeof timeout.timeout === "function") {
    return timeout.timeout(timeoutMs);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  (timer as unknown as { unref?: () => void }).unref?.();
  return controller.signal;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function postStatement(
  url: string,
  statement: XAPIStatement,
  init: RequestInit,
): Promise<void> {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(statement),
    ...init,
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`xAPI fetch failed: ${res.status} ${res.statusText}`);
    }
  });
}

/**
 * Creates an xAPI transport backed by fetch with timeout, retry backoff, and a
 * keepalive exit transport for pagehide delivery.
 */
export function createFetchTransport(opts: CreateFetchTransportOptions): FetchTransportBundle {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const retries = opts.retries ?? 2;
  const initialBackoffMs = opts.backoffMs ?? 250;
  const maxBackoffMs = opts.maxBackoffMs ?? 5_000;

  const transport: XAPITransport = async (statement) => {
    let attempt = 0;
    let backoff = initialBackoffMs;
    for (;;) {
      try {
        await postStatement(opts.url, statement, {
          ...opts.init,
          headers: resolveHeaders(opts.headers),
          signal: createAbortSignal(timeoutMs),
        });
        return;
      } catch (err) {
        if (attempt >= retries) throw err;
        await sleep(backoff);
        backoff = Math.min(backoff * 2, maxBackoffMs);
        attempt += 1;
      }
    }
  };

  const exitTransport = (statement: XAPIStatement): void => {
    try {
      void postStatement(opts.url, statement, {
        ...opts.init,
        headers: resolveHeaders(opts.headers),
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // ignore — page is unloading
    }
  };

  return { transport, exitTransport };
}

export type CreateFetchBatchSinkOptions = CreateFetchTransportOptions;

export type FetchBatchSinkBundle = {
  batchSink: (events: unknown[]) => Promise<void>;
  /** Best-effort keepalive POST for pagehide (JSON array body). */
  exitBatchSink: (events: unknown[]) => void;
};

/**
 * Batch analytics sink with timeout, retry backoff, and keepalive exit delivery.
 */
export function createFetchBatchSink(opts: CreateFetchBatchSinkOptions): FetchBatchSinkBundle {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const retries = opts.retries ?? 2;
  const initialBackoffMs = opts.backoffMs ?? 250;
  const maxBackoffMs = opts.maxBackoffMs ?? 5_000;

  const postBatch = async (events: unknown[], init: RequestInit): Promise<void> => {
    let attempt = 0;
    let backoff = initialBackoffMs;
    for (;;) {
      try {
        const res = await fetch(opts.url, {
          method: "POST",
          body: JSON.stringify(events),
          ...init,
          headers: resolveHeaders(opts.headers),
          signal: createAbortSignal(timeoutMs),
        });
        if (!res.ok) {
          throw new Error(`telemetry batch fetch failed: ${res.status} ${res.statusText}`);
        }
        return;
      } catch (err) {
        if (attempt >= retries) throw err;
        await sleep(backoff);
        backoff = Math.min(backoff * 2, maxBackoffMs);
        attempt += 1;
      }
    }
  };

  return {
    batchSink: (events) => postBatch(events, opts.init ?? {}),
    exitBatchSink: (events) => {
      try {
        void fetch(opts.url, {
          method: "POST",
          body: JSON.stringify(events),
          ...opts.init,
          headers: resolveHeaders(opts.headers),
          keepalive: true,
        }).catch(() => undefined);
      } catch {
        // ignore
      }
    },
  };
}
