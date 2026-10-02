import importlib.util,json,sys,types
from pathlib import Path
import pytest

CREATOR="0x1111111111111111111111111111111111111111";OBSERVER="0x2222222222222222222222222222222222222222";OUTSIDER="0x3333333333333333333333333333333333333333"
ARTICLE="27516793";NOTICE="28515760";ALT="322561"
def block(pmid,title,abstract,relations=""):return f'<PubmedArticle><MedlineCitation><PMID>{pmid}</PMID><Article><ArticleTitle>{title}</ArticleTitle><Abstract><AbstractText>{abstract}</AbstractText></Abstract></Article></MedlineCitation><PubmedData>{relations}</PubmedData></PubmedArticle>'
def relation(kind,pmid):return f'<CommentsCorrectionsList><CommentsCorrections RefType="{kind}"><PMID>{pmid}</PMID></CommentsCorrections></CommentsCorrectionsList>'
def envelope(*items):return ("<PubmedArticleSet>"+"".join(items)+"</PubmedArticleSet>").encode()
ARTICLE_BLOCK=block(ARTICLE,"Left ventricular pseudoaneurysm perceived as a left lung mass","Diagnosis and surgical repair.",relation("RetractionIn",NOTICE));NOTICE_BLOCK=block(NOTICE,"Retraction notice","Retracts the cited article.",relation("RetractionOf",ARTICLE));ALT_BLOCK=block(ALT,"Pseudoaneurysm of the left ventricle","Independent diagnostic literature.")

class TreeMap(dict):
 @classmethod
 def __class_getitem__(cls,_):return cls
class U256(int):pass
class Address(str):pass
class ContractBase:
 def __init_subclass__(cls,**kw):
  original=cls.__dict__.get("__init__")
  def init(self,*args,**kwargs):
   for name,kind in cls.__annotations__.items():
    if kind is TreeMap:setattr(self,name,TreeMap())
   original(self,*args,**kwargs)
  cls.__init__=init
class Write:
 def __call__(self,fn):return fn
class Public:write=Write();view=staticmethod(lambda fn:fn)
class Response:
 def __init__(self,status=200,body=b""):self.status=status;self.body=body
class Nondet:
 def __init__(self):self.override=None;self.answer={"verdict":"SUPPORT_SUFFICIENT","reason_code":"CLAIM_DIRECTLY_SUPPORTED"};self.web=types.SimpleNamespace(get=self.get)
 def get(self,url,headers=None):
  self.last_url=url
  if self.override is not None:return self.override
  ids=url.rsplit("=",1)[1].split(",");lookup={ARTICLE:ARTICLE_BLOCK,NOTICE:NOTICE_BLOCK,ALT:ALT_BLOCK};return Response(body=envelope(*(lookup[x] for x in ids)))
 def exec_prompt(self,*_,**__):return self.answer
class Eq:
 forced=None
 def prompt_comparative(self,fn,*_,**__):return self.forced if self.forced is not None else fn()

@pytest.fixture
def runtime(monkeypatch):
 n=Nondet();gl=types.ModuleType("genlayer");gl.__all__=["gl","u256","Address","TreeMap","typing"];gl.gl=gl;gl.Contract=ContractBase;gl.public=Public();gl.nondet=n;gl.eq_principle=Eq();gl.message=types.SimpleNamespace(sender_address=CREATOR);gl.message_raw={"datetime":"2026-09-29T00:00:00+00:00"};gl.u256=U256;gl.Address=Address;gl.TreeMap=TreeMap;gl.typing=types.SimpleNamespace(Any=object)
 monkeypatch.setitem(sys.modules,"genlayer",gl);spec=importlib.util.spec_from_file_location("retract_graph_test",Path("contracts/retract_graph.py"));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m.RetractGraph(),gl,n

def draft(c):
 assert int(c.create_workspace("Cardiac evidence lineage"))==1
 assert int(c.add_claim(U256(1),"A left ventricular pseudoaneurysm may appear as a lung mass after cardiac surgery."))==1;assert c.add_citation(U256(1),ARTICLE)=="CITATION_ADDED"
 assert int(c.add_claim(U256(1),"Diagnostic guidance should explicitly consider cardiac pseudoaneurysm in this presentation."))==2;assert c.add_citation(U256(2),ALT)=="CITATION_ADDED";assert c.add_dependency(U256(1),U256(2))=="DEPENDENCY_ADDED"
def verified(c,n):
 draft(c)
 for cid in (1,2):
  claim=c.get_claim(U256(cid));n.answer={"verdict":"SUPPORT_SUFFICIENT","reason_code":"CLAIM_DIRECTLY_SUPPORTED"};assert int(c.verify_claim_support(U256(cid),U256(claim["revision"])))==cid
def sealed(c,n):verified(c,n);assert c.seal_workspace(U256(1))=="SEALED"

def test_claims_are_not_current_before_collective_verification(runtime):
 c,_,_=runtime;draft(c);assert c.get_claim(U256(1))["status"]=="PENDING_SUPPORT";assert c.seal_workspace(U256(1))=="CLAIM_SUPPORT_NOT_CURRENT"
def test_support_is_bound_to_claim_revision_and_citations(runtime):
 c,_,n=runtime;verified(c,n);claim=c.get_claim(U256(2));assert claim["status"]=="CURRENT" and claim["support_revision"]==claim["revision"]
 a=c.get_assessment(U256(2));assert a["claim_id"]==2 and a["citations"]==[ALT] and a["phase"]=="INITIAL_SUPPORT"
 assert c.get_workspace(U256(1))["last_assessment_id"]==2
 assert claim["support_evidence_digest"].startswith("sha256:") and claim["impact_evidence_digest"]==""
def test_seal_requires_complete_support_and_dependency(runtime):
 c,_,n=runtime;verified(c,n);assert c.seal_workspace(U256(1))=="SEALED"
 c2=c.__class__();c2.create_workspace("Independent claims graph")
 for text,pmid in (("First independently supported scientific claim.",ARTICLE),("Second independently supported scientific claim.",ALT)):
  cid=c2.add_claim(U256(1),text);c2.add_citation(cid,pmid);claim=c2.get_claim(cid);c2.verify_claim_support(cid,U256(claim["revision"]))
 assert c2.seal_workspace(U256(1))=="GRAPH_MISSING_DEPENDENCY"
def test_graph_mutation_invalidates_support(runtime):
 c,_,n=runtime;draft(c);root=c.get_claim(U256(1));c.verify_claim_support(U256(1),U256(root["revision"]));assert c.add_citation(U256(1),ALT)=="CITATION_ADDED";root=c.get_claim(U256(1));assert root["status"]=="PENDING_SUPPORT" and root["support_status"]=="NOT_VERIFIED"
def test_permissionless_verification_but_creator_only_edit(runtime):
 c,g,_=runtime;draft(c);g.message.sender_address=OBSERVER;claim=c.get_claim(U256(1));assert int(c.verify_claim_support(U256(1),U256(claim["revision"])))==1;assert c.add_citation(U256(2),"10969679")=="ONLY_WORKSPACE_CREATOR"
def test_support_failure_and_source_failure_close_claim(runtime):
 c,_,n=runtime;draft(c);claim=c.get_claim(U256(1));n.answer={"verdict":"SUPPORT_INSUFFICIENT","reason_code":"CLAIM_NOT_SUPPORTED"};c.verify_claim_support(U256(1),U256(claim["revision"]));assert c.get_claim(U256(1))["status"]=="BROKEN"
def test_material_notice_invalidates_edge_and_propagates(runtime):
 c,_,n=runtime;sealed(c,n);n.answer={"results":[{"claim_id":1,"verdict":"MATERIAL_INVALIDATION","reason_code":"RETRACTION_UNDERMINES_SUPPORT"}]};assert int(c.assess_notice(U256(1),ARTICLE,NOTICE))==3
 assert c.get_claim(U256(1))["support_status"]=="INVALIDATED" and c.get_claim(U256(2))["status"]=="RECHECK_REQUIRED" and c.get_claim(U256(2))["support_status"]=="STALE"
 root=c.get_claim(U256(1));child=c.get_claim(U256(2));assert root["support_evidence_digest"] and root["impact_evidence_digest"] and root["support_evidence_digest"]!=root["impact_evidence_digest"]
 assert child["last_assessment_id"]==3 and child["last_support_assessment_id"]==2 and child["support_status"]=="STALE" and child["impact_evidence_digest"]==""
 assert c.get_workspace(U256(1))["last_assessment_id"]==3
def test_no_impact_preserves_current_support(runtime):
 c,_,n=runtime;sealed(c,n);claim_before=c.get_claim(U256(1));support_digest=claim_before["support_evidence_digest"];n.answer={"results":[{"claim_id":1,"verdict":"NO_MATERIAL_IMPACT","reason_code":"NOTICE_UNRELATED_TO_CLAIM"}]};c.assess_notice(U256(1),ARTICLE,NOTICE);claim=c.get_claim(U256(1));assert claim["status"]=="CURRENT" and claim["support_revision"]==claim["revision"]
 assert claim["support_evidence_digest"]==support_digest and claim["impact_evidence_digest"] and c.get_workspace(U256(1))["last_assessment_id"]==3
def test_wrong_notice_and_consensus_disagreement_fail_closed(runtime):
 c,_,n=runtime;sealed(c,n);before=c.get_claim(U256(1));n.override=Response(body=envelope(block(ARTICLE,"Article","Abstract"),block(NOTICE,"Wrong","Other",relation("RetractionOf","31829105"))));aid=c.assess_notice(U256(1),ARTICLE,NOTICE);assert c.get_assessment(aid)["reason"]=="NOTICE_RELATION_MISMATCH" and c.get_claim(U256(1))==before
def test_consensus_disagreement_records_unresolved_without_mutating_claim(runtime):
 c,_,n=runtime;sealed(c,n);before=c.get_claim(U256(1));Eq.forced='{"kind":"CONFLICT","reason":"independent validators disagreed"}'
 try:aid=c.assess_notice(U256(1),ARTICLE,NOTICE)
 finally:Eq.forced=None
 a=c.get_assessment(aid);assert a["status"]=="UNRESOLVED" and a["reason"]=="CONSENSUS_INVALID" and c.get_claim(U256(1))==before and c.get_workspace(U256(1))["last_assessment_id"]==3
def test_source_failure_records_unresolved_without_mutating_claim(runtime):
 c,_,n=runtime;sealed(c,n);before=c.get_claim(U256(1));n.override=Response(status=503,body=b"temporary source outage");aid=c.assess_notice(U256(1),ARTICLE,NOTICE)
 a=c.get_assessment(aid);assert a["status"]=="UNRESOLVED" and a["reason"]=="SOURCE_UNAVAILABLE" and c.get_claim(U256(1))==before
def test_repair_reassessment_and_replay(runtime):
 c,_,n=runtime;sealed(c,n);n.answer={"results":[{"claim_id":1,"verdict":"MATERIAL_INVALIDATION","reason_code":"RETRACTION_UNDERMINES_SUPPORT"}]};c.assess_notice(U256(1),ARTICLE,NOTICE);assert c.assess_notice(U256(1),ARTICLE,NOTICE)=="NOTICE_ALREADY_ASSESSED"
 assert c.add_citation(U256(1),ALT)=="CITATION_ADDED";claim=c.get_claim(U256(1));assert c.reassess_claim(U256(1),U256(claim["revision"]-1))=="STALE_CLAIM_REVISION";n.answer={"verdict":"SUPPORT_SUFFICIENT","reason_code":"CLAIM_DIRECTLY_SUPPORTED"};assert int(c.reassess_claim(U256(1),U256(claim["revision"])))==4
 assert c.get_workspace(U256(1))["last_assessment_id"]==4
 assert c.get_claim(U256(1))["impact_evidence_digest"]==""
def test_protocol_v5_and_reviewer_can_create(runtime):
 c,g,_=runtime;p=c.get_protocol();assert p["version"]==5 and p["seal_policy"]=="ALL_CLAIMS_COLLECTIVELY_VERIFIED" and p["architecture"]=="separate-support-impact-evidence-and-assessment-readback";g.message.sender_address=OUTSIDER;assert int(c.create_workspace("Reviewer controlled test graph"))==1
