import {
  GuessTheAnswer,
  MultimediaChoice,
  Quiz,
  SingleChoiceSet,
  SortParagraphs,
} from "@lessonkit/react";
import { DEMO_HERO_IMAGE } from "../constants";
import { demoFrame } from "../demoFrame";
import type { ComponentDemo } from "../types";

export const batch5Demos: ComponentDemo[] = [
  {
    slug: "sort-paragraphs",
    title: "SortParagraphs",
    render: () =>
      demoFrame(
        "sort-paragraphs",
        "Incident response",
        <SortParagraphs
          checkId="ir-sort"
          paragraphs={["Contain the account", "Notify security", "Document the timeline"]}
          correctOrder={[0, 1, 2]}
        />,
      ),
  },
  {
    slug: "guess-the-answer",
    title: "GuessTheAnswer",
    render: () =>
      demoFrame(
        "guess-the-answer",
        "Policy acronym",
        <GuessTheAnswer checkId="policy-guess" prompt="What is the EU privacy regulation acronym?" answer="GDPR" />,
      ),
  },
  {
    slug: "multimedia-choice",
    title: "MultimediaChoice",
    render: () =>
      demoFrame(
        "multimedia-choice",
        "Approved channel",
        <MultimediaChoice
          checkId="channel-mm"
          question="Which channel is approved for IT requests?"
          choices={[
            {
              label: "Service portal",
              mediaUrl: DEMO_HERO_IMAGE,
              mediaKind: "image",
              altText: "Corporate service portal home screen",
            },
            {
              label: "Unknown email link",
              mediaUrl: DEMO_HERO_IMAGE,
              mediaKind: "image",
              altText: "Suspicious email screenshot",
            },
          ]}
          answer="Service portal"
        />,
      ),
  },
  {
    slug: "single-choice-set",
    title: "SingleChoiceSet",
    render: () =>
      demoFrame(
        "single-choice-set",
        "Security basics",
        <SingleChoiceSet blockId="scs-demo" title="Security basics" showSetScore>
          <Quiz checkId="scs-q1" question="Report phishing to security?" choices={["Yes", "No"]} answer="Yes" />
          <Quiz
            checkId="scs-q2"
            question="Share passwords with colleagues?"
            choices={["Yes", "No"]}
            answer="No"
          />
        </SingleChoiceSet>,
      ),
  },
];
