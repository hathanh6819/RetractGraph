# RetractGraph — Scientific Evidence Cascade

RetractGraph is a GenLayer dApp that maintains a bounded dependency graph of scientific claims and PubMed citations. A claim starts as `PENDING_SUPPORT`, not `CURRENT`. Validators must fetch its exact PMID set and confirm collective support; the contract binds that verdict to the claim revision and citation-set digest. Only a fully verified graph can be sealed. Later PubMed retractions, errata or expressions of concern invalidate the affected evidence edge and trigger a deterministic downstream recheck wave.

The constructor takes no inputs. The deployer receives no admin, reviewer or assessment power. Any wallet can create and own a workspace, and any wallet—including a steward—can trigger assessment or reassessment on a sealed workspace.

## Distinct lifecycle

```text
build claim graph → collectively verify every claim → seal epoch → verify notice relationship
→ semantic edge-impact judgment → deterministic impact wave
→ add replacement citation → reassess affected branch
```

This is not an authorization gate, escrow, recall quarantine or two-version policy diff. Persistent behavior is a bounded graph whose affected frontier evolves after source-backed events.

## Public methods

- `create_workspace(title)`
- `add_claim(workspace_id, claim_text)`
- `add_citation(claim_id, pmid)`
- `add_dependency(parent_claim_id, child_claim_id)`
- `verify_claim_support(claim_id, expected_revision)` — permissionless and required before sealing
- `seal_workspace(workspace_id)`
- `assess_notice(workspace_id, article_pmid, notice_pmid)` — permissionless
- `reassess_claim(claim_id, expected_revision)` — permissionless
- `get_workspace`, `get_claim`, `get_assessment`, `get_counts`, `get_protocol`

## Canonical live fixture

- Original article: [PMID 27516793](https://pubmed.ncbi.nlm.nih.gov/27516793/)
- Retraction notice: [PMID 28515760](https://pubmed.ncbi.nlm.nih.gov/28515760/)
- Potential alternate support: [PMID 322561](https://pubmed.ncbi.nlm.nih.gov/322561/)

See [source manifest](docs/SOURCE_MANIFEST.md) and [threat model](docs/THREAT_MODEL.md). PubMed records publication metadata and relationships; RetractGraph does not certify scientific truth and is not medical advice.

## Local checks

```powershell
python -m pytest tests -q
genvm-lint contracts/retract_graph.py
cd frontend
npm ci
npm test
npm run build
```

## Reviewer path

1. Connect any wallet on Studio Next, chain ID `61997`.
2. Create a workspace and two claims.
3. Add at least one PMID to each claim; add claim 1 as a dependency of claim 2.
4. Call `verify_claim_support` for both claims. Confirm each finalized readback is `CURRENT`, `SUPPORT_SUFFICIENT`, and has matching `support_revision` and `revision`.
5. Seal the workspace. Sealing fails if any claim is pending, stale, unsupported, missing a citation commitment, or the graph has no dependency edge.
6. From the same wallet or another wallet, assess article `27516793` with notice `28515760`.
7. Read both claims. A material or narrowing result on claim 1 must make claim 2 `RECHECK_REQUIRED`.
8. Repeat the exact notice pair and confirm replay rejection with no mutation.

Current Studio Next v5 contract: [`0x62073d9383EE35778a7308298ACEa4A314cA09eb`](https://explorer-studio-dev.genlayer.com/address/0x62073d9383EE35778a7308298ACEa4A314cA09eb). Finalized RPC confirms protocol version 5 and a no-argument constructor. Fresh two-wallet E2E evidence is still pending for v5; see [v5 live checkpoint](docs/LIVE_EVIDENCE_V5.md), [verification status](docs/VERIFICATION.md), and the complete [v4 lifecycle record](docs/LIVE_EVIDENCE_V4.md).

Live frontend: [retractgraph.pages.dev](https://retractgraph.pages.dev)
