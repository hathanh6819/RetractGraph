import{createClient}from'genlayer-js';
import{studioDevnet}from'genlayer-js/chains';
import type{CalldataEncodable,TransactionHash}from'genlayer-js/types';

export const studioNext={...studioDevnet,id:61997,name:'GenLayer Studio Next',rpcUrls:{default:{http:['https://studio-next.genlayer.com/api']}}};
const env=(import.meta as ImportMeta&{env?:Record<string,string>}).env;
export const CONTRACT=(env?.VITE_CONTRACT_ADDRESS||'').trim();
export const configured=/^0x[a-fA-F0-9]{40}$/.test(CONTRACT);
export const explorer=configured?`https://explorer-studio-dev.genlayer.com/address/${CONTRACT}`:'';
export const reader=createClient({chain:studioNext});
export type InjectedProvider={request:(request:{method:string;params?:unknown[]})=>Promise<unknown>};
type ClientFactory=typeof createClient;

export async function connectedWallet(provider:InjectedProvider|undefined,expected='',factory:ClientFactory=createClient){
 if(!provider?.request)throw Error('Install a compatible injected wallet.');
 const accounts=await provider.request({method:'eth_requestAccounts'}) as string[];const account=accounts?.[0]||'';
 if(!/^0x[a-fA-F0-9]{40}$/.test(account))throw Error('Wallet returned no valid account.');
 const chainId=BigInt(String(await provider.request({method:'eth_chainId'})));
 if(chainId!==61997n)throw Error('Switch the wallet to GenLayer Studio Next (chain ID 61997).');
 if(expected&&account.toLowerCase()!==expected.toLowerCase())throw Error('Wallet account changed. Reconnect before signing.');
 return{account,client:factory({chain:studioNext,provider:provider as never,account:account as `0x${string}`})};
}
export async function connectWallet(){return(await connectedWallet(window.ethereum)).account}
export const readFinalized=<T=unknown>(functionName:string,args:CalldataEncodable[]=[])=>reader.readContract({address:CONTRACT,functionName,args,jsonSafeReturn:true,stateStatus:'finalized'} as never) as Promise<T>;
export async function writeFinalized(expected:string,functionName:string,args:CalldataEncodable[]){
 if(!configured)throw Error('Contract address is not configured.');const{client}=await connectedWallet(window.ethereum,expected);
 const fees=await client.estimateTransactionFees({leaderTimeunitsAllocation:300n,validatorTimeunitsAllocation:700n});
 const raw=await client.writeContract({address:CONTRACT,functionName,args,fees:{distribution:fees.distribution,feeValue:fees.feeValue}} as never);
 const hash=(typeof raw==='string'?raw:(raw as{hash?:string;txId?:string}).hash||(raw as{txId?:string}).txId||'') as TransactionHash;
 if(!/^0x[a-fA-F0-9]{64}$/.test(hash))throw Error('Wallet returned an invalid transaction hash.');
 const receipt=await reader.waitForTransactionReceipt({hash,waitUntil:'finalized',interval:4000,retries:300}) as {txExecutionResultName?:string;consensusResultName?:string};
 if(receipt.txExecutionResultName&&receipt.txExecutionResultName!=='FINISHED_WITH_RETURN')throw Error(`${functionName} finalized with ${receipt.txExecutionResultName}.`);
 if(receipt.consensusResultName&& !['AGREE','MAJORITY_AGREE','ACCEPTED'].includes(receipt.consensusResultName))throw Error(`${functionName} consensus: ${receipt.consensusResultName}.`);
 return hash;
}
export const short=(v:string)=>v?`${v.slice(0,6)}...${v.slice(-4)}`:'Not available';
export const txUrl=(hash:string)=>`https://explorer-studio-dev.genlayer.com/tx/${hash}`;
