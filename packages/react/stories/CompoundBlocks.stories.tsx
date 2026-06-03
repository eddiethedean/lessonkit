import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  Course,
  InteractiveBook,
  Lesson,
  Page,
  Text,
  TrueFalse,
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
