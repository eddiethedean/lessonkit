import { describe, expect, it, vi } from "vitest";
import catalogJson from "../telemetry-catalog.v1.json";
import identityContractJson from "../identity-contract.v1.json";
import {
  assertValidId,
  buildLessonkitUrn,
  buildTelemetryCatalog,
  deriveId,
  ID_MAX_LENGTH,
  ID_PATTERN,
  parseBlockId,
  parseCheckId,
  parseCourseId,
  parseLessonId,
  slugifyId,
  validateId,
} from "../src";

describe("@lessonkit/core identity", () => {
  it("validateId accepts valid ids", () => {
    expect(validateId("phishing-101").ok).toBe(true);
    expect(validateId("quiz_1").ok).toBe(true);
    expect(validateId("Quiz_MixedCase").ok).toBe(true);
  });

  it("validateId rejects invalid ids", () => {
    expect(validateId("").ok).toBe(false);
    expect(validateId("1bad").ok).toBe(false);
    expect(validateId("has space").ok).toBe(false);
    expect(validateId(null).ok).toBe(false);
    expect(validateId("a".repeat(65)).ok).toBe(false);
    expect(validateId("café").ok).toBe(false);
    expect(validateId("emoji-🎓").ok).toBe(false);
  });

  it("identity-contract urnPatterns match buildLessonkitUrn outputs", () => {
    const contract = identityContractJson as {
      urnPatterns: Record<string, string>;
    };
    expect(contract.urnPatterns.course).toBe("urn:lessonkit:course:{courseId}");
    expect(contract.urnPatterns.lesson).toBe(
      "urn:lessonkit:course:{courseId}:lesson:{lessonId}",
    );
    expect(contract.urnPatterns.check).toBe(
      "urn:lessonkit:course:{courseId}:lesson:{lessonId}:check:{checkId}",
    );
    expect(buildLessonkitUrn({ courseId: "c1" })).toBe("urn:lessonkit:course:c1");
    expect(buildLessonkitUrn({ courseId: "c1", lessonId: "l1", checkId: "q1" })).toBe(
      "urn:lessonkit:course:c1:lesson:l1:check:q1",
    );
  });

  it("assertValidId throws with message", () => {
    expect(() => assertValidId("!!!")).toThrow(/letter/);
  });

  it("parse helpers return narrowed ids or null", () => {
    expect(parseCourseId("course-a")).toBe("course-a");
    expect(parseCourseId("1bad")).toBeNull();
    expect(parseLessonId("lesson-a")).toBe("lesson-a");
    expect(parseLessonId(null)).toBeNull();
    expect(parseCheckId("check-a")).toBe("check-a");
    expect(parseCheckId("")).toBeNull();
    expect(parseBlockId("block-a")).toBe("block-a");
    expect(parseBlockId("!!!")).toBeNull();
  });

  it("assertValidId overloads return typed ids", () => {
    expect(assertValidId("course-a", "courseId")).toBe("course-a");
    expect(assertValidId("lesson-a", "lessonId")).toBe("lesson-a");
    expect(assertValidId("check-a", "checkId")).toBe("check-a");
    expect(assertValidId("block-a", "blockId")).toBe("block-a");
  });

  it("slugifyId produces valid ids", () => {
    expect(slugifyId("Phishing Awareness 101")).toBe("phishing-awareness-101");
    expect(validateId(slugifyId("")).ok).toBe(true);
    expect(validateId(slugifyId("   ")).ok).toBe(true);
    expect(slugifyId("123abc")).toBe("id-123abc");
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
    expect(validateId(id).ok).toBe(true);
    expect(id.length).toBeLessThanOrEqual(64);
  });

  it("deriveId keeps suffixed ids within the 64-character contract", () => {
    const longBase = "a".repeat(64);
    const used = new Set([longBase]);
    const id = deriveId(longBase, used);
    expect(validateId(id).ok).toBe(true);
    expect(id.length).toBeLessThanOrEqual(64);
  });

  it("deriveId uses crypto randomUUID when hash and random suffixes are exhausted", () => {
    vi.spyOn(Date, "now").mockReturnValue(42);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.stubGlobal("crypto", { randomUUID: () => "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" });

    const title = "Intro";
    const base = slugifyId(title);
    const used = new Set<string>([base]);
    for (let n = 2; n < 1000; n++) used.add(`${base}-${n}`);

    const fallbackKey = `${title}-42`;
    let h = 0;
    for (let i = 0; i < fallbackKey.length; i++) {
      h = (Math.imul(31, h) + fallbackKey.charCodeAt(i)) >>> 0;
    }
    const hash = h.toString(36);
    for (let n = 0; n < 100; n++) {
      used.add((n === 0 ? `id-${hash}` : `id-${hash}-${n}`).slice(0, 64));
    }
    const randomSuffix = (0.5).toString(36).slice(2, 8);
    used.add(`id-${hash}-${randomSuffix}`.slice(0, 64));
    used.add(`id-${hash}-${(42).toString(36)}`.slice(0, 64));

    const id = deriveId(title, used);
    expect(used.has(id)).toBe(false);
    expect(validateId(id).ok).toBe(true);

    vi.unstubAllGlobals();
    vi.spyOn(Date, "now").mockRestore();
    vi.spyOn(Math, "random").mockRestore();
  });

  it("deriveId never returns an id already in usedIds", () => {
    const title = "Collision Test";
    const base = slugifyId(title);
    const used = new Set<string>([base]);
    for (let n = 2; n < 1000; n++) used.add(`${base}-${n}`);
    const hash = (() => {
      let h = 0;
      const input = `${title}-${Date.now()}`;
      for (let i = 0; i < input.length; i++) {
        h = (Math.imul(31, h) + input.charCodeAt(i)) >>> 0;
      }
      return h.toString(36);
    })();
    for (let n = 0; n < 100; n++) {
      used.add((n === 0 ? `id-${hash}` : `id-${hash}-${n}`).slice(0, 64));
    }
    const id = deriveId(title, used);
    expect(used.has(id)).toBe(false);
    expect(validateId(id).ok).toBe(true);
  });

  it("deriveId uses random suffix fallback when numeric suffixes are exhausted", () => {
    const title = "Intro";
    const base = slugifyId(title);
    const used = new Set<string>([base]);
    for (let n = 2; n < 1000; n++) used.add(`${base}-${n}`);

    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const randomSpy = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.999999)
      .mockReturnValueOnce(0.000001);

    const id = deriveId(title, used);
    expect(validateId(id).ok).toBe(true);
    expect(used.has(id)).toBe(false);

    randomSpy.mockRestore();
    vi.spyOn(Date, "now").mockRestore();
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
