export type Veracity = 'entailed' | 'contradicted' | 'unknown';
export type Spin = 'redshift' | 'green' | 'blueshift';
export type EvidenceStatus =
  | 'unverified' | 'authentic' | 'disputed' | 'retracted' | 'forged' | 'superseded';
export type Reason = 'no-evidence' | 'warrant-withdrawn' | 'counter-evidence' | 'proved';
export type RaterKind = 'human' | 'crowd' | 'machine' | 'authority';

export interface Rater {
  id: string;
  kind: RaterKind;
  display?: string;
  /** Required for crowd raters. */
  n?: number;
  method?: string;
}

export type Subject =
  | { kind: 'claim'; subject: string; relation: string; object: string; at?: string }
  | { kind: 'document'; uri?: string; hash?: string };

export interface Affect {
  /** -1 unpleasant … +1 pleasant */
  valence: number;
  /** 0 calm … 1 activated */
  arousal: number;
  label?: string;
}

export interface Rating {
  subject: Subject;
  /** Absent means not assessed; 'unknown' means deliberately abstained. */
  veracity?: Veracity;
  /** Absent means not assessed. Never default this to 'green'. */
  spin?: Spin;
  affect?: Affect;
  rater: Rater;
  at: string;
  /** Evidence ids. Required and non-empty when veracity is asserted. */
  basis?: string[];
  reason?: Reason;
  note?: string;
  /** Set when a fall-back to unknown occurred, so un-learning stays auditable. */
  was?: { veracity: Veracity; until: string };
  retracted_at?: string | null;
}

export interface Evidence {
  id: string;
  document: { hash: string; media_type?: string; retrieved_from?: string; issuer?: string };
  locator?: { section?: string; page?: number; span?: [number, number] };
  quote?: string;
  obtained_at: string;
  status: EvidenceStatus;
  /** The document's own validity in the world, half-open [from, to). */
  valid?: { from?: string | null; to?: string | null };
  /** Set when this record is downstream of another — not an independent witness. */
  derives_from?: string | null;
  history?: Array<{ status: EvidenceStatus; at: string; by: string; basis?: string }>;
}

export interface DieRoll {
  /** white = 0 = false, black = 1 = true (the die author's polarity) */
  whiteMode?: boolean;
  apexVi?: number;
  clickVote?: number;
}

export interface Warrant {
  warranted: boolean;
  reason: Reason;
  witnesses: number;
  lost: string[];
  why?: string[];
}

export declare const VERACITY: readonly Veracity[];
export declare const SPIN: readonly Spin[];
export declare const EVIDENCE_STATUS: readonly EvidenceStatus[];
export declare const WARRANTING_STATUS: 'authentic';
export declare const REASON: Record<string, Reason>;
export declare const VI: { WHITE: 0; BLACK: 1; RED: 2; GREEN: 3; BLUE: 4 };

export declare function fromDieRoll(roll: DieRoll | null | undefined): { veracity: Veracity; spin?: Spin };
export declare function toDieRoll(rating: Pick<Rating, 'veracity' | 'spin'>): DieRoll | null;
export declare function isWarranted(evidence: Evidence, at?: string): boolean;
export declare function independentWitnesses(evidences: Evidence[]): number;
export declare function warrantOf(basis: string[], byId: Record<string, Evidence>, at?: string): Warrant;
export declare function reassess(rating: Rating, byId: Record<string, Evidence>, at?: string): Rating;
export declare function check(rating: Rating): string[];
export declare function expressesAllSixCombinations(
  roundTrip: (r: { veracity: Veracity; spin: Spin }) => { veracity?: Veracity; spin?: Spin } | null,
): boolean;
