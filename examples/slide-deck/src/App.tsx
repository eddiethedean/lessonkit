import { useMemo } from "react";
import {
  Accordion,
  Course,
  Heading,
  Lesson,
  Slide,
  SlideDeck,
  Text,
  ThemeProvider,
  TrueFalse,
} from "@lessonkit/react";

const COURSE_ID = "slide-deck-demo";

export default function App() {
  const config = useMemo(
    () => ({ tracking: { enabled: false }, xapi: { enabled: false } }),
    [],
  );

  return (
    <ThemeProvider mode="light">
      <Course title="Warehouse onboarding" courseId={COURSE_ID} config={config}>
        <Lesson title="Presentation" lessonId="deck-lesson">
          <SlideDeck blockId="onboarding-deck" title="New hire onboarding" showDeckScore>
            <Slide blockId="slide-welcome" title="Welcome">
              <Heading level={2}>Welcome aboard</Heading>
              <Text>Use the arrow keys or buttons to move between slides.</Text>
            </Slide>
            <Slide blockId="slide-policy" title="Safety policy">
              <Accordion
                blockId="policy-accordion"
                sections={[
                  {
                    id: "ppe",
                    title: "PPE requirements",
                    content: <Text>Always wear required PPE in the warehouse.</Text>,
                  },
                ]}
              />
            </Slide>
            <Slide blockId="slide-check" title="Knowledge check">
              <TrueFalse
                checkId="ppe-deck-tf"
                question="PPE is optional in the warehouse."
                answer={false}
              />
            </Slide>
            <Slide blockId="slide-summary" title="Summary">
              <Text>You have completed the onboarding presentation.</Text>
            </Slide>
          </SlideDeck>
        </Lesson>
      </Course>
    </ThemeProvider>
  );
}
