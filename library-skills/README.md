# LessonKit Library Skills

[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

**Library Skills** are portable packages of instructions (and optional scripts) for AI coding agents: Claude Code, Cursor, Windsurf, Aider, Copilot, and others that support the [Agent Skills](https://agentskills.io) `SKILL.md` format.

LLMs do not know your project's current CLI flags, identity rules, or React block contracts. These skills act as **lazy-loaded expertise**: the agent reads a short `description` in frontmatter first, then loads the full `SKILL.md` (and `references/` only when needed) instead of pasting huge prompts every session.

**Human guides:** [Library Skills](https://lessonkit.readthedocs.io/en/latest/guides/library-skills/) · [Vibe coding](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/index.html) · [React developers](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/index.html) · [Documentation home](https://lessonkit.readthedocs.io/en/latest/).

## Included skills

| Skill | When the agent should use it |
|-------|------------------------------|
| **lessonkit-author** | Editing `src/App.tsx`, `lessonkit.json`, Course/Lesson/Quiz blocks; running `lessonkit dev` / `build` |
| **lessonkit-packaging** | Choosing SCORM/xAPI/cmi5 target and `lessonkit package` (Node 18+) |
| **lessonkit-telemetry** | Telemetry sinks, xAPI transport, plugins, LXPack bridge when packaged |
| **lessonkit-migrate** | Upgrading LessonKit 0.9.x projects to 1.0 APIs |

Each skill folder:

```text
skill-name/
  SKILL.md       # Required — YAML frontmatter + instructions
  references/    # Optional — deep docs loaded on demand
  scripts/       # Optional — deterministic helpers (build, package)
```

## Install

Full walkthrough: [Library Skills guide](https://lessonkit.readthedocs.io/en/latest/guides/library-skills/).

From the LessonKit repository (or a clone):

```bash
# Global — available in all projects (Cursor, Claude Code, ~/.agents/skills)
./library-skills/install.sh --global

# This repo only — for LessonKit contributors
./library-skills/install.sh --project

# A specific course project
./library-skills/install.sh --project --directory ~/courses/security-2026
```

Install locations:

| Scope | Paths |
|-------|--------|
| **Global** | `~/.cursor/skills/`, `~/.claude/skills/`, `~/.agents/skills/` |
| **Project** | `<course>/.cursor/skills/`, `<course>/.claude/skills/` |

Re-run install after `git pull` to refresh skills from upstream.

## Requirements

- Node.js **18+** for `lessonkit dev` / `build`; **20+** for `lessonkit package` — [CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html)
- Agent product that discovers `SKILL.md` (Cursor Skills, Claude Code skills, etc.)

## Related documentation

| Topic | Guide |
|-------|--------|
| Project layout | [Project structure](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/project-structure.html) |
| Components | [Components and hooks](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html) |
| LMS ZIP | [Packaging reference](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) |
| LXPack (underlying export) | [LXPack library skills](https://github.com/eddiethedean/lxpack/tree/main/library-skills) |

## License

Apache-2.0 — same as LessonKit.
