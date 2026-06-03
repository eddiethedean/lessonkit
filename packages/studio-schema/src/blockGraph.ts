import type { StudioBlock } from "./types";

export function getChildBlockLists(block: StudioBlock): StudioBlock[][] {
  switch (block.type) {
    case "container":
    case "scenario":
    case "assessmentSequence":
      return [block.blocks];
    case "page":
      return [block.blocks];
    case "interactiveBook":
      return block.pages.map((page) => page.blocks);
    case "accordion":
      return block.sections.map((section) => section.blocks);
    case "imageHotspots":
      return block.hotspots.map((hotspot) => hotspot.blocks);
    default:
      return [];
  }
}

/** Depth-first walk including compound nested blocks. */
export function walkBlocks(blocks: StudioBlock[], visit: (block: StudioBlock) => void): void {
  for (const block of blocks) {
    visit(block);
    for (const childList of getChildBlockLists(block)) {
      walkBlocks(childList, visit);
    }
  }
}

export function forEachBlock(blocks: StudioBlock[], visit: (block: StudioBlock) => void): void {
  walkBlocks(blocks, visit);
}
