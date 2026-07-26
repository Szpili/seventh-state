/**
 * Self-check for the invariants that give this vocabulary its point.
 *   node test.mjs
 * No framework, no dependencies. Exits non-zero on the first broken invariant.
 */
import assert from 'node:assert/strict';
import {
  fromDieRoll, toDieRoll, isWarranted, independentWitnesses, warrantOf,
  reassess, check, expressesAllSixCombinations, VI, REASON,
} from './src/seventh-state.mjs';

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`  ok  ${name}`); };

const authority = { id: 'weryta', kind: 'authority' };
const ev = (over = {}) => ({
  id: 'ev:1',
  document: { hash: 'sha256:' + '1'.repeat(64) },
  obtained_at: '2026-01-01T00:00:00Z',
  status: 'authentic',
  ...over,
});

console.log('seventh-state self-check\n');

// --- the die ---------------------------------------------------------------

test('a roll that never landed is the seventh state', () => {
  assert.equal(fromDieRoll(null).veracity, 'unknown');
  assert.equal(fromDieRoll(undefined).veracity, 'unknown');
  assert.equal(fromDieRoll({}).veracity, 'unknown');
});

test('poles carry truth, apex carries spin', () => {
  // Polarity is the author's: white = 0 = false, black = 1 = true. Pinned
  // here because this spec shipped with it inverted and nothing caught it.
  assert.deepEqual(fromDieRoll({ whiteMode: false, apexVi: VI.BLUE }), { veracity: 'entailed', spin: 'blueshift' });
  assert.deepEqual(fromDieRoll({ whiteMode: true, apexVi: VI.RED }), { veracity: 'contradicted', spin: 'redshift' });
  assert.equal(toDieRoll({ veracity: 'entailed' }).whiteMode, false, 'true lands on black');
  assert.equal(toDieRoll({ veracity: 'contradicted' }).whiteMode, true, 'false lands on white');
});

test('a pure pole click invents no frame (spin stays absent, not green)', () => {
  const r = fromDieRoll({ whiteMode: false, apexVi: VI.GREEN, clickVote: VI.BLACK });
  assert.equal(r.veracity, 'entailed');
  assert.equal(r.spin, undefined, 'defaulting to green would fabricate a declared frame');
});

test('unknown never lands on a face', () => {
  assert.equal(toDieRoll({ veracity: 'unknown' }), null);
  assert.equal(toDieRoll({}), null);
});

test('all six veracity x spin combinations round-trip', () => {
  assert.ok(expressesAllSixCombinations((r) => fromDieRoll(toDieRoll(r))));
});

test('true+redshift and false+blueshift are expressible', () => {
  // the two cells a collapsed score cannot represent
  assert.deepEqual(fromDieRoll(toDieRoll({ veracity: 'entailed', spin: 'redshift' })),
    { veracity: 'entailed', spin: 'redshift' });
  assert.deepEqual(fromDieRoll(toDieRoll({ veracity: 'contradicted', spin: 'blueshift' })),
    { veracity: 'contradicted', spin: 'blueshift' });
});

// --- warrant ---------------------------------------------------------------

test('only authentic evidence warrants', () => {
  assert.ok(isWarranted(ev()));
  for (const status of ['unverified', 'disputed', 'retracted', 'forged', 'superseded']) {
    assert.ok(!isWarranted(ev({ status })), `${status} must not warrant`);
  }
});

test('validity is half-open [from, to)', () => {
  const e = ev({ valid: { from: '2026-01-01', to: '2026-06-01' } });
  assert.ok(isWarranted(e, '2026-05-31T23:59:59Z'));
  assert.ok(!isWarranted(e, '2026-06-01T00:00:00Z'), 'the end instant is outside');
});

test('citations of one document are one witness, not three', () => {
  const root = ev({ id: 'ev:release' });
  const a = ev({ id: 'ev:a', derives_from: 'ev:release', document: { hash: 'sha256:' + '2'.repeat(64) } });
  const b = ev({ id: 'ev:b', derives_from: 'ev:release', document: { hash: 'sha256:' + '3'.repeat(64) } });
  assert.equal(independentWitnesses([root, a, b]), 1);
  const other = ev({ id: 'ev:other', document: { hash: 'sha256:' + '4'.repeat(64) } });
  assert.equal(independentWitnesses([root, other]), 2);
});

test('the two silences are distinguishable', () => {
  assert.equal(warrantOf([], {}).reason, REASON.NO_EVIDENCE);
  assert.equal(warrantOf(['ev:1'], { 'ev:1': ev({ status: 'forged' }) }).reason, REASON.WARRANT_WITHDRAWN);
});

// --- the core rule ---------------------------------------------------------

test('losing evidence sends a claim to unknown, NEVER to contradicted', () => {
  const byId = { 'ev:1': ev() };
  const rating = {
    subject: { kind: 'claim', subject: 's', relation: 'r', object: 'o' },
    veracity: 'entailed', rater: authority, at: '2026-01-02T00:00:00Z', basis: ['ev:1'],
  };
  assert.equal(reassess(rating, byId).veracity, 'entailed', 'still warranted');

  byId['ev:1'] = ev({ status: 'forged' });
  const after = reassess(rating, byId);
  assert.equal(after.veracity, 'unknown');
  assert.notEqual(after.veracity, 'contradicted', 'warrant withdrawal is not counter-evidence');
  assert.equal(after.reason, REASON.WARRANT_WITHDRAWN);
  assert.equal(after.was.veracity, 'entailed', 'un-learning must stay auditable');
});

test('spin survives a veracity fall-back untouched', () => {
  const byId = { 'ev:1': ev({ status: 'retracted' }) };
  const after = reassess({
    subject: { kind: 'claim', subject: 's', relation: 'r', object: 'o' },
    veracity: 'entailed', spin: 'redshift', rater: authority, at: '2026-01-02T00:00:00Z', basis: ['ev:1'],
  }, byId);
  assert.equal(after.veracity, 'unknown');
  assert.equal(after.spin, 'redshift', 'how a record was framed did not change');
});

test('unknown is reachable again after assertion (knowledge is not monotonic)', () => {
  const byId = { 'ev:1': ev() };
  const base = {
    subject: { kind: 'claim', subject: 's', relation: 'r', object: 'o' },
    veracity: 'entailed', rater: authority, at: '2026-01-02T00:00:00Z', basis: ['ev:1'],
  };
  byId['ev:1'] = ev({ status: 'disputed' });
  assert.equal(reassess(base, byId).veracity, 'unknown');
  byId['ev:1'] = ev({ status: 'authentic' });
  assert.equal(reassess(base, byId).veracity, 'entailed', 'and forward again once warranted');
});

// --- invariants ------------------------------------------------------------

const wellFormed = {
  subject: { kind: 'claim', subject: 's', relation: 'r', object: 'o' },
  rater: authority, at: '2026-01-02T00:00:00Z',
};

test('a crowd may report framing, never truth', () => {
  const crowd = { id: 'captcha', kind: 'crowd', n: 4200 };
  assert.deepEqual(check({ ...wellFormed, rater: crowd, spin: 'blueshift' }), []);
  const bad = check({ ...wellFormed, rater: crowd, veracity: 'entailed', basis: ['ev:1'] });
  assert.ok(bad.some((p) => p.includes('never whether it is true')));
});

test('asserted veracity requires an authority and a basis', () => {
  assert.ok(check({ ...wellFormed, veracity: 'entailed' }).some((p) => p.includes('without a basis')));
  assert.ok(check({ ...wellFormed, rater: { id: 'gpt', kind: 'machine' }, veracity: 'entailed', basis: ['ev:1'] })
    .some((p) => p.includes("only 'authority' may")));
});

test('unattributed spin is invalid', () => {
  assert.ok(check({ subject: wellFormed.subject, spin: 'green', rater: { kind: 'human' }, at: '' })
    .some((p) => p.includes('spin without an attributed rater')));
});

test('no aggregate score field may exist', () => {
  for (const field of ['score', 'confidence', 'trust']) {
    assert.ok(check({ ...wellFormed, [field]: 0.9 }).some((p) => p.includes('aggregate score')),
      `${field} must be rejected`);
  }
});

test('abstention is well-formed on its own', () => {
  assert.deepEqual(check({ ...wellFormed, veracity: 'unknown', reason: 'no-evidence' }), []);
});

console.log(`\n${n} checks passed.`);
