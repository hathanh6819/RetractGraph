#!/usr/bin/env node
import{createAccount,createClient}from'../frontend/node_modules/genlayer-js/dist/index.js';
import{studioDevnet}from'../frontend/node_modules/genlayer-js/dist/chains/index.js';
const CONTRACT=process.argv[2];if(!/^0x[0-9a-fA-F]{40}$/.test(CONTRACT||''))throw Error('Usage: node scripts/run_live_failures.mjs <contract-address>');
const chain={...studioDevnet,id:61997,name:'Studio Next',rpcUrls:{default:{http:['https://studio-next.genlayer.com/api']}}};
function hidden(prompt){return new Promise((resolve,reject)=>{process.stdout.write(prompt);process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');let value='';const done=()=>{process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause()};const onData=chunk=>{for(const ch of chunk){if(ch==='\u0003'){done();reject(Error('Interrupted'));return}if(ch==='\r'||ch==='\n'){done();process.stdout.write('\n');resolve(value.trim());return}if(ch==='\u007f'||ch==='\b')value=value.slice(0,-1);else value+=ch}};process.stdin.on('data',onData)})}
async function signer(label){const secret=await hidden(`${label} private key: `),account=createAccount(secret.startsWith('0x')?secret:`0x${secret}`);return{account,client:createClient({chain,account})}}
const read=(client,fn,args=[])=>client.readContract({address:CONTRACT,functionName:fn,args,stateStatus:'finalized',jsonSafeReturn:true});
async function write(s,label,fn,args,validators=300n){const fees=await s.client.estimateTransactionFees({leaderTimeunitsAllocation:300n,validatorTimeunitsAllocation:validators});const before=await read(s.client,'get_counts');const hash=await s.client.writeContract({account:s.account,address:CONTRACT,functionName:fn,args,value:0n,fees:{distribution:fees.distribution,feeValue:fees.feeValue}});console.log(`${label}.tx=${hash}`);const receipt=await s.client.waitForTransactionReceipt({hash,waitUntil:'finalized',interval:3000,retries:600,fullTransaction:false}),tx=await s.client.getTransaction({hash}),after=await read(s.client,'get_counts');console.log(`${label}.execution=${receipt?.txExecutionResultName||'unknown'} consensus=${tx.result_name||tx.result} counts=${JSON.stringify(before)}->${JSON.stringify(after)}`);return hash}
const author=await signer('graph author'),observer=await signer('independent observer');
const before=await read(author.client,'get_counts');
console.log(`before=${JSON.stringify(before)}`);
await write(observer,'mismatched_replacement_notice','assess_notice',[1,'10969679','28515760']);
await write(observer,'failure_invalid_pair','assess_notice',[1,'27516793','27516793']);
await write(observer,'failure_stale_revision','reassess_claim',[1,3],600n);
await write(observer,'audit_reassess_child','reassess_claim',[2,4],600n);
console.log(`assessment.1=${JSON.stringify(await read(author.client,'get_assessment',[1]))}`);
console.log(`assessment.2=${JSON.stringify(await read(author.client,'get_assessment',[2]))}`);
console.log(`assessment.3=${JSON.stringify(await read(author.client,'get_assessment',[3]))}`);
console.log(`assessment.4=${JSON.stringify(await read(author.client,'get_assessment',[4]))}`);
console.log(`final.workspace=${JSON.stringify(await read(author.client,'get_workspace',[1]))}`);
console.log(`final.root=${JSON.stringify(await read(author.client,'get_claim',[1]))}`);
console.log(`final.child=${JSON.stringify(await read(author.client,'get_claim',[2]))}`);
console.log(`final.counts=${JSON.stringify(await read(author.client,'get_counts'))}`);
