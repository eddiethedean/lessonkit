# Library Skills

Agent Skills ([`SKILL.md`](https://agentskills.io)) that teach AI coding assistants LessonKit conventions — CLI flags, identity rules, block contracts, and packaging.

**Guide:** [lessonkit.readthedocs.io/guides/library-skills](https://lessonkit.readthedocs.io/en/latest/guides/library-skills.html)

## Skills

| Skill | Use when |
| --- | --- |
| `lessonkit-author` | Editing `App.tsx`, `lessonkit.json`, Course/Lesson/Quiz blocks |
| `lessonkit-packaging` | Choosing LMS target, running `lessonkit package` |
| `lessonkit-telemetry` | Tracking sinks, xAPI transport, plugins, LXPack bridge |
| `lessonkit-migrate` | Upgrading `@lessonkit/*` across versions (0.9.x through 1.6.x) |

## Install

**Without cloning the monorepo** (requires git):

```bash
curl -fsSL https://raw.githubusercontent.com/eddiethedean/lessonkit/main/library-skills/install-remote.sh | bash
```

**From this repo:**

```bash
./library-skills/install.sh --global              # all projects
./library-skills/install.sh --project           # this repo
./library-skills/install.sh --project -C ~/my-course
```

Installs to `~/.cursor/skills/`, `~/.claude/skills/`, or `<project>/.cursor/skills/`. Re-run after `git pull` to refresh.

## Requirements

Node.js **20.19+ recommended** for `npx @lessonkit/cli init` (Vite 8). Node **18+** minimum for `lessonkit dev`, `build`, and `package` in an existing course.

## License

Apache-2.0
