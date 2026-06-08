import {
  BranchChoice,
  BranchingScenario,
  BranchNode,
  GameMap,
  KnowledgeCheck,
  MapExit,
  MapStage,
  Scenario,
  Text,
  TrueFalse,
} from "@lessonkit/react";
import { DEMO_MAP_IMAGE } from "../constants";
import { demoFrame } from "../demoFrame";
import type { ComponentDemo } from "../types";

export const batch4Demos: ComponentDemo[] = [
  {
    slug: "branch-node",
    title: "BranchNode",
    render: () =>
      demoFrame(
        "branch-node",
        "Call opening",
        <BranchingScenario blockId="node-demo" title="Card dispute call" startNodeId="start" showPathScore>
          <BranchNode nodeId="start" title="Opening">
            <Text>
              A caller says their card was charged after clicking a shipping notification. They want
              the charge reversed immediately.
            </Text>
            <BranchChoice label="Listen and verify identity" targetNodeId="verify" />
            <BranchChoice label="Explain policy before gathering facts" targetNodeId="policy" />
          </BranchNode>
          <BranchNode nodeId="verify" title="Verify" terminal>
            <Text>
              You confirmed identity, secured the card, and opened a fraud ticket. The caller knows
              what happens next.
            </Text>
          </BranchNode>
          <BranchNode nodeId="policy" title="Policy first" terminal>
            <Text>
              The caller escalated because they felt dismissed. Nodes can end with narrative or a
              check — add assessments on terminal paths when needed.
            </Text>
          </BranchNode>
        </BranchingScenario>,
      ),
  },
  {
    slug: "branch-choice",
    title: "BranchChoice",
    render: () =>
      demoFrame(
        "branch-choice",
        "Escalation fork",
        <BranchingScenario blockId="choice-demo" title="Invoice dispute" startNodeId="fork" showPathScore>
          <BranchNode nodeId="fork">
            <Scenario blockId="choice-scenario">
              <Text>
                Finance flagged a duplicate wire. The requester is pressuring you to approve before
                the end of day.
              </Text>
            </Scenario>
            <BranchChoice label="Escalate to supervisor and hold payment" targetNodeId="supervisor" scoreWeight={1} />
            <BranchChoice label="Approve to avoid delays" targetNodeId="approve" />
          </BranchNode>
          <BranchNode nodeId="supervisor" terminal>
            <Text>
              Supervisor path — payment held pending callback verification. Higher scoreWeight rewards
              safer choices when showPathScore is enabled.
            </Text>
          </BranchNode>
          <BranchNode nodeId="approve" terminal>
            <TrueFalse
              checkId="desk-tf"
              question="Approving under pressure without verification increases fraud risk."
              answer={true}
            />
          </BranchNode>
        </BranchingScenario>,
      ),
  },
  {
    slug: "map-stage",
    title: "MapStage",
    render: () =>
      demoFrame(
        "map-stage",
        "Secure zones",
        <GameMap
          blockId="stage-demo"
          title="Building zones"
          backgroundSrc={DEMO_MAP_IMAGE}
          backgroundAlt="Office floor plan"
          startStageId="lobby"
        >
          <MapStage stageId="lobby" x={30} y={55} label="Lobby">
            <Text>Reception verifies visitors. Badges must be visible before entering work areas.</Text>
            <MapExit label="Enter work floor" targetStageId="floor" />
          </MapStage>
          <MapStage stageId="floor" x={70} y={40} label="Work floor">
            <Text>Stages can mix narrative, media, and checks. Add MapExit links to continue the tour.</Text>
            <TrueFalse
              checkId="stage-tf"
              question="Tailgating is acceptable when you recognize the person behind you."
              answer={false}
            />
          </MapStage>
        </GameMap>,
      ),
  },
  {
    slug: "map-exit",
    title: "MapExit",
    render: () =>
      demoFrame(
        "map-exit",
        "Tour routing",
        <GameMap
          blockId="exit-demo"
          title="Facility tour"
          backgroundSrc={DEMO_MAP_IMAGE}
          backgroundAlt="Floor plan"
          startStageId="hub"
          showMapScore
        >
          <MapStage stageId="hub" x={50} y={62} label="Central hub">
            <Text>
              Click the green pins on the map or use the buttons below to move between rooms.
            </Text>
            <MapExit label="Visit lab (PPE required)" targetStageId="lab" scoreWeight={1} />
            <MapExit label="Visit open office" targetStageId="office" />
          </MapStage>
          <MapStage stageId="lab" x={22} y={38} label="Lab">
            <TrueFalse checkId="lab-tf" question="PPE is required in the lab at all times." answer={true} />
          </MapStage>
          <MapStage stageId="office" x={78} y={38} label="Office">
            <Text>Clean-desk rules apply. Lock screens before leaving for meetings.</Text>
          </MapStage>
        </GameMap>,
      ),
  },
  {
    slug: "knowledge-check",
    title: "KnowledgeCheck",
    render: () =>
      demoFrame(
        "knowledge-check",
        "Password reset",
        <KnowledgeCheck
          checkId="kc-demo"
          question="Which channel is approved for password resets?"
          choices={[
            "Self-service portal linked from the intranet",
            "Reply to the email that prompted the reset",
            "Text a colleague for a temporary password",
          ]}
          answer="Self-service portal linked from the intranet"
        />,
      ),
  },
];
