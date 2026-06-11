import React, { useMemo, useState } from "react";
import type { BlockId } from "@lessonkit/core";
import { setLessonkitBlockType } from "../compound/blockType";
import { useLessonkit } from "../hooks";
import { useEnclosingLessonId } from "../lessonContext";
import { normalizeComponentId } from "../runtime/validateComponentId";

export type AdventDoor = {
  id: string;
  day: number;
  label: string;
  content: React.ReactNode;
};

export type AdventCalendarProps = {
  blockId: BlockId;
  doors: AdventDoor[];
  unlockFrom?: string;
};

function isDoorUnlocked(day: number, unlockFrom?: string): boolean {
  if (!unlockFrom) return true;
  const unlockDate = new Date(unlockFrom);
  if (Number.isNaN(unlockDate.getTime())) return true;
  const now = new Date();
  const unlockDay = unlockDate.getDate();
  const unlockMonth = unlockDate.getMonth();
  if (now.getMonth() !== unlockMonth) return now.getMonth() > unlockMonth;
  return now.getDate() >= unlockDay && day <= now.getDate() - unlockDay + 1;
}

export function AdventCalendar(props: AdventCalendarProps) {
  const blockId = useMemo(
    () => normalizeComponentId(props.blockId, "blockId") as BlockId,
    [props.blockId],
  );
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const { track } = useLessonkit();
  const lessonId = useEnclosingLessonId();

  const openDoor = (door: AdventDoor) => {
    if (!isDoorUnlocked(door.day, props.unlockFrom)) return;
    setOpened((prev) => new Set([...prev, door.id]));
    track(
      "advent_door_opened",
      { blockId, doorId: door.id, day: door.day },
      lessonId ? { lessonId } : undefined,
    );
  };

  return (
    <section aria-label="Advent calendar" data-lk-block-id={blockId} data-testid="advent-calendar">
      <div className="lk-advent-calendar-grid">
        {props.doors.map((door) => {
          const unlocked = isDoorUnlocked(door.day, props.unlockFrom);
          const isOpen = opened.has(door.id);
          return (
            <div key={door.id} data-testid={`advent-door-${door.id}`}>
              <button
                type="button"
                className="lk-button lk-advent-door-button"
                disabled={!unlocked}
                aria-expanded={isOpen}
                data-testid={`advent-door-button-${door.id}`}
                onClick={() => openDoor(door)}
              >
                {door.label}
              </button>
              {isOpen ? <div data-testid={`advent-door-content-${door.id}`}>{door.content}</div> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

setLessonkitBlockType(AdventCalendar, "AdventCalendar");
