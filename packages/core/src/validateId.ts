import { ID_MAX_LENGTH, ID_PATTERN, type IdentityValidationResult } from "./identityTypes";

export function validateId(input: unknown, path = "id"): IdentityValidationResult {
  if (typeof input !== "string") {
    return { ok: false, issues: [{ path, message: "id must be a string" }] };
  }
  const id = input.trim();
  if (!id.length) {
    return { ok: false, issues: [{ path, message: "id must not be empty" }] };
  }
  if (id.length > ID_MAX_LENGTH) {
    return {
      ok: false,
      issues: [{ path, message: `id must be at most ${ID_MAX_LENGTH} characters` }],
    };
  }
  if (!ID_PATTERN.test(id)) {
    return {
      ok: false,
      issues: [
        {
          path,
          message:
            "id must start with a letter and contain only letters, digits, underscores, and hyphens",
        },
      ],
    };
  }
  return { ok: true, id };
}

export function assertValidId(input: unknown, path = "id"): string {
  const result = validateId(input, path);
  if (!result.ok) {
    throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join("; "));
  }
  return result.id;
}
