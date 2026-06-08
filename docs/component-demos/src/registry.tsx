import type { ReactNode } from "react";
import {
  Accordion,
  AssessmentSequence,
  BranchChoice,
  BranchingScenario,
  BranchNode,
  DragAndDrop,
  DragTheWords,
  FillInTheBlanks,
  Heading,
  InteractiveBook,
  MarkTheWords,
  Page,
  Quiz,
  Reflection,
  Scenario,
  Slide,
  SlideDeck,
  Text,
  TrueFalse,
} from "@lessonkit/react";
import { demoFrame } from "./demoFrame";
import { batch2Demos } from "./demos/batch2";
import { batch3Demos } from "./demos/batch3";
import { batch4Demos } from "./demos/batch4";
import type { ComponentDemo } from "./types";

export type { ComponentDemo } from "./types";

export const componentDemos: ComponentDemo[] = [
  {
    slug: "true-false",
    title: "TrueFalse",
    render: () =>
      demoFrame(
        "true-false",
        "Policy check",
        <TrueFalse
          checkId="phishing-tf"
          question="Phishing emails always use your real name in the greeting."
          answer={false}
        />,
      ),
  },
  {
    slug: "quiz",
    title: "Quiz",
    render: () =>
      demoFrame(
        "quiz",
        "Verification",
        <Quiz
          checkId="verify-quiz"
          question="What should you verify before clicking a password-reset link?"
          choices={[
            "The sender domain and link destination",
            "The email font and signature image",
            "How urgent the subject line sounds",
          ]}
          answer="The sender domain and link destination"
        />,
      ),
  },
  {
    slug: "fill-in-the-blanks",
    title: "FillInTheBlanks",
    render: () =>
      demoFrame(
        "fill-in-the-blanks",
        "Reporting",
        <FillInTheBlanks
          checkId="report-fib"
          template="Report suspicious messages to the *security* team within *one hour* using the *Report phishing* button."
        />,
      ),
  },
  {
    slug: "mark-the-words",
    title: "MarkTheWords",
    render: () =>
      demoFrame(
        "mark-the-words",
        "Policy language",
        <MarkTheWords
          checkId="policy-mtw"
          text="Never share your password, MFA codes, or one-time recovery links with colleagues or vendors."
          correctWords={["password", "MFA", "recovery"]}
        />,
      ),
  },
  {
    slug: "drag-the-words",
    title: "DragTheWords",
    render: () =>
      demoFrame(
        "drag-the-words",
        "Actions",
        <DragTheWords
          checkId="action-dtw"
          template="When mail looks suspicious, use *Report phishing* instead of *forwarding* it to colleagues."
          words={["Report phishing", "forwarding", "Reply all", "Archive"]}
        />,
      ),
  },
  {
    slug: "drag-and-drop",
    title: "DragAndDrop",
    render: () =>
      demoFrame(
        "drag-and-drop",
        "Channels",
        <DragAndDrop
          checkId="channel-dad"
          items={[
            { id: "email", label: "Unknown payment link in email" },
            { id: "portal", label: "IT self-service portal" },
            { id: "phone", label: "Unsolicited callback number" },
          ]}
          targets={[
            { id: "email-risk", label: "Verify before acting", accepts: "email" },
            { id: "phone-risk", label: "Call back via known number", accepts: "phone" },
            { id: "safe", label: "Approved channel", accepts: "portal" },
          ]}
        />,
      ),
  },
  {
    slug: "assessment-sequence",
    title: "AssessmentSequence",
    render: () =>
      demoFrame(
        "assessment-sequence",
        "Module check",
        <AssessmentSequence blockId="module-sequence">
          <TrueFalse
            checkId="seq-tf"
            question="Public Wi‑Fi is safe for payroll access without a VPN."
            answer={false}
          />
          <Quiz
            checkId="seq-quiz"
            question="Best first step for a suspicious invoice?"
            choices={[
              "Pay immediately to avoid late fees",
              "Verify through procurement or a known contact",
              "Forward the PDF to your team chat",
            ]}
            answer="Verify through procurement or a known contact"
          />
        </AssessmentSequence>,
      ),
  },
  {
    slug: "scenario",
    title: "Scenario",
    render: () =>
      demoFrame(
        "scenario",
        "Inbox triage",
        <Scenario blockId="inbox-scenario">
          <p>
            You receive an email from <strong>payroll-notify@hr-portal-support.net</strong> asking
            you to confirm direct deposit details before end of day. The message includes a link
            labeled &ldquo;Confirm now&rdquo; and warns that payroll will be delayed if you wait.
          </p>
          <p>
            Your manager is in meetings and the real HR portal is bookmarked under a different
            domain. What is your first move?
          </p>
        </Scenario>,
      ),
  },
  {
    slug: "reflection",
    title: "Reflection",
    render: () =>
      demoFrame(
        "reflection",
        "Takeaway",
        <Reflection
          blockId="lesson-reflection"
          prompt="Describe one habit you will change after this module and how you will remind yourself."
          hint="Example: I will hover links and verify sender domains before clicking."
        />,
      ),
  },
  {
    slug: "interactive-book",
    title: "InteractiveBook",
    render: () =>
      demoFrame(
        "interactive-book",
        "Handbook",
        <InteractiveBook blockId="safety-book" title="Security handbook">
          <Page blockId="book-intro" title="Reporting">
            <Text>
              Use the Report phishing action in your mail client. Do not forward suspicious messages
              to colleagues — that spreads risk and removes audit trails.
            </Text>
          </Page>
          <Page blockId="book-devices" title="Devices">
            <Text>
              Lock your screen when leaving your desk. Store recovery codes in an approved password
              manager, not in chat or sticky notes.
            </Text>
          </Page>
          <Page blockId="book-check" title="Knowledge check">
            <TrueFalse
              checkId="book-tf"
              question="Forwarding a suspicious email to IT is better than using Report phishing."
              answer={false}
            />
          </Page>
        </InteractiveBook>,
      ),
  },
  {
    slug: "slide-deck",
    title: "SlideDeck",
    render: () =>
      demoFrame(
        "slide-deck",
        "Onboarding",
        <SlideDeck blockId="onboarding-deck" title="Phishing red flags" showDeckScore>
          <Slide blockId="deck-welcome" title="Welcome">
            <Heading level={2}>Spot the red flags</Heading>
            <Text>
              This deck covers sender impersonation, urgency tactics, and how to report suspicious
              mail without spreading it.
            </Text>
          </Slide>
          <Slide blockId="deck-signals" title="Signals">
            <Text>
              Watch for mismatched domains, unexpected attachments, and requests to bypass normal
              approval channels.
            </Text>
          </Slide>
          <Slide blockId="deck-check" title="Check">
            <TrueFalse
              checkId="deck-tf"
              question="Urgent language alone proves an email is malicious."
              answer={false}
            />
          </Slide>
        </SlideDeck>,
      ),
  },
  {
    slug: "branching-scenario",
    title: "BranchingScenario",
    render: () =>
      demoFrame(
        "branching-scenario",
        "Customer call",
        <BranchingScenario blockId="call-paths" title="Suspicious charge call" startNodeId="opening" showPathScore>
          <BranchNode nodeId="opening">
            <Text>
              A customer says their card was charged twice after clicking a link in a &ldquo;shipping
              update&rdquo; email. They are upset and want an immediate refund.
            </Text>
            <BranchChoice label="Acknowledge concern and verify account details" targetNodeId="empathy" />
            <BranchChoice label="Quote the no-refund policy first" targetNodeId="policy" />
          </BranchNode>
          <BranchNode nodeId="empathy" terminal>
            <Text>
              You validated the concern, secured the account, and escalated to fraud review. The
              customer felt heard and followed your reporting steps.
            </Text>
          </BranchNode>
          <BranchNode nodeId="policy" terminal>
            <TrueFalse
              checkId="branch-tf"
              question="Leading with policy before listening usually reduces trust in security calls."
              answer={true}
            />
          </BranchNode>
        </BranchingScenario>,
      ),
  },
  {
    slug: "accordion",
    title: "Accordion",
    render: () =>
      demoFrame(
        "accordion",
        "Reference",
        <Accordion
          blockId="policy-accordion"
          sections={[
            {
              id: "reporting",
              title: "Reporting phishing",
              content: (
                <Text>
                  Use Report phishing in your mail client or forward to the security mailbox listed on
                  the intranet. Include headers if asked.
                </Text>
              ),
            },
            {
              id: "devices",
              title: "Devices and access",
              content: (
                <Text>
                  Lock your screen when away. Never approve MFA prompts you did not initiate.
                </Text>
              ),
            },
            {
              id: "travel",
              title: "Travel",
              content: (
                <Text>
                  Use the corporate VPN on hotel and conference Wi‑Fi. Do not log into payroll from
                  public networks without it.
                </Text>
              ),
            },
          ]}
        />,
      ),
  },
  ...batch2Demos,
  ...batch3Demos,
  ...batch4Demos,
];

export const demoBySlug = new Map(componentDemos.map((demo) => [demo.slug, demo]));
