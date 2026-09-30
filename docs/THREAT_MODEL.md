# Threat model

## Protected consequence

Only an exact PubMed notice relationship can change the standing of a cited claim and trigger a deterministic downstream recheck wave.

## Attacker controls

- workspace and claim wording they create;
- PMIDs supplied to public methods;
- timing and order of calls;
- inert text that may occur inside fetched evidence;
- repeated, stale, cross-workspace and cross-object transactions.

## Attacker does not control

- the fixed HTTPS authority host/path/query shape;
- PubMed's returned relationship fields;
- independent validator fetches and semantic judgments;
- contract-derived graph traversal, revision and replay indexes.

## Invariants

1. Constructor grants no privileged operational role to the deployer.
2. Each workspace creator controls graph construction only; any wallet may request source-backed assessment.
3. A notice must contain exactly one supported relation to the exact article PMID.
4. Unknown, unavailable, malformed or disagreeing evidence never becomes a material verdict.
5. A direct material/narrowing verdict marks descendants `RECHECK_REQUIRED`; it never declares descendants false.
6. Dependencies are acyclic because a parent ID must precede its child ID.
7. A notice pair is single-use per sealed workspace revision.
8. Rejected deterministic writes do not mutate graph state.
9. Contract holds no funds and makes no medical or scientific-truth certification.
