import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Course, Lesson, Quiz } from "../src/components";
import { storyConfig } from "./helpers";

const quizProps = {
  checkId: "capitals-quiz" as const,
  question: "What is the capital of France?",
  choices: ["London", "Paris", "Berlin"],
  answer: "Paris",
};

const meta: Meta<typeof Quiz> = {
  title: "Components/Quiz",
  component: Quiz,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Quiz>;

const QuizInLesson = (props: React.ComponentProps<typeof Quiz>) => (
  <Course title="Quiz demo" courseId="storybook-quiz" config={storyConfig}>
    <Lesson title="Capitals" lessonId="lesson-capitals">
      <Quiz {...props} />
    </Lesson>
  </Course>
);

export const Unanswered: Story = {
  render: () => <QuizInLesson {...quizProps} />,
};

export const IncorrectSelection: Story = {
  render: () => <QuizInLesson {...quizProps} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("London"));
    await expect(canvas.getByRole("status")).toHaveTextContent("Try again");
  },
};

export const CorrectSelection: Story = {
  render: () => <QuizInLesson {...quizProps} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Paris"));
    await expect(canvas.getByRole("status")).toHaveTextContent("Correct");
  },
};
