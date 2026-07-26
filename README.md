# seventh-state

A rating vocabulary for claims that keeps **what is true** apart from **how it was framed** — and always leaves room for *"I don't know."*

Six faces on a die: two poles (true / false) × three colours (the frame you declare).
The **seventh state** is the die that has not landed.

---

## Why the axes must stay apart

Most rating systems collapse accuracy and desirability into one number — stars, a
percentage, a trust badge. The moment they are one number:

- moral approval leaks into believedness (*"it feels right, so it's true"*), and
  disapproval drags truth down;
- the evidential bar silently moves with how welcome a claim is — low for
  congenial claims, unreachable for uncomfortable ones;
- you can no longer say **true but repugnant** or **false but well-meant** — exactly
  the two cases a serious system most needs to flag;
- disconfirming a fact starts to feel like a moral attack, so beliefs stop being
  correctable, and disagreement reads as bad faith.

So this spec keeps the axes apart on purpose, and makes abstention a first-class
answer rather than a failure.

## The three axes

| axis | values | who may set it | what it is a property of |
|---|---|---|---|
| **Veracity** | `entailed` · `contradicted` · `unknown` | only an authority that can produce a proof | the **world** |
| **Spin** | `redshift` · `green` · `blueshift` | anyone — but always attributed | the **record and its author** |
| **Affect** *(optional)* | valence × arousal | anyone — always attributed | the **appraiser** |

**Spin is not morality.** It is the *declared intent* of whoever recorded the
claim: `blueshift` = spun toward, `redshift` = spun away, `green` = *"I claim no
spin."* Because it describes the recorder and not the world, it is attributed by
construction — which is precisely what makes it safe to store next to truth.

Note that `green` means **"I declare no spin,"** not **"this is objective."** Nobody
can certify their own neutrality; a claim of neutrality is just a third declared
frame, and it can be disputed like any other.

## The seventh state

Six faces is 2 poles × 3 apex colours. The seventh state is *no landing* — and it
is **required**, not optional:

> Absence of evidence is not evidence of absence.

`unknown` is both an **origin** and a **destination**. Knowledge is not monotonic:
we learn, but we also *un-learn*, and the un-learning must be as auditable as the
learning. A system that can only move forward (unknown → known) will lie the first
time one of its sources turns out to be rotten.

If abstention is harder to express than guessing, people will guess — and your
data is poisoned at the source. In any UI built on this vocabulary, **"I don't
know" must cost exactly one gesture, same as the others.**

## Evidence can die

A claim's support is not one thing. It decomposes into three questions that fail
*independently*:

| | question | fails through |
|---|---|---|
| **authenticity** | is the document what it claims to be? | forgery, tampering, fabricated citation |
| **fidelity** | did we read the claim out of it correctly? | OCR error, quote out of context, wrong span |
| **veracity of source** | is what the document says true? | the source was wrong, retracted, overturned |

A genuine document can state a falsehood. A forged document can happen to state a
truth. A true, authentic document can be misquoted. Systems that store provenance
as a bare string cannot tell these apart — and cannot revise.

So evidence here is a **first-class record with its own lifecycle and its own
clock**, and the fact→evidence link is a relation, not a field. Two consequences
fall out for free:

- discrediting one document reaches **every** claim resting on it, at once;
- **independence becomes countable** — three articles citing one press release are
  one witness, not three.

And the rule that matters most:

> When its evidence dies, a claim does **not** become false. It becomes
> **unwarranted**, and falls back to `unknown`.

Losing your warrant is not acquiring a counter-warrant. These two must never be
confused in output:

- **`contradicted`** — something says the opposite (*counter-evidence*);
- **`unknown` after warrant withdrawal** — our own source failed (*no evidence either way*).

## Mapping to the die

| die | axis | meaning |
|---|---|---|
| black pole (1) | veracity | `entailed` |
| white pole (0) | veracity | `contradicted` |
| **has not landed / zero-G** | veracity | **`unknown` — the seventh state** |
| red apex | spin | `redshift` — declared spin away |
| green apex | spin | `green` — *"I declare no spin"* |
| blue apex | spin | `blueshift` — declared spin toward |

The poles read as binary, not as intuition: **white is 0 (false), black is 1
(true)**. This is the die author's convention, and an earlier draft of this
spec had it inverted — hence the frozen test that pins it.

The geometry does work that would otherwise need enforcing in code: every face of
a triangular bipyramid is exactly one pole plus two colours, with the third colour
as apex — so a roll yields exactly one truth value and exactly one frame. You
cannot express "true and false at once," and you cannot express two frames at
once. The shape *is* the schema.

## Crowd input (captcha, polls, votes)

Crowds are decent at reading **spin** — a linguistic judgement — and poor at
establishing **truth**, where they import popularity and outrage. Therefore:

- crowd input MAY touch the spin axis; it MUST NOT touch the veracity axis;
- an aggregate is stored as a **fact about opinion, not about the topic**:
  *"in July 2026, n=4200, 63% read this as blueshift"* is a hard, datable,
  citable fact — about the crowd.

That framing is what keeps a captcha-style collector from quietly turning the
system into an opinion engine.

## What this is not

- **Not a truth oracle for the web.** No system can auto-rate the Internet
  true/false; for most claims the honest answer is `unknown`, and this vocabulary
  is built to say so out loud.
- **Not a morality scale.** The colour axis records declared framing, not good and evil.
- **Not a trust score.** There is deliberately no single number to sort by.

## Contents

```
SPEC.md                        normative specification
schema/rating.schema.json      one rating record
schema/evidence.schema.json    one piece of evidence, with its lifecycle
src/seventh-state.mjs          dependency-free reference implementation (browser + node)
src/seventh-state.d.ts         types
examples/                      worked examples, incl. evidence going bad
test.mjs                       self-check: node test.mjs
```

No build step, no dependencies. Drop the `.mjs` into a page and it runs.

## Credits and status

The die, the three colours and the redshift/blueshift metaphor come from **yoxi /
Magic Fairy Dice** by **Dr. Dan (Sapien Systems)** — <https://girltech.me/PR/>.

This repository contains **no yoxi code or assets**. It defines the data layer
underneath, and speaks to the yoxi UI through that project's own
`window.physixVoteOnRoll` hook. Bringing the dice UI itself into a shared package
is a separate, welcome step that needs an explicit licence grant from its author.

**Licence: not yet chosen** — all rights reserved for now. The intent is to open it
once the vocabulary is agreed with Dr. Dan.
