import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("WordSearch renders letter grid", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(wrap(<WordSearch checkId="ws-1" words={["CAT"]} size={5} />));
    expect(screen.getByTestId("word-search-cell-0-0")).toBeDefined();
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
  });
});
