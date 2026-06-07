import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import {
  AssessmentSequence,
  BranchingScenario,
  BranchNode,
  Course,
  InteractiveBook,
  InteractiveVideo,
  Lesson,
  Page,
  Slide,
  SlideDeck,
  Text,
  TimedCue,
  TrueFalse,
} from "../src";

const COURSE_ID = "compound-blockid";

function wrap(children: React.ReactNode) {
  return (
    <Course
      title="Compound"
      courseId={COURSE_ID}
      config={{ xapi: { enabled: false }, session: { persistCompoundState: true } }}
    >
      <Lesson title="L1" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

describe("requireCompoundBlockIdWhenPersisting", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  const cases: Array<{ name: string; node: React.ReactNode }> = [
    {
      name: "InteractiveBook",
      node: (
        <InteractiveBook {...({ title: "Book" } as React.ComponentProps<typeof InteractiveBook>)}>
          <Page blockId="p1" title="One">
            <Text>Page one</Text>
          </Page>
        </InteractiveBook>
      ),
    },
    {
      name: "SlideDeck",
      node: (
        <SlideDeck {...({ title: "Deck" } as React.ComponentProps<typeof SlideDeck>)}>
          <Slide blockId="s1" title="One">
            <Text>Slide one</Text>
          </Slide>
        </SlideDeck>
      ),
    },
    {
      name: "InteractiveVideo",
      node: (
        <InteractiveVideo
          {...({ title: "Video", src: "/sample.mp4" } as React.ComponentProps<typeof InteractiveVideo>)}
        >
          <TimedCue atSeconds={0} label="Cue">
            <Text>Cue text</Text>
          </TimedCue>
        </InteractiveVideo>
      ),
    },
    {
      name: "BranchingScenario",
      node: (
        <BranchingScenario
          {...({ title: "Branch", startNodeId: "start" } as React.ComponentProps<typeof BranchingScenario>)}
        >
          <BranchNode nodeId="start" title="Start">
            <Text>Start</Text>
          </BranchNode>
        </BranchingScenario>
      ),
    },
    {
      name: "AssessmentSequence",
      node: (
        <AssessmentSequence sequential>
          <TrueFalse checkId="tf-a" question="A?" answer={true} />
        </AssessmentSequence>
      ),
    },
  ];

  it.each(cases)("throws when $name omits blockId with persistCompoundState", ({ node }) => {
    expect(() => render(wrap(node))).toThrow(/requires a unique blockId/);
  });
});
