import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Course, Lesson, Quiz, SingleChoiceSet } from "../src";
import { storyConfig } from "./helpers";

const meta: Meta<typeof SingleChoiceSet> = {
  title: "Components/SingleChoiceSet — H5P Single Choice Set",
  component: SingleChoiceSet,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof SingleChoiceSet>;

export const Default: Story = {
  render: () => (
    <Course title="Demo" courseId="storybook-single-choice-set" config={storyConfig}>
      <Lesson title="Lesson" lessonId="lesson-1">
        <SingleChoiceSet blockId="scs-1" title="Security basics" showSetScore>
          <Quiz checkId="scs-q1" question="Report phishing to security?" choices={["Yes", "No"]} answer="Yes" />
          <Quiz
            checkId="scs-q2"
            question="Share passwords with colleagues?"
            choices={["Yes", "No"]}
            answer="No"
          />
        </SingleChoiceSet>
      </Lesson>
    </Course>
  ),
};
