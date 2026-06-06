import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  Course,
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
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

/** H5P: Interactive Book */
export const InteractiveBookBlock: Story = {
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
