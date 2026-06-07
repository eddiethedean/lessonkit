import { describe, expect, it } from "vitest";
import { telemetryEventToXAPIStatement } from "../src/telemetryMap";

describe("telemetryEventToXAPIStatement idempotency", () => {
  const baseEvent = {
    name: "course_started" as const,
    courseId: "my-course",
    timestamp: "2026-01-01T00:00:00.000Z",
    sessionId: "session-1",
  };

  it("maps the same event twice to identical statement ids", () => {
    const first = telemetryEventToXAPIStatement(baseEvent);
    const second = telemetryEventToXAPIStatement(baseEvent);
    expect(first?.id).toBeTruthy();
    expect(first?.id).toBe(second?.id);
  });

  it("uses telemetry event.id when it is a valid UUID", () => {
    const stableId = "550e8400-e29b-41d4-a716-446655440000";
    const statement = telemetryEventToXAPIStatement({ ...baseEvent, id: stableId });
    expect(statement?.id).toBe(stableId);
  });
});
