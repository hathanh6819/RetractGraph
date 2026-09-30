import{createClient}from'../frontend/node_modules/genlayer-js/dist/index.js';
import{studioDevnet}from'../frontend/node_modules/genlayer-js/dist/chains/index.js';
const address=process.argv[2];
if(!/^0x[0-9a-fA-F]{40}$/.test(address||''))throw Error('Usage: node scripts/inspect_live.mjs <contract-address>');
const chain={...studioDevnet,id:61997,name:'Studio Next',rpcUrls:{default:{http:['https://studio-next.genlayer.com/api']}}};
const client=createClient({chain});
for(const name of ['get_protocol','get_counts']){
 const value=await client.readContract({address,functionName:name,args:[],stateStatus:'finalized',jsonSafeReturn:true});
 console.log(`${name}=${JSON.stringify(value)}`);
}
