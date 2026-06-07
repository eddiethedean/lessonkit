import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BlockId, CompoundHandle, CompoundResumeState, CourseId } from "@lessonkit/core";
import { loadCompoundState } from "@lessonkit/core";
import { CompoundProvider } from "../compound/CompoundProvider";
import { useCompoundInitialIndex, useCompoundShell } from "../compound/useCompoundShell";
import { mergeVideoMetaIntoState, readInteractiveVideoMeta } from "../compound/useCompoundVideoShell";
import { validateCompoundChildren } from "../compound/validateChildren";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";
import type { TimedCueProps } from "./TimedCue";

export type InteractiveVideoProps = {
  blockId: BlockId;
  title: string;
  src: string;
  poster?: string;
  captions?: string;
  showVideoScore?: boolean;
  children: React.ReactElement<TimedCueProps> | React.ReactElement<TimedCueProps>[];
};

type CueElement = React.ReactElement<TimedCueProps>;

function loadVideoMeta(
  storage: ReturnType<typeof useLessonkit>["storage"],
  courseId: CourseId | undefined,
  blockId: BlockId,
  enabled: boolean,
) {
  const empty = { currentTime: 0, completedCueIndices: [] as number[], firedCueIndices: [] as number[] };
  if (!enabled || !courseId) return empty;
  const saved = loadCompoundState(storage, courseId, blockId);
  if (!saved) return empty;
  const meta = readInteractiveVideoMeta(saved.childStates);
  return meta ?? empty;
}

function getCueChildCheckId(cue: CueElement): string | null {
  const child = React.Children.only(cue.props.children);
  if (!React.isValidElement(child)) return null;
  const props = child.props as { checkId?: string };
  if (typeof props.checkId !== "string") return null;
  return normalizeComponentId(props.checkId, "checkId");
}

function cueRequiresAnswer(cue: CueElement): boolean {
  return Boolean(cue.props.mustComplete && getCueChildCheckId(cue));
}

const InteractiveVideoInner = forwardRef<
  CompoundHandle,
  InteractiveVideoProps & {
    blockId: BlockId;
    cues: CueElement[];
    index: number;
    setIndex: React.Dispatch<React.SetStateAction<number>>;
    persistEnabled: boolean;
    initialMeta: { currentTime: number; completedCueIndices: number[]; firedCueIndices: number[] };
  }
>(function InteractiveVideoInner(props, ref) {
  const { blockId, cues, index, setIndex, persistEnabled, initialMeta } = props;
  validateCompoundChildren("InteractiveVideo", cues);

  const { config, track, storage } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastKnownTimeRef = useRef(initialMeta.currentTime);
  const completedCuesRef = useRef(new Set<number>(initialMeta.completedCueIndices));
  const [completedCues, setCompletedCues] = useState<Set<number>>(
    () => new Set(initialMeta.completedCueIndices),
  );
  const [overlayActive, setOverlayActive] = useState(false);
  const firedCuesRef = useRef(
    new Set<number>(
      initialMeta.firedCueIndices.length > 0
        ? initialMeta.firedCueIndices
        : initialMeta.completedCueIndices,
    ),
  );
  const resumeOverlayCheckedRef = useRef(false);

  const sortedCues = useMemo(
    () => [...cues].sort((a, b) => (a.props.atSeconds ?? 0) - (b.props.atSeconds ?? 0)),
    [cues],
  );

  useEffect(() => {
    completedCuesRef.current = completedCues;
  }, [completedCues]);

  const transformState = useCallback(
    (state: CompoundResumeState) => {
      const liveTime = videoRef.current?.currentTime;
      const currentTime = Math.max(
        lastKnownTimeRef.current,
        typeof liveTime === "number" && Number.isFinite(liveTime) ? liveTime : 0,
      );
      return mergeVideoMetaIntoState(state, {
        currentTime,
        completedCueIndices: [...completedCuesRef.current],
        firedCueIndices: [...firedCuesRef.current],
      });
    },
    [],
  );

  const { visibleIndex, ctx } = useCompoundShell({
    courseId: config.courseId,
    compoundId: blockId,
    pageCount: sortedCues.length,
    index,
    setIndex,
    persistEnabled,
    ref,
    storage,
    transformState,
  });

  const activeCue = sortedCues[visibleIndex];

  const cueCanContinue = useCallback(
    (cue: CueElement | undefined) => {
      if (!cue || !cueRequiresAnswer(cue)) return true;
      const checkId = getCueChildCheckId(cue);
      if (!checkId) return true;
      const entry = ctx?.getRegisteredHandles().get(checkId);
      if (!entry) return false;
      return entry.handle.getAnswerGiven();
    },
    [ctx],
  );

  const canContinueActiveCue = cueCanContinue(activeCue);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || initialMeta.currentTime <= 0) return;
    video.currentTime = initialMeta.currentTime;
  }, [initialMeta.currentTime]);

  useEffect(() => {
    if (resumeOverlayCheckedRef.current || sortedCues.length === 0) return;
    resumeOverlayCheckedRef.current = true;

    const hasSavedProgress =
      initialMeta.currentTime > 0 ||
      initialMeta.completedCueIndices.length > 0 ||
      (persistEnabled &&
        config.courseId &&
        loadCompoundState(storage, config.courseId, blockId) !== null);

    if (!hasSavedProgress) return;

    const video = videoRef.current;
    if (!video) return;

    const cue = sortedCues[visibleIndex];
    if (!cue || completedCues.has(visibleIndex)) return;

    setOverlayActive(true);
    video.pause();
    const at = cue.props.atSeconds ?? 0;
    if (video.currentTime < at) {
      video.currentTime = at;
    }
  }, [
    blockId,
    completedCues,
    config.courseId,
    index,
    visibleIndex,
    initialMeta.completedCueIndices.length,
    initialMeta.currentTime,
    persistEnabled,
    sortedCues,
    storage,
  ]);

  const mandatoryIncompleteBefore = useCallback(
    (time: number) => {
      for (let i = 0; i < sortedCues.length; i++) {
        const cue = sortedCues[i];
        if ((cue.props.atSeconds ?? 0) >= time) break;
        if (cue.props.mustComplete && !completedCues.has(i)) return cue.props.atSeconds ?? 0;
      }
      return null;
    },
    [sortedCues, completedCues],
  );

  const activateCue = useCallback(
    (i: number) => {
      const cue = sortedCues[i];
      if (!cue || firedCuesRef.current.has(i)) return;
      firedCuesRef.current.add(i);
      videoRef.current?.pause();
      setIndex(i);
      setOverlayActive(true);
      if (lessonId) {
        track(
          "video_cue_reached",
          { blockId, cueIndex: i, atSeconds: cue.props.atSeconds ?? 0, cueLabel: cue.props.label },
          { lessonId },
        );
      }
    },
    [blockId, lessonId, setIndex, sortedCues, track],
  );

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || overlayActive) return;
    const t = video.currentTime;
    lastKnownTimeRef.current = Math.max(lastKnownTimeRef.current, t);

    const blockSeek = mandatoryIncompleteBefore(t);
    if (blockSeek !== null && t > blockSeek + 0.5) {
      video.currentTime = blockSeek;
      return;
    }

    for (let i = 0; i < sortedCues.length; i++) {
      if (firedCuesRef.current.has(i)) continue;
      const at = sortedCues[i]?.props.atSeconds ?? 0;
      if (t >= at) {
        activateCue(i);
        break;
      }
    }
  };

  const completeCue = () => {
    const cue = sortedCues[visibleIndex];
    if (!cue || !cueCanContinue(cue)) return;
    setCompletedCues((prev) => {
      const next = new Set([...prev, visibleIndex]);
      completedCuesRef.current = next;
      return next;
    });
    setOverlayActive(false);
    if (lessonId) {
      track(
        "video_segment_completed",
        {
          blockId,
          segmentIndex: visibleIndex,
          atSeconds: cue.props.atSeconds ?? 0,
          segmentLabel: cue.props.label,
        },
        { lessonId },
      );
    }
    videoRef.current?.play().catch(() => {});
  };

  return (
    <section aria-label={props.title} data-testid="interactive-video" data-lk-block-id={blockId}>
      <h3>{props.title}</h3>
      {props.showVideoScore && ctx ? (
        <p data-testid="video-score">
          Score: {Array.from(ctx.getHandles().values()).reduce((s, h) => s + h.getScore(), 0)} /{" "}
          {Array.from(ctx.getHandles().values()).reduce((s, h) => s + h.getMaxScore(), 0)}
        </p>
      ) : null}
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          src={props.src}
          poster={props.poster}
          controls
          data-testid="interactive-video-player"
          onTimeUpdate={onTimeUpdate}
          onSeeking={() => {
            const video = videoRef.current;
            if (!video) return;
            const blockSeek = mandatoryIncompleteBefore(video.currentTime);
            if (blockSeek !== null && video.currentTime > blockSeek + 0.5) {
              video.currentTime = blockSeek;
            }
          }}
        >
          {props.captions ? (
            <track kind="captions" src={props.captions} srcLang="en" label="Captions" default />
          ) : null}
        </video>
      </div>
      <div data-testid="interactive-video-cues">
        {sortedCues.map((cue, i) =>
          React.cloneElement(cue, {
            key: cue.key ?? i,
            hidden: !overlayActive || i !== index,
            cueIndex: i,
            parentType: "InteractiveVideo",
          }),
        )}
      </div>
      {overlayActive ? (
        <>
          {activeCue?.props.mustComplete && !canContinueActiveCue ? (
            <p role="status" data-testid="cue-must-complete-hint">
              Complete the interaction to continue.
            </p>
          ) : null}
          <button
            type="button"
            data-testid="cue-continue"
            disabled={!canContinueActiveCue}
            aria-disabled={!canContinueActiveCue}
            onClick={completeCue}
          >
            Continue video
          </button>
        </>
      ) : null}
    </section>
  );
});

export const InteractiveVideo = forwardRef<CompoundHandle, InteractiveVideoProps>(
  function InteractiveVideo(props, ref) {
    const blockId = useMemo(
      () => normalizeComponentId(props.blockId, "blockId") as BlockId,
      [props.blockId],
    );
    const cues = React.Children.toArray(props.children).filter(
      React.isValidElement,
    ) as CueElement[];
    const { config, storage } = useLessonkit();
    const persistEnabled = config.session?.persistCompoundState !== false;

    const initialMeta = useMemo(
      () => loadVideoMeta(storage, config.courseId, blockId, persistEnabled),
      [storage, config.courseId, blockId, persistEnabled],
    );

    const initialIndex = useCompoundInitialIndex({
      courseId: config.courseId,
      compoundId: blockId,
      pageCount: cues.length,
      persistEnabled,
      storage,
    });

    const [index, setIndex] = useState(initialIndex);
    const setIndexStable = useCallback((i: number) => setIndex(i), []);

    useEffect(() => {
      setIndex(initialIndex);
    }, [config.courseId, blockId, initialIndex, cues.length]);

    return (
      <CompoundProvider activePageIndex={index} onActivePageIndexChange={setIndexStable}>
        <InteractiveVideoInner
          {...props}
          ref={ref}
          blockId={blockId}
          cues={cues}
          index={index}
          setIndex={setIndex}
          persistEnabled={persistEnabled}
          initialMeta={initialMeta}
        />
      </CompoundProvider>
    );
  },
);

setLessonkitBlockType(InteractiveVideo, "InteractiveVideo");
