import React, { useEffect, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { resolveMediaSrc } from "./embedSecurity";

export type ParallaxSlide = {
  title: string;
  body: string;
  imageSrc?: string;
};

export type ParallaxSlideshowProps = {
  blockId: BlockId;
  slides: ParallaxSlide[];
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function ParallaxSlideshow(props: ParallaxSlideshowProps) {
  const [index, setIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const { track, config } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const trackOpts = lessonId ? { lessonId } : undefined;
  const slide = props.slides[index];
  const mediaOptions = { allowedHosts: config.embed?.allowedHosts };
  const resolvedImageSrc = slide?.imageSrc
    ? resolveMediaSrc(slide.imageSrc, mediaOptions)
    : null;

  useEffect(() => {
    if (props.slides.length < 1) return;
    setIndex((current) => Math.min(current, props.slides.length - 1));
  }, [props.slides.length]);

  useEffect(() => {
    track(
      "parallax_slide_viewed",
      { blockId: props.blockId, slideIndex: index },
      trackOpts,
    );
  }, [index, props.blockId, track, trackOpts]);

  if (!slide) return null;

  const goTo = (next: number) => {
    if (next < 0 || next >= props.slides.length) return;
    setIndex(next);
  };

  return (
    <section
      aria-label="Parallax slideshow"
      data-lk-block-id={props.blockId}
      data-testid="parallax-slideshow"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <article
        data-testid={`parallax-slide-${index}`}
        style={
          reducedMotion
            ? undefined
            : {
                backgroundAttachment: "fixed",
                backgroundImage: resolvedImageSrc ? `url("${resolvedImageSrc}")` : undefined,
                backgroundPosition: "center",
                backgroundSize: "cover",
                minHeight: "12rem",
                padding: "1rem",
              }
        }
      >
        {reducedMotion && resolvedImageSrc ? (
          <img
            src={resolvedImageSrc}
            alt=""
            data-testid="parallax-slide-image"
            style={{ maxWidth: "100%" }}
          />
        ) : null}
        {!reducedMotion && slide.imageSrc && !resolvedImageSrc ? (
          <p role="alert">This image URL is not allowed.</p>
        ) : null}
        <h3 data-testid="parallax-slide-title">{slide.title}</h3>
        <p data-testid="parallax-slide-body">{slide.body}</p>
      </article>
      <nav aria-label="Slide navigation">
        <button
          type="button"
          data-testid="parallax-prev"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          Previous
        </button>
        <span data-testid="parallax-progress">
          {index + 1} / {props.slides.length}
        </span>
        <button
          type="button"
          data-testid="parallax-next"
          disabled={index >= props.slides.length - 1}
          onClick={() => goTo(index + 1)}
        >
          Next
        </button>
      </nav>
    </section>
  );
}

setLessonkitBlockType(ParallaxSlideshow, "ParallaxSlideshow");
