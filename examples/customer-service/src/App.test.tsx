import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import App from "./App";

describe("customer service example", () => {
  afterEach(() => cleanup());

  it("renders course title and scenario", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByText } = render(<App />);
    expect(getByText("Customer De-escalation Skills")).toBeDefined();
    expect(getByText(/fourth agent today/i)).toBeDefined();
    spy.mockRestore();
  });

  it("reflective opening response shows positive coaching", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByText } = render(<App />);
    fireEvent.click(
      getByText(/I hear you’ve been transferred several times and still don’t have the part/i),
    );
    expect(getByText(/Strong start/)).toBeDefined();
    spy.mockRestore();
  });
});
