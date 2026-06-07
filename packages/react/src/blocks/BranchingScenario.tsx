import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { BlockId, CompoundHandle, CompoundResumeState } from "@lessonkit/core";
import { clampCompoundPageIndex } from "@lessonkit/core";
import { CompoundProvider, useCompoundRegistry } from "../compound/CompoundProvider";
import { useCompoundPersistence } from "../compound/useCompoundPersistence";
import {
  applyChoiceScoreUpdate,
  BS_META_KEY,
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
  enableSolutionsButton?: boolean;
  children: React.ReactElement<BranchNodeProps> | React.ReactElement<BranchNodeProps>[];
};

const BranchingScenarioInner = forwardRef<
  CompoundHandle,
  BranchingScenarioProps & {
    blockId: BlockId;
    nodes: React.ReactElement<BranchNodeProps>[];
    persistEnabled: boolean;
    startNodeId: string;
  }
>(function BranchingScenarioInner(props, ref) {
  const { blockId, nodes, persistEnabled, startNodeId } = props;
  validateCompoundChildren("BranchingScenario", nodes);
  useLayoutEffect(() => {
    validateBranchGraphAtMount(startNodeId, nodes);
  }, [startNodeId, nodes]);

  const { config, track, storage } = useLessonkit();
  const lessonId = useEnclosingLessonId();
  const ctx = useCompoundRegistry();

  const nodeIndexMap = useMemo(() => buildNodeIndexMap(nodes), [nodes]);
  const nodeLabels = useMemo(() => buildNodeLabels(nodes), [nodes]);

  const maxChoiceWeightByNode = useMemo(() => {
    const map = new Map<string, number>();
    for (const node of nodes) {
      let maxWeight = 0;
      let hasScoredChoice = false;
      React.Children.forEach(node.props.children, (child) => {
        if (!React.isValidElement(child)) return;
        if (getLessonkitBlockType(child.type) !== "BranchChoice") return;
        const weight = (child.props as { scoreWeight?: number }).scoreWeight;
        if (weight !== undefined && Number.isFinite(weight)) {
          hasScoredChoice = true;
          maxWeight = Math.max(maxWeight, weight);
        }
      });
      if (hasScoredChoice) map.set(node.props.nodeId, maxWeight);
    }
    return map;
  }, [nodes]);

  const [meta, setMeta] = useState<BranchingScenarioMeta>(() => createInitialBranchMeta(startNodeId));
  const metaRef = useRef(meta);
  const branchViewedRef = useRef(new Set<string>());
  const legacyResumeWarnedRef = useRef(false);

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

  const syncBranchViewedRef = useCallback(
    (restoredMeta: BranchingScenarioMeta) => {
      const next = new Set<string>();
      for (const nodeId of restoredMeta.visitedNodeIds) {
        if (nodeId !== restoredMeta.activeNodeId) {
          next.add(`${blockId}:${nodeId}`);
        }
      }
      branchViewedRef.current = next;
    },
    [blockId],
  );

  const applyResumeState = useCallback(
    (state: CompoundResumeState) => {
      const fromMeta = readBranchingScenarioMeta(state.childStates);
      if (fromMeta) {
        const sanitized = sanitizeBranchMeta(fromMeta, nodeIndexMap, startNodeId);
        commitMeta(sanitized);
        syncBranchViewedRef(sanitized);
        return;
      }
      const hasChildCheckStates = Object.keys(state.childStates).some((k) => k !== BS_META_KEY);
      const clampedIndex = clampCompoundPageIndex(state.activePageIndex, nodes.length);
      const nodeAtIndex = nodes[clampedIndex];
      if (nodeAtIndex || hasChildCheckStates) {
        const nodeId = nodeAtIndex?.props.nodeId ?? startNodeId;
        const visitedNodeIds = [startNodeId];
        if (nodeId !== startNodeId) visitedNodeIds.push(nodeId);
        const legacyMeta = sanitizeBranchMeta(
          { activeNodeId: nodeId, visitedNodeIds, choiceScores: {} },
          nodeIndexMap,
          startNodeId,
        );
        commitMeta(legacyMeta);
        syncBranchViewedRef(legacyMeta);
        if (
          !legacyResumeWarnedRef.current &&
          isDevEnvironment() &&
          (hasChildCheckStates || state.activePageIndex !== 0)
        ) {
          legacyResumeWarnedRef.current = true;
          console.warn(
            "[lessonkit] BranchingScenario: legacy save without branch meta; restored via activePageIndex and child states",
          );
        }
        return;
      }
      if (
        !legacyResumeWarnedRef.current &&
        isDevEnvironment() &&
        (state.activePageIndex !== 0 || Object.keys(state.childStates).length > 0)
      ) {
        legacyResumeWarnedRef.current = true;
        console.warn(
          "[lessonkit] BranchingScenario: legacy save without branch meta; starting at startNodeId",
        );
      }
      const fresh = sanitizeBranchMeta(createInitialBranchMeta(startNodeId), nodeIndexMap, startNodeId);
      commitMeta(fresh);
      syncBranchViewedRef(fresh);
    },
    [commitMeta, nodeIndexMap, nodes, startNodeId, syncBranchViewedRef],
  );

  const resetBranchMeta = useCallback(() => {
    commitMeta(createInitialBranchMeta(startNodeId));
    branchViewedRef.current = new Set();
  }, [commitMeta, startNodeId]);

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

  const maxChoiceScoreOnPath = useMemo(() => {
    let sum = 0;
    for (const nodeId of meta.visitedNodeIds) {
      sum += maxChoiceWeightByNode.get(nodeId) ?? 0;
    }
    return sum;
  }, [maxChoiceWeightByNode, meta.visitedNodeIds]);

  useCompoundBranchHandle(ref, {
    activePageIndex: activeIndex,
    getRegisteredHandles: () => ctx?.getRegisteredHandles() ?? new Map(),
    visitedNodeIndices,
    choiceScores: meta.choiceScores ?? {},
    meta,
    maxChoiceScore: maxChoiceScoreOnPath,
    onResetMeta: resetBranchMeta,
    enableSolutionsButton: props.enableSolutionsButton,
  });

  const activeNode = nodes[activeIndex];
  const isTerminal =
    Boolean(activeNode?.props.terminal) ||
    (activeNode ? !nodeHasChoices(activeNode) && meta.activeNodeId !== startNodeId : false);

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

      const activeNodeId = metaRef.current.activeNodeId;
      if (fromNodeId !== activeNodeId) {
        if (isDevEnvironment()) {
          console.warn(
            `[lessonkit] BranchingScenario: navigateToNode from "${fromNodeId}" but active node is "${activeNodeId}"`,
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
          startNodeId,
        );
        metaRef.current = next;
        return next;
      });
    },
    [blockId, lessonId, nodeIndexMap, startNodeId, track],
  );

  const choicesLocked = isTerminal;

  const contextValue = useMemo(
    () => ({
      compoundBlockId: blockId,
      activeNodeId: meta.activeNodeId,
      visitedNodeIds: meta.visitedNodeIds,
      visitedLabels: visitedLabels.map((entry) => entry.label),
      navigateToNode,
      isTerminal,
      choicesLocked,
    }),
    [blockId, choicesLocked, isTerminal, meta.activeNodeId, meta.visitedNodeIds, navigateToNode, visitedLabels],
  );

  const pathScore = ctx
    ? Array.from(ctx.getRegisteredHandles().values())
        .filter((h) => h.pageIndex !== undefined && visitedNodeIndices.has(h.pageIndex))
        .reduce((s, h) => s + h.handle.getScore(), 0) + sumChoiceScores(meta.choiceScores)
    : 0;
  const pathMaxScore = ctx
    ? Array.from(ctx.getRegisteredHandles().values())
        .filter((h) => h.pageIndex !== undefined && visitedNodeIndices.has(h.pageIndex))
        .reduce((s, h) => s + h.handle.getMaxScore(), 0) + maxChoiceScoreOnPath
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
    const { config } = useLessonkit();
    const persistEnabled = config.session?.persistCompoundState !== false;

    const nodeIndexMap = useMemo(() => buildNodeIndexMap(nodes), [nodes]);
    const initialIndex = nodeIndexMap.get(startNodeId) ?? 0;
    const hydrationKey = `${config.courseId ?? "no-course"}:${blockId}`;
    const setIndexStable = useCallback(() => {}, []);

    return (
      <CompoundProvider activePageIndex={initialIndex} onActivePageIndexChange={setIndexStable}>
        <BranchingScenarioInner
          key={hydrationKey}
          {...props}
          startNodeId={startNodeId}
          ref={ref}
          blockId={blockId}
          nodes={nodes}
          persistEnabled={persistEnabled}
        />
      </CompoundProvider>
    );
  },
);

setLessonkitBlockType(BranchingScenario, "BranchingScenario");
