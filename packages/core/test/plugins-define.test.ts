import { describe, expect, it } from "vitest";
import {
  defineAssessmentPlugin,
  defineLifecyclePlugin,
  defineTelemetryPlugin,
} from "../src/plugins/define";

describe("plugin define helpers", () => {
  it("returns segregated plugins unchanged", () => {
    const telemetry = defineTelemetryPlugin({
      id: "t",
      version: "1",
      kind: "analytics",
      onTelemetry: (e) => e,
    });
    const assessment = defineAssessmentPlugin({
      id: "a",
      version: "1",
      kind: "assessment",
      scoreAssessment: () => null,
    });
    const lifecycle = defineLifecyclePlugin({
      id: "l",
      version: "1",
      kind: "interaction",
      setup: () => {},
    });
    expect(telemetry.id).toBe("t");
    expect(assessment.id).toBe("a");
    expect(lifecycle.id).toBe("l");
  });
});
