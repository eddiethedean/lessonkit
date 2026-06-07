export type {
  XAPIClient,
  XAPIExitTransport,
  XAPIObjectDefinition,
  XAPIQueue,
  XAPIResult,
  XAPIScore,
  XAPIStatement,
  XAPITransport,
  XAPIVerbIri,
} from "./types";
export { createInMemoryXAPIQueue, type InMemoryXAPIQueueOptions } from "./queue";
export { createXAPIClient, resetXAPIDeadLetterForTests } from "./client";
export {
  createFetchTransport,
  createFetchBatchSink,
  FetchHttpError,
  isRetryableFetchError,
  isRetryableFetchHttpStatus,
  type CreateFetchTransportOptions,
  type FetchTransportBundle,
  type CreateFetchBatchSinkOptions,
  type FetchBatchSinkBundle,
} from "./fetchTransport";
export { loadDeadLetterStatements, persistDeadLetterStatement } from "./deadLetter";
export { telemetryEventToXAPIStatement } from "./telemetryMap";
