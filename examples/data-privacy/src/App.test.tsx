import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import App from "./App";

describe("data privacy example", () => {
  afterEach(() => cleanup());

  it("renders compliance course with outline", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByText, getByRole } = render(<App />);
    expect(getByRole("heading", { name: "Data Privacy & GDPR Essentials" })).toBeDefined();
    expect(getByRole("navigation", { name: "Course curriculum" })).toBeDefined();
    expect(getByRole("heading", { name: "Program overview" })).toBeDefined();
    expect(getByText(/Binding Corporate Rules/)).toBeDefined();
    spy.mockRestore();
  });

  it("lawful basis lab accepts selections", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByText, getAllByText, getByRole } = render(<App />);
    const nav = within(getByRole("navigation", { name: "Course curriculum" }));
    fireEvent.click(nav.getByRole("button", { name: /Lawful basis/i }));
    fireEvent.click(getAllByText("Contract")[0]!);
    expect(getByText(/Payroll runs monthly/)).toBeDefined();
    spy.mockRestore();
  });
});
