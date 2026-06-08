import {
  AdventCalendar,
  ArithmeticQuiz,
  AudioRecorder,
  Collage,
  Course,
  FindHotspot,
  FindMultipleHotspots,
  Image,
  ImagePairing,
  ImageSequence,
  ImageSequencing,
  ImageSlider,
  InformationWall,
  InteractiveBook,
  InteractiveVideo,
  Lesson,
  Page,
  ParallaxSlideshow,
  ProgressTracker,
  Quiz,
  Scenario,
  Slide,
  SlideDeck,
  Text,
  TimedCue,
  TrueFalse,
} from "@lessonkit/react";
import { DEMO_HERO_IMAGE, DEMO_MAP_IMAGE, SAMPLE_VIDEO } from "../constants";
import { DemoChrome } from "../DemoChrome";
import { demoConfig } from "../demoConfig";
import { demoFrame } from "../demoFrame";
import type { ComponentDemo } from "../types";

export const batch3Demos: ComponentDemo[] = [
  {
    slug: "course-structure",
    title: "Course structure",
    render: () => (
      <DemoChrome>
        <Course title="Security fundamentals" courseId="demo-course-structure" config={demoConfig}>
          <ProgressTracker />
          <Lesson title="Phishing basics" lessonId="phishing-lesson">
            <Scenario blockId="structure-scenario">
              <Text>
                Every production SPA mounts one <code>Course</code> with one active <code>Lesson</code>{" "}
                at a time. Blocks like <code>Scenario</code> and <code>Quiz</code> live inside the
                lesson.
              </Text>
            </Scenario>
            <Quiz
              checkId="structure-quiz"
              question="Where should scored checks live in a LessonKit course?"
              choices={[
                "Inside a Lesson, under Course",
                "Outside Course as siblings",
                "Only in a separate JSON file",
              ]}
              answer="Inside a Lesson, under Course"
            />
          </Lesson>
        </Course>
      </DemoChrome>
    ),
  },
  {
    slug: "page",
    title: "Page",
    render: () =>
      demoFrame(
        "page",
        "Policy digest",
        <InteractiveBook blockId="page-demo-book" title="Policy digest">
          <Page blockId="page-policy" title="Acceptable use">
            <Text>
              Access systems only with approved credentials. Do not install unapproved browser
              extensions on work devices.
            </Text>
          </Page>
          <Page blockId="page-reporting" title="Reporting">
            <Text>Report incidents within one hour using the security mailbox or Report phishing.</Text>
            <TrueFalse
              checkId="page-tf"
              question="Forwarding suspicious mail to a colleague counts as reporting."
              answer={false}
            />
          </Page>
        </InteractiveBook>,
      ),
  },
  {
    slug: "slide",
    title: "Slide",
    render: () =>
      demoFrame(
        "slide",
        "Briefing beats",
        <SlideDeck blockId="slide-demo-deck" title="Security briefing">
          <Slide blockId="slide-context" title="Context">
            <Text>Attackers often impersonate payroll, shipping, and IT support during busy seasons.</Text>
          </Slide>
          <Slide blockId="slide-action" title="Action">
            <Text>Verify sender domains, hover links, and use Report phishing instead of forwarding.</Text>
          </Slide>
          <Slide blockId="slide-check" title="Check">
            <TrueFalse
              checkId="slide-tf"
              question="A familiar display name guarantees the sender is legitimate."
              answer={false}
            />
          </Slide>
        </SlideDeck>,
      ),
  },
  {
    slug: "timed-cue",
    title: "TimedCue",
    render: () =>
      demoFrame(
        "timed-cue",
        "Playback gates",
        <InteractiveVideo blockId="cue-demo-video" title="Facility access briefing" src={SAMPLE_VIDEO}>
          <TimedCue atSeconds={3} label="Tailgating" mustComplete>
            <TrueFalse checkId="cue-tf" question="Tailgating through secure doors is allowed." answer={false} />
          </TimedCue>
          <TimedCue atSeconds={8} label="Badges">
            <Text>Badges must be visible in secure areas. Challenge visitors without escorts.</Text>
          </TimedCue>
          <TimedCue atSeconds={9} label="Reporting" mustComplete>
            <TrueFalse
              checkId="cue-tf-2"
              question="Report lost badges to security the same day."
              answer={true}
            />
          </TimedCue>
        </InteractiveVideo>,
      ),
  },
  {
    slug: "image",
    title: "Image",
    render: () =>
      demoFrame(
        "image",
        "Floor plan",
        <>
          <Text blockId="image-caption">
            Labeled floor plans help learners locate exits, workstations, and restricted zones.
          </Text>
          <Image blockId="floor-image" src={DEMO_MAP_IMAGE} alt="Office floor plan with exits marked" />
        </>,
      ),
  },
  {
    slug: "image-pairing",
    title: "ImagePairing",
    render: () =>
      demoFrame(
        "image-pairing",
        "PPE matching",
        <ImagePairing
          checkId="ppe-pairing"
          pairs={[
            { id: "helmet", label: "Hard hat", imageSrc: DEMO_MAP_IMAGE },
            { id: "vest", label: "High-visibility vest", imageSrc: DEMO_HERO_IMAGE },
            { id: "gloves", label: "Cut-resistant gloves", imageSrc: DEMO_MAP_IMAGE },
          ]}
        />,
      ),
  },
  {
    slug: "image-sequencing",
    title: "ImageSequencing",
    render: () =>
      demoFrame(
        "image-sequencing",
        "Report flow",
        <ImageSequencing
          checkId="procedure-seq"
          images={[
            { id: "step-1", src: DEMO_MAP_IMAGE, alt: "Step 1: do not click further links" },
            { id: "step-2", src: DEMO_HERO_IMAGE, alt: "Step 2: report via mail client" },
            { id: "step-3", src: DEMO_MAP_IMAGE, alt: "Step 3: document what you observed" },
          ]}
          correctOrder={["step-1", "step-2", "step-3"]}
        />,
      ),
  },
  {
    slug: "arithmetic-quiz",
    title: "ArithmeticQuiz",
    render: () =>
      demoFrame(
        "arithmetic-quiz",
        "Shift handoff",
        <ArithmeticQuiz
          checkId="arith-quiz"
          problems={[
            { question: "Phishing reports this shift: 3 new + 2 escalated = ?", answer: "5" },
            { question: "Open tickets after closing 4 of 9 = ?", answer: "5" },
          ]}
        />,
      ),
  },
  {
    slug: "find-hotspot",
    title: "FindHotspot",
    render: () =>
      demoFrame(
        "find-hotspot",
        "Egress check",
        <FindHotspot
          checkId="hazard-hotspot"
          src={DEMO_MAP_IMAGE}
          alt="Floor plan"
          targets={[
            { id: "exit", label: "Clear emergency exit", x: 80, y: 20 },
            { id: "hazard", label: "Blocked aisle", x: 45, y: 60 },
            { id: "desk", label: "Workstation", x: 30, y: 40 },
          ]}
          correctTargetId="hazard"
        />,
      ),
  },
  {
    slug: "find-multiple-hotspots",
    title: "FindMultipleHotspots",
    render: () =>
      demoFrame(
        "find-multiple-hotspots",
        "Hazard sweep",
        <FindMultipleHotspots
          checkId="multi-hotspot"
          src={DEMO_MAP_IMAGE}
          alt="Floor plan"
          targets={[
            { id: "cable", label: "Cable trip hazard", x: 30, y: 70 },
            { id: "spill", label: "Wet floor", x: 60, y: 40 },
            { id: "clear", label: "Clear walkway", x: 20, y: 20 },
            { id: "box", label: "Box blocking exit", x: 75, y: 65 },
          ]}
          correctTargetIds={["cable", "spill", "box"]}
        />,
      ),
  },
  {
    slug: "information-wall",
    title: "InformationWall",
    render: () =>
      demoFrame(
        "information-wall",
        "Policy library",
        <InformationWall
          blockId="policy-wall"
          panels={[
            {
              id: "phish",
              title: "Phishing",
              body: "Report suspicious email via Report message. Preserve headers for SOC review.",
            },
            {
              id: "mfa",
              title: "MFA",
              body: "Approve prompts only when you initiated the login. Report unexpected pushes.",
            },
            {
              id: "travel",
              title: "Travel",
              body: "Use corporate VPN on hotel Wi‑Fi. Never log into payroll from untrusted networks.",
            },
            {
              id: "clean-desk",
              title: "Clean desk",
              body: "Lock screens, stow badges, and shred sensitive drafts before leaving.",
            },
          ]}
        />,
      ),
  },
  {
    slug: "parallax-slideshow",
    title: "ParallaxSlideshow",
    render: () =>
      demoFrame(
        "parallax-slideshow",
        "Program story",
        <ParallaxSlideshow
          blockId="release-story"
          slides={[
            {
              title: "Baseline training",
              body: "Annual phishing modules and clean-desk reminders for all staff.",
              imageSrc: DEMO_MAP_IMAGE,
            },
            {
              title: "Simulations",
              body: "Quarterly phishing drills with just-in-time coaching for clickers.",
              imageSrc: DEMO_HERO_IMAGE,
            },
            {
              title: "Hardening",
              body: "MFA everywhere, allowlisted embeds, and SOC playbooks in the handbook.",
              imageSrc: DEMO_MAP_IMAGE,
            },
          ]}
        />,
      ),
  },
  {
    slug: "image-slider",
    title: "ImageSlider",
    render: () =>
      demoFrame(
        "image-slider",
        "Desk comparison",
        <ImageSlider
          blockId="photo-slider"
          slides={[
            {
              src: DEMO_HERO_IMAGE,
              alt: "Cluttered desk with visible notes",
              caption: "Before — clean-desk violations",
            },
            {
              src: DEMO_MAP_IMAGE,
              alt: "Organized desk with locked screen",
              caption: "After — compliant workspace",
            },
          ]}
        />,
      ),
  },
  {
    slug: "image-sequence",
    title: "ImageSequence",
    render: () =>
      demoFrame(
        "image-sequence",
        "Incident steps",
        <ImageSequence
          blockId="repair-sequence"
          frames={[
            { src: DEMO_MAP_IMAGE, alt: "Step 1: contain", label: "Contain" },
            { src: DEMO_HERO_IMAGE, alt: "Step 2: report", label: "Report" },
            { src: DEMO_MAP_IMAGE, alt: "Step 3: document", label: "Document" },
          ]}
        />,
      ),
  },
  {
    slug: "collage",
    title: "Collage",
    render: () =>
      demoFrame(
        "collage",
        "Ops overview",
        <Collage
          blockId="team-collage"
          columns={2}
          cells={[
            { id: "a", src: DEMO_MAP_IMAGE, alt: "Site map", caption: "Assembly points" },
            { id: "b", src: DEMO_HERO_IMAGE, alt: "Response team", caption: "Floor wardens" },
            { id: "c", src: DEMO_MAP_IMAGE, alt: "SOC dashboard", caption: "SOC escalation" },
            { id: "d", src: DEMO_HERO_IMAGE, alt: "Help desk", caption: "IT help desk" },
          ]}
        />,
      ),
  },
  {
    slug: "audio-recorder",
    title: "AudioRecorder",
    render: () =>
      demoFrame(
        "audio-recorder",
        "Escalation script",
        <AudioRecorder
          blockId="practice-recording"
          consentLabel="I consent to record audio for this practice exercise only."
          maxDurationSeconds={45}
        />,
      ),
  },
  {
    slug: "advent-calendar",
    title: "AdventCalendar",
    render: () =>
      demoFrame(
        "advent-calendar",
        "December tips",
        <AdventCalendar
          blockId="december-tips"
          doors={[
            { id: "d1", day: 1, label: "1", content: <Text>Verify sender domains before clicking links.</Text> },
            { id: "d2", day: 2, label: "2", content: <Text>Lock your screen when stepping away.</Text> },
            { id: "d3", day: 3, label: "3", content: <Text>Use MFA on every work account.</Text> },
            { id: "d4", day: 4, label: "4", content: <Text>Report phishing with one click — do not forward.</Text> },
            { id: "d5", day: 5, label: "5", content: <Text>Shred sensitive drafts and stow badges.</Text> },
          ]}
        />,
      ),
  },
];
