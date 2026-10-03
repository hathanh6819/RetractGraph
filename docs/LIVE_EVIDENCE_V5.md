# RetractGraph v5 — live Studio Next evidence

Network: GenLayer Studio Next, chain ID `61997`.

Contract: [`0x62073d9383EE35778a7308298ACEa4A314cA09eb`](https://explorer-studio-dev.genlayer.com/address/0x62073d9383EE35778a7308298ACEa4A314cA09eb).

Production frontend: [retractgraph.pages.dev](https://retractgraph.pages.dev), Cloudflare deployment `744ade6b-f62d-4551-8626-855d255e3451` ([deployment URL](https://744ade6b-f62d-4551-8626-855d255e3451.retractgraph.pages.dev)). Both production URLs returned HTTP 200; the fetched production JavaScript bundle contains this v5 contract address.

## Deployed interface

Finalized `get_protocol` reports RetractGraph v5, architecture `separate-support-impact-evidence-and-assessment-readback`, no custody, and seal policy `ALL_CLAIMS_COLLECTIVELY_VERIFIED`. The deployed schema has no constructor parameters; all eight write methods are present and nonpayable: `create_workspace`, `add_claim`, `add_citation`, `add_dependency`, `verify_claim_support`, `seal_workspace`, `assess_notice`, and `reassess_claim`.

## Fresh two-wallet SDK E2E — 2026-10-02

The deployment began with zero workspaces, claims, and assessments. Two designated test wallets were address-checked before sending transactions. The primary wallet did not perform E2E actions; wallet roles were author and independent observer. Receipts below were finalized with `FINISHED_WITH_RETURN` unless a row explicitly says otherwise. The exact conflict-probe transaction hash was not captured by the first runner before it exited; it is therefore not fabricated or linked here. Its finalized readbacks are recorded.

| Scenario | On-chain outcome |
| --- | --- |
| Create workspace, two cited claims, dependency; independent observer attempts creator-only citation edit | All writes finalized; unauthorized edit left claim state byte-for-byte unchanged. |
| Independently verify support for both claims; seal workspace | Assessments #1 and #2; both claims `CURRENT` with support evidence digests; workspace `SEALED`, latest assessment ID 2. |
| Invalid duplicate PMID pair | Finalized failure-path call; claim state unchanged and assessment count stayed 2. |
| Stale-revision reassessment | Finalized failure-path call; claim state unchanged and assessment count stayed 2. |
| Cross-object notice conflict (`27516793`, `37086429`) | Finalized as `MAJORITY_DISAGREE`; fail-closed behavior left counts at 2 assessments and left the root claim unchanged. The initial test runner incorrectly treated any disagreement as a harness error; the runner now explicitly records this expected failure-path result. |
| Valid retraction notice (`27516793`, `28515760`) | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0xc484610a0f4ba8ff4158645bb160192ebdd23681671e2ba45dff8bd014c0de3b), assessment #3. Root became `BROKEN` with separate support/impact digests; downstream claim became `RECHECK_REQUIRED` / `STALE` without inheriting the root impact digest. |
| Replay of the same notice | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x292832affa9085309043b7c1e00c844fef640fd80dc9a4527d443ddb08673f7c); assessment count remained 3. |
| Repair root citation | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x1e586cc9994270a3af120ac269bbb11b9703312a4879fe183e6303dc98517d10); old evidence digests cleared and root returned to `PENDING_SUPPORT`. |
| Reassess repaired root | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x132dc455b5306f2f208ed5d51c06d28f9bf7a5dbdfc05deb1a90db3532e17d92), assessment #4; root returned to `CURRENT` with fresh support evidence. Finalized readback confirmed the write despite a subsequent transient RPC error from the transaction-detail endpoint. |
| Reassess downstream claim | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0xc43908b4de442570d3556331a8cc79fe13b4e5dc35d83a2d3b5fb23fb48cdadc), assessment #5; child returned to `CURRENT` with fresh support evidence and no impact digest. |

Finalized state readback: 1 workspace, 2 claims, 5 assessments; workspace remains `SEALED` and `last_assessment_id=5`; both root and downstream claims are `CURRENT`. The root has fresh support evidence and no impact digest; the child has fresh support evidence and no inherited impact digest. `scripts/run_live_v5_e2e.mjs` contains the fresh-run flow and records expected conflict disagreement as a non-mutating fail-closed outcome. The continuation/finishing scripts preserve and verify the live state for this run.

This is SDK-driven two-wallet contract E2E evidence, not a browser-wallet UI journey. Browser UI write/readback and production-browser checks remain separate gates. The v4 live record remains separate in [LIVE_EVIDENCE_V4.md](LIVE_EVIDENCE_V4.md).
