import { describe, expect, it } from "vitest";
import catalogJson from "../telemetry-catalog.v1.json";
import identityContractJson from "../identity-contract.v1.json";
import {
  assertValidId,
  buildLessonkitUrn,
  buildTelemetryCatalog,
  deriveId,
  ID_MAX_LENGTH,
  ID_PATTERN,
  slugifyId,
  validateId,
} from "../src";

describe("@lessonkit/core identity", () => {
  it("validateId accepts valid ids", () => {
    expect(validateId("phishing-101").ok).toBe(true);
    expect(validateId("quiz_1").ok).toBe(true);
  });

  it("validateId rejects invalid ids", () => {
    expect(validateId("").ok).toBe(false);
    expect(validateId("1bad").ok).toBe(false);
    expect(validateId("has space").ok).toBe(false);
    expect(validateId(null).ok).toBe(false);
    expect(validateId("a".repeat(65)).ok).toBe(false);
  });

  it("assertValidId throws with message", () => {
    expect(() => assertValidId("!!!")).toThrow(/letter/);
  });

  it("slugifyId produces valid ids", () => {
    expect(slugifyId("Phishing Awareness 101")).toBe("phishing-awareness-101");
    expect(validateId(slugifyId("")).ok).toBe(true);
  });

  it("deriveId handles collisions", () => {
    const used = new Set(["intro"]);
    expect(deriveId("Intro", used)).toBe("intro-2");
  });

  it("buildLessonkitUrn builds stable paths", () => {
    expect(buildLessonkitUrn({ courseId: "c1" })).toBe("urn:lessonkit:course:c1");
    expect(buildLessonkitUrn({ courseId: "c1", lessonId: "l1" })).toBe(
      "urn:lessonkit:course:c1:lesson:l1",
    );
    expect(
      buildLessonkitUrn({ courseId: "c1", lessonId: "l1", checkId: "q1" }),
    ).toBe("urn:lessonkit:course:c1:lesson:l1:check:q1");
  });

  it("buildLessonkitUrn requires lessonId for check and block", () => {
    expect(() => buildLessonkitUrn({ courseId: "c1", checkId: "q1" })).toThrow(/lessonId/);
    expect(() => buildLessonkitUrn({ courseId: "c1", blockId: "b1" })).toThrow(/lessonId/);
  });

  it("buildLessonkitUrn includes block segment", () => {
    expect(buildLessonkitUrn({ courseId: "c1", lessonId: "l1", blockId: "intro" })).toBe(
      "urn:lessonkit:course:c1:lesson:l1:block:intro",
    );
  });

  it("deriveId falls back after exhausting numeric suffixes", () => {
    const used = new Set<string>(["intro"]);
    for (let n = 2; n < 1000; n++) used.add(`intro-${n}`);
    const id = deriveId("Intro", used);
    expect(id.startsWith("intro-")).toBe(true);
  });

  it("identity-contract.v1.json idPattern matches ID_PATTERN", () => {
    const contract = identityContractJson as { idPattern: string; maxLength: number };
    expect(new RegExp(contract.idPattern).source).toBe(ID_PATTERN.source);
    expect(contract.maxLength).toBe(ID_MAX_LENGTH);
  });

  it("telemetry-catalog.v1.json matches buildTelemetryCatalog()", () => {
    const catalog = catalogJson as { schemaVersion: number; entries: ReturnType<typeof buildTelemetryCatalog> };
    expect(catalog.schemaVersion).toBe(1);
    expect(catalog.entries).toEqual(buildTelemetryCatalog());
  });
});
