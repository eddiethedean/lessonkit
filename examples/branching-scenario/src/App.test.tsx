import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders branching scenario", () => {
    render(<App />);
    expect(screen.getByTestId("branching-scenario")).toBeTruthy();
  });
});
