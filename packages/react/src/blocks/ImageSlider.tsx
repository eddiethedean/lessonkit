import React, { useState } from "react";
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

export function ImageSlider(props: ImageSliderProps) {
  const [index, setIndex] = useState(0);
  const { track, config } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const slide = props.slides[index];
  const mediaOptions = { allowedHosts: config.embed?.allowedHosts };
  const resolvedSrc = slide ? resolveMediaSrc(slide.src, mediaOptions) : null;

  if (!slide) return null;

  const goTo = (next: number) => {
    setIndex(next);
    track(
      "image_slider_changed",
      { blockId: props.blockId, slideIndex: next },
      lessonId ? { lessonId } : undefined,
    );
  };

  return (
    <section aria-label="Image slider" data-lk-block-id={props.blockId} data-testid="image-slider">
      {resolvedSrc ? (
        <img src={resolvedSrc} alt={slide.alt} style={{ maxWidth: "100%" }} />
      ) : (
        <p role="alert">This image URL is not allowed.</p>
      )}
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
