import {
  Course,
  Lesson,
  ProgressTracker,
  ThemeProvider,
} from "@lessonkit/react";
import { CourseTopbar, LessonIntro, SidebarLessons } from "../course-ui";
import { BlockLegend } from "./BlockLegend";
import type { ShowcaseShellProps } from "./types";

function ThemeToggle(props: {
  mode: "light" | "dark";
  onChange: (mode: "light" | "dark") => void;
}) {
  return (
    <div className="showcase-theme-toggle" role="group" aria-label="Theme mode">
      <button type="button" aria-pressed={props.mode === "light"} onClick={() => props.onChange("light")}>
        Light
      </button>
      <button type="button" aria-pressed={props.mode === "dark"} onClick={() => props.onChange("dark")}>
        Dark
      </button>
    </div>
  );
}

export function ShowcaseShell(props: ShowcaseShellProps) {
  const { meta, step, setStep, themeMode, setThemeMode, children } = props;
  const current = meta.lessons[step]!;
  const last = meta.lessons.length - 1;

  return (
    <ThemeProvider mode={themeMode} preset="brand">
      <div className={`lms-app lms-theme-showcase ${meta.themeClassName}`.trim()}>
        <Course title={meta.courseTitle} courseId={meta.courseId} config={meta.courseConfig}>
          <CourseTopbar
            title={meta.topbarTitle}
            subtitle={meta.subtitle}
            lessonCount={meta.lessons.length}
            estimate={meta.estimate}
            chips={
              <>
                <span className="lms-chip lms-chip--accent">{meta.frameworkChip}</span>
                <span className="lms-chip">{meta.secondaryChip}</span>
              </>
            }
          />

          <div className="lms-shell">
            <SidebarLessons
              lessons={meta.lessons}
              step={step}
              setStep={setStep}
              title={meta.sidebarTitle}
              footer={
                <>
                  <div className="lms-sidebar-footer">
                    <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(Math.min(last, step + 1))}
                      disabled={step === last}
                    >
                      Continue
                    </button>
                  </div>
                  <p className="showcase-sibling-hint">
                    Also try: <code>{meta.sibling.npmCommand}</code>
                  </p>
                  <ThemeToggle mode={themeMode} onChange={setThemeMode} />
                </>
              }
            />

            <main className="lms-main">
              <ProgressTracker />
              <LessonIntro type={current.type} title={current.title} duration={current.duration} />
              <BlockLegend blocks={current.blocks} />
              <Lesson title={current.title} lessonId={current.id}>
                {children}
              </Lesson>
            </main>
          </div>
        </Course>
      </div>
    </ThemeProvider>
  );
}
