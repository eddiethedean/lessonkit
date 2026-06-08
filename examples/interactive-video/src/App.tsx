import { useMemo } from "react";
import {
  Course,
  Heading,
  InformationWall,
  InteractiveVideo,
  Lesson,
  MemoryGame,
  Text,
  TimedCue,
  TrueFalse,
  Video,
} from "@lessonkit/react";
import { ExampleThemeShell } from "../../_shared/ExampleThemeShell";

const COURSE_ID = "interactive-video-demo";

/** Sample clip served from public/ (Big Buck Bunny 360p, ~10s). Replace for production courses. */
const SAMPLE_VIDEO = "/media/sample-briefing.mp4";

export default function App() {
  const config = useMemo(
    () => ({ tracking: { enabled: false }, xapi: { enabled: false } }),
    [],
  );

  return (
    <ExampleThemeShell>
      <Course title="Safety briefing" courseId={COURSE_ID} config={config}>
        <Lesson title="Interactive video" lessonId="video-lesson">
          <InteractiveVideo
            blockId="safety-video"
            title="Warehouse safety briefing"
            src={SAMPLE_VIDEO}
            showVideoScore
          >
            <TimedCue atSeconds={5} label="Quick check" mustComplete>
              <TrueFalse
                checkId="ppe-video-tf"
                question="PPE is required in the warehouse."
                answer={true}
              />
            </TimedCue>
            <TimedCue atSeconds={15} label="Reminder">
              <Text>Report hazards to your supervisor immediately.</Text>
            </TimedCue>
          </InteractiveVideo>

          <Heading level={2}>More 1.4 blocks</Heading>
          <Video
            blockId="intro-clip"
            src={SAMPLE_VIDEO}
            title="Optional standalone video block"
          />
          <MemoryGame
            blockId="hazard-memory"
            pairs={[
              { id: "a", label: "Hard hat" },
              { id: "b", label: "Hard hat" },
              { id: "c", label: "Safety vest" },
              { id: "d", label: "Safety vest" },
            ]}
          />
          <InformationWall
            blockId="safety-wall"
            panels={[
              { id: "ppe", title: "PPE", body: "Wear required personal protective equipment." },
              { id: "report", title: "Reporting", body: "Report incidents to your supervisor." },
            ]}
          />
        </Lesson>
      </Course>
    </ExampleThemeShell>
  );
}
