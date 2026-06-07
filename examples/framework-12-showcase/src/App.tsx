import React from "react";
import type { TelemetryEvent } from "@lessonkit/core";
import type { ThemeMode } from "@lessonkit/react";
import type { XAPIStatement } from "@lessonkit/xapi";
import { ShowcaseShell } from "../../_shared/showcase/ShowcaseShell";
import { allowConsoleTelemetryForDocsDemo } from "../../_shared/docsDemoConfig";
import { SHOWCASE_META } from "./constants";
import { CertificationLesson } from "./lessons/CertificationLesson";
import { HandbookLesson } from "./lessons/HandbookLesson";
import { OrientationLesson } from "./lessons/OrientationLesson";
import { PlatformTourLesson } from "./lessons/PlatformTourLesson";

function lessonContent(step: number) {
  const id = SHOWCASE_META.lessons[step]?.id;
  switch (id) {
    case "orientation":
      return <OrientationLesson />;
    case "platform-tour":
      return <PlatformTourLesson />;
    case "analyst-handbook":
      return <HandbookLesson />;
    case "certification":
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
      ...allowConsoleTelemetryForDocsDemo(),
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
