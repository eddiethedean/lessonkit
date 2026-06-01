import React from "react";
import type {
  StudioButtonBlock,
  StudioHeadingBlock,
  StudioImageBlock,
  StudioInputBlock,
  StudioTextBlock,
} from "@lessonkit-studio/schema";

const blockAttrs = (id: string) => ({
  "data-lk-studio-block": true,
  "data-lk-block-id": id,
});

export function TextBlock({ block }: { block: StudioTextBlock }) {
  return (
    <p className="lk-studio-text" {...blockAttrs(block.id)}>
      {block.text}
    </p>
  );
}

export function HeadingBlock({ block }: { block: StudioHeadingBlock }) {
  const Tag = (`h${block.level}` as "h1" | "h2" | "h3");
  return (
    <Tag className="lk-studio-heading" {...blockAttrs(block.id)}>
      {block.text}
    </Tag>
  );
}

export function ImageBlock({ block }: { block: StudioImageBlock }) {
  return (
    <img
      className="lk-studio-image"
      src={block.src}
      alt={block.alt}
      {...blockAttrs(block.id)}
    />
  );
}

export function ButtonBlock({ block }: { block: StudioButtonBlock }) {
  if (block.href) {
    return (
      <a className="lk-studio-button" href={block.href} {...blockAttrs(block.id)}>
        {block.label}
      </a>
    );
  }
  return (
    <button type="button" className="lk-studio-button" {...blockAttrs(block.id)}>
      {block.label}
    </button>
  );
}

export function InputBlock({ block }: { block: StudioInputBlock }) {
  const inputId = `lk-studio-input-${block.id}`;
  return (
    <div className="lk-studio-input" {...blockAttrs(block.id)}>
      <label htmlFor={inputId}>{block.label}</label>
      <input
        id={inputId}
        type={block.inputType ?? "text"}
        placeholder={block.placeholder}
        name={block.id}
      />
    </div>
  );
}

export function ContainerBlock({
  block,
  children,
}: {
  block: { id: string };
  children: React.ReactNode;
}) {
  return (
    <div className="lk-studio-container" {...blockAttrs(block.id)}>
      {children}
    </div>
  );
}
