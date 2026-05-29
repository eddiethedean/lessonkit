import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import App from "./App";

describe("data privacy example", () => {
  afterEach(() => cleanup());

  it("renders compliance course with outline", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByText, getByRole } = render(<App />);
    expect(getByText("Data Privacy & GDPR Essentials")).toBeDefined();
    expect(getByRole("navigation", { name: "Course outline" })).toBeDefined();
    expect(getByText(/Binding Corporate Rules/)).toBeDefined();
    spy.mockRestore();
  });

  it("lawful basis lab accepts selections", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByText, getAllByText } = render(<App />);
    fireEvent.click(getByText("Lawful basis"));
    fireEvent.click(getAllByText("Contract")[0]!);
    expect(getByText(/Payroll runs monthly/)).toBeDefined();
    spy.mockRestore();
  });
});
