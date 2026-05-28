import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import App from "./App";

describe("template App", () => {
  it("renders without crashing", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<App />);
    spy.mockRestore();
    expect(true).toBe(true);
  });
});

