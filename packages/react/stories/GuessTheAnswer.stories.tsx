import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Course, Lesson, GuessTheAnswer } from "../src";
import { storyConfig } from "./helpers";

const meta: Meta<typeof GuessTheAnswer> = {
  title: "Components/GuessTheAnswer — H5P Guess the Answer",
  component: GuessTheAnswer,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof GuessTheAnswer>;

export const Scored: Story = {
  render: () => (
    <Course title="Demo" courseId="storybook-guess-scored" config={storyConfig}>
      <Lesson title="Lesson" lessonId="lesson-1">
        <GuessTheAnswer checkId="guess-1" prompt="What is the capital of France?" answer="Paris" />
      </Lesson>
    </Course>
  ),
};

export const Unscored: Story = {
  render: () => (
    <Course title="Demo" courseId="storybook-guess-unscored" config={storyConfig}>
      <Lesson title="Lesson" lessonId="lesson-1">
        <GuessTheAnswer scored={false} prompt="Reveal the policy acronym" answer="GDPR" />
      </Lesson>
    </Course>
  ),
};
