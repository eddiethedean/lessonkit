import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "./App";

describe("interactive-video example", () => {
  afterEach(() => cleanup());

  it("renders the interactive video block", () => {
    render(<App />);
    expect(screen.getByTestId("interactive-video")).toBeDefined();
    expect(screen.getByRole("heading", { level: 1, name: "Safety briefing" })).toBeDefined();
  });
});
