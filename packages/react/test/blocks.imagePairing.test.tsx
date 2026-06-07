import React, { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import type { AssessmentHandle } from "@lessonkit/core";
import { Course, ImagePairing, Lesson } from "../src";

const pairs = [
  { id: "p1", label: "Helmet", imageSrc: "/helmet.png" },
  { id: "p2", label: "Gloves", imageSrc: "/gloves.png" },
];

function wrap(children: React.ReactNode) {
  return (
    <Course title="C" courseId="image-pairing-resume" config={{ xapi: { enabled: false } }}>
      <Lesson title="L" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

describe("ImagePairing component resume", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("restores matched pairs and score via ref.resume", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <ImagePairing ref={ref} checkId="pair-resume" pairs={pairs} />,
      ),
    );

    ref.current?.resume?.({
      cardKeys: ["p1-0", "p1-1", "p2-0", "p2-1"],
      matched: ["p1"],
      revealed: [],
      keyboardSelection: null,
      passed: false,
    });

    await waitFor(() => {
      expect(ref.current?.getScore()).toBe(1);
    });
    expect(ref.current?.getAnswerGiven()).toBe(true);
  });

  it("persists restored cardKeys via getCurrentState after resume", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const ref = createRef<AssessmentHandle>();
    render(
      wrap(
        <ImagePairing ref={ref} checkId="pair-persist" pairs={pairs} />,
      ),
    );

    ref.current?.resume?.({
      cardKeys: ["p2-0", "p1-0", "p2-1", "p1-1"],
      matched: [],
      revealed: [],
      keyboardSelection: null,
      passed: false,
    });

    await waitFor(() => {
      const state = ref.current?.getCurrentState?.() as { cardKeys?: string[] } | undefined;
      expect(state?.cardKeys).toEqual(["p2-0", "p1-0", "p2-1", "p1-1"]);
    });
  });
});
