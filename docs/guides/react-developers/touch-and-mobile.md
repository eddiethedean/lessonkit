# Touch and mobile (web)

LessonKit courses run in mobile and tablet browsers inside LMS shells and standalone SPAs. Framework **1.7+** adds touch-sized controls, pointer-based drag for assessment blocks, pick-and-place fallbacks on coarse-pointer devices, and shared compound navigation.

## Author setup

1. **Viewport meta** — included in the CLI template `index.html`:

   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   ```

2. **Base theme CSS** — import touch tokens and control sizing:

   ```css
   @import "@lessonkit/themes/base.css";
   ```

3. **Test on a real device** — emulate in DevTools, then verify in your LMS mobile player (iframe height and scroll differ from standalone).

## Coarse-pointer behavior

When `(pointer: coarse)` matches (typical phones/tablets):

| Block | Touch behavior |
| --- | --- |
| `DragAndDrop` | Pick-and-place hint; HTML5 drag disabled; pointer drag still supported |
| `DragTheWords` | Tap word → tap blank; enlarged word bank chips |
| `Quiz` / `TrueFalse` / `MultimediaChoice` | Full-width choice rows (`lk-quiz-choice`) |
| `SortParagraphs` / `ImageSequencing` | Up/Down icon buttons (44px min height) |
| `WordSearch` | Pointer drag selection; grid `touch-action: none` |
| `Summary` | Full-width statement buttons |
| `ImageHotspots` / `FindHotspot` / `FindMultipleHotspots` | 44px minimum hotspot targets |
| `SlideDeck` / `InteractiveBook` / `AssessmentSequence` / `SingleChoiceSet` | `CompoundNav` with `lk-button` Prev/Next |
| `ImageSlider` / `DialogCards` | Swipe or `lk-button` navigation |
| `Accordion` | Full-width `lk-accordion-trigger` sections |
| `GuessTheAnswer` / `Questionnaire` / `AudioRecorder` | `lk-button` actions; inputs at 16px+ |
| `Flashcards` / `DialogCards` / `MemoryGame` / `ImagePairing` | `lk-flip-card` / `lk-memory-card` min heights |

## Drag assessment blocks

**Desktop:** HTML5 drag plus keyboard pick-and-place (select item → activate target).

**Touch:** Tap an item to select it (`aria-pressed="true"`), then tap a target. Items can also be dragged with pointer capture where supported.

**Manifest / resume:** Serialized state still uses `keyboardItem` / `keyboardWord` keys for backward compatibility.

## Touch design tokens

Defined in `@lessonkit/themes/base.css`:

| Token | Default | Purpose |
| --- | --- | --- |
| `--lk-touch-target-min` | `2.75rem` (44px) | Minimum interactive control size |
| `--lk-touch-spacing` | `--lk-space-sm` | Gap between adjacent targets |

Shared classes: `.lk-button`, `.lk-quiz-choice`, `.lk-compound-nav`, `.lk-touch-hint`, `.lk-accordion-trigger`, `.lk-flip-card`, `.lk-memory-card`, `.lk-image-sequence-thumb`.

Override in your theme wrapper if your brand needs larger targets.

## LMS testing checklist

- [ ] Viewport meta present in packaged `index.html`
- [ ] `@lessonkit/themes/base.css` imported
- [ ] Complete one lesson per drag block type on iOS Safari and Android Chrome
- [ ] Verify SCORM/xAPI player scroll does not trap drag gestures
- [ ] Confirm quiz choices and compound Next/Prev are tappable without zoom

## Related

- [Theming and accessibility](theming-and-accessibility.md)
- [LMS Go-Live](lms-go-live.md)
- [Accessibility conformance](../../project/accessibility-conformance.md)
