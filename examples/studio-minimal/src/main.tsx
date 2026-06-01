import React from "react";
import { createRoot } from "react-dom/client";
import { loadStudioProject } from "@lessonkit-studio/schema";
import { StudioRenderer } from "@lessonkit-studio/renderer";
import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIStatement } from "@lessonkit/xapi";
import projectRaw from "./project.json";
import "./styles.css";

const loaded = loadStudioProject(projectRaw);
if (!loaded.ok) {
  throw new Error(
    `Invalid project.json:\n${loaded.issues.map((i) => `${i.path}: ${i.message}`).join("\n")}`,
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StudioRenderer
    project={loaded.project}
    theme={{ preset: "default", mode: "light" }}
    config={{
      tracking: {
        sink: (event: TelemetryEvent) => {
          console.log("[telemetry]", event);
        },
      },
      xapi: {
        enabled: true,
        transport: (statement: XAPIStatement) => {
          console.log("[xapi]", statement);
        },
      },
    }}
  />,
);
