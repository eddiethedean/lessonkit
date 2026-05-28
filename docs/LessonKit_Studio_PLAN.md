# LessonKit Studio — Plan Document

## Vision

LessonKit Studio is a visual learning experience builder built on top of the LessonKit and LXPack ecosystems.

The platform allows instructional designers, developers, and learning teams to visually create modern web-native learning experiences that export to real React applications and LMS-compatible packages.

LessonKit Studio combines:
- Visual drag-and-drop authoring
- React-native component architecture
- GitHub-backed project storage
- AI-assisted course generation
- LXPack export and packaging
- Modern accessibility and telemetry tooling

---

# Core Product Goals

## 1. Visual Authoring

Users can:
- Create pages and lessons visually
- Drag/drop components
- Edit layout and styling
- Configure quizzes and branching
- Preview interactions live

The visual editor should feel similar to:
- Figma
- Webflow
- Storyline
- Framer

But the output is real React projects.

---

## 2. React-Native Runtime

The builder itself is React-based.

All visual elements map directly to:
- LessonKit components
- React components
- Shared runtime blocks

This prevents duplication between:
- builder
- preview
- exported applications

---

## 3. GitHub-Native Storage

Projects are stored in GitHub repositories.

Users:
- Authenticate with GitHub
- Create/select repositories
- Commit changes automatically
- Use branching/version history
- Collaborate through Git workflows

Git becomes:
- storage layer
- version control layer
- collaboration layer
- backup layer

---

## 4. LXPack Integration

LessonKit Studio integrates directly with LXPack for:
- validation
- preview
- SCORM packaging
- xAPI packaging
- cmi5 packaging
- standalone web export

LessonKit Studio focuses on authoring while LXPack handles packaging/runtime concerns.

---

## 5. AI-Native Workflow

Users should be able to:
- generate lessons from prompts
- generate quizzes
- generate branching scenarios
- convert storyboards into courses
- refactor course structures with AI

The system should support:
- Claude
- Cursor
- GitHub Copilot
- future LLM integrations

---

# Product Positioning

## Core Position

"Modern React-native learning experience builder."

## Long-Term Position

"Open, AI-native alternative to traditional e-learning authoring platforms."

---

# Target Users

## Primary

- Instructional designers
- Learning experience designers
- Technical trainers
- Enterprise L&D teams

## Secondary

- Frontend developers
- LMS administrators
- Educational technology teams

---

# Core Architecture

```text
LessonKit Studio
├── Visual Builder
├── Project Schema
├── React Renderer
├── Live Preview
├── GitHub Sync
├── AI Layer
└── LXPack Export Integration
```

---

# MVP Scope

## Visual Editing

- Text blocks
- Headings
- Images
- Buttons
- Layout containers
- Forms
- Quizzes
- Navigation

## Builder Features

- Drag/drop
- Property editor
- Undo/redo
- Autosave
- Live preview

## Export

- React/Vite application
- Static HTML package
- LXPack course package

## Storage

- GitHub repository integration

---

# Non-MVP / Future Scope

- Real-time collaboration
- Timeline animation editor
- Video synchronization
- Advanced branching graph editor
- Marketplace/community templates
- Plugin ecosystem
- LMS cloud hosting
- AI course agents

---

# Suggested Ecosystem Layout

```text
lessonkit-studio/
├── apps/
│   ├── studio-web/
│   └── studio-desktop/
├── packages/
│   ├── schema/
│   ├── renderer/
│   ├── builder/
│   ├── codegen/
│   ├── github/
│   ├── ai/
│   └── ui/
```

---

# Technology Recommendations

## Frontend

- React
- TypeScript
- Vite
- Zustand
- dnd-kit
- Tailwind CSS

## Desktop Packaging

Preferred:
- Tauri

Alternative:
- Electron

## Backend

- Node.js
- Fastify or NestJS

## Storage

- GitHub App integration
- Repository-backed persistence

---

# Strategic Advantages

## Over Traditional Authoring Tools

- Open architecture
- React-native
- Git-native
- AI-friendly
- Developer extensibility
- Modern frontend ecosystem
- Real source code ownership

## Over Low-Code Builders

- LMS-aware
- xAPI-first
- accessibility-first
- learning-focused runtime

---

# Long-Term Vision

LessonKit Studio becomes:

- a visual learning application builder
- a Git-native instructional design platform
- a modern LMS publishing ecosystem
- an AI-assisted course generation platform
