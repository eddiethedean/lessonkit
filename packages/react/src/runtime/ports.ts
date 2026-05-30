export type { StoragePort, ClockPort, TimerPort } from "@lessonkit/core";
export {
  createDefaultClock,
  createGlobalTimer,
  createNoopStorage,
  createSessionStoragePort,
  resetStoragePortForTests,
} from "@lessonkit/core";
