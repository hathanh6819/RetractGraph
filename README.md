# RetractGraph — Scientific Evidence Cascade

RetractGraph v3 is a GenLayer dApp that maintains a bounded dependency graph of scientific claims and PubMed citations. When PubMed links a retraction, erratum or expression of concern to an exact cited article, validators independently verify the relationship in either authoritative XML direction (`RetractionIn` or `RetractionOf`) and judge its bounded impact on directly supported claims. Contract code then marks downstream claims `RECHECK_REQUIRED` without pretending they are automatically false.

The constructor takes no inputs. The deployer receives no admin, reviewer or assessment power. Any wallet can create and own a workspace, and any wallet—including a steward—can trigger assessment or reassessment on a sealed workspace.

## Distinct lifecycle

```text
build claim graph → seal epoch → verify notice relationship
→ semantic edge-impact judgment → deterministic impact wave
→ add replacement citation → reassess affected branch
```

This is not an authorization gate, escrow, recall quarantine or two-version policy diff. Persistent behavior is a bounded graph whose affected frontier evolves after source-backed events.

## Public methods

- `create_workspace(title)`
- `add_claim(workspace_id, claim_text)`
- `add_citation(claim_id, pmid)`
- `add_dependency(parent_claim_id, child_claim_id)`
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
4. Seal the workspace.
5. From the same wallet or another wallet, assess article `27516793` with notice `28515760`.
6. Read both claims. A material or narrowing result on claim 1 must make claim 2 `RECHECK_REQUIRED`.
7. Repeat the exact notice pair and confirm replay rejection with no mutation.

Final Studio Next contract: [`0x31ca5981ccd8a0b0E50a1d17977fA36b9d6FbbE7`](https://explorer-studio-dev.genlayer.com/address/0x31ca5981ccd8a0b0E50a1d17977fA36b9d6FbbE7). See [live E2E evidence](docs/LIVE_EVIDENCE.md) for linked transactions and finalized readbacks.

Live frontend: [retractgraph.pages.dev](https://retractgraph.pages.dev)
