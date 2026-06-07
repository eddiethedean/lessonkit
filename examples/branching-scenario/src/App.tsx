import { useMemo } from "react";
import {
  BranchChoice,
  BranchingScenario,
  BranchNode,
  Course,
  Lesson,
  Scenario,
  Text,
  ThemeProvider,
  TrueFalse,
} from "@lessonkit/react";

const COURSE_ID = "branching-scenario-demo";

export default function App() {
  const config = useMemo(
    () => ({ tracking: { enabled: false }, xapi: { enabled: false } }),
    [],
  );

  return (
    <ThemeProvider mode="light">
      <Course title="Resolution paths" courseId={COURSE_ID} config={config}>
        <Lesson title="Branching scenario" lessonId="branch-lesson">
          <BranchingScenario
            blockId="resolution-paths"
            title="Resolution paths"
            startNodeId="offer"
            showPathScore
            showPathRecap
          >
            <BranchNode nodeId="offer" title="Offer">
              <Scenario>
                <p>Part ships tomorrow but the customer missed a deadline. How do you close the loop?</p>
              </Scenario>
              <BranchChoice label="Offer shipping credit + proactive updates" targetNodeId="credit" />
              <BranchChoice label="Warm-transfer to supervisor" targetNodeId="supervisor" />
            </BranchNode>

            <BranchNode nodeId="credit" terminal title="Credit">
              <Text>Document the credit code and set a callback.</Text>
              <TrueFalse checkId="credit-check" question="Document the credit code?" answer={true} />
            </BranchNode>

            <BranchNode nodeId="supervisor" terminal title="Supervisor">
              <Text>Stay on the line until the supervisor joins—no cold transfer.</Text>
            </BranchNode>
          </BranchingScenario>
        </Lesson>
      </Course>
    </ThemeProvider>
  );
}
