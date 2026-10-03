import test from'node:test';import assert from'node:assert/strict';import{citationPmid,writeWithReadback}from'./actions.ts';
const account='0x1111111111111111111111111111111111111111';const hash='0x'+'a'.repeat(64);
function harness(){
 const counts={workspaces:1,claims:2,assessments:2};const workspaces:any={1:{id:1,creator:account,status:'DRAFT',claim_ids:[1,2],last_assessment_id:2}};
 const claims:any={1:{id:1,workspace_id:1,citations:['27516793'],parents:[],revision:3,last_support_assessment_id:1},2:{id:2,workspace_id:1,citations:['322561'],parents:[],revision:2,last_support_assessment_id:2}};const assessments:any={};let successful=true;
 const read=async(name:string,args:any[]=[]):Promise<any>=>{
  if(name==='get_counts')return{...counts};if(name==='get_workspace')return structuredClone(workspaces[Number(args[0])]||{});if(name==='get_claim')return structuredClone(claims[Number(args[0])]||{});if(name==='get_assessment')return structuredClone(assessments[Number(args[0])]||{});throw Error(name);
 };
 const write=async(_account:string,name:string,args:any[])=>{
  if(!successful)return hash;
  if(name==='create_workspace'){const id=++counts.workspaces;workspaces[id]={id,creator:account,status:'DRAFT',claim_ids:[],last_assessment_id:0}}
  if(name==='add_claim'){const id=++counts.claims;workspaces[Number(args[0])].claim_ids.push(id)}
  if(name==='add_citation')claims[Number(args[0])].citations.push(String(args[1]));
  if(name==='add_dependency')claims[Number(args[1])].parents.push(Number(args[0]));
  if(name==='verify_claim_support'||name==='reassess_claim'){const c=claims[Number(args[0])];const id=++counts.assessments;c.last_support_assessment_id=id;assessments[id]={claim_id:Number(args[0]),claim_revision:Number(args[1])}}
  if(name==='seal_workspace')workspaces[Number(args[0])].status='SEALED';
  if(name==='assess_notice'){const w=workspaces[Number(args[0])];const id=++counts.assessments;w.last_assessment_id=id;assessments[id]={workspace_id:Number(args[0]),article_pmid:String(args[1]),notice_pmid:String(args[2])}}
  return hash;
 };
 return{read,write,fail:()=>{successful=false}};
}
const actions:[string,any[]][]=[['create_workspace',['Evidence graph']],['add_claim',[1,'A claim with sufficient length for the graph.']],['add_citation',[1,'10969679']],['add_dependency',[1,2]],['verify_claim_support',[1,3]],['seal_workspace',[1]],['assess_notice',[1,'27516793','28515760']],['reassess_claim',[1,3]]];
test('citation helper keeps both PMID branches as strings for the contract schema',()=>{const root=citationPmid(1,1,'27516793','322561'),downstream=citationPmid(2,1,'27516793','322561');assert.equal(root,'27516793');assert.equal(downstream,'322561');assert.equal(typeof root,'string');assert.equal(typeof downstream,'string')});
for(const[name,args]of actions)test(`frontend waits for finalized state after ${name}`,async()=>{const h=harness();assert.equal(await writeWithReadback(account,name,args,{...h,pause:async()=>{}}),hash)});
test('finalized receipt without a matching state change is not reported as success',async()=>{const h=harness();h.fail();await assert.rejects(()=>writeWithReadback(account,'seal_workspace',[1],{...h,pause:async()=>{},attempts:2}),/expected state change/)});
