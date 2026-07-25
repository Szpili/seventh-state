/**
 * seventh-state — reference implementation.
 *
 * Dependency-free ES module. Works in a browser (<script type="module">) and in
 * Node. No build step.
 *
 * The one invariant everything here exists to protect:
 *   spin and affect never change veracity, and losing evidence sends a claim to
 *   `unknown` — never to `contradicted`.
 */

export const VERACITY = /** @type {const} */ (['entailed', 'contradicted', 'unknown']);
export const SPIN = /** @type {const} */ (['redshift', 'green', 'blueshift']);
export const EVIDENCE_STATUS = /** @type {const} */ ([
  'unverified', 'authentic', 'disputed', 'retracted', 'forged', 'superseded',
]);

/** Only this status warrants a claim. Every other value withdraws warrant. */
export const WARRANTING_STATUS = 'authentic';

/** Why a rating holds — in particular, which of the two silences an `unknown` is. */
export const REASON = /** @type {const} */ ({
  NO_EVIDENCE: 'no-evidence',
  WARRANT_WITHDRAWN: 'warrant-withdrawn',
  COUNTER_EVIDENCE: 'counter-evidence',
  PROVED: 'proved',
});

// ---------------------------------------------------------------- the die ---

/**
 * Vertex indices of the triangular bipyramid, matching the yoxi toy.
 * Two poles carry the truth axis; three coloured tips carry the frame.
 */
export const VI = /** @type {const} */ ({ WHITE: 0, BLACK: 1, RED: 2, GREEN: 3, BLUE: 4 });

const APEX_TO_SPIN = { [VI.RED]: 'redshift', [VI.GREEN]: 'green', [VI.BLUE]: 'blueshift' };
const SPIN_TO_APEX = { redshift: VI.RED, green: VI.GREEN, blueshift: VI.BLUE };

/**
 * Map a yoxi roll record to the two axes.
 *
 * A roll that never landed (zero-G, or no record at all) is the seventh state:
 * `unknown`. That is an answer, not a missing value.
 *
 * A pure pole click carries no colour — the yoxi source is explicit that no RGB
 * is invented in that case — so spin comes back undefined rather than green.
 * Absent spin means "not assessed"; defaulting it to green would fabricate a
 * frame the rater never declared.
 *
 * @param {{whiteMode?: boolean, apexVi?: number, clickVote?: number}|null|undefined} roll
 * @returns {{veracity: string, spin?: string}}
 */
export function fromDieRoll(roll) {
  if (!roll) return { veracity: 'unknown' };
  const veracity = roll.whiteMode === true ? 'entailed'
    : roll.whiteMode === false ? 'contradicted'
      : 'unknown';
  const polePress = roll.clickVote === VI.WHITE || roll.clickVote === VI.BLACK;
  const spin = polePress ? undefined : APEX_TO_SPIN[roll.apexVi];
  return spin ? { veracity, spin } : { veracity };
}

/**
 * Inverse: which face to show for a rating. `unknown` returns null — the die is
 * meant to float, not to land on a lie.
 * @param {{veracity?: string, spin?: string}} rating
 */
export function toDieRoll(rating) {
  if (!rating || rating.veracity === 'unknown' || rating.veracity == null) return null;
  const pole = rating.veracity === 'entailed' ? VI.WHITE : VI.BLACK;
  const apex = rating.spin ? SPIN_TO_APEX[rating.spin] : undefined;
  return { whiteMode: pole === VI.WHITE, apexVi: apex, clickVote: apex === undefined ? pole : undefined };
}

// ----------------------------------------------------------------- warrant ---

const t = (x) => (x == null ? null : Date.parse(x));

/** Is this evidence usable at instant `at`? Status must warrant, validity must cover. */
export function isWarranted(evidence, at = new Date().toISOString()) {
  if (!evidence || evidence.status !== WARRANTING_STATUS) return false;
  const when = t(at);
  const from = t(evidence.valid?.from);
  const to = t(evidence.valid?.to);
  if (from != null && when < from) return false;
  if (to != null && when >= to) return false; // half-open [from, to)
  return true;
}

/**
 * Independent witnesses only: same document hash counts once, and anything
 * downstream of another record is not a second witness. Three articles citing
 * one press release are one witness.
 */
export function independentWitnesses(evidences) {
  const alive = evidences.filter(Boolean);
  const byId = new Map(alive.map((e) => [e.id, e]));
  // Walk each record up to its ultimate ancestor and count distinct ancestors.
  // If the ancestor is outside the set we key on its id, so two derivatives of
  // one absent press release still count as a single witness.
  const rootKey = (e) => {
    const seen = new Set();
    let cur = e;
    while (cur?.derives_from && !seen.has(cur.id)) {
      seen.add(cur.id);
      const parent = byId.get(cur.derives_from);
      if (!parent) return cur.derives_from;
      cur = parent;
    }
    return cur.document?.hash ?? cur.id;
  };
  return new Set(alive.map(rootKey)).size;
}

/**
 * Recompute the standing of a claim from its evidence.
 *
 * The rule that matters: when warrant is gone the claim becomes UNWARRANTED,
 * which resolves to `unknown`. It never flips to `contradicted` — losing your
 * warrant is not acquiring a counter-warrant.
 *
 * @param {string[]} basis evidence ids
 * @param {Record<string, object>} byId
 * @param {string} at ISO instant
 */
export function warrantOf(basis, byId, at = new Date().toISOString()) {
  const cited = (basis ?? []).map((id) => byId[id]).filter(Boolean);
  if (cited.length === 0) {
    return { warranted: false, reason: REASON.NO_EVIDENCE, witnesses: 0, lost: [] };
  }
  const live = cited.filter((e) => isWarranted(e, at));
  if (live.length > 0) {
    return {
      warranted: true,
      reason: REASON.PROVED,
      witnesses: independentWitnesses(live),
      lost: cited.filter((e) => !isWarranted(e, at)).map((e) => e.id),
    };
  }
  return {
    warranted: false,
    reason: REASON.WARRANT_WITHDRAWN,
    witnesses: 0,
    lost: cited.map((e) => e.id),
    why: cited.map((e) => `${e.id}: ${e.status}`),
  };
}

/**
 * Re-derive a rating's veracity after evidence has moved. Returns a NEW rating;
 * nothing is mutated, and the previous value is kept so the fall-back is
 * auditable.
 *
 * Only an `authority` may hold an asserted veracity, so this is the only place
 * veracity legitimately changes without a fresh human or proof step.
 */
export function reassess(rating, byId, at = new Date().toISOString()) {
  if (rating.veracity !== 'entailed' && rating.veracity !== 'contradicted') return rating;
  const w = warrantOf(rating.basis, byId, at);
  if (w.warranted) return rating;
  return {
    ...rating,
    veracity: 'unknown',
    reason: REASON.WARRANT_WITHDRAWN,
    was: { veracity: rating.veracity, until: at },
    note: w.why ? `warrant withdrawn — ${w.why.join('; ')}` : rating.note,
  };
}

// -------------------------------------------------------------- invariants ---

/**
 * Structural check of one rating. Not a full JSON-Schema validator — it enforces
 * the rules that keep the axes apart, which is the part that actually matters.
 * @returns {string[]} problems; empty means conformant
 */
export function check(rating) {
  const p = [];
  if (!rating || typeof rating !== 'object') return ['not an object'];
  if (!rating.subject) p.push('missing subject');
  if (!rating.at) p.push('missing timestamp');
  const rater = rating.rater;
  if (!rater?.id || !rater?.kind) p.push('missing rater id/kind');

  if (rating.veracity != null && !VERACITY.includes(rating.veracity)) {
    p.push(`veracity not in enumeration: ${rating.veracity}`);
  }
  if (rating.spin != null && !SPIN.includes(rating.spin)) {
    p.push(`spin not in enumeration: ${rating.spin}`);
  }
  if (rating.spin != null && (!rater?.id || !rating.at)) {
    p.push('spin without an attributed rater and timestamp');
  }
  if (rating.affect != null && (!rater?.id || !rating.at)) {
    p.push('affect without an attributed rater and timestamp');
  }

  const asserted = rating.veracity === 'entailed' || rating.veracity === 'contradicted';
  if (asserted) {
    if (rater?.kind !== 'authority') p.push(`veracity asserted by rater kind '${rater?.kind}' — only 'authority' may`);
    if (!rating.basis?.length) p.push('veracity asserted without a basis');
  }
  if (rater?.kind === 'crowd') {
    if (asserted) p.push('crowd may report how a text reads, never whether it is true');
    if (!rater.n) p.push('crowd rater without n');
  }
  if ('score' in rating || 'confidence' in rating || 'trust' in rating) {
    p.push('aggregate score field present — there is deliberately no single number');
  }
  return p;
}

/** True when a store can express all six veracity × spin combinations. */
export function expressesAllSixCombinations(roundTrip) {
  for (const veracity of ['entailed', 'contradicted']) {
    for (const spin of SPIN) {
      const back = roundTrip({ veracity, spin });
      if (back?.veracity !== veracity || back?.spin !== spin) return false;
    }
  }
  return true;
}
