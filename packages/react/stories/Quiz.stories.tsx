import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
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

export const MultiSelect: Story = {
  render: () => (
    <QuizInLesson
      checkId="hazards-multi"
      question="Select all social-engineering risks"
      choices={["Phishing email", "IT portal", "Tailgating"]}
      answer="Phishing email"
      answers={["Phishing email", "Tailgating"]}
    />
  ),
};

export const ShuffledChoices: Story = {
  render: () => (
    <QuizInLesson
      checkId="shuffled-quiz"
      question="Pick the approved channel"
      choices={["Email link", "Service portal", "Personal USB", "Public Wi‑Fi"]}
      answer="Service portal"
      shuffleChoices
      shuffleSeed="storybook-shuffle"
    />
  ),
};

export const ChoiceFeedback: Story = {
  render: () => (
    <QuizInLesson
      checkId="feedback-quiz"
      question="Which action is safest?"
      choices={["Click the link", "Use the IT portal"]}
      answer="Use the IT portal"
      choiceFeedback={{
        "Click the link": "Unknown links may be phishing.",
        "Use the IT portal": "Approved channel for IT requests.",
      }}
    />
  ),
};
