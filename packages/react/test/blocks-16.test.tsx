import React, { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AssessmentHandle } from "@lessonkit/core";
import { buildGrid, buildGridSeed } from "../src/blocks/wordSearchUtils";
import {
  AdventCalendar,
  CombinationLock,
  Course,
  Crossword,
  GameMap,
  ImageJuxtaposition,
  Lesson,
  MapExit,
  MapStage,
  QrContent,
  Table,
  Text,
  Timeline,
  TrueFalse,
  WordSearch,
} from "../src";

const config = { xapi: { enabled: false } } as const;

function wrap(children: React.ReactNode) {
  return (
    <Course title="Blocks 1.6" courseId="blocks-16" config={config}>
      <Lesson title="L1" lessonId="lesson-16">
        {children}
      </Lesson>
    </Course>
  );
}

describe("1.6.x block components", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("Table renders headers and rows", () => {
    render(
      wrap(
        <Table
          blockId="tbl-1"
          caption="Regions"
          headers={["Region", "Lead"]}
          rows={[["NA", "Alex"]]}
        />,
      ),
    );
    expect(screen.getByText("Regions")).toBeDefined();
    expect(screen.getByText("Alex")).toBeDefined();
  });

  it("ImageJuxtaposition updates divider position", () => {
    render(
      wrap(
        <ImageJuxtaposition
          blockId="jux-1"
          beforeSrc="/before.png"
          afterSrc="/after.png"
          beforeAlt="Before"
          afterAlt="After"
        />,
      ),
    );
    fireEvent.change(screen.getByTestId("juxtaposition-slider"), { target: { value: "75" } });
    expect(screen.getByTestId("juxtaposition-slider").getAttribute("value")).toBe("75");
  });

  it("Timeline lists events", () => {
    render(
      wrap(
        <Timeline
          blockId="tl-1"
          events={[{ id: "e1", date: "2024-01-01", title: "Launch", body: "Shipped v1." }]}
        />,
      ),
    );
    expect(screen.getByTestId("timeline-event-e1")).toBeDefined();
  });

  it("CombinationLock checks the combination", () => {
    render(wrap(<CombinationLock checkId="lock-1" combination="42" />));
    fireEvent.change(screen.getByTestId("lock-digit-0"), { target: { value: "4" } });
    fireEvent.change(screen.getByTestId("lock-digit-1"), { target: { value: "2" } });
    fireEvent.click(screen.getByTestId("lock-check"));
    expect(screen.getByTestId("combination-lock")).toBeDefined();
  });

  it("CombinationLock visibly updates digits when typing", () => {
    render(wrap(<CombinationLock checkId="lock-1" combination="42" />));
    const first = screen.getByTestId("lock-digit-0") as HTMLInputElement;
    const second = screen.getByTestId("lock-digit-1") as HTMLInputElement;
    expect(first.value).toBe("");
    fireEvent.change(first, { target: { value: "4" } });
    expect(first.value).toBe("4");
    fireEvent.change(first, { target: { value: "14" } });
    expect(first.value).toBe("4");
    fireEvent.change(second, { target: { value: "2" } });
    expect(second.value).toBe("2");
    expect((screen.getByTestId("lock-check") as HTMLButtonElement).disabled).toBe(false);
  });

  it("CombinationLock emits assessment_completed only once on repeated checks", async () => {
    const events: { name: string }[] = [];
    render(
      <Course
        title="Blocks 1.6"
        courseId="blocks-16"
        config={{
          xapi: { enabled: false },
          tracking: { sink: (e) => { events.push(e); } },
        }}
      >
        <Lesson title="L1" lessonId="lesson-16">
          <CombinationLock checkId="lock-dup" combination="42" />
        </Lesson>
      </Course>,
    );
    fireEvent.change(screen.getByTestId("lock-digit-0"), { target: { value: "4" } });
    fireEvent.change(screen.getByTestId("lock-digit-1"), { target: { value: "2" } });
    fireEvent.click(screen.getByTestId("lock-check"));
    fireEvent.click(screen.getByTestId("lock-check"));
    await waitFor(() => {
      expect(events.filter((e) => e.name === "assessment_completed")).toHaveLength(1);
    });
  });

  it("QrContent reveals hidden content", () => {
    render(
      wrap(
        <QrContent
          blockId="qr-1"
          payload="https://example.com"
          hiddenTitle="Secret"
          hiddenBody="Welcome back."
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("qr-reveal"));
    expect(screen.getByTestId("qr-hidden-content")).toBeDefined();
  });

  it("Crossword renders grid cells", () => {
    render(
      wrap(
        <Crossword
          checkId="cw-1"
          rows={3}
          cols={3}
          entries={[
            { id: "a1", clue: "Greeting", answer: "HI", row: 0, col: 0, direction: "across" },
          ]}
        />,
      ),
    );
    expect(screen.getByTestId("crossword-cell-0-0")).toBeDefined();
  });

  it("Crossword shows feedback when checked", () => {
    render(
      wrap(
        <Crossword
          checkId="cw-2"
          rows={1}
          cols={2}
          entries={[{ id: "a1", clue: "Greeting", answer: "HI", row: 0, col: 0, direction: "across" }]}
        />,
      ),
    );
    fireEvent.change(screen.getByTestId("crossword-cell-0-0"), { target: { value: "H" } });
    fireEvent.change(screen.getByTestId("crossword-cell-0-1"), { target: { value: "I" } });
    fireEvent.click(screen.getByTestId("crossword-check"));
    expect(screen.getByTestId("crossword-feedback").textContent).toContain("Correct");
  });

  it("Crossword clear wrong letters keeps correct cells", () => {
    render(
      wrap(
        <Crossword
          checkId="cw-3"
          rows={1}
          cols={2}
          entries={[{ id: "a1", clue: "Greeting", answer: "HI", row: 0, col: 0, direction: "across" }]}
        />,
      ),
    );
    fireEvent.change(screen.getByTestId("crossword-cell-0-0"), { target: { value: "H" } });
    fireEvent.change(screen.getByTestId("crossword-cell-0-1"), { target: { value: "X" } });
    fireEvent.click(screen.getByTestId("crossword-check"));
    expect(screen.getByTestId("crossword-clear-wrong")).toBeDefined();
    fireEvent.click(screen.getByTestId("crossword-clear-wrong"));
    expect((screen.getByTestId("crossword-cell-0-0") as HTMLInputElement).value).toBe("H");
    expect((screen.getByTestId("crossword-cell-0-1") as HTMLInputElement).value).toBe("");
    expect(screen.queryByTestId("crossword-feedback")).toBeNull();
  });

  function dragWordSearchWord(checkId: string, word: string, size = 5) {
    const { placements } = buildGrid([word], size, buildGridSeed(checkId, word, size));
    const placement = placements.find((entry) => entry.word === word.toUpperCase());
    if (!placement) throw new Error(`expected ${word} to be placed`);
    const start = screen.getByTestId(`word-search-cell-${placement.row}-${placement.col}`);
    const middle = screen.getByTestId(`word-search-cell-${placement.row}-${placement.col + 1}`);
    const end = screen.getByTestId(
      `word-search-cell-${placement.row}-${placement.col + placement.word.length - 1}`,
    );
    fireEvent.pointerDown(start, { pointerId: 1, buttons: 1 });
    fireEvent.pointerEnter(middle, { pointerId: 1, buttons: 1 });
    fireEvent.pointerEnter(end, { pointerId: 1, buttons: 1 });
    fireEvent.pointerUp(end, { pointerId: 1 });
    return placement;
  }

  it("WordSearch renders aligned grid and finds a word via drag", () => {
    render(wrap(<WordSearch checkId="ws-1" words={["CAT"]} size={5} />));

    expect(screen.getByTestId("word-search").querySelector(".lk-word-search-grid")).toBeTruthy();

    const placement = dragWordSearchWord("ws-1", "CAT");
    const foundCells = Array.from({ length: placement.word.length }, (_, index) =>
      screen.getByTestId(`word-search-cell-${placement.row}-${placement.col + index}`),
    );

    const bankItem = screen.getByText("CAT");
    expect(bankItem.classList.contains("lk-word-search-bank-item--found")).toBe(true);
    expect(bankItem.getAttribute("aria-checked")).toBe("true");
    for (const cell of foundCells) {
      expect(cell.classList.contains("lk-word-search-cell--found")).toBe(true);
    }
    expect(foundCells[0]!.classList.contains("lk-word-search-cell--selecting")).toBe(false);
  });

  it("WordSearch resume keeps found highlights after remount", async () => {
    const ref = createRef<AssessmentHandle>();
    render(wrap(<WordSearch ref={ref} checkId="ws-resume" words={["CAT"]} size={5} />));

    const placement = dragWordSearchWord("ws-resume", "CAT");

    const saved = ref.current?.getCurrentState?.();
    expect(saved).toEqual(
      expect.objectContaining({
        found: ["CAT"],
        grid: expect.any(Array),
        placements: expect.arrayContaining([expect.objectContaining({ word: "CAT" })]),
      }),
    );

    cleanup();
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const ref2 = createRef<AssessmentHandle>();
    render(wrap(<WordSearch ref={ref2} checkId="ws-resume" words={["CAT"]} size={5} />));

    act(() => {
      ref2.current?.resume?.(saved!);
    });

    await waitFor(() => {
      expect(ref2.current?.getScore()).toBe(1);
      expect(screen.getByText("CAT").classList.contains("lk-word-search-bank-item--found")).toBe(true);
      for (let index = 0; index < placement.word.length; index += 1) {
        expect(
          screen
            .getByTestId(`word-search-cell-${placement.row}-${placement.col + index}`)
            .classList.contains("lk-word-search-cell--found"),
        ).toBe(true);
      }
    });
  });

  it("AdventCalendar opens a door", () => {
    render(
      wrap(
        <AdventCalendar
          blockId="adv-1"
          doors={[{ id: "d1", day: 1, label: "Day 1", content: <Text>Surprise</Text> }]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("advent-door-button-d1"));
    expect(screen.getByTestId("advent-door-content-d1")).toBeDefined();
  });

  it("GameMap navigates between stages", () => {
    render(
      wrap(
        <GameMap
          blockId="map-1"
          title="Office tour"
          backgroundSrc="/map.png"
          startStageId="lobby"
        >
          <MapStage stageId="lobby" x={20} y={50} label="Lobby">
            <Text>Welcome.</Text>
            <MapExit label="Desk" targetStageId="desk" />
          </MapStage>
          <MapStage stageId="desk" x={60} y={30} label="Desk">
            <TrueFalse checkId="desk-tf" question="Badge visible?" answer={true} />
          </MapStage>
        </GameMap>,
      ),
    );
    expect(screen.getByTestId("map-stage-lobby")).toBeDefined();
    fireEvent.click(screen.getByTestId("map-exit-desk"));
    expect(screen.getByTestId("map-stage-desk")).toBeDefined();
    fireEvent.click(screen.getByTestId("map-marker-lobby"));
    expect(screen.getByTestId("map-stage-lobby")).toBeDefined();
    fireEvent.click(screen.getByTestId("map-marker-desk"));
    expect(screen.getByTestId("map-stage-desk")).toBeDefined();
  });
});
