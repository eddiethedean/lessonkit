import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { loadStudioProject } from "@lessonkit/studio-schema";
import { StudioRenderer } from "../src";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("@lessonkit/studio-renderer blocks", () => {
  it("renders primitive blocks and stubs", () => {
    const loaded = loadStudioProject({
      schemaVersion: 1,
      course: { courseId: "blocks-course", title: "Blocks" },
      pages: [
        {
          id: "lesson-1",
          title: "Lesson",
          blocks: [
            { type: "image", id: "img", src: "/x.png", alt: "Alt text" },
            { type: "button", id: "btn", label: "Click me" },
            { type: "input", id: "inp", label: "Email", inputType: "email" },
            { type: "video", id: "vid", src: "/v.mp4", title: "Clip" },
          ],
        },
      ],
    });
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    render(<StudioRenderer project={loaded.project} />);
    expect(screen.getByAltText("Alt text")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Click me" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByText("Video (coming soon)")).toBeTruthy();
  });
});
