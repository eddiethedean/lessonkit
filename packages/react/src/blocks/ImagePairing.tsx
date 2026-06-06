import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentBaseProps, AssessmentHandle, AssessmentInteractionType } from "@lessonkit/core";
import type { LessonId } from "@lessonkit/core";
import { AssessmentLessonGuard } from "../assessment/AssessmentLessonGuard";
import { buildAssessmentHandle } from "../assessment/internal/buildAssessmentHandle";
import { readBooleanStateField } from "../assessment/internal/resumeState";
import { useAssessmentHandleRegistration } from "../assessment/internal/useAssessmentHandleRegistration";
import { meetsPassingThreshold } from "../assessment/scoring";
import { useAssessmentState } from "../assessment/useAssessmentState";
import { setLessonkitBlockType } from "../compound/blockType";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type ImagePair = {
  id: string;
  label: string;
  imageSrc: string;
};

export type ImagePairingProps = AssessmentBaseProps & {
  pairs: ImagePair[];
};

const INTERACTION: AssessmentInteractionType = "imagePairing";

type Card = {
  cardKey: string;
  pairId: string;
  label: string;
  imageSrc: string;
};

function shuffleCards(cards: Card[]): Card[] {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

function buildDeck(pairs: ImagePair[]): Card[] {
  const cards = pairs.flatMap((pair) =>
    [0, 1].map((copy) => ({
      cardKey: `${pair.id}-${copy}`,
      pairId: pair.id,
      label: pair.label,
      imageSrc: pair.imageSrc,
    })),
  );
  return shuffleCards(cards);
}

function ImagePairingInner(
  props: ImagePairingProps & { enclosingLessonId: LessonId },
  ref: React.Ref<AssessmentHandle>,
) {
  const checkId = useMemo(() => normalizeComponentId(props.checkId, "checkId"), [props.checkId]);
  const assessment = useAssessmentState(props.enclosingLessonId);
  const pairsKey = props.pairs.map((p) => p.id).join("\0");

  const [cards, setCards] = useState<Card[]>(() => buildDeck(props.pairs));
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [keyboardSelection, setKeyboardSelection] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const completedRef = useRef(false);

  const reset = () => {
    completedRef.current = false;
    setCards(buildDeck(props.pairs));
    setMatched(new Set());
    setRevealed(new Set());
    setKeyboardSelection(null);
    setPassed(false);
  };

  useEffect(() => {
    reset();
  }, [checkId, pairsKey]);

  const totalPairs = props.pairs.length;
  const matchedCount = matched.size;
  const maxScore = totalPairs || 1;
  const score = matchedCount;
  const allMatched = totalPairs > 0 && matchedCount === totalPairs;
  const passedThreshold = meetsPassingThreshold(score, maxScore, props.passingScore);

  const completeIfReady = (nextMatched: Set<string>) => {
    if (nextMatched.size === totalPairs && totalPairs > 0 && !completedRef.current) {
      const finalScore = nextMatched.size;
      const finalPassed = meetsPassingThreshold(finalScore, maxScore, props.passingScore);
      completedRef.current = true;
      setPassed(true);
      assessment.answer({
        checkId,
        interactionType: INTERACTION,
        response: { matchedPairIds: [...nextMatched] },
        correct: finalPassed,
      });
      assessment.complete({
        checkId,
        interactionType: INTERACTION,
        score: finalScore,
        maxScore,
        passingScore: props.passingScore ?? maxScore,
      });
    }
  };

  const tryMatch = (firstKey: string, secondKey: string) => {
    if (firstKey === secondKey) return;
    const first = cards.find((c) => c.cardKey === firstKey);
    const second = cards.find((c) => c.cardKey === secondKey);
    if (!first || !second) return;

    setRevealed((prev) => new Set([...prev, firstKey, secondKey]));

    if (first.pairId === second.pairId) {
      setMatched((prev) => {
        const next = new Set([...prev, first.pairId]);
        completeIfReady(next);
        return next;
      });
      setRevealed(new Set());
      setKeyboardSelection(null);
    } else {
      window.setTimeout(() => {
        setRevealed((prev) => {
          const next = new Set(prev);
          next.delete(firstKey);
          next.delete(secondKey);
          return next;
        });
        setKeyboardSelection(null);
      }, 800);
    }
  };

  const selectCard = (cardKey: string) => {
    if (passed && !props.enableRetry) return;
    if (matched.has(cards.find((c) => c.cardKey === cardKey)?.pairId ?? "")) return;

    if (keyboardSelection === null) {
      setKeyboardSelection(cardKey);
      setRevealed((prev) => new Set([...prev, cardKey]));
      return;
    }
    if (keyboardSelection === cardKey) {
      setKeyboardSelection(null);
      setRevealed((prev) => {
        const next = new Set(prev);
        next.delete(cardKey);
        return next;
      });
      return;
    }
    tryMatch(keyboardSelection, cardKey);
  };

  const handle = useMemo(
    () =>
      buildAssessmentHandle({
        checkId,
        getScore: () => score,
        getMaxScore: () => maxScore,
        getAnswerGiven: () => matchedCount > 0,
        resetTask: reset,
        showSolutions: () => {},
        getXAPIData: () => ({
          checkId,
          interactionType: INTERACTION,
          response: { matchedPairIds: [...matched] },
          correct: allMatched && passedThreshold,
          score,
          maxScore,
        }),
        getCurrentState: () => ({
          matched: [...matched],
          revealed: [...revealed],
          keyboardSelection,
          passed,
        }),
        resume: (state) => {
          if (Array.isArray(state.matched)) setMatched(new Set(state.matched as string[]));
          if (Array.isArray(state.revealed)) setRevealed(new Set(state.revealed as string[]));
          const sel = state.keyboardSelection;
          if (sel === null || typeof sel === "string") setKeyboardSelection(sel ?? null);
          readBooleanStateField(state, "passed", (value) => {
            setPassed(value);
            completedRef.current = value;
          });
        },
      }),
    [allMatched, checkId, keyboardSelection, matched, matchedCount, maxScore, passed, passedThreshold, revealed, score],
  );

  useAssessmentHandleRegistration(checkId, handle, ref);

  return (
    <section aria-label="Image Pairing" data-lk-check-id={checkId} data-testid="image-pairing">
      <p>Match the image pairs (select two cards with keyboard or click).</p>
      <div role="list" aria-label="Image cards" data-testid="image-pairing-grid">
        {cards.map((card) => {
          const isMatched = matched.has(card.pairId);
          const isRevealed = isMatched || revealed.has(card.cardKey);
          const isSelected = keyboardSelection === card.cardKey;
          return (
            <button
              key={card.cardKey}
              type="button"
              role="listitem"
              data-testid={`pairing-card-${card.cardKey}`}
              aria-pressed={isSelected}
              disabled={isMatched || (passed && !props.enableRetry)}
              onClick={() => selectCard(card.cardKey)}
              style={{
                margin: "0.25rem",
                minWidth: "6rem",
                minHeight: "6rem",
                border: isSelected ? "2px solid currentColor" : "1px solid currentColor",
              }}
            >
              {isRevealed ? (
                <>
                  <img src={card.imageSrc} alt={card.label} style={{ maxWidth: "5rem", maxHeight: "5rem" }} />
                  <span className="lk-visually-hidden">{card.label}</span>
                </>
              ) : (
                "?"
              )}
            </button>
          );
        })}
      </div>
      <p role="status" aria-live="polite" data-testid="image-pairing-progress">
        {matchedCount} / {totalPairs} pairs matched
      </p>
      {props.enableRetry && passed ? (
        <button type="button" data-testid="image-pairing-retry" onClick={reset}>
          Try again
        </button>
      ) : null}
    </section>
  );
}

const ImagePairingInnerForwarded = forwardRef(ImagePairingInner);

export const ImagePairing = forwardRef<AssessmentHandle, ImagePairingProps>(function ImagePairing(props, ref) {
  return (
    <AssessmentLessonGuard blockLabel="ImagePairing" checkId={props.checkId}>
      {(lessonId) => <ImagePairingInnerForwarded {...props} enclosingLessonId={lessonId} ref={ref} />}
    </AssessmentLessonGuard>
  );
});

setLessonkitBlockType(ImagePairing, "ImagePairing");
