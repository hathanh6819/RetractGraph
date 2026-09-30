from pathlib import Path

SOURCE=Path("contracts/retract_graph.py").read_text(encoding="utf-8")

def test_locked_runtime_header():
    lines=SOURCE.splitlines();assert lines[0]=="# v0.2.16";assert lines[1]=='# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'

def test_no_constructor_roles_or_custody():
    assert "def __init__(self):" in SOURCE and "payable" not in SOURCE and "emit_transfer" not in SOURCE
    assert '"custody":False' in SOURCE and "owner:" not in SOURCE

def test_source_is_contract_derived_and_bounded():
    assert 'EFETCH="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id="' in SOURCE
    assert "MAX_BODY=120000" in SOURCE and "parse_pubmed(body" in SOURCE

def test_assessment_is_permissionless_and_consensus_backed():
    segment=SOURCE.split("def assess_notice",1)[1].split("def reassess_claim",1)[0]
    assert "ONLY_WORKSPACE_CREATOR" not in segment
    assert "prompt_comparative" in segment and "NOTICE_RELATION_MISMATCH" in segment

def test_propagation_is_bounded_to_workspace_claim_ids():
    segment=SOURCE.split("def _children",1)[1].split("def _propagate",1)[0]
    assert 'for cid in w["claim_ids"]' in segment
    assert "range(1,int(self.claim_count)+1)" not in segment
