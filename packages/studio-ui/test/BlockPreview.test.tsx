import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlockPreview } from "../src/BlockPreview";

describe("BlockPreview", () => {
  it("renders lightweight blocks synchronously", () => {
    render(<BlockPreview block={{ type: "text", id: "t", text: "Hello" }} />);
    expect(screen.getByText("Hello")).toBeDefined();
  });
});
