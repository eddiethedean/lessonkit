export type GridCell = { row: number; col: number };

export type WordPlacement = { word: string; row: number; col: number };

export type WordSearchGrid = {
  grid: string[][];
  placed: string[];
  placements: WordPlacement[];
};

export function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function parseCellKey(key: string): GridCell | null {
  const [rowRaw, colRaw] = key.split(":");
  const row = Number(rowRaw);
  const col = Number(colRaw);
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) {
    return null;
  }
  return { row, col };
}

export function buildGrid(words: string[], size: number): WordSearchGrid {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ""),
  );
  const placed: string[] = [];
  const placements: WordPlacement[] = [];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (const raw of words) {
    const word = raw.toUpperCase().replace(/[^A-Z]/g, "");
    if (word.length === 0 || word.length > size) continue;
    let done = false;
    for (let attempt = 0; attempt < 50 && !done; attempt += 1) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * (size - word.length + 1));
      let fits = true;
      for (let i = 0; i < word.length; i += 1) {
        const cell = grid[row]![col + i]!;
        if (cell && cell !== word[i]) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;
      for (let i = 0; i < word.length; i += 1) {
        grid[row]![col + i] = word[i]!;
      }
      placed.push(word);
      placements.push({ word, row, col });
      done = true;
    }
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (!grid[r]![c]) {
        grid[r]![c] = alphabet[Math.floor(Math.random() * alphabet.length)]!;
      }
    }
  }

  return { grid, placed, placements };
}

export function cellsAlongHorizontalLine(start: GridCell, end: GridCell): GridCell[] | null {
  if (start.row !== end.row) return null;
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  return Array.from({ length: maxCol - minCol + 1 }, (_, index) => ({
    row: start.row,
    col: minCol + index,
  }));
}

export function selectionToWord(grid: string[][], cells: readonly GridCell[]): string {
  return cells
    .map(({ row, col }) => grid[row]?.[col] ?? "")
    .join("");
}

export function isContiguousHorizontalLine(cells: readonly GridCell[]): boolean {
  if (cells.length === 0) return false;
  const row = cells[0]!.row;
  const cols = cells.map((cell) => cell.col);
  if (cells.some((cell) => cell.row !== row)) return false;
  const sorted = [...cols].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i]! - sorted[i - 1]! !== 1) return false;
  }
  return true;
}

export function matchPlacement(
  placed: readonly string[],
  grid: string[][],
  cells: readonly GridCell[],
): string | null {
  if (!isContiguousHorizontalLine(cells)) return null;
  const letters = selectionToWord(grid, cells);
  return placed.find((word) => word === letters) ?? null;
}

export function placementCellKeys(placement: WordPlacement): string[] {
  return Array.from({ length: placement.word.length }, (_, index) =>
    cellKey(placement.row, placement.col + index),
  );
}
