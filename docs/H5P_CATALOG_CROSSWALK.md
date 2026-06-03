# H5P / block catalog crosswalk (LessonKit framework vs Studio)

Internal reference only — not a runtime dependency. Use when adding blocks to keep naming and H5P metadata aligned.

| Framework (`block-catalog.v3.json`) | Studio (`studio-block-catalog.v2.json`) | H5P-style name |
|-------------------------------------|----------------------------------------|----------------|
| Quiz | quiz | Question Set (MCQ) |
| TrueFalse | trueFalse | True/False |
| FillInTheBlanks | fillInTheBlanks | Fill in the Blanks |
| MarkTheWords | markTheWords | Mark the Words |
| DragTheWords | dragTheWords | Drag the Words |
| DragAndDrop | dragAndDrop | Drag and Drop |
| FindHotspot | findHotspot | Find the Hotspot |
| FindMultipleHotspots | findMultipleHotspots | Find Multiple Hotspots |
| InteractiveBook | interactiveBook | Interactive Book |
| AssessmentSequence | assessmentSequence | Question Set |
| Page | page | Course Presentation (page) |
| Accordion | accordion | Accordion |
| DialogCards | dialogCards | Dialog Cards |
| Flashcards | flashcards | Flashcards |
| ImageHotspots | imageHotspots | Image Hotspots |
| ImageSlider | imageSlider | Image Slider |

## Registry flags (Studio)

- `traverseChildren: true` — validation, codegen, renderer walk nested blocks.
- `editorNestable: true` — canvas/DnD allows dropping blocks inside (container, scenario only today).

Assessment kinds for LXPack export map via `blockRegistry.assessmentKind` → `collectAssessments`.
