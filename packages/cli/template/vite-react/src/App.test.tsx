import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("template App", () => {
  it("renders the starter quiz question", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<App />);
    expect(screen.getByText("Ready to build?")).toBeDefined();
    spy.mockRestore();
  });
});

