import {
  Collage,
  Heading,
  ImageSequence,
  Table,
  Text,
  Timeline,
} from "@lessonkit/react";

export function ContentWaveLesson() {
  return (
    <>
      <Heading blockId="wave-intro" level={2}>
        1.6 content wave
      </Heading>
      <Text>Informational and media blocks shipped in framework 1.6.x minors.</Text>

      <Table
        blockId="wave-table"
        caption="Release waves"
        headers={["Minor", "Blocks"]}
        rows={[
          ["1.6.1", "Table, ImageJuxtaposition, Timeline"],
          ["1.6.2", "ImageSequence, Collage, AudioRecorder"],
        ]}
      />

      <Timeline
        blockId="wave-timeline"
        events={[
          {
            id: "ship-interchange",
            date: "2026-01-01",
            title: "1.6.0 interchange",
            body: "Portable .lkcourse export and block registry CLI.",
          },
          {
            id: "ship-waves",
            date: "2026-06-01",
            title: "1.6.x content waves",
            body: "Tier C–E blocks and GameMap compound.",
          },
        ]}
      />

      <ImageSequence
        blockId="wave-sequence"
        frames={[
          { src: "/images/slide-discovery.svg", alt: "Discovery", label: "Discover" },
          { src: "/images/slide-model.svg", alt: "Model", label: "Model" },
          { src: "/images/slide-share.svg", alt: "Share", label: "Share" },
        ]}
      />

      <Collage
        blockId="wave-collage"
        columns={2}
        cells={[
          { id: "c1", src: "/images/atlas-hero.svg", alt: "Atlas hero" },
          { id: "c2", src: "/images/workspace-map.svg", alt: "Workspace map" },
        ]}
      />
    </>
  );
}
