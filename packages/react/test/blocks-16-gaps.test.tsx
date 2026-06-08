import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AudioRecorder, Collage, Course, Embed, ImageSequence, Lesson } from "../src";

const config = { xapi: { enabled: false } } as const;

function wrap(children: React.ReactNode) {
  return (
    <Course title="Blocks 1.6 gaps" courseId="blocks-16-gaps" config={config}>
      <Lesson title="L1" lessonId="lesson-gaps">
        {children}
      </Lesson>
    </Course>
  );
}

describe("1.6.x block components (coverage gaps)", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("Embed renders an iframe for allowed relative URLs", () => {
    render(
      wrap(<Embed blockId="embed-1" src="/embed/page.html" title="External activity" />),
    );
    const iframe = screen.getByTitle("External activity");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe.getAttribute("src")).toMatch(/embed\/page\.html$/);
  });

  it("Embed shows an alert when the URL uses a disallowed scheme", () => {
    render(
      wrap(
        <Embed blockId="embed-blocked" src="ftp://evil.example/embed" title="Blocked embed" />,
      ),
    );
    expect(screen.getByRole("alert").textContent).toContain("not allowed");
  });

  it("Collage renders cells with captions", () => {
    render(
      wrap(
        <Collage
          blockId="collage-1"
          columns={2}
          cells={[
            { id: "a", src: "/a.png", alt: "Panel A", caption: "First panel" },
            { id: "b", src: "/b.png", alt: "Panel B" },
          ]}
        />,
      ),
    );
    expect(screen.getByTestId("collage-block")).toBeDefined();
    expect(screen.getByText("First panel")).toBeDefined();
    expect(screen.getByAltText("Panel A")).toBeDefined();
  });

  it("ImageSequence advances frames via slider when motion is allowed", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as typeof window.matchMedia;

    render(
      wrap(
        <ImageSequence
          blockId="seq-1"
          frames={[
            { src: "/frame-1.png", alt: "Frame 1", label: "Step 1" },
            { src: "/frame-2.png", alt: "Frame 2", label: "Step 2" },
          ]}
        />,
      ),
    );
    expect(screen.getByTestId("sequence-frame").getAttribute("alt")).toBe("Frame 1");
    fireEvent.change(screen.getByTestId("sequence-slider"), { target: { value: "1" } });
    expect(screen.getByTestId("sequence-frame").getAttribute("alt")).toBe("Frame 2");
  });

  it("AudioRecorder shows unsupported message when MediaRecorder is unavailable", () => {
    const originalMediaRecorder = globalThis.MediaRecorder;
    // @ts-expect-error test environment
    delete globalThis.MediaRecorder;

    render(wrap(<AudioRecorder blockId="audio-1" consentLabel="I consent to record" />));
    expect(screen.getByTestId("audio-recorder-unsupported")).toBeDefined();

    globalThis.MediaRecorder = originalMediaRecorder;
  });

  it("AudioRecorder requires consent before enabling record", () => {
    class MockMediaRecorder {
      static isTypeSupported = () => true;
      state = "inactive";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn(() => {
        this.onstop?.();
      });
    }
    vi.stubGlobal("MediaRecorder", MockMediaRecorder);
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{ stop: vi.fn() }],
        })),
      },
    });

    render(wrap(<AudioRecorder blockId="audio-2" consentLabel="I consent to record" />));
    const recordButton = screen.getByTestId("audio-recorder-start");
    expect(recordButton.hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByTestId("audio-recorder-consent"));
    expect(recordButton.hasAttribute("disabled")).toBe(false);
    vi.unstubAllGlobals();
  });
});
