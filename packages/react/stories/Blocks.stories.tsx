import type { Meta, StoryObj } from "@storybook/react";
import { Course, KnowledgeCheck, Lesson, Reflection, Scenario } from "../src/components";
import { storyConfig } from "./helpers";

const meta: Meta = {
  title: "Components/Blocks",
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj;

export const ScenarioBlock: Story = {
  render: () => (
    <Course title="Scenario demo" courseId="storybook-scenario" config={storyConfig}>
      <Lesson title="Phishing email" lessonId="lesson-scenario">
        <Scenario blockId="phishing-email">
          <p>You receive an urgent email asking you to reset your password. What do you do?</p>
        </Scenario>
      </Lesson>
    </Course>
  ),
};

export const ReflectionBlock: Story = {
  render: () => (
    <Course title="Reflection demo" courseId="storybook-reflection" config={storyConfig}>
      <Lesson title="Apply your learning" lessonId="lesson-reflection">
        <Reflection blockId="apply-learning" prompt="How would you verify a suspicious link at work?">
          <p>Use the text area below to capture your response.</p>
        </Reflection>
      </Lesson>
    </Course>
  ),
};

export const KnowledgeCheckBlock: Story = {
  render: () => (
    <Course title="Knowledge check demo" courseId="storybook-kc" config={storyConfig}>
      <Lesson title="Check your understanding" lessonId="lesson-kc">
        <KnowledgeCheck
          checkId="kc-1"
          question="Which protocol encrypts web traffic?"
          choices={["HTTP", "HTTPS", "FTP"]}
          answer="HTTPS"
        />
      </Lesson>
    </Course>
  ),
};
