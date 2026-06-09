import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Course, Lesson, SortParagraphs } from "../src";
import { storyConfig } from "./helpers";

const meta: Meta<typeof SortParagraphs> = {
  title: "Components/SortParagraphs — H5P Sort the Paragraphs",
  component: SortParagraphs,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof SortParagraphs>;

export const Default: Story = {
  render: () => (
    <Course title="Demo" courseId="storybook-sort-paragraphs" config={storyConfig}>
      <Lesson title="Lesson" lessonId="lesson-1">
        <SortParagraphs
          checkId="sort-1"
          paragraphs={["Gather requirements", "Build prototype", "Ship release"]}
          correctOrder={[0, 1, 2]}
        />
      </Lesson>
    </Course>
  ),
};
