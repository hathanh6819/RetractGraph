# Source and test-resource manifest

RetractGraph constructs every source URL itself from bounded numeric PMIDs. Users cannot provide evidence URLs.

Canonical endpoint: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=<PMIDS>`.

| Purpose | Exact object | Expected observation | Evidence class |
| --- | --- | --- | --- |
| positive | article `27516793`, notice `28515760` | notice has `RetractionOf` relationship to the article | live + mock |
| alternate support | `322561`, `10969679` | distinct publications about left-ventricular pseudoaneurysm | live + mock |
| cross-object | notice `37086429` submitted for article `27516793` | relationship mismatch; no positive state | mock/live pair |
| not found | syntactically valid absent PMID | empty exact-object result is not evidence of no retraction | mock |
| unavailable | timeout, HTTP 429/503 | `UNRESOLVED`; no claim privilege | strict mock |
| replay | repeat `27516793:28515760` in the same workspace revision | direct index rejects | direct test |
| mutable snapshot | same IDs, different response bytes | new digest; no rewrite of prior assessment | mock |
| injection | inert abstract contains instructions | instructions ignored; bounded schema or unresolved | mock |

## Authority and scope

NCBI PubMed is authoritative for the bibliographic record and relationship represented by its XML. It is not treated as authority for objective scientific truth. A valid relation proves only that PubMed records the notice-to-publication relationship. Semantic consensus evaluates impact on a user-locked claim.

## Redistribution boundary

Tests store small synthetic XML projections and identifiers, not copied complete abstracts. Live GenVM runs fetch the current PubMed response. The UI links to PubMed and displays the PubMed disclaimer. Snapshot hashes are observation diagnostics; they are not claimed to be permanent publication identities.
