import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Course, Lesson, MultimediaChoice } from "../src";
import { storyConfig } from "./helpers";

const meta: Meta<typeof MultimediaChoice> = {
  title: "Components/MultimediaChoice — H5P Multimedia Choice",
  component: MultimediaChoice,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof MultimediaChoice>;

export const Default: Story = {
  render: () => (
    <Course title="Demo" courseId="storybook-multimedia-choice" config={storyConfig}>
      <Lesson title="Lesson" lessonId="lesson-1">
        <MultimediaChoice
          checkId="mm-1"
          question="Which channel is approved for IT requests?"
          choices={[
            {
              label: "Service portal",
              mediaUrl: "https://picsum.photos/seed/portal/120/80",
              mediaKind: "image",
              altText: "Service portal screenshot",
            },
            {
              label: "Unknown email link",
              mediaUrl: "https://picsum.photos/seed/email/120/80",
              mediaKind: "image",
              altText: "Suspicious email screenshot",
            },
          ]}
          answer="Service portal"
        />
      </Lesson>
    </Course>
  ),
};
