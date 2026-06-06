import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BlockId, CompoundHandle, CourseId } from "@lessonkit/core";
import { loadCompoundState, saveCompoundState } from "@lessonkit/core";
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
  if (!enabled || !courseId) return { currentTime: 0, completedCueIndices: [] as number[] };
  const saved = loadCompoundState(storage, courseId, blockId);
  if (!saved) return { currentTime: 0, completedCueIndices: [] as number[] };
  const meta = readInteractiveVideoMeta(saved.childStates);
  return meta ?? { currentTime: 0, completedCueIndices: [] as number[] };
}

const InteractiveVideoInner = forwardRef<
  CompoundHandle,
  InteractiveVideoProps & {
    blockId: BlockId;
    cues: CueElement[];
    index: number;
    setIndex: React.Dispatch<React.SetStateAction<number>>;
    persistEnabled: boolean;
    initialMeta: { currentTime: number; completedCueIndices: number[] };
  }
>(function InteractiveVideoInner(props, ref) {
  const { blockId, cues, index, setIndex, persistEnabled, initialMeta } = props;
  validateCompoundChildren("InteractiveVideo", cues);

  const { config, track, storage } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [completedCues, setCompletedCues] = useState<Set<number>>(
    () => new Set(initialMeta.completedCueIndices),
  );
  const [overlayActive, setOverlayActive] = useState(false);
  const firedCuesRef = useRef(new Set<number>(initialMeta.completedCueIndices));

  const sortedCues = useMemo(
    () => [...cues].sort((a, b) => (a.props.atSeconds ?? 0) - (b.props.atSeconds ?? 0)),
    [cues],
  );

  const { ctx } = useCompoundShell({
    courseId: config.courseId,
    compoundId: blockId,
    pageCount: sortedCues.length,
    index,
    setIndex,
    persistEnabled,
    ref,
    storage,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || initialMeta.currentTime <= 0) return;
    video.currentTime = initialMeta.currentTime;
  }, [initialMeta.currentTime]);

  const persistMeta = useCallback(() => {
    if (!persistEnabled || !config.courseId) return;
    const saved = loadCompoundState(storage, config.courseId, blockId);
    const base = saved ?? { schemaVersion: 1 as const, activePageIndex: index, childStates: {} };
    const childStates = { ...base.childStates };
    for (const [checkId, entry] of ctx?.getRegisteredHandles() ?? []) {
      if (entry.handle.getCurrentState) {
        childStates[checkId] = entry.handle.getCurrentState();
      }
    }
    const merged = mergeVideoMetaIntoState(
      { ...base, activePageIndex: index, childStates },
      {
        currentTime: videoRef.current?.currentTime ?? initialMeta.currentTime,
        completedCueIndices: [...completedCues],
      },
    );
    saveCompoundState(storage, config.courseId, blockId, merged);
  }, [persistEnabled, config.courseId, blockId, storage, index, ctx, completedCues, initialMeta.currentTime]);

  useEffect(() => {
    persistMeta();
  }, [index, completedCues, overlayActive, persistMeta]);

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

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || overlayActive) return;
    const t = video.currentTime;

    const blockSeek = mandatoryIncompleteBefore(t);
    if (blockSeek !== null && t > blockSeek + 0.5) {
      video.currentTime = blockSeek;
      return;
    }

    for (let i = 0; i < sortedCues.length; i++) {
      if (firedCuesRef.current.has(i)) continue;
      const cue = sortedCues[i];
      const at = cue.props.atSeconds ?? 0;
      if (t >= at) {
        firedCuesRef.current.add(i);
        video.pause();
        setIndex(i);
        setOverlayActive(true);
        if (lessonId) {
          track(
            "video_cue_reached",
            { blockId, cueIndex: i, atSeconds: at, cueLabel: cue.props.label },
            { lessonId },
          );
        }
        break;
      }
    }
  };

  const completeCue = () => {
    const cue = sortedCues[index];
    if (!cue) return;
    setCompletedCues((prev) => new Set([...prev, index]));
    setOverlayActive(false);
    if (lessonId) {
      track(
        "video_segment_completed",
        {
          blockId,
          segmentIndex: index,
          atSeconds: cue.props.atSeconds ?? 0,
          segmentLabel: cue.props.label,
        },
        { lessonId },
      );
    }
    videoRef.current?.play().catch(() => {});
  };

  const activeCue = sortedCues[index];

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
          {props.captions ? <track kind="captions" src={props.captions} /> : null}
        </video>
        {overlayActive && activeCue
          ? React.cloneElement(activeCue, {
              key: activeCue.key ?? index,
              hidden: false,
              cueIndex: index,
              parentType: "InteractiveVideo",
            })
          : null}
      </div>
      {overlayActive ? (
        <button type="button" data-testid="cue-continue" onClick={completeCue}>
          Continue video
        </button>
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
    }, [config.courseId, blockId, initialIndex]);

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
