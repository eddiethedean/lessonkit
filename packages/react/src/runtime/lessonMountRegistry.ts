import { isDevEnvironment } from "./validateComponentId";

const mountedLessonIds = new Set<string>();
let warnedConcurrentLessons = false;

/** Track mounted lessons and warn once in dev when more than one is active. */
export function registerLessonMount(lessonId: string): () => void {
  if (
    isDevEnvironment() &&
    mountedLessonIds.size > 0 &&
    !mountedLessonIds.has(lessonId) &&
    !warnedConcurrentLessons
  ) {
    warnedConcurrentLessons = true;
    console.warn(
      "[lessonkit] Multiple <Lesson> components are mounted; only one should be active at a time. Set autoCompleteOnUnmount={false} on routed lessons or unmount the previous lesson before showing the next.",
    );
  }
  mountedLessonIds.add(lessonId);
  return () => {
    mountedLessonIds.delete(lessonId);
  };
}

/** Reset registry state between tests. */
export function resetLessonMountRegistryForTests(): void {
  mountedLessonIds.clear();
  warnedConcurrentLessons = false;
}
