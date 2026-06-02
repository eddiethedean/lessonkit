import { describe, expect, it } from "vitest";
import { emitAppTsx, emitBlockJsx } from "../src/emitJsx";
import { sampleProject } from "./fixtures/sampleProject";

describe("emitJsx", () => {
  it("escapes special characters in text blocks", () => {
    const jsx = emitBlockJsx(
      { type: "text", id: "t", text: 'Say "hello" & <goodbye>' },
      "",
    );
    expect(jsx).toContain("&quot;");
    expect(jsx).toContain("&amp;");
    expect(jsx).toContain("&lt;");
  });

  it("emits nested quiz blocks in lessons", () => {
    const app = emitAppTsx(sampleProject, "default");
    expect(app).toContain("<Lesson");
    expect(app).toContain("<Quiz");
    expect(app).toContain("lk-studio-container");
    expect(app).toContain('preset="default"');
  });

  it("omits href on button blocks without a link", () => {
    const jsx = emitBlockJsx({ type: "button", id: "b", label: "Click me" }, "");
    expect(jsx).not.toContain("href=");
  });

  it("returns never for unsupported block types at runtime", () => {
    const jsx = emitBlockJsx({ type: "unknown", id: "x" } as never, "");
    expect(jsx).toBeTruthy();
  });
});
