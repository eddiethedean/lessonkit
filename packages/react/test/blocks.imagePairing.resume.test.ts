import { describe, expect, it } from "vitest";
import { rebuildCardsFromKeys, type ImagePair } from "../src/blocks/ImagePairing";

describe("ImagePairing resume", () => {
  const pairs: ImagePair[] = [
    { id: "a", label: "A", imageSrc: "https://example.com/a.png" },
    { id: "b", label: "B", imageSrc: "https://example.com/b.png" },
  ];

  it("rebuilds cards from persisted cardKeys", () => {
    const cardKeys = ["a-0", "b-1", "a-1", "b-0"];
    const cards = rebuildCardsFromKeys(pairs, cardKeys);
    expect(cards).toHaveLength(4);
    expect(cards?.map((card) => card.cardKey)).toEqual(cardKeys);
  });

  it("returns null when cardKeys do not match pair count", () => {
    expect(rebuildCardsFromKeys(pairs, ["a-0"])).toBeNull();
  });
});
