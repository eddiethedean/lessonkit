import React, { useEffect, useMemo, useRef, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type AudioRecorderProps = {
  blockId: BlockId;
  maxDurationSeconds?: number;
  consentLabel?: string;
};

function isRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined"
  );
}

export function AudioRecorder(props: AudioRecorderProps) {
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const [consented, setConsented] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const trackOpts = lessonId ? { lessonId } : undefined;
  const supported = isRecordingSupported();

  useEffect(
    () => () => {
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    },
    [playbackUrl],
  );

  const startRecording = async () => {
    if (!supported || !consented) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setPlaybackUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        track("audio_recording_completed", { blockId }, trackOpts);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      track("audio_recording_started", { blockId }, trackOpts);
      const maxMs = (props.maxDurationSeconds ?? 120) * 1000;
      window.setTimeout(() => {
        if (recorderRef.current?.state === "recording") {
          stopRecording();
        }
      }, maxMs);
    } catch {
      setError("Microphone access was denied or is unavailable.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  if (!supported) {
    return (
      <section data-lk-block-id={blockId} data-testid="audio-recorder-unsupported">
        <p>Audio recording is not supported in this browser.</p>
      </section>
    );
  }

  return (
    <section aria-label="Audio recorder" data-lk-block-id={blockId} data-testid="audio-recorder">
      <label>
        <input
          type="checkbox"
          checked={consented}
          data-testid="audio-recorder-consent"
          onChange={(event) => setConsented(event.target.checked)}
        />
        {props.consentLabel ?? "I consent to recording audio in this session (stored locally only)."}
      </label>
      <div>
        <button
          type="button"
          disabled={!consented || recording}
          data-testid="audio-recorder-start"
          onClick={() => void startRecording()}
        >
          Start recording
        </button>
        <button
          type="button"
          disabled={!recording}
          data-testid="audio-recorder-stop"
          onClick={stopRecording}
        >
          Stop
        </button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      {playbackUrl ? (
        <audio controls src={playbackUrl} data-testid="audio-recorder-playback">
          <track kind="captions" />
        </audio>
      ) : null}
    </section>
  );
}

setLessonkitBlockType(AudioRecorder, "AudioRecorder");
