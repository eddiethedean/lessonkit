import { describe, expect, it, vi } from "vitest";

describe("template main", () => {
  it("mounts the app into #root", async () => {
    vi.resetModules();
    const rootEl = document.createElement("div");
    rootEl.id = "root";
    document.body.appendChild(rootEl);

    const render = vi.fn();
    const createRoot = vi.fn(() => ({ render }));

    vi.doMock("react-dom/client", () => ({
      default: { createRoot },
    }));

    await import("./main");

    expect(createRoot).toHaveBeenCalledWith(rootEl);
    expect(render).toHaveBeenCalledTimes(1);

    document.body.removeChild(rootEl);
  });
});

