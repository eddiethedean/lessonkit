import type { ReactElement } from "react";
import type { TelemetryEvent } from "@lessonkit/core";
import type { XAPIStatement } from "@lessonkit/xapi";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("studio-minimal main", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@lessonkit/studio-schema");
    vi.doUnmock("react-dom/client");
    document.getElementById("root")?.remove();
  });

  it("mounts StudioRenderer into #root", async () => {
    const rootEl = document.createElement("div");
    rootEl.id = "root";
    document.body.appendChild(rootEl);

    const render = vi.fn();
    const createRoot = vi.fn(() => ({ render }));

    vi.doMock("react-dom/client", () => ({
      createRoot,
    }));

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await import("./main");

    expect(createRoot).toHaveBeenCalledWith(rootEl);
    expect(render).toHaveBeenCalledTimes(1);

    const element = render.mock.calls[0]![0] as ReactElement;
    const { config } = element.props as {
      config: {
        tracking: { sink: (event: TelemetryEvent) => void };
        xapi: { transport: (statement: XAPIStatement) => void };
      };
    };
    const event: TelemetryEvent = {
      name: "course_started",
      courseId: "studio-minimal",
      timestamp: new Date().toISOString(),
    };
    const statement = { id: "stmt-1" } as XAPIStatement;
    config.tracking.sink(event);
    config.xapi.transport(statement);
    expect(logSpy).toHaveBeenCalledWith("[telemetry]", event);
    expect(logSpy).toHaveBeenCalledWith("[xapi]", statement);

    logSpy.mockRestore();
  });

  it("throws when project.json fails validation", async () => {
    vi.doMock("@lessonkit/studio-schema", () => ({
      loadStudioProject: () => ({
        ok: false,
        issues: [{ path: "course.title", message: "required" }],
      }),
    }));

    await expect(import("./main")).rejects.toThrow(/Invalid project\.json/);
  });

  it("throws when #root is missing", async () => {
    await expect(import("./main")).rejects.toThrow(/Missing #root/);
  });
});
