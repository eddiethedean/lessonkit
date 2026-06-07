import { describe, expect, it } from "vitest";
import { deriveStatementId, enrichTelemetryEventForXapi, stableTelemetryEventId } from "../src/id";

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

  it("differs when sessionId, lessonId, or attemptId differs", () => {
    const base = { name: "lesson_started" as const, courseId: "c1", sessionId: "s1" };
    const a = stableTelemetryEventId({ ...base, lessonId: "l1" });
    const b = stableTelemetryEventId({ ...base, lessonId: "l2" });
    const c = stableTelemetryEventId({ ...base, lessonId: "l1", sessionId: "s2" });
    const d = stableTelemetryEventId({ ...base, lessonId: "l1", attemptId: "a1" });
    const e = stableTelemetryEventId({ ...base, lessonId: "l1", attemptId: "a2" });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(d).not.toBe(e);
  });
});

describe("enrichTelemetryEventForXapi", () => {
  it("assigns stable id to lifecycle events without id", () => {
    const event = {
      name: "course_started" as const,
      courseId: "c1",
      sessionId: "s1",
      timestamp: "2026-01-01T00:00:00.000Z",
    };
    const enriched = enrichTelemetryEventForXapi(event) as typeof event & { id?: string };
    expect(enriched.id).toMatch(UUID_RE);
    expect(
      (enrichTelemetryEventForXapi({ ...event, timestamp: "2026-01-02T00:00:00.000Z" }) as typeof event & {
        id?: string;
      }).id,
    ).toBe(enriched.id);
  });

  it("does not assign id to assessment_answered events", () => {
    const event = {
      name: "assessment_answered" as const,
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      timestamp: "2026-01-01T00:00:00.000Z",
      data: { checkId: "q1" },
    };
    expect((enrichTelemetryEventForXapi(event) as { id?: string }).id).toBeUndefined();
  });

  it("assigns stable id to assessment_completed across timestamps", () => {
    const base = {
      name: "assessment_completed" as const,
      courseId: "c1",
      lessonId: "l1",
      sessionId: "s1",
      data: { checkId: "tf-1", interactionType: "trueFalse" as const, score: 1, maxScore: 1 },
    };
    const enriched = enrichTelemetryEventForXapi({
      ...base,
      timestamp: "2026-01-01T00:00:00.000Z",
    }) as typeof base & { id?: string };
    const retry = enrichTelemetryEventForXapi({
      ...base,
      timestamp: "2026-06-07T12:00:00.000Z",
    }) as typeof base & { id?: string };
    expect(enriched.id).toMatch(UUID_RE);
    expect(retry.id).toBe(enriched.id);
  });
});
