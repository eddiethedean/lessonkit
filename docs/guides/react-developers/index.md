# React developer guides

:::{admonition} Who this is for
:class: tip

Developers comfortable with **React, TypeScript, and npm** who want full control of components, telemetry, theming, and LMS export.
:::

These guides assume you are comfortable with **React, TypeScript, and npm**. You will integrate LessonKit into apps you own or scaffold with the CLI.

(new-to-react)=
## New to React?

LessonKit courses are **React apps** (usually **Vite + TypeScript**). You do not need to be an expert, but you should understand components, props, state, and effects before you customize navigation or wire telemetry.

:::{admonition} Suggested learning order
:class: note

1. **JavaScript** (if rusty) — [MDN JavaScript guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
2. **React** — [react.dev Learn](https://react.dev/learn) (official tutorial)
3. **TypeScript** (basics) — [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
4. **Vite** (how `lessonkit dev` works) — [Vite Getting Started](https://vite.dev/guide/)
5. **LessonKit (new project)** — [Getting started in 5 minutes](getting-started-in-5-minutes.md) → [LMS Go-Live](lms-go-live.md) → [Production checklist](production-checklist.md) (appendix)
6. **LessonKit (existing Vite app only)** — [Quickstart — add to an existing Vite app](quickstart.md)
:::

### Curated resources

| Resource | What to focus on |
| --- | --- |
| [react.dev — Learn React](https://react.dev/learn) | Components, JSX, props, state, rendering lists, sharing state between components |
| [react.dev — Hooks reference](https://react.dev/reference/react) | `useState`, `useEffect`, `useMemo`, `useCallback` (used in LessonKit examples) |
| [react.dev — Thinking in React](https://react.dev/learn/thinking-in-react) | Breaking UI into components—same mindset as structuring lessons |
| [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) | Types on props, `useMemo` config objects, reading package APIs |
| [Vite guide](https://vite.dev/guide/) | Dev server, `npm run dev` / `npm run build`, project layout |
| [Node.js docs](https://nodejs.org/en/docs/guides) | Installing Node, running `npx`, workspace scripts |
| [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/basic_type_example) | Typing React components when TypeScript errors block you |

After the basics, skim our [components & hooks](components-and-hooks.md) guide and the [react-vite example](https://github.com/eddiethedean/lessonkit/tree/main/examples/react-vite) for patterns LessonKit expects (`Course`, `Lesson`, stable IDs).

:::{admonition} Prefer not to learn React?
:class: tip

Use the [Vibe coding guides](../vibe-coding/index.md) with an AI editor and the CLI—you can ship courses without studying React first.
:::

## What LessonKit gives you

- **Components** — `Course`, `Lesson`, `Scenario`, `Quiz`, `Reflection`, `ProgressTracker`
- **Runtime** — `LessonkitProvider` with progress, telemetry batching, xAPI client lifecycle
- **Packages** — `@lessonkit/core`, `@lessonkit/xapi`, `@lessonkit/themes`, `@lessonkit/accessibility`, `@lessonkit/lxpack`
- **Tooling** — `@lessonkit/cli` for init/dev/build/package and `lessonkit.json` as the packaging manifest

## Guide outline

### Start

| Topic | Page |
| --- | --- |
| Coming from H5P | [../h5p-for-lessonkit-authors.md](../h5p-for-lessonkit-authors.md) |
| Getting started (5 min) | [getting-started-in-5-minutes.md](getting-started-in-5-minutes.md) |
| Quickstart (existing Vite app) | [quickstart.md](quickstart.md) |
| Project structure | [project-structure.md](project-structure.md) |
| Components & hooks | [components-and-hooks.md](components-and-hooks.md) |
| Block cookbook | [block-cookbook.md](block-cookbook.md) |

### Ship

| Topic | Page |
| --- | --- |
| **LMS Go-Live (canonical)** | [lms-go-live.md](lms-go-live.md) |
| Backend proxy cookbook | [backend-proxy-cookbook.md](backend-proxy-cookbook.md) |
| Packaging & CLI | [packaging-and-cli.md](packaging-and-cli.md) |
| Deployment | [deployment-guide.md](deployment-guide.md) |
| LRS operations | [lrs-operations.md](lrs-operations.md) |
| Export parity | [export-parity.md](export-parity.md) |
| Troubleshooting | [troubleshooting.md](troubleshooting.md) |
| FAQ | [../faq.md](../faq.md) |
| Appendices | [first-lms-export.md](first-lms-export.md) · [ship-to-lms.md](ship-to-lms.md) · [production-checklist.md](production-checklist.md) |

### Advanced

| Topic | Page |
| --- | --- |
| Telemetry & xAPI | [telemetry-and-xapi.md](telemetry-and-xapi.md) |
| Theming & a11y | [theming-and-accessibility.md](theming-and-accessibility.md) |
| Multi-course patterns | [multi-course-patterns.md](multi-course-patterns.md) |
| Performance | [performance.md](performance.md) |
| Plugins | [plugin-cookbook.md](plugin-cookbook.md) |
| Monorepo | [contributing-to-the-monorepo.md](contributing-to-the-monorepo.md) |
| Adding a framework block | [adding-a-framework-block.md](adding-a-framework-block.md) |

## Identity requirements (0.5+)

- `courseId` required on `Course` / `LessonkitProvider`
- `lessonId` required on `Lesson`
- `checkId` required on `Quiz` / `KnowledgeCheck`

Align IDs with `lessonkit.json` and your LXPack descriptor. See [Identity reference](../../reference/identity.md).

## Other audience

Instructional designers using AI assistants should start with [Vibe coding guides](../vibe-coding/index.md).
