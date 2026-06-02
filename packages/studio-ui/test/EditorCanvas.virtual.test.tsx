import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { StudioProjectV1 } from "@lessonkit/studio-schema";
import { createEditorStore } from "@lessonkit/studio-builder";
import { EditorCanvas } from "../src/EditorCanvas";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => ({
    getTotalSize: () => 240,
    getVirtualItems: () => [{ index: 0, start: 0, key: 0 }],
  }),
}));

const project: StudioProjectV1 = {
  schemaVersion: 1,
  course: { courseId: "virtual", title: "Virtual" },
  pages: [
    {
      id: "lesson-1",
      title: "Large",
      blocks: Array.from({ length: 32 }, (_, index) => ({
        type: "text" as const,
        id: `text-${index}`,
        text: `Block ${index}`,
      })),
    },
  ],
};

describe("EditorCanvas virtualization", () => {
  it("renders virtualized rows when root list exceeds threshold", () => {
    const store = createEditorStore(project);
    render(<EditorCanvas store={store} />);
    expect(screen.getByText("Block 0")).toBeDefined();
  });
});
