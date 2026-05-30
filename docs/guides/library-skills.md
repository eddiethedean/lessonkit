# Library Skills for AI agents

**Library Skills** ship portable `SKILL.md` packages so Cursor, Claude Code, and other Agent Skills–compatible tools load LessonKit expertise on demand instead of repeating long prompts every session.

Source: [`library-skills/`](https://github.com/eddiethedean/lessonkit/tree/main/library-skills) in the LessonKit repo (same pattern as [LXPack library skills](https://github.com/eddiethedean/lxpack/tree/main/library-skills)).

## Included skills

| Skill | Use when |
|-------|----------|
| **lessonkit-author** | Editing `App.tsx`, `lessonkit.json`, React blocks; `lessonkit dev` / `build` |
| **lessonkit-packaging** | LMS export — `lessonkit package --target …` (Node 20+) |
| **lessonkit-telemetry** | Tracking, xAPI, plugins, LXPack bridge |
| **lessonkit-migrate** | Upgrading from LessonKit 0.9.x to 1.0 |

## Install

From a clone of LessonKit (or your course repo if you vendor `library-skills/`):

```bash
# All projects on this machine
./library-skills/install.sh --global

# One course folder
./library-skills/install.sh --project --directory ~/courses/my-course

# LessonKit monorepo contributors
./library-skills/install.sh --project
```

| Scope | Paths |
|-------|--------|
| Global | `~/.cursor/skills/`, `~/.claude/skills/`, `~/.agents/skills/` |
| Project | `<project>/.cursor/skills/`, `<project>/.claude/skills/` |

Re-run after `git pull` to refresh skills.

## Requirements

- Node.js **18+** for dev/build; **20+** for `lessonkit package`
- `@lessonkit/cli` on `PATH` or via `npx @lessonkit/cli`
- An agent product that discovers `SKILL.md` files

## Vibe coding + skills

Combine **lessonkit-author** with the [vibe coding guides](vibe-coding/index.md): paste the starter context from `lessonkit-author/references/vibe-prompts.md` once per session, then let the agent load the skill when you mention `lessonkit.json`, packaging, or telemetry.

## LXPack-only courses

If you author in LXPack (`course.yaml`) rather than React, install [LXPack library skills](https://github.com/eddiethedean/lxpack/tree/main/library-skills) instead. LessonKit React courses still package through `@lessonkit/lxpack` — use **lessonkit-packaging** for the CLI workflow.
