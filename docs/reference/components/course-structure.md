# Course structure

## When to use

Every course is built from **`Course` → `Lesson` → blocks**. Use this shell for all lessons.

- **`Course`** — wraps `LessonkitProvider`, course title, and `courseId`.
- **`Lesson`** — sets the active lesson and emits lesson lifecycle telemetry.
- **`ProgressTracker`** — optional chrome that shows completion progress.

In production SPAs, mount **one active `Lesson` at a time** (route or step state). The demo shows the minimal happy path with a `Quiz` inside the lesson.

## Requirements

- `courseId`, `lessonId`, and assessment `checkId` values must be stable for packaging.
- Pass `config` on `Course` for telemetry, xAPI, and LMS bridge (disabled in docs demos).

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-course-structure

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/course-structure"
  title="Course structure component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/course-structure" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-course-structure

```tsx
<Course title="Security fundamentals" courseId="sec-fundamentals" config={courseConfig}>
  <ProgressTracker />
  <Lesson title="Phishing basics" lessonId="phishing-lesson">
    <Scenario blockId="intro">
      <Text>Mount one active Lesson at a time inside Course.</Text>
    </Scenario>
    <Quiz
      checkId="structure-quiz"
      question="Where should scored checks live?"
      choices={["Inside a Lesson, under Course", "Outside Course"]}
      answer="Inside a Lesson, under Course"
    />
  </Lesson>
</Course>
```
:::

:::{tab-item} AI prompt
:sync: component-course-structure

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Ensure the course shell matches this structure:

<Course title="Security fundamentals" courseId="sec-fundamentals" config={courseConfig}>
  <ProgressTracker />
  <Lesson title="Phishing basics" lessonId="phishing-lesson">
    <Scenario blockId="intro">
      <Text>Mount one active Lesson at a time inside Course.</Text>
    </Scenario>
    <Quiz
      checkId="structure-quiz"
      question="Where should scored checks live?"
      choices={["Inside a Lesson, under Course", "Outside Course"]}
      answer="Inside a Lesson, under Course"
    />
  </Lesson>
</Course>

Requirements:
- Import only from @lessonkit/react; use block types from block-catalog.v3.json.
- Keep existing courseId, lessonId, and navigation stable unless I ask to add a lesson.
- After edits, list changed files and what to verify in the browser (lessonkit dev).

Workflow tips: https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/prompting-and-workflows.html
```
:::

::::
<!-- try-it:end -->




















## See also

- [Components and hooks guide](../../guides/react-developers/components-and-hooks.md)
- [Identity reference](../identity.md)
- [`KnowledgeCheck`](quiz.md) is an alias of `Quiz`
