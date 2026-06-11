import React, { useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";

export type Flashcard = {
  front: string;
  back: string;
};

export type FlashcardsProps = {
  blockId: BlockId;
  cards: Flashcard[];
  /** Optional self-score mode (not LMS-scored). */
  selfScore?: boolean;
};

export function Flashcards(props: FlashcardsProps) {
  const [index, setIndex] = useState(0);
  const [face, setFace] = useState<"front" | "back">("front");
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const card = props.cards[index];

  if (!card) return null;

  const flip = () => {
    const next = face === "front" ? "back" : "front";
    setFace(next);
    track(
      "flashcard_flipped",
      { blockId: props.blockId, cardIndex: index, face: next },
      lessonId ? { lessonId } : undefined,
    );
  };

  return (
    <section aria-label="Flashcards" data-lk-block-id={props.blockId} data-testid="flashcards">
      <button
        type="button"
        className="lk-flip-card"
        data-testid="flashcard-flip"
        onClick={flip}
        style={{ width: "100%" }}
      >
        {face === "front" ? card.front : card.back}
      </button>
      {props.selfScore ? (
        <p data-testid="flashcard-self-score">Self-score mode enabled</p>
      ) : null}
      <button
        type="button"
        className="lk-button"
        data-testid="flashcard-next"
        disabled={index >= props.cards.length - 1}
        onClick={() => {
          setIndex((i) => i + 1);
          setFace("front");
        }}
      >
        Next card
      </button>
    </section>
  );
}

setLessonkitBlockType(Flashcards, "Flashcards");
