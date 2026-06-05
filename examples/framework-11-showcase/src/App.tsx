import React from "react";
import type { TelemetryEvent } from "@lessonkit/core";
import type { ThemeMode } from "@lessonkit/react";
import type { XAPIStatement } from "@lessonkit/xapi";
import { ShowcaseShell } from "../../_shared/showcase/ShowcaseShell";
import { SHOWCASE_META } from "./constants";
import { BriefingLesson } from "./lessons/BriefingLesson";
import { CertificationLesson } from "./lessons/CertificationLesson";
import { ContainmentDrillsLesson } from "./lessons/ContainmentDrillsLesson";
import { SignalTriageLesson } from "./lessons/SignalTriageLesson";

function lessonContent(step: number) {
  const id = SHOWCASE_META.lessons[step]?.id;
  switch (id) {
    case "shift-briefing":
      return <BriefingLesson />;
    case "signal-triage":
      return <SignalTriageLesson />;
    case "containment-drills":
      return <ContainmentDrillsLesson />;
    case "certification-set":
      return <CertificationLesson />;
    default:
      return null;
  }
}

export default function App() {
  const [step, setStep] = React.useState(0);
  const [themeMode, setThemeMode] = React.useState<ThemeMode>("dark");

  const courseConfig = React.useMemo(
    () => ({
      session: { persistCompoundState: true },
      tracking: {
        sink: (event: TelemetryEvent) => {
          console.log("[telemetry]", event);
        },
      },
      xapi: {
        transport: (statement: XAPIStatement) => {
          console.log("[xapi]", statement);
        },
      },
    }),
    [],
  );

  return (
    <ShowcaseShell
      meta={{ ...SHOWCASE_META, courseConfig }}
      step={step}
      setStep={setStep}
      themeMode={themeMode}
      setThemeMode={setThemeMode}
    >
      {lessonContent(step)}
    </ShowcaseShell>
  );
}
