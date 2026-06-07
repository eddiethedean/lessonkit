/** Tracks compounds hydrated by useCompoundPersistence so useCompoundResume skips duplicate mount loads. */
const hydratedKeys = new Set<string>();

export function compoundHydrationKey(courseId: string, compoundId: string): string {
  return `${courseId}:${compoundId}`;
}

export function markCompoundHydrated(key: string): void {
  hydratedKeys.add(key);
}

export function isCompoundHydrated(key: string): boolean {
  return hydratedKeys.has(key);
}

export function clearCompoundHydrated(key: string): void {
  hydratedKeys.delete(key);
}

/** Test-only reset. */
export function resetCompoundHydrationKeys(): void {
  hydratedKeys.clear();
}
