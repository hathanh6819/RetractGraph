#!/usr/bin/env node
import{createAccount,createClient}from'../frontend/node_modules/genlayer-js/dist/index.js';
import{studioDevnet}from'../frontend/node_modules/genlayer-js/dist/chains/index.js';

const CONTRACT=process.argv[2];
if(!/^0x[0-9a-fA-F]{40}$/.test(CONTRACT||''))throw Error('Usage: node scripts/run_live_v5_e2e.mjs <v5-contract-address>');
const EXPECTED_AUTHOR='0x1D283b45974B0be9630DFD1deC6A62a9B72B2760';
const EXPECTED_OBSERVER='0xf96Cf822F9f4e76956AB9fAAa22B3BdCD7b10aD6';
const chain={...studioDevnet,id:61997,name:'Studio Next',rpcUrls:{default:{http:['https://studio-next.genlayer.com/api']}}};
function hidden(prompt){return new Promise((resolve,reject)=>{process.stdout.write(prompt);process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');let value='';const done=()=>{process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause()};const onData=chunk=>{for(const ch of chunk){if(ch==='\u0003'){done();reject(Error('Interrupted'));return}if(ch==='\r'||ch==='\n'){done();process.stdout.write('\n');resolve(value.trim());return}if(ch==='\u007f'||ch==='\b')value=value.slice(0,-1);else value+=ch}};process.stdin.on('data',onData)})}
async function signer(label){const key=await hidden(`${label} private key (hidden input): `),account=createAccount(key.startsWith('0x')?key:`0x${key}`);return{account,client:createClient({chain,account})}}
const author=await signer('author test wallet'),observer=await signer('observer test wallet');
if(author.account.address.toLowerCase()!==EXPECTED_AUTHOR.toLowerCase()||observer.account.address.toLowerCase()!==EXPECTED_OBSERVER.toLowerCase())throw Error('Wallet address mismatch; no transactions were sent. Check that the previously designated test wallets were entered in author/observer order.');
if(author.account.address.toLowerCase()===observer.account.address.toLowerCase())throw Error('Two distinct wallets are required.');
const read=(s,name,args=[])=>s.client.readContract({address:CONTRACT,functionName:name,args,stateStatus:'finalized',jsonSafeReturn:true});
const protocol=await read(author,'get_protocol'),initial=await read(author,'get_counts');
if(protocol.version!==5||Number(protocol.chain_id)!==61997)throw Error(`Wrong contract/network: ${JSON.stringify(protocol)}`);
if(Number(initial.workspaces)!==0||Number(initial.claims)!==0||Number(initial.assessments)!==0)throw Error(`Refusing to assume empty test state: ${JSON.stringify(initial)}`);
console.log(`e2e.contract=${CONTRACT}`);console.log(`e2e.author=${author.account.address} observer=${observer.account.address}`);console.log(`e2e.protocol=${JSON.stringify(protocol)}`);
async function write(s,label,name,args,validators=600n,allowDisagreement=false){
 const fees=await s.client.estimateTransactionFees({leaderTimeunitsAllocation:300n,validatorTimeunitsAllocation:validators});
 const hash=await s.client.writeContract({account:s.account,address:CONTRACT,functionName:name,args,value:0n,fees:{distribution:fees.distribution,feeValue:fees.feeValue}});
 console.log(`${label}.submitted=${hash}`);
 const receipt=await s.client.waitForTransactionReceipt({hash,waitUntil:'finalized',interval:3000,retries:600,fullTransaction:false});
 const tx=await s.client.getTransaction({hash});
 if(receipt?.txExecutionResultName&&receipt.txExecutionResultName!=='FINISHED_WITH_RETURN')throw Error(`${label} did not finish: ${receipt.txExecutionResultName}`);
 const consensus=tx.result_name||tx.result||'UNKNOWN';
 if(String(consensus).includes('DISAGREE')&&!allowDisagreement)throw Error(`${label} reached conflicting consensus: ${consensus}`);
 console.log(`${label}.tx=${hash} execution=${receipt?.txExecutionResultName||'unknown'} consensus=${consensus}`);
 return hash;
}
const expect=(ok,label,data)=>{if(!ok)throw Error(`${label} failed readback: ${JSON.stringify(data)}`);console.log(`${label}.readback=${JSON.stringify(data)}`)};

// Happy graph creation and independent validation.
await write(author,'create_workspace','create_workspace',['Cardiac evidence lineage']);
let counts=await read(author,'get_counts');const wid=Number(counts.workspaces),rootId=Number(counts.claims)+1,childId=rootId+1;
await write(author,'add_root_claim','add_claim',[wid,'A left ventricular pseudoaneurysm may appear as a lung mass after cardiac surgery.']);
await write(author,'cite_retracted_article','add_citation',[rootId,'27516793']);
await write(author,'add_downstream_claim','add_claim',[wid,'Diagnostic guidance should explicitly consider cardiac pseudoaneurysm in this presentation.']);
await write(author,'cite_independent_article','add_citation',[childId,'322561']);
await write(author,'link_dependency','add_dependency',[rootId,childId]);
let before=await read(author,'get_claim',[childId]);
await write(observer,'unauthorized_creator_edit','add_citation',[childId,'10969679'],300n);
let after=await read(author,'get_claim',[childId]);expect(JSON.stringify(after)===JSON.stringify(before),'unauthorized edit leaves graph unchanged',{before,after});
let root=await read(author,'get_claim',[rootId]);await write(observer,'verify_root_support','verify_claim_support',[rootId,Number(root.revision)]);
root=await read(author,'get_claim',[rootId]);expect(root.status==='CURRENT'&&root.support_evidence_digest&&!root.impact_evidence_digest,'root support assessment',root);
let child=await read(author,'get_claim',[childId]);await write(observer,'verify_child_support','verify_claim_support',[childId,Number(child.revision)]);
child=await read(author,'get_claim',[childId]);expect(child.status==='CURRENT'&&child.support_evidence_digest&&!child.impact_evidence_digest,'child support assessment',child);
let workspace=await read(author,'get_workspace',[wid]);expect(Number(workspace.last_assessment_id)===Number(child.last_assessment_id),'workspace tracks last support assessment',workspace);
await write(author,'seal_workspace','seal_workspace',[wid]);workspace=await read(author,'get_workspace',[wid]);expect(workspace.status==='SEALED','seal requires complete support',workspace);

// Failure and conflict controls must not alter claim state.
before=await read(author,'get_claim',[rootId]);counts=await read(author,'get_counts');
await write(observer,'failure_invalid_pmids','assess_notice',[wid,'27516793','27516793'],300n);
after=await read(author,'get_claim',[rootId]);let afterCounts=await read(author,'get_counts');expect(JSON.stringify(after)===JSON.stringify(before)&&Number(afterCounts.assessments)===Number(counts.assessments),'invalid PMID pair is non-mutating',{after,afterCounts});
await write(observer,'failure_stale_revision','reassess_claim',[rootId,Number(root.revision)],300n);
after=await read(author,'get_claim',[rootId]);afterCounts=await read(author,'get_counts');expect(JSON.stringify(after)===JSON.stringify(before)&&Number(afterCounts.assessments)===Number(counts.assessments),'stale revision is non-mutating',{after,afterCounts});
const conflict=await write(observer,'conflicting_cross_object_notice','assess_notice',[wid,'27516793','37086429'],600n,true);
after=await read(author,'get_claim',[rootId]);afterCounts=await read(author,'get_counts');expect(String(conflict.consensus).includes('DISAGREE')&&JSON.stringify(after)===JSON.stringify(before)&&Number(afterCounts.assessments)===Number(counts.assessments),'conflicting-source disagreement fails closed without state mutation',{consensus:conflict.consensus,after,afterCounts});

// Material retraction, replay protection, repair, and recovery.
await write(observer,'assess_valid_retraction','assess_notice',[wid,'27516793','28515760']);
root=await read(author,'get_claim',[rootId]);child=await read(author,'get_claim',[childId]);expect(root.status==='BROKEN'&&root.impact_evidence_digest&&root.support_evidence_digest&&child.status==='RECHECK_REQUIRED'&&child.support_status==='STALE'&&child.last_assessment_id===root.last_assessment_id&&!child.impact_evidence_digest,'impact is edge-scoped and propagates a recheck', {root,child});
counts=await read(author,'get_counts');await write(observer,'replay_same_notice','assess_notice',[wid,'27516793','28515760'],300n);afterCounts=await read(author,'get_counts');expect(Number(afterCounts.assessments)===Number(counts.assessments),'replay does not create another assessment',afterCounts);
await write(author,'repair_root_citation','add_citation',[rootId,'10969679'],300n);root=await read(author,'get_claim',[rootId]);expect(root.status==='PENDING_SUPPORT'&&!root.support_evidence_digest&&!root.impact_evidence_digest,'repair invalidates prior evidence digests',root);
await write(observer,'reassess_repaired_root','reassess_claim',[rootId,Number(root.revision)]);
root=await read(author,'get_claim',[rootId]);expect(root.status==='CURRENT'&&root.support_evidence_digest&&!root.impact_evidence_digest,'repaired root support readback',root);
child=await read(author,'get_claim',[childId]);await write(observer,'reassess_downstream_claim','reassess_claim',[childId,Number(child.revision)]);
child=await read(author,'get_claim',[childId]);expect(child.status==='CURRENT'&&child.support_evidence_digest,'downstream recovery readback',child);
workspace=await read(author,'get_workspace',[wid]);const finalCounts=await read(author,'get_counts');expect(Number(workspace.last_assessment_id)===Number(child.last_assessment_id),'workspace latest assessment final readback',workspace);
console.log(`e2e.final.counts=${JSON.stringify(finalCounts)}`);console.log(`e2e.final.workspace=${JSON.stringify(workspace)}`);console.log(`e2e.final.root=${JSON.stringify(root)}`);console.log(`e2e.final.child=${JSON.stringify(child)}`);console.log('e2e.result=PASS');
