# Library Skills

Agent Skills ([`SKILL.md`](https://agentskills.io)) that teach AI coding assistants LessonKit conventions — CLI flags, identity rules, block contracts, and packaging.

**Guide:** [lessonkit.readthedocs.io/guides/library-skills](https://lessonkit.readthedocs.io/en/latest/guides/library-skills.html)

## Skills

| Skill | Use when |
| --- | --- |
| `lessonkit-author` | Editing `App.tsx`, `lessonkit.json`, Course/Lesson/Quiz blocks |
| `lessonkit-packaging` | Choosing LMS target, running `lessonkit package` |
| `lessonkit-telemetry` | Tracking sinks, xAPI transport, plugins, LXPack bridge |
| `lessonkit-migrate` | Upgrading 0.9.x projects to 1.0 |

## Install

```bash
./library-skills/install.sh --global              # all projects
./library-skills/install.sh --project           # this repo
./library-skills/install.sh --project -C ~/my-course
```

Installs to `~/.cursor/skills/`, `~/.claude/skills/`, or `<project>/.cursor/skills/`. Re-run after `git pull` to refresh.

## Requirements

Node.js **18+** for `lessonkit dev`, `build`, and `package`.

## License

Apache-2.0
