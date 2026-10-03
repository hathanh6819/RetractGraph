# Verification status

Updated 2026-10-03. The deployed contract is **v5** at `0x62073d9383EE35778a7308298ACEa4A314cA09eb` on Studio Next. Finalized RPC confirms its protocol metadata, deployed schema, and fresh two-wallet SDK lifecycle. Browser-wallet write tests remain pending; do not treat v4 evidence as v5 evidence.

## Automated and live checks

| Check | Result |
| --- | --- |
| Contract/direct + architecture suite | `23 passed` |
| Frontend finalized-readback + calldata tests | `10 passed`, covering all 8 write methods and preserving PMID strings |
| Wallet configuration tests | `5 passed` |
| Frontend production build | pass; 2,112 modules transformed |
| Studio Next v5 protocol readback | pass: version 5, chain ID 61997, zero constructor parameters |
| Studio Next v5 schema readback | pass: all 8 write methods are present, nonpayable, and list their expected parameters |
| Fresh two-wallet v5 SDK E2E | pass: happy lifecycle, unauthorized edit, invalid input, stale revision, disagreement/fail-closed, valid retraction, replay, citation repair, root and downstream reassessment; final state 1 workspace / 2 claims / 5 assessments, both claims `CURRENT` |
| Browser-wallet transaction journey | **Not run**. Adapter tests do not prove browser UI interaction. |
| Cloudflare v5 frontend deployment | pass: deployment `744ade6b-f62d-4551-8626-855d255e3451`; both deployment URL and production alias HTTP 200; production JS contains v5 address |

The v5 code separates claim support and notice-impact evidence digests, tracks the latest workspace assessment across support and impact paths, attributes propagated recheck state to the triggering assessment without copying the root impact digest to child claims, fails closed on source failure/validator disagreement, and requires every frontend write to observe its expected finalized state transition before reporting success.

## v4 live evidence

The previously recorded v4 deployment, probes, wallet lifecycle, and transaction hashes are preserved in [LIVE_EVIDENCE_V4.md](LIVE_EVIDENCE_V4.md). They remain valid for v4 only and do not establish v5 behavior.

## Remaining release gates

1. Run browser UI write/readback journeys for each write method using the wallet UI; distinguish these from SDK adapter tests.
2. Run production browser readback and wallet-write journeys; verify visible UI state against v5 finalized reads.
3. Preserve the transaction hash for the expected conflict-disagreement test on any fresh run; the completed live run's fail-closed state readback is recorded, but that one hash was not captured by the initial runner.
