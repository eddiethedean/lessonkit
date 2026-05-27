import { describe, expect, it } from "vitest";
import { defaultTheme } from "../src";

describe("@lessonkit/themes", () => {
  it("exports a defaultTheme with expected shape", () => {
    expect(defaultTheme.name).toBe("default");
    expect(defaultTheme.colors?.background).toBeTruthy();
    expect(defaultTheme.colors?.foreground).toBeTruthy();
    expect(defaultTheme.colors?.primary).toBeTruthy();
    expect(defaultTheme.radius?.sm).toBeTruthy();
  });
});

