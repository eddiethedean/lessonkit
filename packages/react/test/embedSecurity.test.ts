import { afterEach, describe, expect, it, vi } from "vitest";

function mockPageUrl(href: string) {
  vi.stubGlobal("location", new URL(href));
}

describe("resolveMediaSrc production scheme policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("allows same-origin http media in production builds", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockPageUrl("http://127.0.0.1:8765/_static/component-demos/index.html");
    const { resolveMediaSrc } = await import("../src/blocks/embedSecurity");
    expect(resolveMediaSrc("./media/sample-briefing.mp4")).toBe(
      "http://127.0.0.1:8765/_static/component-demos/media/sample-briefing.mp4",
    );
  });

  it("blocks cross-origin http media in production builds", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockPageUrl("http://127.0.0.1:8765/docs/index.html");
    const { resolveMediaSrc } = await import("../src/blocks/embedSecurity");
    expect(resolveMediaSrc("http://evil.example.com/video.mp4")).toBeNull();
  });

  it("blocks cross-origin loopback media in production builds", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockPageUrl("https://lessonkit.example/course/index.html");
    const { resolveMediaSrc } = await import("../src/blocks/embedSecurity");
    expect(resolveMediaSrc("http://127.0.0.1:8765/media/video.mp4")).toBeNull();
  });

  it("allows data:image URLs from bundlers", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { resolveMediaSrc } = await import("../src/blocks/embedSecurity");
    const data =
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIj48L3N2Zz4=";
    expect(resolveMediaSrc(data)).toBe(data);
  });

  it("trusts same-origin media in docs preview mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockPageUrl("https://lessonkit.example/course/index.html");
    const { resolveMediaSrc } = await import("../src/blocks/embedSecurity");
    expect(
      resolveMediaSrc("./assets/workspace-map.svg", { trustSameOriginMedia: true }),
    ).toBe("https://lessonkit.example/course/assets/workspace-map.svg");
  });

  it("allows https media from external hosts in production builds", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockPageUrl("http://127.0.0.1:8765/docs/index.html");
    const { resolveMediaSrc } = await import("../src/blocks/embedSecurity");
    expect(
      resolveMediaSrc("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"),
    ).toBe("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4");
  });
});

describe("embed strictHosts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("blocks loopback hosts in non-production when strictHosts is true", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockPageUrl("https://lessonkit.example/course/index.html");
    const { resolveMediaSrc } = await import("../src/blocks/embedSecurity");
    expect(
      resolveMediaSrc("http://127.0.0.1:8765/media/video.mp4", { strictHosts: true }),
    ).toBeNull();
  });

  it("allows loopback hosts in non-production when strictHosts is false", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mockPageUrl("https://lessonkit.example/course/index.html");
    const { resolveMediaSrc } = await import("../src/blocks/embedSecurity");
    expect(
      resolveMediaSrc("http://127.0.0.1:8765/media/video.mp4", { strictHosts: false }),
    ).toBe("http://127.0.0.1:8765/media/video.mp4");
  });
});
