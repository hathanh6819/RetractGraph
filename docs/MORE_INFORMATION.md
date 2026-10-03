# Reviewer remediation report

This document maps every steward request to the v5 implementation and its verification evidence. Historical v3/v4 results are not used as proof for v5.

## 1. Phase timeout bounds

- Replaced the invalid validator allocation `700` with `600`, keeping the frontend writer inside Studio Next's accepted phase bounds.
- `frontend/src/genlayer.ts` estimates every write with leader allocation `300` and validator allocation `600`.
- `frontend/src/genlayer.test.mts` asserts `600` is present and `700` is absent.

## 2. Evidence and claim-state consistency

- Split claim evidence into `support_evidence_digest` and `impact_evidence_digest`.
- Collective-support assessments bind the exact claim revision, citation list, citation digest, fetched-source digest and bounded verdict.
- Notice assessments bind the workspace revision, exact article/notice PMIDs, source digest, affected claim ID and verdict.
- A downstream recheck receives the triggering assessment ID but never copies the root claim's impact digest.
- Editing citations invalidates both previous evidence digests and resets support state before reassessment.

## 3. Collective support before `CURRENT`

- New claims start as `PENDING_SUPPORT`, never `CURRENT`.
- Permissionless `verify_claim_support(claim_id, expected_revision)` fetches all exact PubMed citations and asks validators whether they collectively support the locked claim.
- Only `SUPPORT_SUFFICIENT / CLAIM_DIRECTLY_SUPPORTED` can move a claim to `CURRENT`.
- Source failure, malformed output, identity mismatch or validator uncertainty fails closed as `UNRESOLVED`.

## 4. Strong graph sealing

`seal_workspace` rejects a graph unless all of the following hold:

- at least two claims and at least one dependency edge;
- every claim has a citation;
- every claim is `CURRENT` and `SUPPORT_SUFFICIENT`;
- support revision equals current claim revision;
- stored citation digest equals the current citation set;
- support assessment ID and support evidence digest exist;
- the reason is `CLAIM_DIRECTLY_SUPPORTED`;
- every parent exists in the same workspace.

## 5. Complete graph lifecycle verification

- Contract and architecture suite: `23 passed`.
- Tests cover claim creation, citations, dependencies, collective support, sealing, authorization failure, malformed/source failure, relation conflict, deterministic propagation, replay protection, citation repair, stale revisions and reassessment.
- Fresh v5 live E2E finished with one sealed workspace, two `CURRENT` claims and five assessments.

## 6. Frontend and deployed-contract consistency

- Production is pinned to Studio Next chain ID `61997` and contract v5 `0x62073d9383EE35778a7308298ACEa4A314cA09eb`.
- The connected wallet account is verified again immediately before client construction and signing.
- Changed accounts and wrong-chain wallets are rejected.
- PMID arguments remain strings as required by the deployed schema.
- Every write waits for finality and then requires its specific expected finalized readback before the UI reports success.
- The Cloudflare production bundle contains the v5 address and does not contain the retired v4 address.

## 7. Every frontend write method

Frontend tests cover all eight deployed write methods independently:

1. `create_workspace`
2. `add_claim`
3. `add_citation`
4. `add_dependency`
5. `verify_claim_support`
6. `seal_workspace`
7. `assess_notice`
8. `reassess_claim`

The finalized-readback adapter rejects a finalized receipt when its expected on-chain state transition cannot be found. Current frontend result: `15 passed`; production build: `2,112 modules transformed`.

Scope note: these are automated frontend transaction/readback tests. The live on-chain lifecycle below was executed through the SDK with the same deployed method names and parameters; it is not represented as a browser-wallet recording.

## 8. Fresh two-wallet on-chain E2E

- The deployer wallet was used only to deploy the contract.
- Two separate designated test wallets performed author and independent-observer roles.
- Live paths cover happy lifecycle, unauthorized creator edit, invalid identical PMID pair, stale revision, validator conflict/fail-closed behavior, valid retraction, downstream recheck propagation, replay rejection, citation repair, root recovery and downstream recovery.
- Final finalized state: one `SEALED` workspace, two `CURRENT` claims and five assessments.
- Transaction hashes and finalized readbacks are recorded in `docs/LIVE_EVIDENCE_V5.md`.

## Submission evidence

- Production: https://retractgraph.pages.dev
- Repository: https://github.com/hathanh6819/RetractGraph
- Contract v5: https://explorer-studio-dev.genlayer.com/address/0x62073d9383EE35778a7308298ACEa4A314cA09eb
- Live v5 evidence: https://github.com/hathanh6819/RetractGraph/blob/main/docs/LIVE_EVIDENCE_V5.md
- Verification matrix: https://github.com/hathanh6819/RetractGraph/blob/main/docs/VERIFICATION.md
- Main remediation commit: https://github.com/hathanh6819/RetractGraph/commit/da12250
- Valid retraction: https://explorer-studio-dev.genlayer.com/transactions/0xc484610a0f4ba8ff4158645bb160192ebdd23681671e2ba45dff8bd014c0de3b
- Root reassessment: https://explorer-studio-dev.genlayer.com/transactions/0x132dc455b5306f2f208ed5d51c06d28f9bf7a5dbdfc05deb1a90db3532e17d92
- Downstream reassessment: https://explorer-studio-dev.genlayer.com/transactions/0xc43908b4de442570d3556331a8cc79fe13b4e5dc35d83a2d3b5fb23fb48cdadc
