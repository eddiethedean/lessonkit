import {
  Accordion,
  DialogCards,
  Flashcards,
  Heading,
  ImageHotspots,
  ImageSlider,
  Text,
} from "@lessonkit/react";
import { WORKSPACE_MAP } from "../constants";

export function PlatformTourLesson() {
  return (
    <>
      <Heading blockId="tour-heading" level={2}>
        Platform tour
      </Heading>
      <Text>
        Explore presentation blocks introduced in LessonKit 1.2. Each section maps to an H5P-familiar pattern in
        the block catalog.
      </Text>

      <section className="showcase-section">
        <Heading blockId="tour-accordion-title" level={3}>
          Accordion
        </Heading>
        <Accordion
          blockId="atlas-features"
          sections={[
            {
              id: "sources",
              title: "Connected sources",
              content: (
                <Text>
                  Atlas ingests CRM, billing, and product telemetry. Only curated fields sync to analyst sandboxes.
                </Text>
              ),
            },
            {
              id: "governance",
              title: "Governance",
              content: (
                <Text>
                  Row-level policies travel with every export. Never bypass the vault when sharing outside Atlas.
                </Text>
              ),
            },
          ]}
        />
      </section>

      <section className="showcase-section">
        <Heading blockId="tour-dialog-title" level={3}>
          Dialog cards
        </Heading>
        <DialogCards
          blockId="atlas-faq"
          cards={[
            {
              front: "Who approves a new dashboard?",
              back: "Your workspace owner plus data governance review within two business days.",
            },
            {
              front: "Can I embed Atlas in Slack?",
              back: "Only through the approved read-only bot—never paste raw query links.",
            },
          ]}
        />
      </section>

      <section className="showcase-section">
        <Heading blockId="tour-flashcards-title" level={3}>
          Flashcards
        </Heading>
        <Flashcards
          blockId="atlas-glossary"
          selfScore
          cards={[
            { front: "Vault", back: "Encrypted storage for regulated exports." },
            { front: "Muster", back: "Incident channel where alert acknowledgments are logged." },
          ]}
        />
      </section>

      <section className="showcase-section">
        <Heading blockId="tour-hotspots-title" level={3}>
          Image hotspots
        </Heading>
        <ImageHotspots
          blockId="workspace-hotspots"
          src={WORKSPACE_MAP.src}
          alt={WORKSPACE_MAP.alt}
          hotspots={[
            {
              id: "widget-pii",
              label: "PII dashboard",
              x: 22,
              y: 38,
              content: <Text>Contains customer identifiers—mask before screenshots.</Text>,
            },
            {
              id: "widget-public",
              label: "Public KPIs",
              x: 78,
              y: 78,
              content: <Text>Safe for all-hands slides after weekly refresh.</Text>,
            },
          ]}
        />
      </section>

      <section className="showcase-section">
        <Heading blockId="tour-slider-title" level={3}>
          Image slider
        </Heading>
        <ImageSlider
          blockId="atlas-workflow"
          slides={[
            {
              src: "/images/slide-discovery.svg",
              alt: "Discover phase",
              caption: "Discover — connect and profile sources.",
            },
            {
              src: "/images/slide-model.svg",
              alt: "Model phase",
              caption: "Model — apply retention and masking rules.",
            },
            {
              src: "/images/slide-share.svg",
              alt: "Share phase",
              caption: "Share — publish through approved channels only.",
            },
          ]}
        />
      </section>
    </>
  );
}
