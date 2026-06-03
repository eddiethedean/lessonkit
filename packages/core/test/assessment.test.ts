import { describe, expect, it } from "vitest";
import type { AssessmentHandle } from "../src/assessment";

describe("AssessmentHandle contract", () => {
  it("can be implemented by a minimal stub", () => {
    const handle: AssessmentHandle = {
      getScore: () => 1,
      getMaxScore: () => 1,
      getAnswerGiven: () => true,
      resetTask: () => {},
      showSolutions: () => {},
      getXAPIData: () => ({
        checkId: "check-1",
        interactionType: "trueFalse",
        correct: true,
      }),
    };
    expect(handle.getScore()).toBe(1);
    expect(handle.getAnswerGiven()).toBe(true);
    expect(handle.getXAPIData().interactionType).toBe("trueFalse");
  });
});
