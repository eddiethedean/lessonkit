import React, { useEffect, useMemo, useRef, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";

export type MemoryPair = {
  id: string;
  label: string;
};

export type MemoryGameProps = {
  blockId: BlockId;
  pairs: MemoryPair[];
  /** Optional self-score mode (not LMS-scored). */
  selfScore?: boolean;
};

type Card = {
  cardKey: string;
  pairId: string;
  label: string;
};

function shuffleCards(cards: Card[]): Card[] {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function buildDeck(pairs: MemoryPair[]): Card[] {
  const cards = pairs.flatMap((pair) =>
    [0, 1].map((copy) => ({
      cardKey: `${pair.id}-${copy}`,
      pairId: pair.id,
      label: pair.label,
    })),
  );
  return shuffleCards(cards);
}

export function MemoryGame(props: MemoryGameProps) {
  const pairsKey = props.pairs.map((p) => p.id).join("\0");
  const [cards, setCards] = useState<Card[]>(() => buildDeck(props.pairs));
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [selection, setSelection] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const mismatchTimeoutRef = useRef<number | null>(null);
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const trackOpts = lessonId ? { lessonId } : undefined;

  useEffect(() => {
    if (mismatchTimeoutRef.current !== null) {
      window.clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }
    setCards(buildDeck(props.pairs));
    setMatched(new Set());
    setRevealed(new Set());
    setSelection(null);
    setComplete(false);
  }, [props.blockId, pairsKey]);

  useEffect(
    () => () => {
      if (mismatchTimeoutRef.current !== null) {
        window.clearTimeout(mismatchTimeoutRef.current);
      }
    },
    [],
  );

  const cardIndexByKey = useMemo(
    () => Object.fromEntries(cards.map((c, i) => [c.cardKey, i])),
    [cards],
  );

  const flipCard = (cardKey: string, face: "front" | "back") => {
    const cardIndex = cardIndexByKey[cardKey];
    if (typeof cardIndex === "number") {
      track(
        "memory_card_flipped",
        { blockId: props.blockId, cardIndex, face },
        trackOpts,
      );
    }
  };

  const tryMatch = (firstKey: string, secondKey: string) => {
    const first = cards.find((c) => c.cardKey === firstKey);
    const second = cards.find((c) => c.cardKey === secondKey);
    if (!first || !second) return;

    setRevealed((prev) => new Set([...prev, firstKey, secondKey]));
    flipCard(secondKey, "back");

    if (first.pairId === second.pairId) {
      setMatched((prev) => {
        const next = new Set([...prev, first.pairId]);
        if (next.size === props.pairs.length) setComplete(true);
        return next;
      });
      setRevealed(new Set());
      setSelection(null);
    } else {
      if (mismatchTimeoutRef.current !== null) {
        window.clearTimeout(mismatchTimeoutRef.current);
      }
      mismatchTimeoutRef.current = window.setTimeout(() => {
        mismatchTimeoutRef.current = null;
        setRevealed((prev) => {
          const next = new Set(prev);
          next.delete(firstKey);
          next.delete(secondKey);
          return next;
        });
        flipCard(firstKey, "front");
        flipCard(secondKey, "front");
        setSelection(null);
      }, 800);
    }
  };

  const selectCard = (cardKey: string) => {
    if (complete) return;
    if (matched.has(cards.find((c) => c.cardKey === cardKey)?.pairId ?? "")) return;

    if (selection === null) {
      setSelection(cardKey);
      setRevealed((prev) => new Set([...prev, cardKey]));
      flipCard(cardKey, "back");
      return;
    }
    if (selection === cardKey) {
      setSelection(null);
      setRevealed((prev) => {
        const next = new Set(prev);
        next.delete(cardKey);
        return next;
      });
      flipCard(cardKey, "front");
      return;
    }
    tryMatch(selection, cardKey);
  };

  const restart = () => {
    setCards(buildDeck(props.pairs));
    setMatched(new Set());
    setRevealed(new Set());
    setSelection(null);
    setComplete(false);
  };

  return (
    <section aria-label="Memory Game" data-lk-block-id={props.blockId} data-testid="memory-game">
      <div role="list" aria-label="Memory cards" data-testid="memory-game-grid">
        {cards.map((card) => {
          const isMatched = matched.has(card.pairId);
          const isRevealed = isMatched || revealed.has(card.cardKey);
          const isSelected = selection === card.cardKey;
          return (
            <button
              key={card.cardKey}
              type="button"
              role="listitem"
              data-testid={`memory-card-${card.cardKey}`}
              aria-pressed={isSelected}
              disabled={isMatched || complete}
              onClick={() => selectCard(card.cardKey)}
              style={{
                margin: "0.25rem",
                minWidth: "5rem",
                minHeight: "5rem",
                border: isSelected ? "2px solid currentColor" : "1px solid currentColor",
              }}
            >
              {isRevealed ? card.label : "?"}
            </button>
          );
        })}
      </div>
      {complete ? (
        <p role="status" aria-live="polite" data-testid="memory-game-complete">
          All pairs matched!
        </p>
      ) : null}
      {props.selfScore ? (
        <p data-testid="memory-game-self-score">Self-score mode enabled</p>
      ) : null}
      <button type="button" data-testid="memory-game-restart" onClick={restart}>
        Restart
      </button>
    </section>
  );
}

setLessonkitBlockType(MemoryGame, "MemoryGame");
