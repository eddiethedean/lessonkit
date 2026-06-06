import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BlockId, CompoundHandle, CompoundResumeState } from "@lessonkit/core";
import { loadCompoundState } from "@lessonkit/core";
import { CompoundProvider, useCompoundRegistry } from "../compound/CompoundProvider";
import { useCompoundPersistence } from "../compound/useCompoundPersistence";
import {
  mergeBranchMetaIntoState,
  readBranchingScenarioMeta,
  sumChoiceScores,
  type BranchingScenarioMeta,
} from "../compound/useCompoundBranchShell";
import { choiceScoreKey } from "../compound/useCompoundBranchShell";
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
import { normalizeComponentId } from "../runtime/validateComponentId";
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
): BranchingScenarioMeta {
  if (!persistEnabled || !courseId) {
    return { activeNodeId: startNodeId, visitedNodeIds: [startNodeId] };
  }
  const saved = loadCompoundState(storage, courseId, blockId);
  if (!saved) return { activeNodeId: startNodeId, visitedNodeIds: [startNodeId] };
  const meta = readBranchingScenarioMeta(saved.childStates);
  if (!meta) return { activeNodeId: startNodeId, visitedNodeIds: [startNodeId] };
  return meta;
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
  metaRef.current = meta;

  const activeIndex = nodeIndexMap.get(meta.activeNodeId) ?? 0;
  const [index, setIndex] = useState(activeIndex);

  useEffect(() => {
    const nextIndex = nodeIndexMap.get(meta.activeNodeId) ?? 0;
    setIndex(nextIndex);
  }, [meta.activeNodeId, nodeIndexMap]);

  const visitedNodeIndices = useMemo(() => {
    const indices = new Set<number>();
    for (const nodeId of meta.visitedNodeIds) {
      const i = nodeIndexMap.get(nodeId);
      if (i !== undefined) indices.add(i);
    }
    return indices;
  }, [meta.visitedNodeIds, nodeIndexMap]);

  const transformState = useCallback(
    (state: CompoundResumeState) => mergeBranchMetaIntoState(state, metaRef.current),
    [],
  );

  useCompoundPersistence({
    courseId: config.courseId,
    compoundId: blockId,
    pageCount: nodes.length,
    index,
    setIndex,
    enabled: persistEnabled,
    storage,
    transformState,
  });

  useCompoundBranchHandle(ref, {
    activePageIndex: index,
    setActivePageIndex: setIndex,
    getRegisteredHandles: () => ctx?.getRegisteredHandles() ?? new Map(),
    pageCount: nodes.length,
    visitedNodeIndices,
    choiceScores: meta.choiceScores ?? {},
  });

  const activeNode = nodes[activeIndex];
  const isTerminal =
    Boolean(activeNode?.props.terminal) ||
    (activeNode ? !nodeHasChoices(activeNode) && meta.activeNodeId !== props.startNodeId : false);

  const visitedLabels = useMemo(
    () => meta.visitedNodeIds.map((id) => nodeLabels.get(id) ?? id),
    [meta.visitedNodeIds, nodeLabels],
  );

  useEffect(() => {
    if (!lessonId || !activeNode) return;
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
      if (lessonId) {
        track(
          "branch_selected",
          {
            blockId,
            fromNodeId: opts.fromNodeId,
            toNodeId: opts.toNodeId,
            label: opts.label,
            scoreWeight: opts.scoreWeight,
          },
          { lessonId },
        );
      }

      setMeta((prev) => {
        const choiceScores =
          opts.scoreWeight !== undefined
            ? { ...prev.choiceScores, [choiceScoreKey(opts.fromNodeId, opts.toNodeId)]: opts.scoreWeight }
            : prev.choiceScores;
        const visited = prev.visitedNodeIds.includes(opts.toNodeId)
          ? prev.visitedNodeIds
          : [...prev.visitedNodeIds, opts.toNodeId];
        return {
          activeNodeId: opts.toNodeId,
          visitedNodeIds: visited,
          choiceScores,
        };
      });
    },
    [blockId, lessonId, track],
  );

  const contextValue = useMemo(
    () => ({
      compoundBlockId: blockId,
      activeNodeId: meta.activeNodeId,
      visitedNodeIds: meta.visitedNodeIds,
      visitedLabels,
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
              {visitedLabels.map((label) => (
                <li key={label}>{label}</li>
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

    const initialMeta = useMemo(
      () => loadBranchMeta(storage, config.courseId, blockId, persistEnabled, startNodeId),
      [blockId, config.courseId, persistEnabled, startNodeId, storage],
    );

    const [metaSeed] = useState(initialMeta);
    const activeIndex = nodes.findIndex((n) => n.props.nodeId === metaSeed.activeNodeId);
    const [index, setIndex] = useState(activeIndex >= 0 ? activeIndex : 0);
    const setIndexStable = useCallback((i: number) => setIndex(i), []);

    return (
      <CompoundProvider activePageIndex={index} onActivePageIndexChange={setIndexStable}>
        <BranchingScenarioInner
          {...props}
          startNodeId={startNodeId}
          ref={ref}
          blockId={blockId}
          nodes={nodes}
          persistEnabled={persistEnabled}
          initialMeta={metaSeed}
        />
      </CompoundProvider>
    );
  },
);

setLessonkitBlockType(BranchingScenario, "BranchingScenario");
