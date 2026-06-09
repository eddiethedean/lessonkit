import {
  Chart,
  CombinationLock,
  Crossword,
  DialogCards,
  Embed,
  Essay,
  Flashcards,
  GameMap,
  Heading,
  ImageHotspots,
  ImageJuxtaposition,
  InteractiveVideo,
  MapExit,
  MapStage,
  MemoryGame,
  QrContent,
  Questionnaire,
  Summary,
  Table,
  Text,
  TimedCue,
  Timeline,
  TrueFalse,
  Video,
  WordSearch,
} from "@lessonkit/react";
import { DEMO_HERO_IMAGE, DEMO_MAP_IMAGE, DEMO_QR_PAYLOAD, SAMPLE_VIDEO } from "../constants";
import { DemoCallout } from "../DemoCallout";
import { demoFrame } from "../demoFrame";
import type { ComponentDemo } from "../types";

export const batch2Demos: ComponentDemo[] = [
  {
    slug: "summary",
    title: "Summary",
    render: () =>
      demoFrame(
        "summary",
        "Incident response",
        <Summary
          checkId="summary-1"
          statements={[
            "Isolate affected accounts",
            "Report to security within one hour",
            "Share passwords in chat for speed",
            "Preserve message headers for investigation",
          ]}
          correct={[
            "Isolate affected accounts",
            "Report to security within one hour",
            "Preserve message headers for investigation",
          ]}
        />,
      ),
  },
  {
    slug: "memory-game",
    title: "MemoryGame",
    render: () =>
      demoFrame(
        "memory-game",
        "Security pairs",
        <MemoryGame
          blockId="security-memory"
          pairs={[
            { id: "mfa", label: "MFA" },
            { id: "phish", label: "Phishing" },
            { id: "vpn", label: "VPN" },
            { id: "soc", label: "SOC" },
          ]}
        />,
      ),
  },
  {
    slug: "video",
    title: "Video",
    render: () =>
      demoFrame(
        "video",
        "Briefing clip",
        <Video blockId="intro-video" src={SAMPLE_VIDEO} title="Phishing red flags (sample clip)" />,
      ),
  },
  {
    slug: "interactive-video",
    title: "InteractiveVideo",
    render: () =>
      demoFrame(
        "interactive-video",
        "Safety briefing",
        <>
          <DemoCallout relatedSlug="timed-cue" relatedLabel="Open TimedCue demo">
            <p>
              <strong>InteractiveVideo is the parent compound.</strong> Each pause overlay is a{" "}
              <code>TimedCue</code> child at a timestamp.
            </p>
          </DemoCallout>
          <InteractiveVideo
          blockId="safety-video"
          title="Warehouse safety briefing"
          src={SAMPLE_VIDEO}
          showVideoScore
        >
          <TimedCue atSeconds={3} label="PPE check" mustComplete>
            <TrueFalse checkId="iv-tf" question="PPE is required in the warehouse floor." answer={true} />
          </TimedCue>
          <TimedCue atSeconds={6} label="Reporting">
            <Text>Report spills, blocked aisles, and missing signage to your supervisor immediately.</Text>
          </TimedCue>
          <TimedCue atSeconds={8} label="Quick quiz" mustComplete>
            <TrueFalse checkId="iv-tf-2" question="Tailgating through secure doors is acceptable." answer={false} />
          </TimedCue>
        </InteractiveVideo>
        </>,
      ),
  },
  {
    slug: "embed",
    title: "Embed",
    render: () =>
      demoFrame(
        "embed",
        "Approved tool",
        <>
          <Text>
            Production courses should allowlist embed hosts in course config. This placeholder loads
            example.com inside a sandboxed frame.
          </Text>
          <Embed blockId="policy-embed" src="https://example.com" title="Policy lookup (demo)" />
        </>,
      ),
  },
  {
    slug: "chart",
    title: "Chart",
    render: () =>
      demoFrame(
        "chart",
        "Incident trends",
        <Chart
          blockId="incidents-chart"
          type="bar"
          title="Reported incidents — Q1"
          data={[
            { label: "Phishing", value: 42 },
            { label: "Malware", value: 11 },
            { label: "Lost device", value: 4 },
          ]}
        />,
      ),
  },
  {
    slug: "table",
    title: "Table",
    render: () =>
      demoFrame(
        "table",
        "Escalation contacts",
        <Table
          blockId="escalation-table"
          caption="Security escalation contacts"
          headers={["Role", "Contact", "When to use"]}
          rows={[
            ["SOC analyst", "soc@company.example", "Active phishing or malware"],
            ["Privacy office", "privacy@company.example", "Data exposure suspected"],
            ["IT help desk", "help@company.example", "Account lockout or MFA issues"],
          ]}
        />,
      ),
  },
  {
    slug: "timeline",
    title: "Timeline",
    render: () =>
      demoFrame(
        "timeline",
        "Playbook history",
        <Timeline
          blockId="playbook-timeline"
          events={[
            {
              id: "t1",
              date: "2024-03-15",
              title: "Tabletop exercise",
              body: "Identified gaps in invoice-fraud verification.",
            },
            {
              id: "t2",
              date: "2024-06-01",
              title: "Report phishing rollout",
              body: "One-click reporting enabled in mail clients.",
            },
            {
              id: "t3",
              date: "2024-09-10",
              title: "MFA enforcement",
              body: "VPN and payroll require hardware keys.",
            },
          ]}
        />,
      ),
  },
  {
    slug: "flashcards",
    title: "Flashcards",
    render: () =>
      demoFrame(
        "flashcards",
        "Core terms",
        <Flashcards
          blockId="security-flashcards"
          cards={[
            { front: "Phishing", back: "Fraudulent messages designed to steal credentials or payments." },
            { front: "MFA", back: "Multi-factor authentication — something you know plus something you have." },
            { front: "Clean desk", back: "No sensitive papers, badges, or unlocked devices left unattended." },
            { front: "SOC", back: "Security operations center that triages active incidents." },
          ]}
        />,
      ),
  },
  {
    slug: "dialog-cards",
    title: "DialogCards",
    render: () =>
      demoFrame(
        "dialog-cards",
        "Coaching phrases",
        <DialogCards
          blockId="phrase-cards"
          cards={[
            {
              front: "A colleague asks for your MFA code to 'fix' their laptop.",
              back: "Never share MFA codes. Offer to walk them to the help desk instead.",
            },
            {
              front: "How do I report phishing?",
              back: "Use Report message in your mail client — do not forward the email.",
            },
            {
              front: "Who approves security exceptions?",
              back: "Your manager and InfoSec must both approve documented exceptions.",
            },
          ]}
        />,
      ),
  },
  {
    slug: "questionnaire",
    title: "Questionnaire",
    render: () =>
      demoFrame(
        "questionnaire",
        "Course feedback",
        <Questionnaire
          blockId="exit-survey"
          fields={[
            { id: "role", label: "Your role", type: "text" },
            {
              id: "confidence",
              label: "How confident do you feel spotting phishing? (1–5)",
              type: "text",
            },
            { id: "feedback", label: "What was most useful in this module?", type: "textarea" },
          ]}
        />,
      ),
  },
  {
    slug: "essay",
    title: "Essay",
    render: () =>
      demoFrame(
        "essay",
        "Vendor verification",
        <Essay
          checkId="policy-essay"
          question="A vendor emails an urgent request to change bank details for an open PO. Describe the steps you would take before approving any change."
          minLength={40}
        />,
      ),
  },
  {
    slug: "combination-lock",
    title: "CombinationLock",
    render: () =>
      demoFrame(
        "combination-lock",
        "Training vault",
        <CombinationLock
          checkId="vault-lock"
          combination="1234"
          label="Enter demo vault code (hint: 1234)"
        />,
      ),
  },
  {
    slug: "crossword",
    title: "Crossword",
    render: () =>
      demoFrame(
        "crossword",
        "Vocabulary puzzle",
        <Crossword
          checkId="security-crossword"
          rows={4}
          cols={3}
          entries={[
            {
              id: "a1",
              clue: "Two-step login, for short (3 letters)",
              answer: "MFA",
              row: 1,
              col: 0,
              direction: "across",
            },
            {
              id: "d1",
              clue: "How apps talk to servers, for short (3 letters)",
              answer: "API",
              row: 1,
              col: 2,
              direction: "down",
            },
          ]}
        />,
      ),
  },
  {
    slug: "word-search",
    title: "WordSearch",
    render: () =>
      demoFrame(
        "word-search",
        "Term hunt",
        <WordSearch checkId="policy-ws" words={["PHISH", "MFA", "VPN"]} size={8} />,
      ),
  },
  {
    slug: "game-map",
    title: "GameMap",
    render: () =>
      demoFrame(
        "game-map",
        "Office security tour",
        <GameMap
          blockId="office-map"
          title="Office security tour"
          backgroundSrc={DEMO_MAP_IMAGE}
          backgroundAlt="Office floor plan"
          startStageId="lobby"
          showMapScore
        >
          <MapStage stageId="lobby" x={25} y={55} label="Lobby">
            <Text>Welcome — badges must be visible before you enter secure areas.</Text>
            <MapExit label="Visit workstation" targetStageId="desk" />
          </MapStage>
          <MapStage stageId="desk" x={65} y={35} label="Workstation">
            <TrueFalse
              checkId="badge-tf"
              question="You should lock your screen whenever you leave your desk."
              answer={true}
            />
            <MapExit label="Head to exit briefing" targetStageId="exit" />
          </MapStage>
          <MapStage stageId="exit" x={80} y={20} label="Emergency exit">
            <Text>Proceed to the assembly point and report to your floor warden.</Text>
          </MapStage>
        </GameMap>,
      ),
  },
  {
    slug: "image-hotspots",
    title: "ImageHotspots",
    render: () =>
      demoFrame(
        "image-hotspots",
        "Floor plan tour",
        <ImageHotspots
          blockId="floor-hotspots"
          src={DEMO_MAP_IMAGE}
          alt="Office floor plan"
          hotspots={[
            {
              id: "exit",
              label: "Emergency exit",
              x: 80,
              y: 20,
              content: (
                <Text>Know two routes out. Keep aisles clear — blocked egress is a reportable hazard.</Text>
              ),
            },
            {
              id: "desk",
              label: "Workstation",
              x: 40,
              y: 50,
              content: (
                <Text>Lock your screen, stow badges, and apply clean-desk rules before you leave.</Text>
              ),
            },
            {
              id: "server",
              label: "Server room",
              x: 20,
              y: 30,
              content: <Text>Escorted access only. No photos or unapproved USB devices.</Text>,
            },
          ]}
        />,
      ),
  },
  {
    slug: "image-juxtaposition",
    title: "ImageJuxtaposition",
    render: () =>
      demoFrame(
        "image-juxtaposition",
        "Clean desk",
        <ImageJuxtaposition
          blockId="workspace-jux"
          beforeSrc={DEMO_HERO_IMAGE}
          afterSrc={DEMO_MAP_IMAGE}
          beforeAlt="Cluttered desk with visible notes and badge"
          afterAlt="Clean desk with locked screen and stowed materials"
        />,
      ),
  },
  {
    slug: "qr-content",
    title: "QrContent",
    render: () =>
      demoFrame(
        "qr-content",
        "Poster unlock",
        <QrContent
          blockId="bonus-qr"
          title="Scan for security checklist"
          payload={DEMO_QR_PAYLOAD}
          hiddenTitle="Checklist unlocked"
          hiddenBody="Optional deep dive: password managers, travel VPN, and incident reporting templates."
        />,
      ),
  },
  {
    slug: "text-and-heading",
    title: "Text & Heading",
    render: () =>
      demoFrame(
        "text-and-heading",
        "Policy section",
        <>
          <Heading level={2} blockId="section-title">
            Reporting suspicious mail
          </Heading>
          <Text blockId="section-body">
            Use the Report phishing action in your mail client. Do not forward the message to
            colleagues — that spreads risk and removes headers investigators need. If you already
            clicked a link, disconnect from Wi‑Fi, report immediately, and follow help-desk guidance.
          </Text>
        </>,
      ),
  },
];
