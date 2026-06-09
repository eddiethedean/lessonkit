# GuessTheAnswer

:::{admonition} H5P equivalent
:class: tip

**H5P Guess the Answer**
:::

## When to use

Use `GuessTheAnswer` for **hidden-answer discovery** — learners reveal or type a short answer after a prompt. Set `scored={false}` for reveal-only interactions without LMS scoring.

Set `kind: "guessTheAnswer"` in `lessonkit.json` when packaging scored variants.

## Requirements

- `checkId` is required when `scored` is true (default).
- Props and telemetry: [block catalog — GuessTheAnswer](../block-catalog.md).

## See also

- [TrueFalse](true-false.md)
- [Block catalog](../block-catalog.md)
