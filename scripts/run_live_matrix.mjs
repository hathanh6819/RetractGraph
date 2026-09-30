#!/usr/bin/env node
import{createAccount,createClient}from'../frontend/node_modules/genlayer-js/dist/index.js';
import{studioDevnet}from'../frontend/node_modules/genlayer-js/dist/chains/index.js';
const CONTRACT=process.argv[2];if(!/^0x[0-9a-fA-F]{40}$/.test(CONTRACT||''))throw Error('Usage: node scripts/run_live_matrix.mjs <contract-address>');
const chain={...studioDevnet,id:61997,name:'Studio Next',rpcUrls:{default:{http:['https://studio-next.genlayer.com/api']}}};
function hidden(prompt){return new Promise((resolve,reject)=>{process.stdout.write(prompt);process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');let value='';const done=()=>{process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause()};const onData=chunk=>{for(const ch of chunk){if(ch==='\u0003'){done();reject(Error('Interrupted'));return}if(ch==='\r'||ch==='\n'){done();process.stdout.write('\n');resolve(value.trim());return}if(ch==='\u007f'||ch==='\b')value=value.slice(0,-1);else value+=ch}};process.stdin.on('data',onData)})}
async function signer(label){const secret=await hidden(`${label} private key: `),account=createAccount(secret.startsWith('0x')?secret:`0x${secret}`);return{account,client:createClient({chain,account})}}
const read=(client,fn,args=[])=>client.readContract({address:CONTRACT,functionName:fn,args,stateStatus:'finalized',jsonSafeReturn:true});
async function write(s,label,fn,args,validators=300n){const fees=await s.client.estimateTransactionFees({leaderTimeunitsAllocation:300n,validatorTimeunitsAllocation:validators});const before=await read(s.client,'get_counts');const hash=await s.client.writeContract({account:s.account,address:CONTRACT,functionName:fn,args,value:0n,fees:{distribution:fees.distribution,feeValue:fees.feeValue}});console.log(`${label}.tx=${hash}`);const receipt=await s.client.waitForTransactionReceipt({hash,waitUntil:'finalized',interval:3000,retries:600,fullTransaction:false}),tx=await s.client.getTransaction({hash}),after=await read(s.client,'get_counts');console.log(`${label}.execution=${receipt?.txExecutionResultName||'unknown'} consensus=${tx.result_name||tx.result} counts=${JSON.stringify(before)}->${JSON.stringify(after)}`);return hash}
const author=await signer('graph author'),observer=await signer('independent observer');if(author.account.address.toLowerCase()===observer.account.address.toLowerCase())throw Error('Two distinct wallets required');
console.log(`author=${author.account.address} observer=${observer.account.address}`);console.log(`protocol=${JSON.stringify(await read(author.client,'get_protocol'))}`);
const initial=await read(author.client,'get_counts');const wid=Number(initial.workspaces)+1,c1=Number(initial.claims)+1,c2=c1+1;
await write(author,'create_workspace','create_workspace',['Cardiac evidence lineage']);
await write(author,'add_root_claim','add_claim',[wid,'A left ventricular pseudoaneurysm may appear as a lung mass after cardiac surgery.']);
await write(author,'cite_retracted_article','add_citation',[c1,'27516793']);
await write(author,'add_downstream_claim','add_claim',[wid,'Diagnostic guidance should explicitly consider cardiac pseudoaneurysm in this presentation.']);
await write(author,'cite_independent_article','add_citation',[c2,'322561']);
await write(author,'link_dependency','add_dependency',[c1,c2]);
await write(observer,'unauthorized_graph_edit','add_citation',[c2,'10969679']);
await write(author,'seal_workspace','seal_workspace',[wid]);
console.log(`sealed=${JSON.stringify(await read(author.client,'get_workspace',[wid]))}`);
await write(observer,'cross_object_notice','assess_notice',[wid,'27516793','37086429'],600n);
console.log(`after_cross_object.root=${JSON.stringify(await read(author.client,'get_claim',[c1]))}`);
await write(observer,'assess_valid_retraction','assess_notice',[wid,'27516793','28515760'],600n);
console.log(`impact.root=${JSON.stringify(await read(author.client,'get_claim',[c1]))}`);console.log(`impact.child=${JSON.stringify(await read(author.client,'get_claim',[c2]))}`);
await write(observer,'replay_notice','assess_notice',[wid,'27516793','28515760'],600n);
await write(author,'add_replacement','add_citation',[c1,'10969679']);
const repaired=await read(author.client,'get_claim',[c1]);await write(observer,'reassess_repaired_branch','reassess_claim',[c1,Number(repaired.revision)],600n);
console.log(`final.workspace=${JSON.stringify(await read(author.client,'get_workspace',[wid]))}`);console.log(`final.root=${JSON.stringify(await read(author.client,'get_claim',[c1]))}`);console.log(`final.child=${JSON.stringify(await read(author.client,'get_claim',[c2]))}`);console.log(`final.counts=${JSON.stringify(await read(author.client,'get_counts'))}`);
