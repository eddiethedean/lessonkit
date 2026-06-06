import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  BranchChoice,
  BranchingScenario,
  BranchNode,
  Chart,
  Course,
  Embed,
  Heading,
  InteractiveBook,
  InteractiveVideo,
  Lesson,
  MemoryGame,
  Page,
  Slide,
  SlideDeck,
  Summary,
  Text,
  TimedCue,
  TrueFalse,
  Video,
} from "../src";
import { storyConfig } from "./helpers";

const meta: Meta = {
  title: "Components/Compound & Tier C/D",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Compound layouts and Tier C/D blocks. Props and H5P mappings: [block catalog](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html).",
      },
    },
  },
};

export default meta;

type Story = StoryObj;

/** H5P: Interactive Book */
export const InteractiveBookBlock: Story = {
  parameters: {
    docs: {
      description: {
        story: "[`InteractiveBook` / `Page`](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html#interactivebook) in the block catalog.",
      },
    },
  },
  render: () => (
    <Course title="Handbook" courseId="storybook-book" config={storyConfig}>
      <Lesson title="Safety" lessonId="lesson-book">
        <InteractiveBook blockId="safety-book" title="Safety handbook">
          <Page blockId="page-intro" title="Introduction">
            <Text>Welcome to the handbook.</Text>
          </Page>
          <Page blockId="page-quiz" title="Check">
            <TrueFalse checkId="tf-1" question="PPE is required?" answer={true} />
          </Page>
        </InteractiveBook>
      </Lesson>
    </Course>
  ),
};

/** H5P: Course Presentation */
export const SlideDeckBlock: Story = {
  parameters: {
    docs: {
      description: {
        story: "[`SlideDeck` / `Slide`](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html#slidedeck) in the block catalog.",
      },
    },
  },
  render: () => (
    <Course title="Presentation" courseId="storybook-deck" config={storyConfig}>
      <Lesson title="Onboarding" lessonId="lesson-deck">
        <SlideDeck blockId="onboarding-deck" title="New hire onboarding" showDeckScore>
          <Slide blockId="slide-intro" title="Welcome">
            <Heading level={2}>Welcome aboard</Heading>
            <Text>This deck covers safety basics and a quick knowledge check.</Text>
          </Slide>
          <Slide blockId="slide-policy" title="Policy">
            <Accordion
              blockId="policy-accordion"
              sections={[
                { id: "ppe", title: "PPE", content: <Text>Always wear required PPE in the warehouse.</Text> },
              ]}
            />
          </Slide>
          <Slide blockId="slide-quiz" title="Check">
            <TrueFalse checkId="tf-deck" question="PPE is optional?" answer={false} />
          </Slide>
        </SlideDeck>
      </Lesson>
    </Course>
  ),
};

/** H5P: Accordion */
export const AccordionBlock: Story = {
  render: () => (
    <Course title="Accordion demo" courseId="storybook-accordion" config={storyConfig}>
      <Lesson title="Topics" lessonId="lesson-accordion">
        <Accordion
          blockId="topics-accordion"
          sections={[
            { id: "one", title: "Section one", content: <Text>First panel content.</Text> },
            { id: "two", title: "Section two", content: <Text>Second panel content.</Text> },
          ]}
        />
      </Lesson>
    </Course>
  ),
};

/** H5P: Interactive Video */
export const InteractiveVideoBlock: Story = {
  parameters: {
    docs: {
      description: {
        story: "[`InteractiveVideo` / `TimedCue`](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html#interactivevideo) in the block catalog.",
      },
    },
  },
  render: () => (
    <Course title="Interactive video" courseId="storybook-iv" config={storyConfig}>
      <Lesson title="Briefing" lessonId="lesson-iv">
        <InteractiveVideo blockId="briefing-iv" title="Safety briefing" src="/sample.mp4" showVideoScore>
          <TimedCue atSeconds={5} label="Check" mustComplete>
            <TrueFalse checkId="iv-tf" question="PPE required?" answer={true} />
          </TimedCue>
        </InteractiveVideo>
      </Lesson>
    </Course>
  ),
};

/** Self-hosted video primitive */
export const VideoBlock: Story = {
  render: () => (
    <Course title="Video" courseId="storybook-video" config={storyConfig}>
      <Lesson title="Clip" lessonId="lesson-video">
        <Video blockId="intro-video" src="/sample.mp4" title="Introduction" />
      </Lesson>
    </Course>
  ),
};

/** H5P: Summary */
export const SummaryBlock: Story = {
  render: () => (
    <Course title="Summary" courseId="storybook-summary" config={storyConfig}>
      <Lesson title="Construct" lessonId="lesson-summary">
        <Summary
          checkId="summary-1"
          statements={["Wear PPE", "Report hazards", "Stay alert"]}
          correct={["Wear PPE", "Report hazards"]}
        />
      </Lesson>
    </Course>
  ),
};

/** H5P: Memory Game */
export const MemoryGameBlock: Story = {
  render: () => (
    <Course title="Memory" courseId="storybook-memory" config={storyConfig}>
      <Lesson title="Pairs" lessonId="lesson-memory">
        <MemoryGame
          blockId="memory-1"
          pairs={[
            { id: "a", label: "Hat" },
            { id: "b", label: "Hat" },
            { id: "c", label: "Vest" },
            { id: "d", label: "Vest" },
          ]}
        />
      </Lesson>
    </Course>
  ),
};

/** H5P: Branching Scenario */
export const BranchingScenarioBlock: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "[`BranchingScenario`](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html#branchingscenario) · [1.4→1.5 migration](https://lessonkit.readthedocs.io/en/latest/MIGRATION-1.4-to-1.5.html).",
      },
    },
  },
  render: () => (
    <Course title="Branching" courseId="storybook-branch" config={storyConfig}>
      <Lesson title="Paths" lessonId="lesson-branch">
        <BranchingScenario blockId="paths" title="Resolution paths" startNodeId="offer" showPathScore>
          <BranchNode nodeId="offer">
            <Text>Choose a resolution path.</Text>
            <BranchChoice label="Credit" targetNodeId="credit" />
            <BranchChoice label="Supervisor" targetNodeId="supervisor" />
          </BranchNode>
          <BranchNode nodeId="credit" terminal>
            <TrueFalse checkId="branch-tf" question="Document credit?" answer={true} />
          </BranchNode>
          <BranchNode nodeId="supervisor" terminal>
            <Text>Supervisor path selected.</Text>
          </BranchNode>
        </BranchingScenario>
      </Lesson>
    </Course>
  ),
};

/** H5P: Iframe Embedder */
export const EmbedBlock: Story = {
  parameters: {
    docs: {
      description: {
        story: "[`Embed`](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html#embed) — sandboxed iframe (1.5).",
      },
    },
  },
  render: () => (
    <Course title="Embed" courseId="storybook-embed" config={storyConfig}>
      <Lesson title="External" lessonId="lesson-embed">
        <Embed blockId="ext" src="https://example.com" title="Example embed" />
      </Lesson>
    </Course>
  ),
};

/** H5P: Chart */
export const ChartBlock: Story = {
  parameters: {
    docs: {
      description: {
        story: "[`Chart`](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html#chart) — bar/pie with table fallback (1.5).",
      },
    },
  },
  render: () => (
    <Course title="Chart" courseId="storybook-chart" config={storyConfig}>
      <Lesson title="Metrics" lessonId="lesson-chart">
        <Chart
          blockId="incidents"
          type="bar"
          title="Incidents"
          data={[
            { label: "Phishing", value: 8 },
            { label: "Malware", value: 3 },
          ]}
        />
      </Lesson>
    </Course>
  ),
};
