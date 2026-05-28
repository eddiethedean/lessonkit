import { describe, expect, it } from "vitest";
import { applyCssVariables } from "../src/theme/applyCssVariables";

describe("applyCssVariables", () => {
  it("sets variables and removes stale keys", () => {
    const el = document.createElement("div");
    const first = applyCssVariables(el, { "--lk-a": "1", "--lk-b": "2" }, new Set());
    expect(el.style.getPropertyValue("--lk-a")).toBe("1");
    expect(el.style.getPropertyValue("--lk-b")).toBe("2");

    applyCssVariables(el, { "--lk-a": "9" }, first);
    expect(el.style.getPropertyValue("--lk-a")).toBe("9");
    expect(el.style.getPropertyValue("--lk-b")).toBe("");
  });
});
