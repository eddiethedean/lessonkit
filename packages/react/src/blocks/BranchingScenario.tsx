import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BlockId, CompoundHandle, CompoundResumeState } from "@lessonkit/core";
import { clampCompoundPageIndex, loadCompoundState } from "@lessonkit/core";
import { CompoundProvider, useCompoundRegistry } from "../compound/CompoundProvider";
import { useCompoundPersistence } from "../compound/useCompoundPersistence";
import {
  applyChoiceScoreUpdate,
  createInitialBranchMeta,
  mergeBranchMetaIntoState,
  readBranchingScenarioMeta,
  sanitizeBranchMeta,
  sumChoiceScores,
  type BranchingScenarioMeta,
} from "../compound/useCompoundBranchShell";
import { useCompoundBranchHandle } from "../compound/useCompoundBranchHandle";
import { BranchingScenarioProvider } from "../compound/useBranchingScenario";
import {
  buildNodeIndexMap,
  buildNodeLabels,
  nodeHasChoices,
  validateBranchGraphAtMount,
} from "../compound/validateBranchGraph";
import { validateCompoundChildren } from "../compound/validateChildren";
import { getLessonkitBlockType, setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { isDevEnvironment, normalizeComponentId } from "../runtime/validateComponentId";
import type { BranchNodeProps } from "./BranchNode";

export type BranchingScenarioProps = {
  blockId: BlockId;
  title: string;
  startNodeId: string;
  showPathScore?: boolean;
  showPathRecap?: boolean;
  children: React.ReactElement<BranchNodeProps> | React.ReactElement<BranchNodeProps>[];
};

function loadBranchMeta(
  storage: ReturnType<typeof useLessonkit>["storage"],
  courseId: string | undefined,
  blockId: BlockId,
  persistEnabled: boolean,
  startNodeId: string,
  nodeIndexMap: ReadonlyMap<string, number>,
  pageCount: number,
): BranchingScenarioMeta {
  const fallback = createInitialBranchMeta(startNodeId);
  if (!persistEnabled || !courseId || pageCount < 1) {
    return fallback;
  }
  const saved = loadCompoundState(storage, courseId, blockId);
  if (!saved) return fallback;
  const fromMeta = readBranchingScenarioMeta(saved.childStates);
  if (fromMeta) {
    return sanitizeBranchMeta(fromMeta, nodeIndexMap, startNodeId);
  }
  const nodeIds = [...nodeIndexMap.keys()];
  const clamped = clampCompoundPageIndex(saved.activePageIndex, pageCount);
  const nodeId = nodeIds[clamped] ?? startNodeId;
  return sanitizeBranchMeta(createInitialBranchMeta(nodeId), nodeIndexMap, startNodeId);
}

const BranchingScenarioInner = forwardRef<
  CompoundHandle,
  BranchingScenarioProps & {
    blockId: BlockId;
    nodes: React.ReactElement<BranchNodeProps>[];
    persistEnabled: boolean;
    initialMeta: BranchingScenarioMeta;
  }
>(function BranchingScenarioInner(props, ref) {
  const { blockId, nodes, persistEnabled, initialMeta } = props;
  validateCompoundChildren("BranchingScenario", nodes);
  validateBranchGraphAtMount(props.startNodeId, nodes);

  const { config, track, storage } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const ctx = useCompoundRegistry();

  const nodeIndexMap = useMemo(() => buildNodeIndexMap(nodes), [nodes]);
  const nodeLabels = useMemo(() => buildNodeLabels(nodes), [nodes]);

  const [meta, setMeta] = useState<BranchingScenarioMeta>(initialMeta);
  const metaRef = useRef(meta);
  const branchViewedRef = useRef(new Set<string>());

  const commitMeta = useCallback((next: BranchingScenarioMeta) => {
    metaRef.current = next;
    setMeta(next);
  }, []);

  const activeIndex = nodeIndexMap.get(meta.activeNodeId) ?? 0;

  const visitedNodeIndices = useMemo(() => {
    const indices = new Set<number>();
    for (const nodeId of meta.visitedNodeIds) {
      const i = nodeIndexMap.get(nodeId);
      if (i !== undefined) indices.add(i);
    }
    return indices;
  }, [meta.visitedNodeIds, nodeIndexMap]);

  const applyResumeState = useCallback(
    (state: CompoundResumeState) => {
      const fromMeta = readBranchingScenarioMeta(state.childStates);
      if (fromMeta) {
        commitMeta(sanitizeBranchMeta(fromMeta, nodeIndexMap, props.startNodeId));
        return;
      }
      const nodeIds = [...nodeIndexMap.keys()];
      const clamped = clampCompoundPageIndex(state.activePageIndex, nodes.length);
      const nodeId = nodeIds[clamped] ?? props.startNodeId;
      commitMeta(sanitizeBranchMeta(createInitialBranchMeta(nodeId), nodeIndexMap, props.startNodeId));
    },
    [commitMeta, nodeIndexMap, nodes.length, props.startNodeId],
  );

  const resetBranchMeta = useCallback(() => {
    commitMeta(createInitialBranchMeta(props.startNodeId));
    branchViewedRef.current = new Set();
  }, [commitMeta, props.startNodeId]);

  const transformState = useCallback(
    (state: CompoundResumeState) => mergeBranchMetaIntoState(state, metaRef.current),
    [],
  );

  const shouldIncludeChildState = useCallback(
    (_checkId: string, pageIndex: number | undefined) =>
      pageIndex !== undefined && visitedNodeIndices.has(pageIndex),
    [visitedNodeIndices],
  );

  useCompoundPersistence({
    courseId: config.courseId,
    compoundId: blockId,
    pageCount: nodes.length,
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
    setActivePageIndex: () => {},
    getRegisteredHandles: () => ctx?.getRegisteredHandles() ?? new Map(),
    pageCount: nodes.length,
    visitedNodeIndices,
    choiceScores: meta.choiceScores ?? {},
    meta,
    onResetMeta: resetBranchMeta,
    onApplyResumeState: applyResumeState,
  });

  const activeNode = nodes[activeIndex];
  const isTerminal =
    Boolean(activeNode?.props.terminal) ||
    (activeNode ? !nodeHasChoices(activeNode) && meta.activeNodeId !== props.startNodeId : false);

  const visitedLabels = useMemo(
    () =>
      meta.visitedNodeIds.map((id) => ({
        nodeId: id,
        label: nodeLabels.get(id) ?? id,
      })),
    [meta.visitedNodeIds, nodeLabels],
  );

  useEffect(() => {
    if (!lessonId || !activeNode) return;
    const dedupeKey = `${blockId}:${meta.activeNodeId}`;
    if (branchViewedRef.current.has(dedupeKey)) return;
    branchViewedRef.current.add(dedupeKey);
    track(
      "branch_node_viewed",
      {
        blockId,
        nodeId: meta.activeNodeId,
        nodeIndex: activeIndex,
        nodeTitle: activeNode.props.title,
      },
      { lessonId },
    );
  }, [activeIndex, activeNode, blockId, lessonId, meta.activeNodeId, track]);

  const navigateToNode = useCallback(
    (opts: { fromNodeId: string; toNodeId: string; label: string; scoreWeight?: number }) => {
      const toNodeId = normalizeComponentId(opts.toNodeId, "blockId");
      const fromNodeId = normalizeComponentId(opts.fromNodeId, "blockId");
      if (!nodeIndexMap.has(toNodeId)) {
        if (isDevEnvironment()) {
          console.warn(
            `[lessonkit] BranchingScenario: unknown targetNodeId "${toNodeId}" from "${fromNodeId}"`,
          );
        }
        return;
      }

      if (lessonId) {
        track(
          "branch_selected",
          {
            blockId,
            fromNodeId,
            toNodeId,
            label: opts.label,
            scoreWeight: opts.scoreWeight,
          },
          { lessonId },
        );
      }

      setMeta((prev) => {
        const choiceScores = applyChoiceScoreUpdate(
          prev.choiceScores,
          fromNodeId,
          toNodeId,
          opts.scoreWeight,
        );
        const visited = prev.visitedNodeIds.includes(toNodeId)
          ? prev.visitedNodeIds
          : [...prev.visitedNodeIds, toNodeId];
        const next = sanitizeBranchMeta(
          {
            activeNodeId: toNodeId,
            visitedNodeIds: visited,
            choiceScores,
          },
          nodeIndexMap,
          props.startNodeId,
        );
        metaRef.current = next;
        return next;
      });
    },
    [blockId, lessonId, nodeIndexMap, props.startNodeId, track],
  );

  const contextValue = useMemo(
    () => ({
      compoundBlockId: blockId,
      activeNodeId: meta.activeNodeId,
      visitedNodeIds: meta.visitedNodeIds,
      visitedLabels: visitedLabels.map((entry) => entry.label),
      navigateToNode,
      isTerminal,
      choicesLocked: false,
    }),
    [blockId, isTerminal, meta.activeNodeId, meta.visitedNodeIds, navigateToNode, visitedLabels],
  );

  const pathScore = ctx
    ? Array.from(ctx.getRegisteredHandles().values())
        .filter((h) => h.pageIndex !== undefined && visitedNodeIndices.has(h.pageIndex))
        .reduce((s, h) => s + h.handle.getScore(), 0) + sumChoiceScores(meta.choiceScores)
    : 0;
  const pathMaxScore = ctx
    ? Array.from(ctx.getRegisteredHandles().values())
        .filter((h) => h.pageIndex !== undefined && visitedNodeIndices.has(h.pageIndex))
        .reduce((s, h) => s + h.handle.getMaxScore(), 0) + sumChoiceScores(meta.choiceScores)
    : 0;

  return (
    <BranchingScenarioProvider value={contextValue}>
      <section aria-label={props.title} data-testid="branching-scenario" data-lk-block-id={blockId}>
        <h3>{props.title}</h3>
        {props.showPathScore && ctx ? (
          <p data-testid="branch-score">
            Score: {pathScore} / {pathMaxScore}
          </p>
        ) : null}
        {props.showPathRecap && isTerminal && meta.visitedNodeIds.length > 0 ? (
          <aside data-testid="branch-path-recap" aria-label="Your path">
            <h4>Your path</h4>
            <ol>
              {visitedLabels.map((entry) => (
                <li key={entry.nodeId}>{entry.label}</li>
              ))}
            </ol>
          </aside>
        ) : null}
        <div data-testid="branching-scenario-active-node">
          {nodes.map((node, i) => {
            const content = React.Children.map(node.props.children, (child) => {
              if (!React.isValidElement(child)) return child;
              if (getLessonkitBlockType(child.type) !== "BranchChoice") return child;
              return React.cloneElement(child as React.ReactElement<{ fromNodeId?: string }>, {
                fromNodeId: node.props.nodeId,
              });
            });
            return React.cloneElement(node, {
              key: node.key ?? node.props.nodeId,
              hidden: i !== activeIndex,
              nodeIndex: i,
              children: content,
            });
          })}
        </div>
      </section>
    </BranchingScenarioProvider>
  );
});

export const BranchingScenario = forwardRef<CompoundHandle, BranchingScenarioProps>(
  function BranchingScenario(props, ref) {
    const blockId = useMemo(
      () => normalizeComponentId(props.blockId, "blockId") as BlockId,
      [props.blockId],
    );
    const startNodeId = useMemo(
      () => normalizeComponentId(props.startNodeId, "blockId"),
      [props.startNodeId],
    );
    const nodes = React.Children.toArray(props.children).filter(
      React.isValidElement,
    ) as React.ReactElement<BranchNodeProps>[];
    const { config, storage } = useLessonkit();
    const persistEnabled = config.session?.persistCompoundState !== false;

    const nodeIndexMap = useMemo(() => buildNodeIndexMap(nodes), [nodes]);
    const hydrationKey = `${config.courseId ?? "no-course"}:${blockId}`;

    const initialMeta = useMemo(
      () => loadBranchMeta(storage, config.courseId, blockId, persistEnabled, startNodeId, nodeIndexMap, nodes.length),
      [blockId, config.courseId, nodeIndexMap, nodes.length, persistEnabled, startNodeId, storage],
    );

    const activeIndex = nodeIndexMap.get(initialMeta.activeNodeId) ?? 0;
    const setIndexStable = useCallback(() => {}, []);

    return (
      <CompoundProvider activePageIndex={activeIndex} onActivePageIndexChange={setIndexStable}>
        <BranchingScenarioInner
          key={hydrationKey}
          {...props}
          startNodeId={startNodeId}
          ref={ref}
          blockId={blockId}
          nodes={nodes}
          persistEnabled={persistEnabled}
          initialMeta={initialMeta}
        />
      </CompoundProvider>
    );
  },
);

setLessonkitBlockType(BranchingScenario, "BranchingScenario");
