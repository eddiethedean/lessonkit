import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

describe("@lessonkit/react provider dispose regression", () => {
  afterEach(() => cleanup());

  it("does not dispose tracking client on lesson transitions (only on unmount)", async () => {
    const dispose = vi.fn();

    vi.resetModules();
    vi.doMock("@lessonkit/core", async () => {
      const actual = await vi.importActual<any>("@lessonkit/core");
      return {
        ...actual,
        createTrackingClient: () => ({
          track: vi.fn(),
          dispose,
        }),
      };
    });

    const mod = await import("../src");
    const { LessonkitProvider, useLessonkit } = mod;

    let runtime!: ReturnType<typeof useLessonkit>;
    function Driver() {
      runtime = useLessonkit();
      React.useEffect(() => {
        runtime.setActiveLesson("lesson-1");
        runtime.setActiveLesson("lesson-2");
      }, [runtime]);
      return <div>driver</div>;
    }

    const { unmount } = render(
      <LessonkitProvider config={{ tracking: { sink: () => {} } }}>
        <Driver />
      </LessonkitProvider>,
    );

    // Allow effects to run.
    await waitFor(() => {
      expect(runtime.progress.activeLessonId).toBe("lesson-2");
    });

    expect(dispose).not.toHaveBeenCalled();
    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);

    vi.unmock("@lessonkit/core");
  });
});

