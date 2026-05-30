import type { Meta, StoryObj } from "@storybook/react";
import { Course, Lesson, ProgressTracker } from "../src/components";
import { storyConfig } from "./helpers";

const meta: Meta = {
  title: "Layouts/Course and Lesson",
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

export const SingleLesson: Story = {
  render: () => (
    <Course title="Introduction to LessonKit" courseId="storybook-course" config={storyConfig}>
      <ProgressTracker />
      <Lesson title="Getting started" lessonId="lesson-1">
        <p>Welcome to LessonKit. This lesson shell includes a progress tracker and lesson heading.</p>
      </Lesson>
    </Course>
  ),
};

export const MultiLessonNavigation: Story = {
  render: () => (
    <Course title="Multi-lesson course" courseId="storybook-course" config={storyConfig}>
      <ProgressTracker />
      <Lesson title="Lesson one" lessonId="lesson-1">
        <p>First lesson content. Switch lessons by mounting a different Lesson (as in a routed SPA).</p>
      </Lesson>
      <Lesson title="Lesson two" lessonId="lesson-2">
        <p>Second lesson stub — in production only one active lesson is shown at a time.</p>
      </Lesson>
    </Course>
  ),
};
