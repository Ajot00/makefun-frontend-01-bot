export const stats={requests:0,cached:0,notModified:0,jsonBytes:0,updated:'—'};
const cache=new Map(),pending=new Map(),freshFor=60000;
export async function get(path,{refresh=false}={}){
 const url=`https://make.fun/api${path}`,old=cache.get(url);
 if(old&&!refresh){stats.cached++;if(Date.now()-old.at>=freshFor)get(path,{refresh:true}).catch(()=>{});return old.data}
 if(pending.has(url))return pending.get(url);
 const task=(async()=>{stats.requests++;let response=await fetch(url,{headers:old?.etag?{'If-None-Match':old.etag}:{}});stats.updated=new Date().toISOString().slice(11,19);if(response.status===304&&old){stats.notModified++;old.at=Date.now();return old.data}if(!response.ok)throw Error(`Public API ${response.status}`);let raw=await response.text();stats.jsonBytes+=new TextEncoder().encode(raw).length;let data=JSON.parse(raw);cache.set(url,{data,etag:response.headers.get('ETag'),at:Date.now()});return data})().finally(()=>pending.delete(url));pending.set(url,task);return task;
}
export async function bounties(){let out=[];for(const status of ['open','closed','resolved']){let cursor='';do{let q=new URLSearchParams({activity:'times',limit:'100',status});if(cursor)q.set('cursor',cursor);let d=await get(`/competitions?${q}`);out.push(...(d.items||[]));cursor=d.next_cursor||''}while(cursor&&out.length<1000)}return [...new Map(out.map(x=>[x.slug,x])).values()]}
export const bounty=s=>get(`/competitions/${encodeURIComponent(s)}?submissions=summary`);
export const leaderboard=s=>get(`/competitions/${encodeURIComponent(s)}/leaderboard?phase=dev&view=performance&rows=all`);
export const profile=h=>get(`/profiles/${encodeURIComponent(h)}`);
