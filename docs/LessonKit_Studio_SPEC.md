# LessonKit Studio — Technical Specification

# Overview

LessonKit Studio is a React-based visual authoring platform for creating learning experiences that export to:
- React/Vite applications
- LXPack packages
- SCORM
- xAPI
- cmi5
- standalone web builds

---

# Architecture

```text
+----------------------+
| LessonKit Studio UI  |
+----------------------+
           |
           v
+----------------------+
| Project Schema Layer |
+----------------------+
           |
           v
+----------------------+
| React Renderer       |
+----------------------+
           |
           v
+----------------------+
| LXPack Integration   |
+----------------------+
```

---

# Core Concepts

## Project

A LessonKit Studio project is a Git-backed directory containing:

```text
lessonkit.json
src/
assets/
themes/
```

---

## Schema

Projects are represented internally as JSON schema documents.

Example:

```json
{
  "schemaVersion": 1,
  "course": { "courseId": "my-course", "title": "My course" },
  "pages": [
    {
      "id": "lesson-1",
      "title": "Lesson one",
      "blocks": []
    }
  ]
}
```

Implementation reference: [`guides/studio/project-format-v1.md`](guides/studio/project-format-v1.md).

---

# Editor System

## Canvas

The visual editor renders:
- pages
- blocks
- layouts
- interactions

using real React components.

---

## Block Types

Initial block support:

- text
- heading
- image
- button
- input
- container
- quiz
- scenario
- checklist
- video

---

## Drag/Drop

Library recommendation:
- dnd-kit

Features:
- nested containers
- reorder support
- snap zones
- insertion previews

---

# State Management

Recommended:
- Zustand

Requirements:
- undo/redo
- patch history
- autosave
- schema validation

---

# Undo/Redo

## Immediate Undo

Editor-level undo stack:
- command-based
- patch-based
- in-memory

## Persistent History

Git commits generated:
- periodically
- on major actions
- on explicit save

---

# GitHub Integration

## Authentication

Recommended:
- GitHub App

Capabilities:
- create repositories
- clone templates
- commit changes
- branch management

---

## Project Sync

Studio should:
- pull latest project
- autosave changes
- push commits
- support branching

---

# Rendering System

## Live Preview

Projects render directly using:
- @lessonkit/react
- shared runtime components

The editor preview and exported app should share rendering logic.

---

# Code Generation

## Output Targets

### React/Vite

Generate:
- App.tsx
- components/
- assets/
- styles/

### LXPack

Generate:
- course.yaml
- lesson assets
- metadata
- package configuration

---

# AI Integration

## Supported Workflows

- lesson generation
- storyboard conversion
- quiz generation
- branching generation
- accessibility suggestions

---

# Accessibility Requirements

All generated experiences must:
- support keyboard navigation
- use semantic HTML
- support ARIA where appropriate
- pass WCAG-focused audits

---

# Theming

Support:
- global themes
- CSS variables
- component themes
- dark mode

---

# Autosave

Autosave requirements:
- debounce writes
- semantic commit grouping
- offline recovery support

---

# Schema Versioning

All projects require:

```json
{
  "schemaVersion": 1
}
```

Migration system required:
- v1 → v2 transforms
- validation before rendering
- normalization pipeline

---

# Desktop Support

## Preferred

Tauri desktop shell.

## Features

- local filesystem access
- offline editing
- local export
- local preview

---

# Hosting Model

## Hosted Web App

```text
lessonkit.app
```

## Local Dev Mode

```bash
npx lessonkit-studio dev
```

---

# Suggested Packages

```text
@lessonkit/studio-schema
@lessonkit/studio-builder
@lessonkit/studio-renderer
@lessonkit/studio-codegen
@lessonkit/studio-github
@lessonkit/studio-ai
@lessonkit/studio-ui
```

---

# Performance Goals

- fast canvas rendering
- instant undo/redo
- lazy-loaded blocks
- virtualized large page rendering

---

# Future Extensions

- multiplayer collaboration
- plugin API
- marketplace
- animation timeline editor
- visual branching graph
- AI design agents
- integrated LMS deployment
