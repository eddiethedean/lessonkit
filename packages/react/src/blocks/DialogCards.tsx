import React, { useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";

export type DialogCard = {
  front: string;
  back: string;
};

export type DialogCardsProps = {
  blockId: BlockId;
  cards: DialogCard[];
};

export function DialogCards(props: DialogCardsProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = props.cards[index];

  if (!card) return null;

  return (
    <section aria-label="Dialog cards" data-lk-block-id={props.blockId} data-testid="dialog-cards">
      <p>
        Card {index + 1} of {props.cards.length}
      </p>
      <button
        type="button"
        className="lk-flip-card"
        data-testid="dialog-card-flip"
        aria-pressed={flipped}
        onClick={() => setFlipped((f) => !f)}
        style={{ width: "100%" }}
      >
        {flipped ? card.back : card.front}
      </button>
      <nav className="lk-compound-nav" aria-label="Card navigation">
        <button
          type="button"
          className="lk-button"
          data-testid="dialog-prev"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => i - 1);
            setFlipped(false);
          }}
        >
          Previous
        </button>
        <button
          type="button"
          className="lk-button"
          data-testid="dialog-next"
          disabled={index >= props.cards.length - 1}
          onClick={() => {
            setIndex((i) => i + 1);
            setFlipped(false);
          }}
        >
          Next
        </button>
      </nav>
    </section>
  );
}

setLessonkitBlockType(DialogCards, "DialogCards");
