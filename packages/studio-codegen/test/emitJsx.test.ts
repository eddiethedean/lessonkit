import { describe, expect, it } from "vitest";
import { emitAppTsx, emitBlockJsx } from "../src/emitJsx";
import { sampleProject } from "./fixtures/sampleProject";

describe("emitJsx", () => {
  it("escapes special characters in text blocks", () => {
    const jsx = emitBlockJsx(
      { type: "text", id: "t", text: 'Say "hello" & <goodbye>' },
      "",
    );
    expect(jsx).toContain("<Text");
    expect(jsx).toContain('\\"hello\\"');
    expect(jsx).toContain("&");
    expect(jsx).toContain("<goodbye>");
  });

  it("emits TrueFalse and InteractiveBook framework components", () => {
    const trueFalse = emitBlockJsx(
      {
        type: "trueFalse",
        id: "tf1",
        checkId: "check-tf",
        question: "Sky is blue?",
        answer: true,
      },
      "  ",
    );
    expect(trueFalse).toContain("<TrueFalse");
    expect(trueFalse).toContain('answer={true}');

    const book = emitBlockJsx(
      {
        type: "interactiveBook",
        id: "book1",
        blockId: "book-block",
        title: "My book",
        pages: [
          {
            type: "page",
            id: "page1",
            blockId: "page-block",
            title: "Chapter",
            blocks: [{ type: "text", id: "t1", text: "Chapter body" }],
          },
        ],
      },
      "  ",
    );
    expect(book).toContain("<InteractiveBook");
    expect(book).toContain("<Page");
    expect(book).toContain("hidden");
    expect(book).toContain("Chapter body");
  });

  it("emits nested quiz blocks in lessons", () => {
    const app = emitAppTsx(sampleProject, "default");
    expect(app).toContain("<Lesson");
    expect(app).toContain("<Quiz");
    expect(app).toContain("<Text");
    expect(app).toContain("<Heading");
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
