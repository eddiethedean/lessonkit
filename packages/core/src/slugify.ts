import { validateId } from "./validateId";

/** Convert human-readable text to a candidate LessonKit id (may still need collision handling via deriveId). */
export function slugifyId(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 64);

  if (!slug.length) return "id";
  const candidate = /^[a-z]/.test(slug) ? slug : `id-${slug}`;
  const validated = validateId(candidate);
  return validated.ok ? validated.id : "id";
}

/** Pick a unique id from a title, suffixing -2, -3, … on collision. */
export function deriveId(title: string, usedIds: ReadonlySet<string> = new Set()): string {
  const base = slugifyId(title);
  if (!usedIds.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!usedIds.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}
