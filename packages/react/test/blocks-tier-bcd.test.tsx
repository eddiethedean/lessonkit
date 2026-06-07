import React, { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  ArithmeticQuiz,
  Course,
  DialogCards,
  Essay,
  FindMultipleHotspots,
  Flashcards,
  Heading,
  Image,
  ImageHotspots,
  ImagePairing,
  ImageSequencing,
  ImageSlider,
  InformationWall,
  Lesson,
  MemoryGame,
  ParallaxSlideshow,
  Questionnaire,
  Summary,
  Video,
} from "../src";

const config = { xapi: { enabled: false } } as const;

function wrap(children: React.ReactNode) {
  return (
    <Course title="Blocks" courseId="blocks-tier-bcd" config={config}>
      <Lesson title="L1" lessonId="lesson-1">
        {children}
      </Lesson>
    </Course>
  );
}

describe("Tier B/C/D block components", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("Heading renders the requested level", () => {
    render(wrap(<Heading level={2} blockId="intro-heading">Section title</Heading>));
    expect(screen.getByRole("heading", { level: 2, name: "Section title" })).toBeDefined();
  });

  it("Image renders alt text", () => {
    render(wrap(<Image blockId="hero" src="/hero.png" alt="Warehouse floor" />));
    expect(screen.getByAltText("Warehouse floor")).toBeDefined();
  });

  it("Video renders title and player", () => {
    render(
      wrap(
        <Video blockId="intro-video" src="/clip.mp4" title="Safety clip" />,
      ),
    );
    expect(screen.getByTestId("video-title").textContent).toContain("Safety clip");
    expect(screen.getByTestId("video-player").getAttribute("src")).toBe("/clip.mp4");
  });

  it("Essay submits when minimum length is met", () => {
    render(
      wrap(
        <Essay checkId="essay-1" question="Describe the hazard." minLength={5} />,
      ),
    );
    fireEvent.change(screen.getByTestId("essay-textarea"), {
      target: { value: "Spill near exit" },
    });
    fireEvent.click(screen.getByTestId("essay-submit"));
    expect(screen.getByTestId("essay-submitted").textContent).toContain("submitted");
  });

  it("ArithmeticQuiz accepts correct answers", () => {
    render(
      wrap(
        <ArithmeticQuiz
          checkId="arith-1"
          problems={[
            { question: "2 + 2", answer: "4" },
            { question: "3 + 3", answer: "6" },
          ]}
        />,
      ),
    );
    fireEvent.change(screen.getByTestId("arithmetic-answer-0"), { target: { value: "4" } });
    fireEvent.change(screen.getByTestId("arithmetic-answer-1"), { target: { value: "6" } });
    fireEvent.click(screen.getByTestId("arithmetic-check"));
    expect(screen.getByTestId("arithmetic-feedback").textContent).toContain("Correct");
  });

  it("ArithmeticQuiz reports incorrect answers", () => {
    render(
      wrap(
        <ArithmeticQuiz
          checkId="arith-wrong"
          problems={[{ question: "2 + 2", answer: "4" }]}
        />,
      ),
    );
    fireEvent.change(screen.getByTestId("arithmetic-answer-0"), { target: { value: "5" } });
    fireEvent.click(screen.getByTestId("arithmetic-check"));
    expect(screen.getByTestId("arithmetic-feedback").textContent).toContain("Try again");
  });

  it("FindMultipleHotspots marks correct selections", () => {
    render(
      wrap(
        <FindMultipleHotspots
          checkId="fmh-1"
          src="/scene.png"
          alt="Scene"
          targets={[
            { id: "a", label: "Hazard A", x: 10, y: 10 },
            { id: "b", label: "Hazard B", x: 50, y: 50 },
          ]}
          correctTargetIds={["a", "b"]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("target-a"));
    fireEvent.click(screen.getByTestId("target-b"));
    fireEvent.click(screen.getByTestId("check-hotspots"));
    expect(screen.getByRole("status").textContent).toContain("Correct");
  });

  it("Summary accepts correct statement order", () => {
    render(
      wrap(
        <Summary
          checkId="summary-1"
          statements={["First", "Second", "Noise"]}
          correct={["First", "Second"]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("summary-statement-0"));
    fireEvent.click(screen.getByTestId("summary-statement-1"));
    fireEvent.click(screen.getByTestId("summary-check"));
    expect(screen.getByTestId("summary-feedback").textContent).toContain("Correct");
  });

  it("Summary getScore reflects live selection before check", () => {
    const ref = createRef<import("@lessonkit/core").AssessmentHandle>();
    render(
      wrap(
        <Summary
          ref={ref}
          checkId="summary-live-score"
          statements={["First", "Second", "Noise"]}
          correct={["First", "Second"]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("summary-statement-0"));
    fireEvent.click(screen.getByTestId("summary-statement-1"));
    expect(ref.current?.getScore()).toBe(2);
  });

  it("ImageSequencing getScore reflects live order before check", () => {
    const ref = createRef<import("@lessonkit/core").AssessmentHandle>();
    render(
      wrap(
        <ImageSequencing
          ref={ref}
          checkId="seq-live"
          images={[
            { id: "step-1", src: "/1.png", alt: "Step 1" },
            { id: "step-2", src: "/2.png", alt: "Step 2" },
          ]}
          correctOrder={["step-1", "step-2"]}
        />,
      ),
    );
    expect(ref.current?.getScore()).toBe(2);
  });

  it("ArithmeticQuiz getScore reflects live answers before check", () => {
    const ref = createRef<import("@lessonkit/core").AssessmentHandle>();
    render(
      wrap(
        <ArithmeticQuiz
          ref={ref}
          checkId="arith-live"
          problems={[
            { question: "1 + 1", answer: "2" },
            { question: "2 + 2", answer: "4" },
          ]}
        />,
      ),
    );
    fireEvent.change(screen.getByTestId("arithmetic-answer-0"), { target: { value: "2" } });
    fireEvent.change(screen.getByTestId("arithmetic-answer-1"), { target: { value: "4" } });
    expect(ref.current?.getScore()).toBe(2);
  });

  it("ImageSequencing validates correct order", () => {
    render(
      wrap(
        <ImageSequencing
          checkId="seq-1"
          images={[
            { id: "step-1", src: "/1.png", alt: "Step 1" },
            { id: "step-2", src: "/2.png", alt: "Step 2" },
          ]}
          correctOrder={["step-1", "step-2"]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("image-sequencing-check"));
    expect(screen.getByTestId("image-sequencing-feedback").textContent).toContain("Correct");
  });

  it("ImagePairing renders the pairing grid", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(
      wrap(
        <ImagePairing
          checkId="pair-1"
          pairs={[
            { id: "p1", label: "Helmet", imageSrc: "/helmet.png" },
            { id: "p2", label: "Gloves", imageSrc: "/gloves.png" },
          ]}
        />,
      ),
    );
    expect(screen.getByTestId("image-pairing-grid")).toBeDefined();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("Flashcards flips to show the back", () => {
    render(
      wrap(
        <Flashcards
          blockId="flash-1"
          cards={[{ front: "Term", back: "Definition" }]}
        />,
      ),
    );
    expect(screen.getByTestId("flashcard-flip").textContent).toContain("Term");
    fireEvent.click(screen.getByTestId("flashcard-flip"));
    expect(screen.getByTestId("flashcard-flip").textContent).toContain("Definition");
  });

  it("DialogCards flips and navigates", () => {
    render(
      wrap(
        <DialogCards
          blockId="dialog-1"
          cards={[
            { front: "Hello", back: "Hi there" },
            { front: "Bye", back: "See you" },
          ]}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("dialog-card-flip"));
    expect(screen.getByTestId("dialog-card-flip").textContent).toContain("Hi there");
    fireEvent.click(screen.getByTestId("dialog-next"));
    expect(screen.getByText("Card 2 of 2")).toBeDefined();
  });

  it("ImageHotspots opens hotspot content", () => {
    render(
      wrap(
        <ImageHotspots
          blockId="hotspots-1"
          src="/map.png"
          alt="Floor plan"
          hotspots={[
            { id: "zone-a", label: "Zone A", x: 20, y: 30, content: <p>Zone A details</p> },
          ]}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Zone A" }));
    expect(screen.getByText("Zone A details")).toBeDefined();
  });

  it("ImageSlider advances to the next slide", () => {
    render(
      wrap(
        <ImageSlider
          blockId="slider-1"
          slides={[
            { src: "/1.png", alt: "Slide 1" },
            { src: "/2.png", alt: "Slide 2" },
          ]}
        />,
      ),
    );
    expect(screen.getByAltText("Slide 1")).toBeDefined();
    fireEvent.click(screen.getByTestId("slider-next"));
    expect(screen.getByAltText("Slide 2")).toBeDefined();
  });

  it("InformationWall filters panels by search query", () => {
    render(
      wrap(
        <InformationWall
          blockId="wall-1"
          panels={[
            { id: "p1", title: "Fire safety", body: "Extinguisher locations" },
            { id: "p2", title: "Ergonomics", body: "Desk setup tips" },
          ]}
        />,
      ),
    );
    fireEvent.change(screen.getByTestId("information-wall-search"), {
      target: { value: "fire" },
    });
    expect(screen.getByTestId("information-panel-p1")).toBeDefined();
    expect(screen.queryByTestId("information-panel-p2")).toBeNull();
  });

  it("MemoryGame reveals a card on click", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(
      wrap(
        <MemoryGame
          blockId="memory-1"
          pairs={[
            { id: "a", label: "Alpha" },
            { id: "b", label: "Beta" },
          ]}
        />,
      ),
    );
    const cards = screen.getAllByTestId(/^memory-card-/);
    fireEvent.click(cards[0]!);
    expect(cards[0]!.getAttribute("aria-pressed")).toBe("true");
  });

  it("ParallaxSlideshow navigates between slides", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as typeof window.matchMedia;
    render(
      wrap(
        <ParallaxSlideshow
          blockId="parallax-1"
          slides={[
            { title: "Slide one", body: "Body one" },
            { title: "Slide two", body: "Body two" },
          ]}
        />,
      ),
    );
    expect(screen.getByTestId("parallax-slide-title").textContent).toContain("Slide one");
    fireEvent.click(screen.getByTestId("parallax-next"));
    expect(screen.getByTestId("parallax-slide-title").textContent).toContain("Slide two");
  });

  it("Questionnaire submits field values", () => {
    render(
      wrap(
        <Questionnaire
          blockId="survey-1"
          fields={[{ id: "name", label: "Your name", type: "text" }]}
        />,
      ),
    );
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Alex" } });
    fireEvent.click(screen.getByTestId("questionnaire-submit"));
    expect(screen.getByTestId("questionnaire-submitted").textContent).toContain("Thank you");
  });
});
