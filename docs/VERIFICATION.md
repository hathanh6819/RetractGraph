# Verification record

Status: **LOCALLY VERIFIED** on 2026-09-29. Deployment and live lifecycle are still pending.

| Check | Result |
| --- | --- |
| Contract/direct suite | `27 passed` (v2) |
| GenVM lint | pass, no remaining warning after consensus-parser repair |
| Frontend wallet tests | `4 passed` |
| Frontend production build | pass; 2,111 modules transformed |
| PubMed positive probe | HTTP 200, 9,726 bytes, both PMIDs present, `RetractionOf` relation found |
| PubMed cross-object control | HTTP 200, 9,515 bytes, both PMIDs present, expected relation absent |

Observed probe SHA-256 values are temporal diagnostics, not permanent publication identities:

- positive response: `ccfbf13263173aea5df02ed80e01026ec4aa36102b0106961e42168ce08365a2`
- cross-object response: `c41e99ced48bfe063d2ea5f1f7acca9ba1238b172e3c331a3e3c2ffc82a956ce`

Required release ladder:

1. deterministic/direct tests — complete;
2. GenVM lint and production frontend build — complete;
3. exact v2 source deployment to Studio Next — required; v1 was superseded after live parser regression;
4. two-wallet happy, failure, cross-object, replay and recovery lifecycle;
5. finalized authoritative readback;
6. production frontend build wired to the final address;
7. browser wallet write plus readback reconciliation.

Live transaction hashes, address and Explorer links must be added only after they exist. No fixture or local mock is represented as live evidence.
