import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import App from "./App";

describe("data privacy example", () => {
  afterEach(() => cleanup());

  it("renders course title and first lesson", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByText } = render(<App />);
    expect(getByText("Data Privacy Essentials")).toBeDefined();
    expect(getByText(/Wrong distribution list/)).toBeDefined();
    spy.mockRestore();
  });

  it("theme toggle switches document theme", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByRole } = render(<App />);
    fireEvent.click(getByRole("button", { name: "Light" }));
    expect(document.documentElement.getAttribute("data-lk-theme")).toBe("light");
    spy.mockRestore();
  });
});
