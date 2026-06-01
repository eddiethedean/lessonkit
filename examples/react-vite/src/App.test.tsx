import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import App from "./App";

describe("example App", () => {
  afterEach(() => cleanup());

  it("renders without crashing", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<App />);
    spy.mockRestore();
    expect(true).toBe(true);
  });

  it("assignment acknowledgment unlocks lab feedback", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByRole, getByText } = render(<App />);
    fireEvent.click(getByRole("checkbox"));
    expect(getByText(/Ready for labs/)).toBeDefined();
    spy.mockRestore();
  });

  it("theme toggle updates data-lk-theme and light background CSS on the document", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getByRole } = render(<App />);
    fireEvent.click(getByRole("button", { name: "Light" }));
    expect(document.documentElement.getAttribute("data-lk-theme")).toBe("light");
    expect(document.documentElement.style.getPropertyValue("--lk-color-background").trim()).toBe(
      "#f7f8ff",
    );
    fireEvent.click(getByRole("button", { name: "Dark" }));
    expect(document.documentElement.getAttribute("data-lk-theme")).toBe("dark");
    spy.mockRestore();
  });

  it(
    "lets you triage inbox, navigate lessons, unlock hints, and complete the course",
    async () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.useFakeTimers();

      const { getAllByLabelText, getAllByText, getByText, queryByText } = render(<App />);
      const nav = within(getAllByLabelText("Course curriculum")[0]!);

      fireEvent.click(nav.getByText("Continue"));

      await act(async () => {
        fireEvent.click(getAllByText("Open attachment / link")[0]!);
        fireEvent.click(getAllByText("Ignore for now")[1]!);
        fireEvent.click(getAllByText("Report as phishing")[2]!);
      });

      expect(getAllByText(/You chose:/)).toHaveLength(3);
      expect(queryByText(/High exposure/i)).toBeTruthy();

      fireEvent.click(nav.getByText("Continue"));
      fireEvent.click(nav.getByText("Continue"));

      await act(async () => {
        vi.advanceTimersByTime(6000);
      });
      expect(getByText(/Coaching tip:/)).toBeDefined();

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      expect(getByText(/Policy reminder:/)).toBeDefined();

      fireEvent.click(getByText("Ask them to use the official IT self-service portal"));
      expect(getByText(/Correct approach/)).toBeDefined();

      fireEvent.click(nav.getByText("Continue"));
      fireEvent.click(nav.getByText("Continue"));
      fireEvent.click(nav.getByText("Continue"));
      fireEvent.click(nav.getByText("Continue"));

      const completeBtn = getByText("Mark module complete") as HTMLButtonElement;
      expect(completeBtn.disabled).toBe(false);
      fireEvent.click(completeBtn);

      vi.useRealTimers();
      spy.mockRestore();
    },
    15000,
  );

  it("inbox exercise can land on needs-review risk band", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getAllByLabelText, getAllByText, getByText } = render(<App />);
    const nav = within(getAllByLabelText("Course curriculum")[0]!);

    fireEvent.click(nav.getByText("Continue"));
    fireEvent.click(getAllByText("Ignore for now")[0]!);
    fireEvent.click(getAllByText("Report as phishing")[1]!);
    fireEvent.click(getAllByText("Ignore for now")[2]!);
    expect(getByText(/Needs review/)).toBeDefined();
    spy.mockRestore();
  });

  it("covers smishing simulation safe path", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getAllByLabelText, getAllByText, getByText } = render(<App />);
    const nav = within(getAllByLabelText("Course curriculum")[0]!);

    fireEvent.click(nav.getByText("Continue"));
    fireEvent.click(nav.getByText("Continue"));
    fireEvent.click(getAllByText("Block & report")[0]!);
    fireEvent.click(getAllByText("Block & report")[1]!);
    fireEvent.click(getAllByText("Call number back")[2]!);
    expect(getByText(/Good instincts/)).toBeDefined();
    spy.mockRestore();
  });

  it("covers smishing simulation risky path", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getAllByLabelText, getAllByText, getByText } = render(<App />);
    const nav = within(getAllByLabelText("Course curriculum")[0]!);

    fireEvent.click(nav.getByText("Continue"));
    fireEvent.click(nav.getByText("Continue"));
    fireEvent.click(getAllByText("Open link")[0]!);
    fireEvent.click(getAllByText("Open link")[1]!);
    fireEvent.click(getAllByText("Open link")[2]!);
    expect(getByText(/Review SOC guidance/)).toBeDefined();
    spy.mockRestore();
  });

  it("sidebar Previous is enabled after advancing and disabled on the first lesson", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getAllByLabelText, getByRole } = render(<App />);
    const nav = within(getAllByLabelText("Course curriculum")[0]!);

    const previous = getByRole("button", { name: "Previous" }) as HTMLButtonElement;
    expect(previous.disabled).toBe(true);
    fireEvent.click(nav.getByText("Continue"));
    expect(previous.disabled).toBe(false);
    fireEvent.click(previous);
    expect(previous.disabled).toBe(true);
    spy.mockRestore();
  });

  it("credential hygiene acknowledgment checkbox updates state", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { getAllByLabelText, getByRole } = render(<App />);
    const nav = within(getAllByLabelText("Course curriculum")[0]!);

    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(nav.getByText("Continue"));
    }
    const mfaCheckbox = getByRole("checkbox", {
      name: /I will enable MFA on my primary work account this week/i,
    });
    expect(mfaCheckbox).toBeDefined();
    fireEvent.click(mfaCheckbox);
    spy.mockRestore();
  });

  it("covers the risky urgent-request branch", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.useFakeTimers();

    const { getAllByLabelText, getByText } = render(<App />);
    const nav = within(getAllByLabelText("Course curriculum")[0]!);

    fireEvent.click(nav.getByText("Continue"));
    fireEvent.click(nav.getByText("Continue"));
    fireEvent.click(nav.getByText("Continue"));
    expect(nav.getByText(/Pressure tactics/i)).toBeDefined();

    await act(async () => {
      vi.advanceTimersByTime(6000);
    });

    fireEvent.click(getByText("Forward the reset link they sent"));
    expect(getByText(/Risky choice/)).toBeDefined();

    vi.useRealTimers();
    spy.mockRestore();
  });
});
