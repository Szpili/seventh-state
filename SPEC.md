# seventh-state — specification

Version 0.1.0 (draft). The key words MUST, MUST NOT, SHOULD and MAY are used in
the RFC 2119 sense.

---

## 1. Scope

This document defines a vocabulary and data model for rating **claims** and
**documents** along axes that are deliberately kept orthogonal, together with a
lifecycle for the **evidence** those ratings rest on.

It does not define how truth is established. It defines how a truth judgement,
once made by something entitled to make it, is recorded next to judgements of a
different kind without contaminating them.

### 1.1 Non-goals

- Automatic truth rating of arbitrary web content.
- A single aggregate score. There is intentionally no such field.
- Moral evaluation. The colour axis records declared framing, not good and evil.

---

## 2. Axis 1 — veracity

```
veracity ∈ { entailed, contradicted, unknown }
```

- `entailed` — supported by evidence that is currently warranted.
- `contradicted` — *counter*-evidence supports the opposite.
- `unknown` — no warranted evidence either way. **This is an answer, not a failure.**

Rules:

1. Veracity MUST be a closed enumeration. Implementations MUST NOT introduce a
   continuous score, a percentage, or a "confidence" field on this axis.
2. Veracity MAY only be set to `entailed` or `contradicted` by a rater of kind
   `authority` (§6.2) that supplies at least one evidence reference in `basis`.
3. Any other rater setting this axis MUST leave it `unknown` or omit it.
4. Veracity is a property of the world. It MUST NOT be derived from spin, affect,
   vote counts, agreement between raters, or the identity of whoever asserted it.

> Agreement is not evidence. Two raters concurring raises *research priority*,
> never veracity.

---

## 3. Axis 2 — spin

```
spin ∈ { redshift, green, blueshift }
```

The **declared intent of the recorder**, in the Doppler metaphor:

- `blueshift` — recorded with intent toward the subject (favourable framing);
- `redshift` — recorded with intent away from the subject (unfavourable framing);
- `green` — *"I declare no spin."*

Rules:

1. Spin MUST always carry a `rater` and an `at` timestamp. An unattributed spin
   value is invalid.
2. `green` MUST be interpreted as a *declared claim of neutrality*, not as
   established objectivity, and MUST be disputable like any other value.
3. Spin MUST NOT influence veracity, in either direction, at any point in a
   pipeline.
4. Spin MAY be absent. Absence means *not assessed* — implementations MUST NOT
   default it to `green`. Inventing a frame the rater did not declare is a
   fabrication.

---

## 4. Axis 3 — affect (optional)

```
affect = { valence: -1.0 … +1.0, arousal: 0.0 … 1.0, label?: string }
```

The emotional appraisal *of a named appraiser*, kept separate from spin because
"this makes me angry" and "I wrote this with hostile intent" are different
claims, made by different people, at different times.

Rules:

1. Affect MUST carry a rater and a timestamp.
2. Affect MUST NOT influence veracity. High arousal is not a truth signal, and
   outrage is not corroboration.

---

## 5. The seventh state

Six die faces enumerate 2 poles × 3 apex colours. The seventh state is *no
landing*: `veracity = unknown`.

1. Every conforming interface MUST offer `unknown` as an explicit, first-class
   choice, reachable in the same number of gestures as any other value.
2. `unknown` is both a starting state and a **reachable destination**: a claim
   that was `entailed` MUST be able to return to `unknown` when its warrant is
   withdrawn (§7.3).
3. A transition into `unknown` MUST record why (§7.4), so un-learning is as
   auditable as learning.

---

## 6. Records

### 6.1 Subject

What is being rated. Either a structured claim or a document:

```json
{ "kind": "claim",    "subject": "s", "relation": "r", "object": "o" }
{ "kind": "document", "uri": "https://…", "hash": "sha256:…" }
```

### 6.2 Rater

```json
{ "id": "…", "kind": "human | crowd | machine | authority", "display": "…" }
```

- `authority` — an entity able to produce a proof (e.g. a verified store).
  Only this kind may set veracity to `entailed` / `contradicted`.
- `crowd` — an aggregate. MUST carry `n`, and MUST NOT set veracity (§9).
- `machine` — a model or heuristic. MUST NOT set veracity; its output is a
  proposal for review.

### 6.3 Rating

```json
{
  "subject":  { … },
  "veracity": "entailed",
  "spin":     "green",
  "affect":   { "valence": -0.4, "arousal": 0.7 },
  "rater":    { "id": "weryta", "kind": "authority" },
  "at":       "2026-07-25T12:00:00Z",
  "basis":    ["ev:sha256:…#§3.1"],
  "note":     "free text"
}
```

`basis` MUST be non-empty when veracity is `entailed` or `contradicted`.

---

## 7. Evidence

### 7.1 Record

```json
{
  "id":          "ev:sha256:…#§3.1",
  "document":    { "hash": "sha256:…", "media_type": "application/pdf", "retrieved_from": "…" },
  "locator":     { "section": "§3.1", "page": 4, "span": [1180, 1246] },
  "quote":       "verbatim text",
  "obtained_at": "2026-05-02T09:14:00Z",
  "status":      "authentic",
  "valid":       { "from": "2021-01-01", "to": null },
  "history":     [ { "status": "…", "at": "…", "by": "…", "basis": "…" } ]
}
```

`valid` is the document's own validity **in the world**; `obtained_at` and
`history[].at` are *our* clock — when we came to believe something about it.
Evidence is therefore bitemporal in the same way facts are.

### 7.2 Status

```
status ∈ { unverified, authentic, disputed, retracted, forged, superseded }
```

Only `authentic` **warrants** a claim. Every other value withdraws warrant.

Each status maps to which of the three support questions failed:

| status | failed | meaning |
|---|---|---|
| `unverified` | — | obtained, not yet checked |
| `authentic` | none | is what it claims to be, read correctly |
| `disputed` | contested | someone credible challenges it; unresolved |
| `forged` | authenticity | not what it claims to be |
| `retracted` | veracity of source | genuine, but its issuer withdrew it |
| `superseded` | veracity of source, in time | replaced by a later version |

A **fidelity** failure (misquote, bad OCR, wrong span) is not a status change: the
evidence record itself is wrong and MUST be corrected or replaced, with the old
record kept in `history`.

### 7.3 Warrant

A claim is **warranted** at time *t* if at least one evidence in its `basis` has
status `authentic` and its `valid` interval contains *t*.

1. When a claim loses all warrant, its veracity MUST become `unknown`.
2. It MUST NOT become `contradicted`. Warrant withdrawal is not counter-evidence.
3. Evidence MUST NOT be deleted on status change. History is append-only.

### 7.4 Distinguishing the two silences

Output MUST let a reader tell these apart:

```
unknown  (never had evidence)          → "no evidence in this corpus"
unknown  (warrant withdrawn)           → "the evidence we had no longer holds: <reason>"
contradicted                           → "evidence supports the opposite"
```

Collapsing the first two into a bare "unknown" is conformant but lossy;
implementations SHOULD carry the reason.

### 7.5 Independence

Two evidence records are **independent** only if their `document.hash` values
differ *and* neither document derives from the other. Corroboration counts
independent evidence only. Three citations of one press release count as one.

---

## 8. Transitions

| from | to | requires |
|---|---|---|
| `unknown` | `entailed` / `contradicted` | ≥1 warranted evidence, rater kind `authority` |
| `entailed` | `contradicted` | counter-evidence — **not** withdrawal of existing evidence |
| `entailed` / `contradicted` | `unknown` | loss of all warrant (§7.3) |
| any | any | a recorded `at`, `by` and `basis` |

No transition may occur silently.

---

## 9. Crowd input

1. Crowd ratings MUST set `rater.kind = "crowd"` and carry `n`.
2. They MUST NOT set veracity.
3. An aggregate is stored as a claim **about opinion**, with its own timestamp and
   method — e.g. *"share of readers reading X as blueshift, n=4200, 2026-07"*. As
   such it is an ordinary, verifiable fact about a population, and MAY itself be
   `entailed` on the strength of the poll record.
4. Implementations SHOULD record collection method and known adversarial exposure
   (bots, brigading), since a crowd channel is adversarial by nature.

---

## 10. Conformance

An implementation conforms if:

1. it never lets spin or affect change veracity, in code or in aggregate;
2. it can represent, and round-trip, all six combinations of veracity ×
   spin — including *true + redshift* and *false + blueshift*;
3. `unknown` is representable, reachable in one gesture, and reachable **again**
   after a claim has been asserted;
4. every spin and affect value carries a rater and a timestamp;
5. evidence status changes propagate to warrant, and warrant loss lands in
   `unknown`, never in `contradicted`;
6. no aggregate single-score field is emitted.

A useful smoke test: if the system cannot express *"true, and framed against"* or
*"false, and framed in good faith"*, or if it cannot go back to *"I don't know"* —
it is not conformant, whatever else it does.
