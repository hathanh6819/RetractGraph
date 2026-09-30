import importlib.util,json,sys,types
from pathlib import Path
import pytest

CREATOR="0x1111111111111111111111111111111111111111";OBSERVER="0x2222222222222222222222222222222222222222";OUTSIDER="0x3333333333333333333333333333333333333333"
ARTICLE="27516793";NOTICE="28515760";ALT="322561";WRONG_NOTICE="37086429"

def block(pmid,title,abstract,relations=""):
    return f"<PubmedArticle><MedlineCitation><PMID Version=\"1\">{pmid}</PMID><Article><ArticleTitle>{title}</ArticleTitle><Abstract><AbstractText>{abstract}</AbstractText></Abstract></Article></MedlineCitation><PubmedData>{relations}</PubmedData></PubmedArticle>"
def relation(kind,pmid):return f'<CommentsCorrectionsList><CommentsCorrections RefType="{kind}"><RefSource>Authority citation.</RefSource><PMID Version="1">{pmid}</PMID></CommentsCorrections></CommentsCorrectionsList>'
PAIR=("<PubmedArticleSet>"+block(ARTICLE,"Left ventricular pseudoaneurysm perceived as a left lung mass","A case report about diagnosis and surgical repair.",relation("RetractionIn",NOTICE))+block(NOTICE,"Retraction notice","This retracts the cited article.",relation("RetractionOf",ARTICLE))+"</PubmedArticleSet>").encode()
ALT_BODY=("<PubmedArticleSet>"+block(ARTICLE,"Original article","Retracted source.")+block(ALT,"Pseudoaneurysm of the left ventricle","A literature review of diagnosis after cardiac surgery.")+"</PubmedArticleSet>").encode()

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
    def __init__(self,status=200,body=PAIR):self.status=status;self.body=body
class Nondet:
    def __init__(self):
        self.response=Response();self.answer={"results":[{"claim_id":1,"verdict":"MATERIAL_INVALIDATION","reason_code":"RETRACTION_UNDERMINES_SUPPORT"}]};self.web=types.SimpleNamespace(get=self.get)
    def get(self,url,headers=None):self.last_url=url;self.last_headers=headers;return self.response
    def exec_prompt(self,*_,**__):return self.answer
class Eq:
    forced=None
    def prompt_comparative(self,fn,*_,**__):return self.forced if self.forced is not None else fn()

@pytest.fixture
def runtime(monkeypatch):
    nondet=Nondet();gl=types.ModuleType("genlayer");gl.__all__=["gl","u256","Address","TreeMap","typing"]
    gl.gl=gl;gl.Contract=ContractBase;gl.public=Public();gl.nondet=nondet;gl.eq_principle=Eq();gl.message=types.SimpleNamespace(sender_address=CREATOR);gl.message_raw={"datetime":"2026-09-29T00:00:00+00:00"};gl.u256=U256;gl.Address=Address;gl.TreeMap=TreeMap;gl.typing=types.SimpleNamespace(Any=object)
    monkeypatch.setitem(sys.modules,"genlayer",gl);spec=importlib.util.spec_from_file_location("retract_graph_test",Path("contracts/retract_graph.py"));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module.RetractGraph(),gl,nondet

def graph(c):
    assert int(c.create_workspace("Cardiac evidence lineage"))==1
    assert int(c.add_claim(U256(1),"A left ventricular pseudoaneurysm may appear as a lung mass after cardiac surgery."))==1
    assert c.add_citation(U256(1),ARTICLE)=="CITATION_ADDED"
    assert int(c.add_claim(U256(1),"Diagnostic guidance should explicitly consider cardiac pseudoaneurysm in this presentation."))==2
    assert c.add_citation(U256(2),ALT)=="CITATION_ADDED"
    assert c.add_dependency(U256(1),U256(2))=="DEPENDENCY_ADDED"
    assert c.seal_workspace(U256(1))=="SEALED"

def test_permissionless_workspace_and_constructor_has_no_roles(runtime):
    c,g,_=runtime;assert c.get_protocol()["roles"]=="permissionless-assessment-per-workspace";assert not hasattr(c,"owner")
    g.message.sender_address=OUTSIDER;assert int(c.create_workspace("Reviewer controlled test graph"))==1;assert c.get_workspace(U256(1))["creator"]==OUTSIDER

def test_build_and_seal_graph(runtime):
    c,_,_=runtime;graph(c);w=c.get_workspace(U256(1));assert w["status"]=="SEALED" and w["claim_ids"]==[1,2]
    assert c.get_claim(U256(2))["parents"]==[1]

def test_other_wallet_cannot_edit_but_can_assess(runtime):
    c,g,_=runtime;graph(c);g.message.sender_address=OBSERVER
    assert c.add_citation(U256(2),"10969679")=="ONLY_WORKSPACE_CREATOR"
    assert int(c.assess_notice(U256(1),ARTICLE,NOTICE))==1;assert c.get_assessment(U256(1))["requester"]==OBSERVER

def test_material_notice_creates_impact_wave(runtime):
    c,_,_=runtime;graph(c);aid=c.assess_notice(U256(1),ARTICLE,NOTICE);assert int(aid)==1
    assert c.get_claim(U256(1))["status"]=="BROKEN";assert c.get_claim(U256(2))["status"]=="RECHECK_REQUIRED"
    assert c.get_assessment(U256(1))["relation"]=="RetractionOf"

def test_limited_impact_narrows_and_propagates(runtime):
    c,_,n=runtime;graph(c);n.answer={"results":[{"claim_id":1,"verdict":"LIMITED_IMPACT","reason_code":"CORRECTION_NARROWS_SUPPORT"}]}
    c.assess_notice(U256(1),ARTICLE,NOTICE);assert c.get_claim(U256(1))["status"]=="NARROWED" and c.get_claim(U256(2))["status"]=="RECHECK_REQUIRED"

def test_no_impact_does_not_propagate(runtime):
    c,_,n=runtime;graph(c);n.answer={"results":[{"claim_id":1,"verdict":"NO_MATERIAL_IMPACT","reason_code":"NOTICE_UNRELATED_TO_CLAIM"}]}
    c.assess_notice(U256(1),ARTICLE,NOTICE);assert c.get_claim(U256(1))["status"]=="CURRENT" and c.get_claim(U256(2))["status"]=="CURRENT"

def test_wrong_notice_relation_fails_closed(runtime):
    c,_,n=runtime;graph(c);wrong=("<PubmedArticleSet>"+block(ARTICLE,"Article","Abstract")+block(NOTICE,"Wrong notice","Other article",relation("RetractionOf","31829105"))+"</PubmedArticleSet>").encode();n.response=Response(body=wrong)
    before=c.get_claim(U256(1));aid=c.assess_notice(U256(1),ARTICLE,NOTICE);assert int(aid)==1
    assert c.get_assessment(U256(1))["reason"]=="NOTICE_RELATION_MISMATCH";assert c.get_claim(U256(1))==before

@pytest.mark.parametrize("status,body,reason",[(503,PAIR,"SOURCE_UNAVAILABLE"),(200,b"tiny","SOURCE_UNAVAILABLE"),(200,("<PubmedArticleSet>"+block(ARTICLE,"Only","One")+"</PubmedArticleSet>").encode(),"SOURCE_IDENTITY_MISMATCH")])
def test_source_failures_do_not_mutate_claims(runtime,status,body,reason):
    c,_,n=runtime;graph(c);n.response=Response(status,body);before1=c.get_claim(U256(1));before2=c.get_claim(U256(2));aid=c.assess_notice(U256(1),ARTICLE,NOTICE)
    assert c.get_assessment(aid)["reason"]==reason and c.get_claim(U256(1))==before1 and c.get_claim(U256(2))==before2

@pytest.mark.parametrize("answer",[
 {"results":[{"claim_id":2,"verdict":"MATERIAL_INVALIDATION","reason_code":"RETRACTION_UNDERMINES_SUPPORT"}]},
 {"results":[{"claim_id":1,"verdict":"MATERIAL_INVALIDATION","reason_code":"NOTICE_UNRELATED_TO_CLAIM"}]},
 {"results":[{"claim_id":1,"verdict":"DROP_DATABASE","reason_code":"INSUFFICIENT_DETAIL"}]},
 {"verdict":"MATERIAL_INVALIDATION"}
])
def test_malformed_or_contradictory_model_fails_closed(runtime,answer):
    c,_,n=runtime;graph(c);n.answer=answer;before=c.get_claim(U256(1));aid=c.assess_notice(U256(1),ARTICLE,NOTICE)
    assert c.get_assessment(aid)["status"]=="UNRESOLVED" and c.get_claim(U256(1))==before

def test_consensus_disagreement_fails_closed(runtime):
    c,g,_=runtime;graph(c);g.eq_principle.forced='{"different":"validator outputs"}';before=c.get_claim(U256(1));aid=c.assess_notice(U256(1),ARTICLE,NOTICE)
    assert c.get_assessment(aid)["reason"]=="CONSENSUS_INVALID" and c.get_claim(U256(1))==before

def test_exact_notice_replay_is_rejected_without_mutation(runtime):
    c,_,_=runtime;graph(c);c.assess_notice(U256(1),ARTICLE,NOTICE);before=(c.get_counts(),c.get_claim(U256(1)),c.get_claim(U256(2)))
    assert c.assess_notice(U256(1),ARTICLE,NOTICE)=="NOTICE_ALREADY_ASSESSED";assert before==(c.get_counts(),c.get_claim(U256(1)),c.get_claim(U256(2)))

def test_cross_workspace_and_unknown_article_are_rejected(runtime):
    c,_,_=runtime;graph(c);before=c.get_counts();assert c.assess_notice(U256(1),"31829105",NOTICE)=="ARTICLE_NOT_IN_WORKSPACE";assert c.get_counts()==before

def test_creator_repairs_and_any_wallet_reassesses(runtime):
    c,g,n=runtime;graph(c);c.assess_notice(U256(1),ARTICLE,NOTICE);assert c.add_citation(U256(1),ALT)=="CITATION_ADDED";claim=c.get_claim(U256(1));assert claim["status"]=="PENDING_RECHECK"
    n.response=Response(body=ALT_BODY);n.answer={"verdict":"SUPPORT_SUFFICIENT","reason_code":"CLAIM_DIRECTLY_SUPPORTED"};g.message.sender_address=OBSERVER
    aid=c.reassess_claim(U256(1),U256(claim["revision"]));assert int(aid)==2 and c.get_claim(U256(1))["status"]=="CURRENT"

def test_reassessment_failure_and_stale_revision(runtime):
    c,_,n=runtime;graph(c);c.assess_notice(U256(1),ARTICLE,NOTICE);c.add_citation(U256(1),ALT);claim=c.get_claim(U256(1));before=c.get_claim(U256(1))
    assert c.reassess_claim(U256(1),U256(claim["revision"]-1))=="STALE_CLAIM_REVISION" and c.get_claim(U256(1))==before
    n.response=Response(429,ALT_BODY);aid=c.reassess_claim(U256(1),U256(claim["revision"]));assert c.get_assessment(aid)["status"]=="UNRESOLVED" and c.get_claim(U256(1))["status"]=="UNRESOLVED"

def test_authorization_bounds_and_cycle_prevention(runtime):
    c,g,_=runtime;c.create_workspace("Bounded research graph");c.add_claim(U256(1),"First claim has enough meaningful text for validation.");c.add_citation(U256(1),ARTICLE);c.add_claim(U256(1),"Second claim also has enough meaningful text for validation.");c.add_citation(U256(2),ALT)
    assert c.add_dependency(U256(2),U256(1))=="DEPENDENCY_ORDER_INVALID"
    g.message.sender_address=OUTSIDER;before=c.get_workspace(U256(1));assert c.seal_workspace(U256(1))=="ONLY_WORKSPACE_CREATOR" and c.get_workspace(U256(1))==before

def test_protocol_counts_and_fixed_source(runtime):
    c,_,n=runtime;graph(c);c.assess_notice(U256(1),ARTICLE,NOTICE);assert c.get_counts()=={"workspaces":1,"claims":2,"assessments":1}
    assert n.last_url=="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=27516793,28515760"

def test_article_side_relation_is_sufficient_when_notice_projection_omits_link(runtime):
    c,_,n=runtime;graph(c);n.response=Response(body=("<PubmedArticleSet>"+block(ARTICLE,"Article","Abstract",relation("RetractionIn",NOTICE))+block(NOTICE,"Notice","Retracts the article")+"</PubmedArticleSet>").encode())
    aid=c.assess_notice(U256(1),ARTICLE,NOTICE);assert int(aid)==1 and c.get_assessment(U256(1))["relation"]=="RetractionOf"

def test_pubmed_relation_wrapper_is_not_mistaken_for_relation(runtime):
    c,_,_=runtime;graph(c);aid=c.assess_notice(U256(1),ARTICLE,NOTICE)
    assert int(aid)==1 and c.get_assessment(U256(1))["status"]=="ASSESSED"
    assert c.get_claim(U256(1))["status"]=="BROKEN" and c.get_claim(U256(2))["status"]=="RECHECK_REQUIRED"
