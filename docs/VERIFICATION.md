# Verification status

Updated 2026-10-02. The currently deployed contract remains **v4** at `0xe9113918395E93948A24FFb3b0cAe20a933586A4`. The working tree now contains the **v5 candidate**; it is not deployed yet and must not be represented as live evidence.

## v5 candidate checks (local)

| Check | Result |
| --- | --- |
| Contract/direct + architecture suite | `23 passed` |
| Frontend finalized-readback tests | `9 passed` across all 8 write methods, including verify + reassess separately |
| Wallet configuration tests | `5 passed` |
| Frontend production build | pass; 2,112 modules transformed |
| Browser-wallet transaction journey | **Not run**. The tests use injected read/write adapters; they do not prove browser UI interaction. |
| Studio Next v5 deployment / two-wallet lifecycle | **Pending**. No v5 deployment address or transaction hashes exist yet. |
| Cloudflare v5 frontend deployment | **Pending** until the v5 contract is deployed and the frontend is wired to its finalized address. |

The v5 code separates claim support and notice-impact evidence digests, tracks the latest workspace assessment across support and impact paths, attributes propagated recheck state to the triggering assessment without copying the root impact digest to child claims, fails closed on source failure/validator disagreement, and requires every frontend write to observe its expected finalized state transition before reporting success.

## v4 live evidence

The previously recorded v4 deployment, probes, wallet lifecycle, and transaction hashes are preserved in [LIVE_EVIDENCE_V4.md](LIVE_EVIDENCE_V4.md). They remain valid for v4 only and do not establish v5 behavior.

## Remaining release gates

1. Deploy the exact v5 source using the designated deployer wallet (not either test wallet).
2. Verify schema loading and protocol version 5 on Studio Next.
3. Run fresh two-wallet happy, failure, conflicting-source, replay, and repair/reassessment paths against the v5 address; record finalized receipts and readbacks.
4. Run browser UI write/readback journeys for each write method using the wallet UI; distinguish these from SDK adapter tests.
5. Build the frontend with the v5 address, deploy to Cloudflare Pages, and verify production contract reads and links.
6. Update the v5 live evidence manifest with real addresses and hashes, then publish it to GitHub.
