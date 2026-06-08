import { useMemo } from "react";
import {
  Accordion,
  Course,
  InteractiveBook,
  Lesson,
  Page,
  Text,
  TrueFalse,
} from "@lessonkit/react";
import { ExampleThemeShell } from "../../_shared/ExampleThemeShell";

const COURSE_ID = "interactive-book-demo";

export default function App() {
  const config = useMemo(
    () => ({ tracking: { enabled: false }, xapi: { enabled: false } }),
    [],
  );

  return (
    <ExampleThemeShell>
      <Course title="Warehouse safety handbook" courseId={COURSE_ID} config={config}>
        <Lesson title="Handbook" lessonId="book-lesson">
          <InteractiveBook blockId="safety-book" title="Safety handbook" showBookScore>
            <Page blockId="page-intro" title="Introduction">
              <Text>Welcome to the warehouse safety handbook.</Text>
              <Accordion
                blockId="intro-accordion"
                sections={[
                  {
                    id: "goals",
                    title: "Learning goals",
                    content: <Text>Identify hazards and use PPE correctly.</Text>,
                  },
                ]}
              />
            </Page>
            <Page blockId="page-check" title="Check your knowledge">
              <TrueFalse
                checkId="ppe-tf"
                question="PPE is optional in the warehouse."
                answer={false}
              />
            </Page>
          </InteractiveBook>
        </Lesson>
      </Course>
    </ExampleThemeShell>
  );
}
