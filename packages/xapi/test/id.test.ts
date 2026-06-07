import { describe, expect, it } from "vitest";
import { deriveStatementId, stableTelemetryEventId } from "../src/id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("deriveStatementId", () => {
  const base = {
    name: "course_started" as const,
    courseId: "my-course",
    timestamp: "2026-01-01T00:00:00.000Z",
    sessionId: "session-1",
  };
  const objectId = "urn:lessonkit:course:my-course";
  const verb = "http://adlnet.gov/expapi/verbs/initialized";

  it("passes through a valid UUID event.id", () => {
    const stableId = "550e8400-e29b-41d4-a716-446655440000";
    expect(deriveStatementId({ ...base, id: stableId }, objectId, verb)).toBe(stableId);
  });

  it("trims whitespace from event.id before validating UUID", () => {
    const stableId = "550e8400-e29b-41d4-a716-446655440000";
    expect(deriveStatementId({ ...base, id: `  ${stableId}  ` }, objectId, verb)).toBe(stableId);
  });

  it("falls back to hash when event.id is not a UUID", () => {
    const a = deriveStatementId({ ...base, id: "not-a-uuid" }, objectId, verb);
    const b = deriveStatementId({ ...base, id: "not-a-uuid" }, objectId, verb);
    expect(a).toBe(b);
    expect(a).toMatch(UUID_RE);
  });

  it("returns the same id for identical inputs", () => {
    const a = deriveStatementId(base, objectId, verb);
    const b = deriveStatementId(base, objectId, verb);
    expect(a).toBe(b);
    expect(a).toMatch(UUID_RE);
  });

  it("returns different ids when timestamp differs", () => {
    const a = deriveStatementId(base, objectId, verb);
    const b = deriveStatementId({ ...base, timestamp: "2026-01-02T00:00:00.000Z" }, objectId, verb);
    expect(a).not.toBe(b);
  });

  it("returns different ids when verb or objectId differs", () => {
    const a = deriveStatementId(base, objectId, verb);
    const b = deriveStatementId(base, "urn:other", verb);
    const c = deriveStatementId(base, objectId, "http://adlnet.gov/expapi/verbs/completed");
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("stableTelemetryEventId", () => {
  it("is stable for the same lifecycle event identity", () => {
    const event = {
      name: "course_completed" as const,
      courseId: "c1",
      lessonId: undefined,
      sessionId: "s1",
    };
    expect(stableTelemetryEventId(event)).toBe(stableTelemetryEventId(event));
    expect(stableTelemetryEventId(event)).toMatch(UUID_RE);
  });

  it("differs when sessionId or lessonId differs", () => {
    const base = { name: "lesson_started" as const, courseId: "c1", sessionId: "s1" };
    const a = stableTelemetryEventId({ ...base, lessonId: "l1" });
    const b = stableTelemetryEventId({ ...base, lessonId: "l2" });
    const c = stableTelemetryEventId({ ...base, lessonId: "l1", sessionId: "s2" });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});
