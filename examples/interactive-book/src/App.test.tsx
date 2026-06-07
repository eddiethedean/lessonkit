import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import App from "./App";

describe("interactive-book example", () => {
  afterEach(() => cleanup());

  it("renders the warehouse safety handbook title", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /warehouse safety handbook/i })).toBeDefined();
  });
});
