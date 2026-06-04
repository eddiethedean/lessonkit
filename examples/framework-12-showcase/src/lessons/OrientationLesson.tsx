import { Heading, Image, Scenario, Text } from "@lessonkit/react";

export function OrientationLesson() {
  return (
    <>
      <Scenario blockId="orientation-scenario">
        <Text>
          Welcome to Atlas Analytics. This course doubles as the LessonKit <strong>1.2 block catalog</strong>—every
          lesson introduces a family of components you can copy into your own projects.
        </Text>
      </Scenario>

      <div className="showcase-callout">
        <strong>Looking for 1.1 blocks only?</strong> Run the sibling showcase:{" "}
        <code>npm -w lessonkit-example-framework-11-showcase run dev</code>
      </div>

      <Heading blockId="orientation-heading" level={2}>
        What you will explore
      </Heading>

      <ul className="showcase-objectives">
        <li>Content blocks — Text, Heading, Image</li>
        <li>Tier C/D presentation — Accordion through ImageSlider</li>
        <li>Compound containers — Page, InteractiveBook, AssessmentSequence</li>
        <li>P0 assessments — including FindHotspot and FindMultipleHotspots</li>
      </ul>

      <Image
        blockId="orientation-hero"
        src="/images/atlas-hero.svg"
        alt="Atlas Analytics dashboard illustration"
      />
    </>
  );
}
