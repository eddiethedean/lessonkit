import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildGrid,
  buildGridSeed,
  cellsAlongHorizontalLine,
  isContiguousHorizontalLine,
  matchPlacement,
  restoreWordSearchLayout,
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

  it("buildGrid with the same seed produces identical layouts", () => {
    const seed = buildGridSeed("ws-check", "CAT\0DOG", 8);
    const first = buildGrid(["CAT", "DOG"], 8, seed);
    const second = buildGrid(["CAT", "DOG"], 8, seed);
    expect(second).toEqual(first);
  });

  it("buildGrid with different seeds can produce different layouts", () => {
    const first = buildGrid(["CAT", "DOG", "BIRD"], 10, buildGridSeed("a", "CAT\0DOG\0BIRD", 10));
    const second = buildGrid(["CAT", "DOG", "BIRD"], 10, buildGridSeed("b", "CAT\0DOG\0BIRD", 10));
    expect(second.placements).not.toEqual(first.placements);
  });

  it("restoreWordSearchLayout validates persisted grid and placements", () => {
    const seed = buildGridSeed("ws-check", "CAT", 5);
    const layout = buildGrid(["CAT"], 5, seed);
    const restored = restoreWordSearchLayout(
      {
        grid: layout.grid,
        placed: layout.placed,
        placements: layout.placements,
        found: ["CAT"],
      },
      ["CAT"],
      5,
    );
    expect(restored).toEqual(layout);
    expect(restoreWordSearchLayout({ grid: [["X"]] }, ["CAT"], 5)).toBeNull();
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
