# RetractGraph v5 — live deployment checkpoint

Network: GenLayer Studio Next (chain ID `61997`).

Contract: [`0x62073d9383EE35778a7308298ACEa4A314cA09eb`](https://explorer-studio-dev.genlayer.com/address/0x62073d9383EE35778a7308298ACEa4A314cA09eb).

Production frontend: [retractgraph.pages.dev](https://retractgraph.pages.dev), Cloudflare Pages deployment `744ade6b-f62d-4551-8626-855d255e3451` ([deployment URL](https://744ade6b.retractgraph.pages.dev)). Both production URLs returned HTTP 200; the fetched production JavaScript bundle contains this v5 contract address.

Read-only finalized RPC checks completed 2026-10-02:

- `get_protocol`: `RetractGraph`, version `5`, architecture `separate-support-impact-evidence-and-assessment-readback`, no custody, seal policy `ALL_CLAIMS_COLLECTIVELY_VERIFIED`.
- `get_counts`: `0` workspaces, `0` claims, `0` assessments at inspection time.
- Deployed schema: no constructor inputs. The eight write methods are present and nonpayable: `create_workspace(title)`, `add_claim(workspace_id, claim_text)`, `add_citation(claim_id, pmid)`, `add_dependency(parent_claim_id, child_claim_id)`, `verify_claim_support(claim_id, expected_revision)`, `seal_workspace(workspace_id)`, `assess_notice(workspace_id, article_pmid, notice_pmid)`, and `reassess_claim(claim_id, expected_revision)`.

This is deployment/schema evidence only. No transactions or two-wallet E2E paths have yet been run against v5, and no transaction hashes are claimed here. The v4 E2E record remains separate in [LIVE_EVIDENCE_V4.md](LIVE_EVIDENCE_V4.md).
