import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildGrid,
  cellsAlongHorizontalLine,
  isContiguousHorizontalLine,
  matchPlacement,
  selectionToWord,
} from "../src/blocks/wordSearchUtils";

describe("wordSearchUtils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("buildGrid places words horizontally at deterministic positions", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const { grid, placed, placements } = buildGrid(["CAT"], 5);
    expect(placed).toEqual(["CAT"]);
    expect(placements).toEqual([{ word: "CAT", row: 0, col: 0 }]);
    expect(grid[0]?.slice(0, 3)).toEqual(["C", "A", "T"]);
  });

  it("cellsAlongHorizontalLine returns contiguous cells on the same row", () => {
    expect(cellsAlongHorizontalLine({ row: 1, col: 2 }, { row: 1, col: 4 })).toEqual([
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
    ]);
    expect(cellsAlongHorizontalLine({ row: 1, col: 4 }, { row: 1, col: 2 })).toEqual([
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
    ]);
  });

  it("cellsAlongHorizontalLine returns null across rows", () => {
    expect(cellsAlongHorizontalLine({ row: 0, col: 0 }, { row: 1, col: 0 })).toBeNull();
  });

  it("matchPlacement matches horizontal words in path order", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const { grid, placed } = buildGrid(["CAT"], 5);
    const cells = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(selectionToWord(grid, cells)).toBe("CAT");
    expect(matchPlacement(placed, grid, cells)).toBe("CAT");
  });

  it("matchPlacement rejects non-contiguous selections", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const { grid, placed } = buildGrid(["CAT"], 5);
    const cells = [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
    ];
    expect(isContiguousHorizontalLine(cells)).toBe(false);
    expect(matchPlacement(placed, grid, cells)).toBeNull();
  });

  it("matchPlacement rejects sorted-but-non-adjacent cells", () => {
    const grid = [
      ["C", "X", "A", "X", "T"],
      ["Z", "Z", "Z", "Z", "Z"],
    ];
    const placed = ["CAT"];
    const cells = [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 0, col: 4 },
    ];
    expect(selectionToWord(grid, cells)).toBe("CAT");
    expect(matchPlacement(placed, grid, cells)).toBeNull();
  });
});
