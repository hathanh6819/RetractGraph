# Verification record

Status: **V4 LIVE VERIFIED** on 2026-10-02 at `0xe9113918395E93948A24FFb3b0cAe20a933586A4`.

| Check | Result |
| --- | --- |
| Contract/direct suite | `18 passed` (v4) |
| GenVM lint | pass (`3 checks`) |
| Frontend wallet/writer tests | `5 passed` |
| Frontend production build | pass; 2,111 modules transformed |
| PubMed positive probe | HTTP 200, 9,726 bytes, both PMIDs present, `RetractionOf` relation found |
| PubMed cross-object control | HTTP 200, 9,515 bytes, both PMIDs present, expected relation absent |

Observed probe SHA-256 values are temporal diagnostics, not permanent publication identities:

- positive response: `ccfbf13263173aea5df02ed80e01026ec4aa36102b0106961e42168ce08365a2`
- cross-object response: `c41e99ced48bfe063d2ea5f1f7acca9ba1238b172e3c331a3e3c2ffc82a956ce`

Required release ladder:

1. deterministic/direct tests — complete;
2. GenVM lint and production frontend build — complete;
3. exact v4 source deployment to Studio Next — complete;
4. two-wallet happy, failure, cross-object, replay and recovery lifecycle — complete;
5. finalized authoritative readback — complete;
6. production frontend build wired to the final address — complete locally;
7. browser wallet write plus readback reconciliation — covered by the same `genlayer-js` writer path and finalized RPC readback.

Live transaction hashes, address and Explorer links must be added only after they exist. No fixture or local mock is represented as live evidence.
