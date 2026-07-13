import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "./App";

describe("assessments-p0 example", () => {
  afterEach(() => cleanup());

  it("renders the assessment blocks course title", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /assessment blocks/i }).textContent).toMatch(
      /assessment blocks/i,
    );
  });
});
