import React, { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { deriveId } from "@lessonkit/core";
import type { AssessmentBehaviour, BlockId, CompoundHandle } from "@lessonkit/core";
import { aggregateAssessmentScores } from "../compound/aggregateScores";
import { CompoundProvider, useCompoundHandlesVersion, useCompoundRegistry } from "../compound/CompoundProvider";
import { CompoundNav } from "../compound/CompoundNav";
import { useCompoundInitialIndex, useCompoundShell } from "../compound/useCompoundShell";
import { CompoundPageIndexProvider } from "../compound/CompoundPageIndexContext";
import { validateCompoundChildren } from "../compound/validateChildren";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { normalizeComponentId } from "../runtime/validateComponentId";
import { requireCompoundBlockIdWhenPersisting } from "../compound/requireCompoundBlockId";

export type SingleChoiceSetProps = AssessmentBehaviour & {
  children: React.ReactNode;
  blockId?: BlockId;
  title?: string;
  /** Show aggregated score for answered Quiz steps. */
  showSetScore?: boolean;
};

type SingleChoiceSetInnerProps = SingleChoiceSetProps & {
  compoundId: BlockId;
  childArray: React.ReactElement[];
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
  persistEnabled: boolean;
};

const SingleChoiceSetInner = forwardRef<CompoundHandle, SingleChoiceSetInnerProps>(
  function SingleChoiceSetInner(props, ref) {
    const { compoundId, childArray, index, setIndex, persistEnabled } = props;
    const { config } = useLessonkit();
    const registry = useCompoundRegistry();
    const handlesVersion = useCompoundHandlesVersion();

    const { visibleIndex, goNext, goPrev, progress } = useCompoundShell({
      courseId: config.courseId,
      compoundId,
      pageCount: childArray.length,
      index,
      setIndex,
      persistEnabled,
      ref,
      enableSolutionsButton: props.enableSolutionsButton,
    });

    validateCompoundChildren("SingleChoiceSet", props.children);

    const activeStepAnswered = useMemo(() => {
      if (!registry) return true;
      let handlesForStep = 0;
      for (const entry of registry.getRegisteredHandles().values()) {
        if (entry.pageIndex !== visibleIndex) continue;
        handlesForStep += 1;
        if (!entry.handle.getAnswerGiven()) return false;
      }
      if (handlesForStep === 0) {
        const child = childArray[visibleIndex];
        const childProps = child?.props as { checkId?: string } | undefined;
        if (child && typeof childProps?.checkId === "string") return false;
      }
      return true;
    }, [childArray, handlesVersion, registry, visibleIndex]);

    const setScore = useMemo(() => {
      if (!props.showSetScore || !registry) return null;
      return aggregateAssessmentScores(registry.getRegisteredHandles().values());
    }, [handlesVersion, props.showSetScore, registry]);

    return (
      <section
        aria-label={props.title ?? "Single choice set"}
        data-testid="single-choice-set"
        data-lk-block-id={compoundId}
      >
        {props.title ? <h3>{props.title}</h3> : null}
        <p>
          Question {progress.current} of {progress.total}
        </p>
        {props.showSetScore && setScore ? (
          <p data-testid="single-choice-set-score">
            Score: {setScore.score} / {setScore.maxScore}
          </p>
        ) : null}
        <div data-testid="single-choice-set-step">
          {childArray.map((child, i) => (
            <div key={child.key ?? i} hidden={i !== visibleIndex}>
              <CompoundPageIndexProvider pageIndex={i}>{child}</CompoundPageIndexProvider>
            </div>
          ))}
        </div>
        <CompoundNav
          ariaLabel="Single choice set navigation"
          prevTestId="single-choice-set-prev"
          nextTestId="single-choice-set-next"
          prevDisabled={visibleIndex === 0 || childArray.length === 0}
          nextDisabled={
            visibleIndex >= childArray.length - 1 ||
            childArray.length === 0 ||
            !activeStepAnswered
          }
          onPrev={goPrev}
          onNext={goNext}
        />
      </section>
    );
  },
);

export const SingleChoiceSet = forwardRef<CompoundHandle, SingleChoiceSetProps>(
  function SingleChoiceSet(props, ref) {
    const reactInstanceId = useId();
    const autoCompoundIdRef = useRef<BlockId | null>(null);
    if (!props.blockId && !autoCompoundIdRef.current) {
      autoCompoundIdRef.current = deriveId(`single-choice-set-${reactInstanceId}`) as BlockId;
    }
    const compoundId = useMemo(() => {
      if (props.blockId) {
        return normalizeComponentId(props.blockId, "blockId") as BlockId;
      }
      return (autoCompoundIdRef.current ?? deriveId(`single-choice-set-${reactInstanceId}`)) as BlockId;
    }, [props.blockId, reactInstanceId]);
    const childArray = React.Children.toArray(props.children).filter(
      React.isValidElement,
    ) as React.ReactElement[];
    const { config, storage } = useLessonkit();
    const persistEnabled = config.session?.persistCompoundState !== false;

    requireCompoundBlockIdWhenPersisting({
      persistEnabled,
      blockId: props.blockId,
      componentName: "SingleChoiceSet",
    });

    const initialIndex = useCompoundInitialIndex({
      courseId: config.courseId,
      compoundId,
      pageCount: childArray.length,
      persistEnabled,
      storage,
    });

    const [index, setIndex] = useState(initialIndex);
    const setIndexStable = useCallback((i: number) => setIndex(i), []);

    useEffect(() => {
      setIndex(initialIndex);
    }, [config.courseId, compoundId, initialIndex]);

    return (
      <CompoundProvider activePageIndex={index} onActivePageIndexChange={setIndexStable}>
        <SingleChoiceSetInner
          {...props}
          ref={ref}
          compoundId={compoundId}
          childArray={childArray}
          index={index}
          setIndex={setIndex}
          persistEnabled={persistEnabled}
        />
      </CompoundProvider>
    );
  },
);

setLessonkitBlockType(SingleChoiceSet, "SingleChoiceSet");
