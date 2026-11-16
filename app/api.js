export const FRESH_MS=60_000;
export const requestStats={requests:0,cached:0,notModified:0,updated:'—'};
const cache=new Map(),inFlight=new Map();
export async function cacheWithEtag(path,{refresh=false}={}){
 const key=`https://make.fun/api${path}`,old=cache.get(key);
 if(old&&!refresh){requestStats.cached++;if(Date.now()-old.at>=FRESH_MS)cacheWithEtag(path,{refresh:true}).catch(()=>{});return old.data;}
 if(inFlight.has(key)){requestStats.cached++;return inFlight.get(key)}
 const task=(async()=>{const headers=old?.etag?{'If-None-Match':old.etag}:{};let res;for(let attempt=0;attempt<4;attempt++){try{requestStats.requests++;res=await fetch(key,{headers});if(res.status<500||attempt===3)break}catch(error){if(attempt===3)throw error}await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)))}requestStats.updated=new Date().toISOString().slice(11,19);
 if(res.status===304&&old){requestStats.notModified++;old.at=Date.now();return old.data;}if(!res.ok)throw Error(`API ${res.status}`);const data=await res.json();cache.set(key,{data,etag:res.headers.get('ETag'),at:Date.now()});return data;})().finally(()=>inFlight.delete(key));inFlight.set(key,task);return task;
}
export const getBounties=async(status='open')=>{const all=[];let cursor='';do{const query=new URLSearchParams({activity:'times',limit:'100'});if(status!=='all')query.set('status',status==='ended'?'closed':status);if(cursor)query.set('cursor',cursor);const d=await cacheWithEtag(`/competitions?${query}`);all.push(...(d.items||[]));cursor=d.next_cursor||''}while(cursor&&all.length<1200);return all};
export const getBounty=s=>cacheWithEtag(`/competitions/${encodeURIComponent(s)}?submissions=summary`);
export const getLeaderboard=s=>cacheWithEtag(`/competitions/${encodeURIComponent(s)}/leaderboard?phase=dev&view=overall&rows=all&ties=ids`);
export const getProfile=h=>cacheWithEtag(`/profiles/${encodeURIComponent(h)}`);
export const getRecentSubmissions=s=>cacheWithEtag(`/competitions/${encodeURIComponent(s)}/submissions?limit=100`);
