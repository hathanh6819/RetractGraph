# Verification status

Updated 2026-10-02. The deployed contract is **v5** at `0x62073d9383EE35778a7308298ACEa4A314cA09eb` on Studio Next. Finalized RPC confirms its protocol metadata and deployed schema. Fresh two-wallet v5 lifecycle evidence and browser-wallet write tests are still pending; do not treat v4 evidence as v5 evidence.

## Automated and live checks

| Check | Result |
| --- | --- |
| Contract/direct + architecture suite | `23 passed` |
| Frontend finalized-readback tests | `9 passed` across all 8 write methods, including verify + reassess separately |
| Wallet configuration tests | `5 passed` |
| Frontend production build | pass; 2,112 modules transformed |
| Studio Next v5 protocol readback | pass: version 5, chain ID 61997, zero constructor parameters |
| Studio Next v5 schema readback | pass: all 8 write methods are present, nonpayable, and list their expected parameters |
| Fresh two-wallet v5 lifecycle | **Pending**; v4 live tests are not substituted for v5 tests. |
| Browser-wallet transaction journey | **Not run**. Adapter tests do not prove browser UI interaction. |
| Cloudflare v5 frontend deployment | pass: deployment `744ade6b-f62d-4551-8626-855d255e3451`; both deployment URL and production alias HTTP 200; production JS contains v5 address |

The v5 code separates claim support and notice-impact evidence digests, tracks the latest workspace assessment across support and impact paths, attributes propagated recheck state to the triggering assessment without copying the root impact digest to child claims, fails closed on source failure/validator disagreement, and requires every frontend write to observe its expected finalized state transition before reporting success.

## v4 live evidence

The previously recorded v4 deployment, probes, wallet lifecycle, and transaction hashes are preserved in [LIVE_EVIDENCE_V4.md](LIVE_EVIDENCE_V4.md). They remain valid for v4 only and do not establish v5 behavior.

## Remaining release gates

1. Run fresh two-wallet happy, failure, conflicting-source, replay, and repair/reassessment paths against the v5 address; record finalized receipts and readbacks.
2. Run browser UI write/readback journeys for each write method using the wallet UI; distinguish these from SDK adapter tests.
3. Run production browser readback and wallet-write journeys; verify visible UI state against v5 finalized reads.
4. Update the v5 live evidence manifest with real transaction hashes, then publish it to GitHub.
