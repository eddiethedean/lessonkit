import { isDevEnvironment } from "./validateComponentId";

const mountCounts = new Map<string, number>();
let warnedConcurrentLessons = false;

/** Track mounted lessons and warn once in dev when more than one is active. */
export function registerLessonMount(lessonId: string): () => void {
  if (
    isDevEnvironment() &&
    mountCounts.size > 0 &&
    !mountCounts.has(lessonId) &&
    !warnedConcurrentLessons
  ) {
    warnedConcurrentLessons = true;
    console.warn(
      "[lessonkit] Multiple <Lesson> components are mounted; only one should be active at a time. Set autoCompleteOnUnmount={false} on routed lessons or unmount the previous lesson before showing the next.",
    );
  }
  mountCounts.set(lessonId, (mountCounts.get(lessonId) ?? 0) + 1);
  return () => {
    /* v8 ignore start -- defensive when unregister races ahead of register bookkeeping */
    const next = (mountCounts.get(lessonId) ?? 1) - 1;
    /* v8 ignore stop */
    if (next <= 0) {
      mountCounts.delete(lessonId);
    } else {
      /* v8 ignore start -- nested lesson mounts decrement without clearing */
      mountCounts.set(lessonId, next);
      /* v8 ignore stop */
    }
  };
}

/** Remaining mount count for a lesson (0 when none mounted). */
export function getLessonMountCount(lessonId: string): number {
  return mountCounts.get(lessonId) ?? 0;
}

/** Reset registry state between tests. */
export function resetLessonMountRegistryForTests(): void {
  mountCounts.clear();
  warnedConcurrentLessons = false;
}
