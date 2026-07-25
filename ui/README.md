# UI exploration — parked

Two attempts at the surface a person actually taps. Neither is adopted;
`main` carries only the spec, schema and reference implementation.

- **`v1-instrument.html`** — both axes on one screen, die as animated state
  indicator, live record panel, evidence-retraction demo. Too dense: it is a
  panel for someone who already knows the model, not a screen for a passer-by.
- **`v2-plain.html`** — one question only, no jargon on screen, three taps.
  Asks a crowd only what a crowd is good at (how a text is framed), leaves
  true/false to a reviewer holding the document. Closer, still not it.

## What is settled

- The technical vocabulary (`redshift` / `blueshift` / `green`, `entailed` /
  `contradicted`) is the **wire format**, never the interface language.
- Green reads as "approved" to a lay reader, so the neutral option is shown
  grey even though it stores as `green`.
- Abstention ("can't tell") stays a full-size control. If abstaining costs
  more than guessing, the data lies from day one.
- A crowd surface must not offer a truth verdict at all — see SPEC.md §9.

## What is not settled

The framing question itself. "Does it try to push you one way?" is still
abstract for someone who did not come here to think about framing, and the
three-way answer may be one choice too many for a captcha-speed interaction.
Worth reconsidering from the task, not from the vocabulary: what is the
smallest true thing a stranger can tell us in one tap?
