import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import catalogJson from "../block-catalog.v1.json";
import catalogV3Json from "../block-catalog.v3.json";
import contractJson from "../block-contract.v1.json";
import identityContractJson from "@lessonkit/core/identity-contract.v1.json";
import telemetryCatalogJson from "@lessonkit/core/telemetry-catalog.v1.json";
import telemetryCatalogV2Json from "@lessonkit/core/telemetry-catalog.v2.json";
import telemetryCatalogV3Json from "@lessonkit/core/telemetry-catalog.v3.json";
import {
  BLOCK_CATALOG,
  buildBlockCatalog,
  buildBlockCatalogV1,
  blockCatalogVersion,
  getBlockCatalogEntry,
  type BlockCatalogEntryV2,
} from "../src/blockCatalog";
import {
  Course,
  KnowledgeCheck,
  Lesson,
  ProgressTracker,
  Quiz,
  Reflection,
  Scenario,
} from "../src";

const EXPORTED_BLOCK_TYPES_V1 = [
  "Course",
  "Lesson",
  "Scenario",
  "Quiz",
  "Reflection",
  "ProgressTracker",
] as const;

const EXPORTED_BLOCK_TYPES_V3 = [
  "Course",
  "Lesson",
  "Scenario",
  "Quiz",
  "KnowledgeCheck",
  "Reflection",
  "ProgressTracker",
  "TrueFalse",
  "MarkTheWords",
  "FillInTheBlanks",
  "DragTheWords",
  "DragAndDrop",
  "AssessmentSequence",
  "Text",
  "Heading",
  "Image",
  "Video",
  "Page",
  "InteractiveBook",
  "Slide",
  "SlideDeck",
  "TimedCue",
  "InteractiveVideo",
  "Summary",
  "ImagePairing",
  "ImageSequencing",
  "ArithmeticQuiz",
  "Essay",
  "Questionnaire",
  "MemoryGame",
  "InformationWall",
  "ParallaxSlideshow",
  "Accordion",
  "DialogCards",
  "Flashcards",
  "ImageHotspots",
  "ImageSlider",
  "FindHotspot",
  "FindMultipleHotspots",
  "BranchingScenario",
  "BranchNode",
  "BranchChoice",
  "Embed",
  "Chart",
  "Table",
  "ImageJuxtaposition",
  "Timeline",
  "ImageSequence",
  "Collage",
  "AudioRecorder",
  "CombinationLock",
  "QrContent",
  "Crossword",
  "WordSearch",
  "AdventCalendar",
  "GameMap",
  "MapStage",
  "MapExit",
] as const;

describe("@lessonkit/react block catalog", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it("block-catalog.v1.json matches buildBlockCatalog()", () => {
    const catalog = catalogJson as { schemaVersion: number; entries: ReturnType<typeof buildBlockCatalog> };
    expect(catalog.schemaVersion).toBe(blockCatalogVersion);
    expect(catalog.entries).toEqual(buildBlockCatalog({ version: 1 }));
  });

  it("BLOCK_CATALOG has an entry for every exported block type", () => {
    for (const type of EXPORTED_BLOCK_TYPES_V1) {
      expect(getBlockCatalogEntry(type, { version: 1 })).toBeDefined();
    }
    expect(getBlockCatalogEntry("KnowledgeCheck", { version: 1 })).toBe(
      getBlockCatalogEntry("Quiz", { version: 1 }),
    );
  });

  it("v3 catalog has an entry for every exported block component", () => {
    for (const type of EXPORTED_BLOCK_TYPES_V3) {
      expect(getBlockCatalogEntry(type, { version: 3 })).toBeDefined();
    }
    expect(getBlockCatalogEntry("KnowledgeCheck", { version: 3 })).toBe(
      getBlockCatalogEntry("Quiz", { version: 3 }),
    );
  });

  it("requiredIds and optionalIds align with identity-contract.v1.json", () => {
    const identity = identityContractJson as {
      requiredComponentIds: Record<string, string[]>;
      optionalComponentIds: Record<string, string[]>;
    };

    for (const entry of BLOCK_CATALOG) {
      const types = [entry.type, ...(entry.aliases ?? [])];
      for (const type of types) {
        const required = identity.requiredComponentIds[type];
        const optional = identity.optionalComponentIds[type];
        if (required) {
          expect(entry.requiredIds).toEqual(required);
        }
        if (optional) {
          expect(entry.optionalIds).toEqual(optional);
        }
      }
    }
  });

  it("telemetry.emits references valid telemetry catalog event names", () => {
    const telemetryNames = new Set(
      (telemetryCatalogJson as { entries: { name: string }[] }).entries.map((e) => e.name),
    );
    for (const entry of (telemetryCatalogV2Json as { entries: { name: string }[] }).entries) {
      telemetryNames.add(entry.name);
    }
    for (const entry of (telemetryCatalogV3Json as { entries: { name: string }[] }).entries) {
      telemetryNames.add(entry.name);
    }
    telemetryNames.add("assessment_answered");
    telemetryNames.add("assessment_completed");

    for (const entry of buildBlockCatalog({ version: 3 })) {
      for (const event of entry.telemetry.emits) {
        expect(telemetryNames.has(event)).toBe(true);
      }
    }
  });

  it("v2 catalog includes P0 assessment blocks with assessment_* telemetry", () => {
    const v2 = buildBlockCatalog({ version: 2 });
    expect(getBlockCatalogEntry("TrueFalse", { version: 2 })).toBeDefined();
    expect(getBlockCatalogEntry("FillInTheBlanks", { version: 2 })?.telemetry.emits).toContain(
      "assessment_completed",
    );
    expect(v2.length).toBeGreaterThan(BLOCK_CATALOG.length);
  });

  it("block-catalog.v3.json matches buildBlockCatalog({ version: 3 })", () => {
    const catalog = catalogV3Json as { schemaVersion: number; entries: ReturnType<typeof buildBlockCatalog> };
    expect(catalog.schemaVersion).toBe(3);
    expect(catalog.entries).toEqual(buildBlockCatalog({ version: 3 }));
  });

  it("v3 catalog includes compound blocks", () => {
    const book = getBlockCatalogEntry("InteractiveBook", { version: 3 }) as BlockCatalogEntryV2 | undefined;
    const page = getBlockCatalogEntry("Page", { version: 3 }) as BlockCatalogEntryV2 | undefined;
    const deck = getBlockCatalogEntry("SlideDeck", { version: 3 }) as BlockCatalogEntryV2 | undefined;
    const slide = getBlockCatalogEntry("Slide", { version: 3 }) as BlockCatalogEntryV2 | undefined;
    const accordion = getBlockCatalogEntry("Accordion", { version: 3 }) as BlockCatalogEntryV2 | undefined;
    expect(book?.compoundContract).toBe(true);
    expect(page?.allowedChildTypes).toContain("Text");
    expect(deck?.compoundContract).toBe(true);
    expect(deck?.h5pMachineName).toBe("H5P.CoursePresentation");
    expect(slide?.allowedChildTypes).toContain("TrueFalse");
    expect(slide?.allowedChildTypes).not.toContain("ProgressTracker");
    expect(accordion?.h5pMachineName).toBe("H5P.Accordion");
  });

  it("block-catalog.v1.json satisfies block-contract.v1.json shape", () => {
    const catalog = catalogJson as { schemaVersion: number; entries: unknown[] };
    const contract = contractJson as {
      required: string[];
      properties: { schemaVersion: { const: number } };
      $defs: { blockCatalogEntry: { required: string[] } };
    };

    expect(catalog.schemaVersion).toBe(contract.properties.schemaVersion.const);
    expect(Array.isArray(catalog.entries)).toBe(true);
    expect(catalog.entries.length).toBeGreaterThan(0);

    const entryRequired = contract.$defs.blockCatalogEntry.required;
    for (const entry of catalog.entries) {
      for (const key of entryRequired) {
        expect(entry).toHaveProperty(key);
      }
    }
  });

  it("getBlockCatalogEntry returns undefined for unknown types", () => {
    expect(getBlockCatalogEntry("UnknownBlock")).toBeUndefined();
  });

  it("buildBlockCatalogV1 matches version 1 builder", () => {
    expect(buildBlockCatalogV1()).toEqual(buildBlockCatalog({ version: 1 }));
  });

  it("smoke-renders core catalog block types in a minimal Course/Lesson tree", () => {
    render(
      <Course title="Catalog smoke" courseId="catalog-smoke" config={{ xapi: { enabled: false } }}>
        <ProgressTracker />
        <Lesson title="Lesson one" lessonId="lesson-one">
          <Scenario blockId="scenario-intro">
            <p>Scenario content</p>
          </Scenario>
          <Reflection blockId="reflection-notes" prompt="What did you learn?" />
          <Quiz
            checkId="quiz-one"
            question="Pick one"
            choices={["A", "B"]}
            answer="A"
          />
          <KnowledgeCheck
            checkId="check-one"
            question="Confirm"
            choices={["Yes"]}
            answer="Yes"
          />
        </Lesson>
      </Course>,
    );

    expect(document.querySelector('[aria-label="Catalog smoke"]')).toBeTruthy();
    expect(document.querySelector('[aria-label="Lesson one"]')).toBeTruthy();
    expect(document.querySelector('[aria-label="Scenario"]')).toBeTruthy();
    expect(document.querySelector('[aria-label="Reflection"]')).toBeTruthy();
    expect(document.querySelectorAll('[aria-label="Quiz"]')).toHaveLength(2);
    expect(document.querySelector('[aria-label="Progress"]')).toBeTruthy();
    expect(document.querySelector('[data-lk-block-id="scenario-intro"]')).toBeTruthy();
    expect(document.querySelector('[data-lk-check-id="quiz-one"]')).toBeTruthy();
  });
});
