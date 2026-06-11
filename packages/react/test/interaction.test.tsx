// @vitest-environment jsdom
import { act, render, renderHook, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Course, DragAndDrop, Lesson, TrueFalse } from "../src";
import {
  resolveDropTargetAtPoint,
  useCoarsePointer,
  usePickAndPlace,
  usePointerDrag,
} from "../src/interaction";
import { mockMatchMedia } from "../src/testing";

const config = { xapi: { enabled: false } } as const;

function wrap(children: React.ReactNode) {
  return (
    <Course title="Touch" courseId="touch-test" config={config}>
      <Lesson title="L1" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

describe("usePickAndPlace", () => {
  it("toggles selection", () => {
    const { result } = renderHook(() => usePickAndPlace<string>());
    act(() => result.current.toggle("a"));
    expect(result.current.selected).toBe("a");
    act(() => result.current.toggle("a"));
    expect(result.current.selected).toBeNull();
  });

  it("clear and isSelected", () => {
    const { result } = renderHook(() => usePickAndPlace<string>());
    act(() => result.current.setSelected("b"));
    expect(result.current.isSelected("b")).toBe(true);
    expect(result.current.isSelected("a")).toBe(false);
    act(() => result.current.clear());
    expect(result.current.selected).toBeNull();
  });
});

describe("useCoarsePointer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads coarse pointer media query", () => {
    const restore = mockMatchMedia({ coarse: true });
    const { result } = renderHook(() => useCoarsePointer());
    expect(result.current).toBe(true);
    restore();
  });

  it("returns false when coarse pointer does not match", () => {
    const restore = mockMatchMedia({ coarse: false });
    const { result } = renderHook(() => useCoarsePointer());
    expect(result.current).toBe(false);
    restore();
  });
});

describe("resolveDropTargetAtPoint", () => {
  const originalElementFromPoint = document.elementFromPoint;

  afterEach(() => {
    document.elementFromPoint = originalElementFromPoint;
  });

  it("finds nearest drop target", () => {
    document.body.innerHTML = `
      <div data-lk-drop-id="zone-a" style="width:100px;height:100px">
        <span id="inner">x</span>
      </div>
    `;
    const inner = document.getElementById("inner");
    expect(inner).toBeTruthy();
    document.elementFromPoint = vi.fn().mockReturnValue(inner);
    expect(resolveDropTargetAtPoint(10, 10)).toBe("zone-a");
  });

  it("returns null when no drop target", () => {
    document.body.innerHTML = `<div id="plain">x</div>`;
    const plain = document.getElementById("plain");
    document.elementFromPoint = vi.fn().mockReturnValue(plain);
    expect(resolveDropTargetAtPoint(0, 0)).toBeNull();
  });
});

describe("usePointerDrag", () => {
  function DragProbe() {
    const drag = usePointerDrag({
      onDrop: vi.fn(),
    });
    return (
      <button
        type="button"
        data-testid="drag-item"
        onPointerDown={(e) => drag.start(e, "item-1")}
        onPointerMove={drag.move}
        onPointerUp={drag.end}
        onPointerCancel={drag.cancel}
      >
        drag
      </button>
    );
  }

  it("shouldSuppressClick after movement", () => {
    document.elementFromPoint = vi.fn().mockReturnValue(null);
    const onDrop = vi.fn();
    const { result } = renderHook(() => usePointerDrag({ onDrop }));
    const startEvent = {
      button: 0,
      clientX: 0,
      clientY: 0,
      pointerId: 1,
      currentTarget: { setPointerCapture: vi.fn() },
      preventDefault: vi.fn(),
    } as unknown as React.PointerEvent<HTMLElement>;
    const moveEvent = {
      clientX: 20,
      clientY: 0,
      pointerId: 1,
    } as unknown as React.PointerEvent<HTMLElement>;
    const endEvent = {
      clientX: 20,
      clientY: 0,
      pointerId: 1,
    } as unknown as React.PointerEvent<HTMLElement>;

    act(() => result.current.start(startEvent, "x"));
    act(() => result.current.move(moveEvent));
    act(() => result.current.end(endEvent));
    expect(result.current.shouldSuppressClick()).toBe(true);
  });

  it("calls onDrop when released over target", () => {
    document.body.innerHTML = `<div data-lk-drop-id="target-1" data-testid="drop" style="width:80px;height:80px"></div>`;
    const drop = document.querySelector("[data-testid='drop']");
    document.elementFromPoint = vi.fn().mockReturnValue(drop);
    const onDrop = vi.fn();
    const { result } = renderHook(() => usePointerDrag({ onDrop }));
    const startEvent = {
      button: 0,
      clientX: 0,
      clientY: 0,
      pointerId: 2,
      currentTarget: { setPointerCapture: vi.fn() },
      preventDefault: vi.fn(),
    } as unknown as React.PointerEvent<HTMLElement>;
    const moveEvent = {
      clientX: 10,
      clientY: 10,
      pointerId: 2,
    } as unknown as React.PointerEvent<HTMLElement>;
    const endEvent = {
      clientX: 10,
      clientY: 10,
      pointerId: 2,
    } as unknown as React.PointerEvent<HTMLElement>;

    act(() => result.current.start(startEvent, "item-a"));
    act(() => result.current.move(moveEvent));
    act(() => result.current.end(endEvent));
    expect(onDrop).toHaveBeenCalledWith("item-a", "target-1");
  });

  it("renders drag probe without error", () => {
    render(<DragProbe />);
    expect(screen.getByTestId("drag-item")).toBeTruthy();
  });
});

describe("touch block integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("TrueFalse uses lk-quiz-choice on labels", () => {
    render(wrap(<TrueFalse checkId="tf-touch" question="2+2=4?" answer={true} />));
    const choices = document.querySelectorAll(".lk-quiz-choice");
    expect(choices.length).toBe(2);
  });

  it("DragAndDrop shows touch hint on coarse pointer", () => {
    const restore = mockMatchMedia({ coarse: true });
    render(
      wrap(
        <DragAndDrop
          checkId="dad-touch"
          items={[{ id: "a", label: "A" }]}
          targets={[{ id: "t1", label: "T1", accepts: "a" }]}
        />,
      ),
    );
    expect(screen.getByRole("status").textContent).toContain("Tap an item");
    restore();
  });
});
