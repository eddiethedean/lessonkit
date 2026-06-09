import React, { useEffect, useRef, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { resolveMediaSrc } from "./embedSecurity";

export type ImageSlide = {
  src: string;
  alt: string;
  caption?: string;
};

export type ImageSliderProps = {
  blockId: BlockId;
  slides: ImageSlide[];
};

const SWIPE_THRESHOLD_PX = 40;

export function ImageSlider(props: ImageSliderProps) {
  const [index, setIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);
  const { track, config } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const slide = props.slides[index];
  const mediaOptions = { allowedHosts: config.embed?.allowedHosts };
  const resolvedSrc = slide ? resolveMediaSrc(slide.src, mediaOptions) : null;

  useEffect(() => {
    if (index >= props.slides.length) {
      setIndex(Math.max(0, props.slides.length - 1));
    }
  }, [index, props.slides.length]);

  if (!slide) return null;

  const goTo = (next: number) => {
    if (next < 0 || next >= props.slides.length || next === index) return;
    setIndex(next);
    track(
      "image_slider_changed",
      { blockId: props.blockId, slideIndex: next },
      lessonId ? { lessonId } : undefined,
    );
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;
    const delta = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) goTo(index + 1);
    else goTo(index - 1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    }
  };

  return (
    <section
      aria-label="Image slider"
      data-lk-block-id={props.blockId}
      data-testid="image-slider"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div
        className="lk-image-slider-viewport"
        data-testid="image-slider-viewport"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
      >
        {resolvedSrc ? (
          <img src={resolvedSrc} alt={slide.alt} draggable={false} />
        ) : (
          <p role="alert">This image URL is not allowed.</p>
        )}
      </div>
      {slide.caption ? <p>{slide.caption}</p> : null}
      <nav aria-label="Slide navigation">
        <button
          type="button"
          data-testid="slider-prev"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          Previous
        </button>
        <span>
          {index + 1} / {props.slides.length}
        </span>
        <button
          type="button"
          data-testid="slider-next"
          disabled={index >= props.slides.length - 1}
          onClick={() => goTo(index + 1)}
        >
          Next
        </button>
      </nav>
    </section>
  );
}

setLessonkitBlockType(ImageSlider, "ImageSlider");
