import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Course, Lesson, TrueFalse } from "../src";
import { storyConfig } from "./helpers";

const meta: Meta<typeof TrueFalse> = {
  title: "Components/TrueFalse — H5P True/False",
  component: TrueFalse,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof TrueFalse>;

export const Default: Story = {
  render: () => (
    <Course title="Demo" courseId="storybook-tf" config={storyConfig}>
      <Lesson title="Lesson" lessonId="lesson-1">
        <TrueFalse checkId="tf-1" question="The sky is green." answer={false} />
      </Lesson>
    </Course>
  ),
};
