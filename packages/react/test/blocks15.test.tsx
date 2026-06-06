import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Course, Chart, Embed, Lesson } from "../src";

describe("Embed", () => {
  it("renders sandboxed iframe", () => {
    render(
      <Course title="C" courseId="embed-course" config={{ xapi: { enabled: false } }}>
        <Lesson title="L" lessonId="l1">
          <Embed blockId="ext-doc" src="https://example.com/doc" title="External doc" />
        </Lesson>
      </Course>,
    );
    const iframe = screen.getByTitle("External doc") as HTMLIFrameElement;
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe.getAttribute("sandbox")).toContain("allow-scripts");
    expect(iframe.getAttribute("referrerpolicy")).toBe("no-referrer");
  });
});

describe("Chart", () => {
  it("renders accessible data table", () => {
    render(
      <Course title="C" courseId="chart-course" config={{ xapi: { enabled: false } }}>
        <Lesson title="L" lessonId="l1">
          <Chart
            blockId="incidents"
            type="bar"
            title="Incidents by type"
            data={[
              { label: "Phishing", value: 12 },
              { label: "Malware", value: 4 },
            ]}
          />
        </Lesson>
      </Course>,
    );
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("rowheader", { name: "Phishing" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "12" })).toBeTruthy();
  });
});
