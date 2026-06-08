import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { BlockId, CompoundHandle, CompoundResumeState } from "@lessonkit/core";
import { clampCompoundPageIndex } from "@lessonkit/core";
import { CompoundProvider, useCompoundRegistry } from "../compound/CompoundProvider";
import { useCompoundPersistence } from "../compound/useCompoundPersistence";
import {
  applyExitScoreUpdate,
  createInitialMapMeta,
  mergeMapMetaIntoState,
  readGameMapMeta,
  sanitizeMapMeta,
  sumExitScores,
  type GameMapMeta,
} from "../compound/useCompoundMapShell";
import { useCompoundBranchHandle } from "../compound/useCompoundBranchHandle";
import { requireCompoundBlockIdWhenPersisting } from "../compound/requireCompoundBlockId";
import { GameMapProvider } from "../compound/useGameMap";
import {
  buildStageIndexMap,
  buildStageLabels,
  extractMapExitsFromStage,
  stageHasExits,
  validateMapGraphAtMount,
} from "../compound/validateMapGraph";
import { validateCompoundChildren } from "../compound/validateChildren";
import { getLessonkitBlockType, setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { isDevEnvironment, normalizeComponentId } from "../runtime/validateComponentId";
import { buildMediaOptions, resolveMediaSrc } from "./embedSecurity";
import type { MapStageProps } from "./MapStage";

export type GameMapProps = {
  blockId: BlockId;
  title: string;
  backgroundSrc: string;
  backgroundAlt?: string;
  startStageId: string;
  showMapScore?: boolean;
  enableSolutionsButton?: boolean;
  children: React.ReactElement<MapStageProps> | React.ReactElement<MapStageProps>[];
};

const GameMapInner = forwardRef<
  CompoundHandle,
  GameMapProps & {
    blockId: BlockId;
    stages: React.ReactElement<MapStageProps>[];
    persistEnabled: boolean;
    startStageId: string;
  }
>(function GameMapInner(props, ref) {
  const { blockId, stages, persistEnabled, startStageId } = props;
  validateCompoundChildren("GameMap", stages);
  useLayoutEffect(() => {
    validateMapGraphAtMount(startStageId, stages);
  }, [startStageId, stages]);

  const { config, track, storage } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const ctx = useCompoundRegistry();
  const resolvedBackground = resolveMediaSrc(props.backgroundSrc, buildMediaOptions(config));

  const stageIndexMap = useMemo(() => buildStageIndexMap(stages), [stages]);
  const stageLabels = useMemo(() => buildStageLabels(stages), [stages]);

  const [meta, setMeta] = useState<GameMapMeta>(() => createInitialMapMeta(startStageId));
  const metaRef = useRef(meta);
  const stageViewedRef = useRef(new Set<string>());

  const commitMeta = useCallback((next: GameMapMeta) => {
    metaRef.current = next;
    setMeta(next);
  }, []);

  const activeIndex = stageIndexMap.get(meta.activeStageId) ?? 0;

  const visitedStageIndices = useMemo(() => {
    const indices = new Set<number>();
    for (const stageId of meta.visitedStageIds) {
      const i = stageIndexMap.get(stageId);
      if (i !== undefined) indices.add(i);
    }
    return indices;
  }, [meta.visitedStageIds, stageIndexMap]);

  const applyResumeState = useCallback(
    (state: CompoundResumeState) => {
      const fromMeta = readGameMapMeta(state.childStates);
      if (fromMeta) {
        const sanitized = sanitizeMapMeta(fromMeta, stageIndexMap, startStageId);
        commitMeta(sanitized);
        return;
      }
      const clampedIndex = clampCompoundPageIndex(state.activePageIndex, stages.length);
      const stageAtIndex = stages[clampedIndex];
      const stageId = stageAtIndex?.props.stageId ?? startStageId;
      const visitedStageIds = [startStageId];
      if (stageId !== startStageId) visitedStageIds.push(stageId);
      commitMeta(sanitizeMapMeta({ activeStageId: stageId, visitedStageIds }, stageIndexMap, startStageId));
    },
    [commitMeta, stageIndexMap, stages, startStageId],
  );

  const resetMapMeta = useCallback(() => {
    commitMeta(createInitialMapMeta(startStageId));
    stageViewedRef.current = new Set();
  }, [commitMeta, startStageId]);

  const transformState = useCallback(
    (state: CompoundResumeState) => mergeMapMetaIntoState(state, metaRef.current),
    [],
  );

  const shouldIncludeChildState = useCallback(
    (_checkId: string, pageIndex: number | undefined) =>
      pageIndex !== undefined && visitedStageIndices.has(pageIndex),
    [visitedStageIndices],
  );

  useCompoundPersistence({
    courseId: config.courseId,
    compoundId: blockId,
    pageCount: stages.length,
    index: activeIndex,
    setIndex: () => {},
    enabled: persistEnabled,
    storage,
    transformState,
    onCompoundResume: applyResumeState,
    shouldIncludeChildState,
  });

  useCompoundBranchHandle(ref, {
    activePageIndex: activeIndex,
    getRegisteredHandles: () => ctx?.getRegisteredHandles() ?? new Map(),
    visitedNodeIndices: visitedStageIndices,
    choiceScores: meta.exitScores ?? {},
    meta: {
      activeNodeId: meta.activeStageId,
      visitedNodeIds: meta.visitedStageIds,
      choiceScores: meta.exitScores,
    },
    onResetMeta: resetMapMeta,
    enableSolutionsButton: props.enableSolutionsButton,
  });

  const activeStage = stages[activeIndex];
  const activeExits = useMemo(
    () => (activeStage ? extractMapExitsFromStage(activeStage) : []),
    [activeStage],
  );
  const reachableStageIds = useMemo(
    () => new Set(activeExits.map((exit) => exit.targetStageId)),
    [activeExits],
  );
  const isTerminal =
    Boolean(activeStage && !stageHasExits(activeStage)) && meta.activeStageId !== startStageId;

  useEffect(() => {
    if (!lessonId || !activeStage) return;
    const dedupeKey = `${blockId}:${meta.activeStageId}`;
    if (stageViewedRef.current.has(dedupeKey)) return;
    stageViewedRef.current.add(dedupeKey);
    track(
      "map_stage_viewed",
      {
        blockId,
        stageId: meta.activeStageId,
        stageIndex: activeIndex,
        stageLabel: activeStage.props.label,
      },
      { lessonId },
    );
  }, [activeIndex, activeStage, blockId, lessonId, meta.activeStageId, track]);

  const navigateToStage = useCallback(
    (opts: { fromStageId: string; toStageId: string; label: string; scoreWeight?: number }) => {
      const toStageId = normalizeComponentId(opts.toStageId, "blockId");
      const fromStageId = normalizeComponentId(opts.fromStageId, "blockId");
      if (!stageIndexMap.has(toStageId)) {
        if (isDevEnvironment()) {
          console.warn(`[lessonkit] GameMap: unknown targetStageId "${toStageId}"`);
        }
        return;
      }
      if (fromStageId !== metaRef.current.activeStageId) return;

      if (lessonId) {
        track(
          "map_exit_selected",
          {
            blockId,
            fromStageId,
            toStageId,
            label: opts.label,
            scoreWeight: opts.scoreWeight,
          },
          { lessonId },
        );
      }

      setMeta((prev) => {
        const exitScores = applyExitScoreUpdate(prev.exitScores, fromStageId, toStageId, opts.scoreWeight);
        const visited = prev.visitedStageIds.includes(toStageId)
          ? prev.visitedStageIds
          : [...prev.visitedStageIds, toStageId];
        const next = sanitizeMapMeta(
          { activeStageId: toStageId, visitedStageIds: visited, exitScores },
          stageIndexMap,
          startStageId,
        );
        metaRef.current = next;
        return next;
      });
    },
    [blockId, lessonId, stageIndexMap, startStageId, track],
  );

  const pathScore = ctx
    ? Array.from(ctx.getRegisteredHandles().values())
        .filter((h) => h.pageIndex !== undefined && visitedStageIndices.has(h.pageIndex))
        .reduce((s, h) => s + h.handle.getScore(), 0) + sumExitScores(meta.exitScores)
    : 0;
  const pathMaxScore = ctx
    ? Array.from(ctx.getRegisteredHandles().values())
        .filter((h) => h.pageIndex !== undefined && visitedStageIndices.has(h.pageIndex))
        .reduce((s, h) => s + h.handle.getMaxScore(), 0)
    : 0;

  const contextValue = useMemo(
    () => ({
      compoundBlockId: blockId,
      activeStageId: meta.activeStageId,
      visitedStageIds: meta.visitedStageIds,
      navigateToStage,
      exitsLocked: isTerminal,
    }),
    [blockId, isTerminal, meta.activeStageId, meta.visitedStageIds, navigateToStage],
  );

  return (
    <GameMapProvider value={contextValue}>
      <section aria-label={props.title} data-testid="game-map" data-lk-block-id={blockId}>
        <h3>{props.title}</h3>
        {props.showMapScore && ctx ? (
          <p data-testid="map-score">
            Score: {pathScore} / {pathMaxScore}
          </p>
        ) : null}
        <div className="lk-game-map-canvas" data-testid="game-map-canvas">
          {resolvedBackground ? (
            <img
              className="lk-game-map-background"
              src={resolvedBackground}
              alt={props.backgroundAlt ?? props.title}
            />
          ) : (
            <p role="alert" className="lk-game-map-blocked" data-testid="game-map-blocked">
              This map image URL is not allowed.
            </p>
          )}
          {stages.map((stage) => {
            const stageId = normalizeComponentId(stage.props.stageId, "blockId");
            const visited = meta.visitedStageIds.includes(stageId);
            const active = meta.activeStageId === stageId;
            const reachable = reachableStageIds.has(stageId);
            const exitLink = activeExits.find((exit) => exit.targetStageId === stageId);
            const canActivate = visited || reachable;
            return (
              <button
                key={stageId}
                type="button"
                className={[
                  "lk-game-map-marker",
                  active ? "lk-game-map-marker--active" : "",
                  visited ? "lk-game-map-marker--visited" : "",
                  reachable && !visited ? "lk-game-map-marker--reachable" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ left: `${stage.props.x}%`, top: `${stage.props.y}%` }}
                aria-current={active ? "true" : undefined}
                aria-label={
                  exitLink
                    ? `${stage.props.label ?? stageId} — ${exitLink.label}`
                    : (stage.props.label ?? stageId)
                }
                disabled={!canActivate}
                data-testid={`map-marker-${stageId}`}
                onClick={() => {
                  if (!canActivate) return;
                  if (reachable && !visited && exitLink) {
                    navigateToStage({
                      fromStageId: meta.activeStageId,
                      toStageId: stageId,
                      label: exitLink.label,
                      scoreWeight: exitLink.scoreWeight,
                    });
                    return;
                  }
                  setMeta((prev) => {
                    const next = sanitizeMapMeta(
                      { ...prev, activeStageId: stageId },
                      stageIndexMap,
                      startStageId,
                    );
                    metaRef.current = next;
                    return next;
                  });
                }}
              >
                {stage.props.label ?? stageId}
              </button>
            );
          })}
        </div>
        <div className="lk-game-map-active-stage" data-testid="game-map-active-stage">
          {stages.map((stage, i) => {
            const content = React.Children.map(stage.props.children, (child) => {
              if (!React.isValidElement(child)) return child;
              if (getLessonkitBlockType(child.type) !== "MapExit") return child;
              return React.cloneElement(child as React.ReactElement<{ fromStageId?: string }>, {
                fromStageId: stage.props.stageId,
              });
            });
            return React.cloneElement(stage, {
              key: stage.key ?? stage.props.stageId,
              hidden: i !== activeIndex,
              stageIndex: i,
              children: content,
            });
          })}
        </div>
        {isTerminal ? (
          <aside data-testid="map-path-recap" aria-label="Your path">
            <h4>Your path</h4>
            <ol>
              {meta.visitedStageIds.map((id) => (
                <li key={id}>{stageLabels.get(id) ?? id}</li>
              ))}
            </ol>
          </aside>
        ) : null}
      </section>
    </GameMapProvider>
  );
});

export const GameMap = forwardRef<CompoundHandle, GameMapProps>(function GameMap(props, ref) {
  const stages = React.Children.toArray(props.children).filter(
    React.isValidElement,
  ) as React.ReactElement<MapStageProps>[];
  const { config } = useLessonkit();
  const persistEnabled = config.session?.persistCompoundState !== false;

  requireCompoundBlockIdWhenPersisting({
    persistEnabled,
    blockId: props.blockId,
    componentName: "GameMap",
  });

  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const startStageId = useMemo(
    () => normalizeComponentId(props.startStageId, "blockId"),
    [props.startStageId],
  );

  const stageIndexMap = useMemo(() => buildStageIndexMap(stages), [stages]);
  const initialIndex = stageIndexMap.get(startStageId) ?? 0;
  const hydrationKey = `${config.courseId ?? "no-course"}:${blockId}`;
  const setIndexStable = useCallback(() => {}, []);

  return (
    <CompoundProvider activePageIndex={initialIndex} onActivePageIndexChange={setIndexStable}>
      <GameMapInner
        key={hydrationKey}
        {...props}
        startStageId={startStageId}
        ref={ref}
        blockId={blockId}
        stages={stages}
        persistEnabled={persistEnabled}
      />
    </CompoundProvider>
  );
});

setLessonkitBlockType(GameMap, "GameMap");
