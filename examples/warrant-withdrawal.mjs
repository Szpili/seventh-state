/**
 * The case that motivates the whole evidence model: the evidence itself turns
 * out to be false.
 *
 *   node examples/warrant-withdrawal.mjs
 *
 * A claim is proved on the strength of one document. Later the document is
 * exposed as a forgery. The claim must NOT become false — nobody showed the
 * opposite. It becomes unsupported, and returns to "I don't know", with a
 * record of what it used to be and why that changed.
 */
import { warrantOf, reassess, fromDieRoll } from '../src/seventh-state.mjs';

const evidence = {
  'ev:permit#§3.1': {
    id: 'ev:permit#§3.1',
    document: { hash: 'sha256:' + 'a'.repeat(64), media_type: 'application/pdf' },
    locator: { section: '§3.1', page: 4 },
    quote: 'Processing capacity is 50 700 Mg per year.',
    obtained_at: '2026-05-02T09:14:00Z',
    status: 'authentic',
    valid: { from: '2026-01-09', to: null },
  },
};

let rating = {
  subject: { kind: 'claim', subject: 'permit:X', relation: 'allows', object: 'capacity:50700' },
  veracity: 'entailed',
  spin: 'green',
  rater: { id: 'weryta', kind: 'authority' },
  at: '2026-05-02T10:00:00Z',
  basis: ['ev:permit#§3.1'],
  reason: 'proved',
};

const show = (label) => {
  const w = warrantOf(rating.basis, evidence);
  console.log(`\n${label}`);
  console.log(`  veracity   : ${rating.veracity}   (reason: ${rating.reason})`);
  console.log(`  spin       : ${rating.spin ?? '—'}`);
  console.log(`  warranted  : ${w.warranted}  witnesses: ${w.witnesses}`);
  if (rating.was) console.log(`  was        : ${rating.was.veracity} until ${rating.was.until}`);
  if (rating.note) console.log(`  note       : ${rating.note}`);
};

show('1. Proved on one authentic document');

// The document is exposed as a forgery. History is append-only: we record what
// we now believe about the evidence, we do not delete it.
evidence['ev:permit#§3.1'].history = [
  { status: 'authentic', at: '2026-05-02T09:14:00Z', by: 'ingest' },
  { status: 'forged', at: '2026-07-25T08:00:00Z', by: 'reviewer:kk', basis: 'issuer confirmed no such decision' },
];
evidence['ev:permit#§3.1'].status = 'forged';

rating = reassess(rating, evidence, '2026-07-25T08:00:00Z');
show('2. After the document is exposed as forged');

console.log(`
  Note what did NOT happen: the claim is not 'contradicted'. Nobody showed the
  opposite — we merely lost the only reason we had to believe it. Absence of
  evidence is not evidence of absence, so the honest destination is 'unknown'.

  On the die: it stops resting on a face and floats again.
  fromDieRoll(null) -> ${JSON.stringify(fromDieRoll(null))}
`);

// Spin survives the fall-back untouched: how the record was framed is a fact
// about its author, and that did not change when the document was discredited.
console.log(`  spin after fall-back: ${rating.spin} — unchanged, as it must be.\n`);
