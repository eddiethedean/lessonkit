import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { LessonkitProvider } from "../src";
import { registerRuntimeTestCleanup } from "./runtime.testSetup";

describe("@lessonkit/react runtime — page exit", () => {
  registerRuntimeTestCleanup();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers pagehide only for exit flush (not visibilitychange)", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");
    const docAdd = vi.spyOn(document, "addEventListener");

    render(
      <LessonkitProvider
        config={{
          courseId: "course-1",
          tracking: { enabled: false },
          xapi: { enabled: false },
        }}
      >
        <div>child</div>
      </LessonkitProvider>,
    );

    expect(addEventListener).toHaveBeenCalledWith("pagehide", expect.any(Function));
    expect(docAdd).not.toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });
});
