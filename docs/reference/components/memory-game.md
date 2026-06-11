# MemoryGame

:::{admonition} H5P equivalent
:class: tip

**H5P Memory Game**
:::

## When to use

Use `MemoryGame` for **matching pairs** — terminology drills, icon/name association, or low-stakes recall. Self-score mode is optional; it is not an LMS-scored assessment by default.

## Requirements

- Provide `blockId` and an even-length `pairs` array (two cards per `id`).
- Emits `memory_card_flipped` interactions when tracking is enabled.

<!-- try-it:start -->
## Try it

```{include} _demo-notice.md
```

::::{tab-set}

:::{tab-item} Live demo
:sync: component-memory-game

```{raw} html
<iframe
  class="lk-demo-frame lk-component-demo-frame"
  src="../../_static/component-demos/index.html#/memory-game"
  title="MemoryGame component demo"
  loading="lazy"
></iframe>
<p class="lk-demo-links">
  <a href="../../_static/component-demos/index.html#/memory-game" target="_blank" rel="noopener noreferrer">Open demo in full tab</a>
</p>
```
:::

:::{tab-item} React
:sync: component-memory-game

```tsx
<MemoryGame
  blockId="security-memory"
  pairs={[
    { id: "mfa", label: "MFA" },
    { id: "phish", label: "Phishing" },
    { id: "vpn", label: "VPN" },
    { id: "soc", label: "SOC" },
  ]}
/>
```
:::

:::{tab-item} AI prompt
:sync: component-memory-game

Copy into Cursor, Copilot, or ChatGPT after the [vibe coding starter context](../../guides/vibe-coding/prompting-and-workflows.md#starter-context-block):

```text
Read lessonkit.json and src/App.tsx before editing.

Add a MemoryGame block (H5P-style: Memory Game) like this example inside the active <Lesson>:

<MemoryGame
  blockId="security-memory"
  pairs={[
    { id: "mfa", label: "MFA" },
    { id: "phish", label: "Phishing" },
    { id: "vpn", label: "VPN" },
    { id: "soc", label: "SOC" },
  ]}
/>

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

- [interactive-video example](../../examples/index.md) — uses `MemoryGame` alongside video blocks
