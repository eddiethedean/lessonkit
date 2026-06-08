import React, { useMemo, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type QrContentProps = {
  blockId: BlockId;
  payload: string;
  title?: string;
  revealLabel?: string;
  hiddenTitle?: string;
  hiddenBody?: string;
};

function buildQrSvgUrl(payload: string): string {
  const encoded = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}`;
}

export function QrContent(props: QrContentProps) {
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const [revealed, setRevealed] = useState(false);
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const qrSrc = buildQrSvgUrl(props.payload);

  const reveal = () => {
    setRevealed(true);
    track("qr_content_revealed", { blockId }, lessonId ? { lessonId } : undefined);
  };

  return (
    <section aria-label={props.title ?? "QR content"} data-lk-block-id={blockId} data-testid="qr-content">
      {props.title ? <h4>{props.title}</h4> : null}
      <img src={qrSrc} alt={`QR code for ${props.payload}`} width={180} height={180} data-testid="qr-image" />
      <p>
        <code>{props.payload}</code>
      </p>
      <button type="button" data-testid="qr-reveal" onClick={reveal}>
        {props.revealLabel ?? "Simulate scan"}
      </button>
      {revealed ? (
        <div data-testid="qr-hidden-content">
          {props.hiddenTitle ? <h5>{props.hiddenTitle}</h5> : null}
          {props.hiddenBody ? <p>{props.hiddenBody}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

setLessonkitBlockType(QrContent, "QrContent");
