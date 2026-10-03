import type{CalldataEncodable}from'genlayer-js/types';

type Read=<T=unknown>(name:string,args?:CalldataEncodable[])=>Promise<T>;
type Write=(account:string,name:string,args:CalldataEncodable[])=>Promise<string>;
type Dependencies={read:Read;write:Write;pause?:(ms:number)=>Promise<void>;attempts?:number};
const pause=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
const number=(value:unknown)=>Number(value||0);

/** Keep PMIDs as strings: the contract accepts `add_citation(claim_id, pmid: str)`. */
export function citationPmid(claimId:number,rootClaimId:number,rootPmid:string,downstreamPmid:string):string{
 return claimId===rootClaimId?rootPmid:downstreamPmid;
}

/** Finalize a wallet write, then require its expected state transition on finalized reads. */
export async function writeWithReadback(account:string,name:string,args:CalldataEncodable[],deps:Dependencies):Promise<string>{
 const {read,write}=deps;const wait=deps.pause||pause;const attempts=deps.attempts??8;
 const wid=number(args[0]);let before:any=null;let beforeCount=0;
 if(name==='create_workspace')beforeCount=number((await read<any>('get_counts')).workspaces);
 else if(name==='add_claim'){
  beforeCount=number((await read<any>('get_counts')).claims);before=await read<any>('get_workspace',[wid]);
 }
 else if(name==='add_citation'||name==='verify_claim_support'||name==='reassess_claim')before=await read<any>('get_claim',[number(args[0])]);
 else if(name==='add_dependency')before=await read<any>('get_claim',[number(args[1])]);
 else if(name==='seal_workspace'||name==='assess_notice')before=await read<any>('get_workspace',[wid]);
 else throw Error(`Unsupported write method: ${name}`);
 const hash=await write(account,name,args);
 const confirmed=async()=>{
  if(name==='create_workspace'){
   const count=await read<any>('get_counts');if(number(count.workspaces)!==beforeCount+1)return false;
   const w=await read<any>('get_workspace',[number(count.workspaces)]);return String(w.creator||'').toLowerCase()===account.toLowerCase();
  }
  if(name==='add_claim'){
   const [count,w]=await Promise.all([read<any>('get_counts'),read<any>('get_workspace',[wid])]);
   return number(count.claims)===beforeCount+1&&(w.claim_ids||[]).includes(number(count.claims));
  }
  if(name==='add_citation'){
   const c=await read<any>('get_claim',[number(args[0])]);return (c.citations||[]).includes(String(args[1]));
  }
  if(name==='add_dependency'){
   const c=await read<any>('get_claim',[number(args[1])]);return (c.parents||[]).includes(number(args[0]));
  }
  if(name==='verify_claim_support'||name==='reassess_claim'){
   const c=await read<any>('get_claim',[number(args[0])]);const aid=number(c.last_support_assessment_id);
   if(aid<1||aid===number(before.last_support_assessment_id))return false;
   const assessment=await read<any>('get_assessment',[aid]);return number(assessment.claim_id)===number(args[0])&&number(assessment.claim_revision)===number(args[1]);
  }
  const w=await read<any>('get_workspace',[wid]);
  if(name==='seal_workspace')return w.status==='SEALED'&&before.status!=='SEALED';
  if(name==='assess_notice'){
   const aid=number(w.last_assessment_id);if(aid<1||aid===number(before.last_assessment_id))return false;
   const assessment=await read<any>('get_assessment',[aid]);return number(assessment.workspace_id)===wid&&String(assessment.article_pmid)===String(args[1])&&String(assessment.notice_pmid)===String(args[2]);
  }
  return false;
 };
 for(let i=0;i<attempts;i++){if(await confirmed())return hash;if(i+1<attempts)await wait(1000)}
 throw Error(`${name} finalized, but its expected state change was not found in finalized contract reads. Refresh before retrying to avoid duplicate writes.`);
}
