import { validateId } from "./validateId";

function shortHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

function uniqueFallbackId(input: string, usedIds: ReadonlySet<string>): string {
  const hash = shortHash(input);
  for (let n = 0; n < 100; n++) {
    const candidate = (n === 0 ? `id-${hash}` : `id-${hash}-${n}`).slice(0, 64);
    const validated = validateId(candidate);
    if (validated.ok && !usedIds.has(validated.id)) return validated.id;
  }
  const timed = `id-${hash}-${Date.now().toString(36)}`.slice(0, 64);
  const validated = validateId(timed);
  return validated.ok ? validated.id : `id-${hash}`;
}

/** Convert human-readable text to a candidate LessonKit id (may still need collision handling via deriveId). */
export function slugifyId(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 64);

  if (!slug.length) return uniqueFallbackId(input, new Set());
  const candidate = /^[a-z]/.test(slug) ? slug : `id-${slug}`.slice(0, 64);
  const validated = validateId(candidate);
  return validated.ok ? validated.id : uniqueFallbackId(input, new Set());
}

/** Pick a unique id from a title, suffixing -2, -3, … on collision. */
export function deriveId(title: string, usedIds: ReadonlySet<string> = new Set()): string {
  const base = slugifyId(title);
  if (!usedIds.has(base) && validateId(base).ok) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`.slice(0, 64);
    const validated = validateId(candidate);
    if (validated.ok && !usedIds.has(validated.id)) return validated.id;
  }
  return uniqueFallbackId(`${title}-${Date.now()}`, usedIds);
}
