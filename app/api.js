export const FRESH_MS=60_000;
export const PAGE_SIZE=50;
export const VIRTUAL_OVERSCAN=5;
export const requestStats={requests:0,cached:0,notModified:0,jsonBytes:0,updated:'—'};
const cache=new Map(),inFlight=new Map();
export async function cacheWithEtag(path,{refresh=false}={}){const key=`https://make.fun/api${path}`,old=cache.get(key);if(old&&!refresh){requestStats.cached++;if(Date.now()-old.at>=FRESH_MS)cacheWithEtag(path,{refresh:true}).catch(()=>{});return old.data}if(inFlight.has(key)){requestStats.cached++;return inFlight.get(key)}const task=(async()=>{let res;for(let i=0;i<3;i++){try{requestStats.requests++;res=await fetch(key,{headers:old?.etag?{'If-None-Match':old.etag}:{}});if(res.status<500||i===2)break}catch(e){if(i===2)throw e;await new Promise(r=>setTimeout(r,220*(i+1)))}}requestStats.updated=new Date().toISOString().slice(11,19);if(res.status===304&&old){requestStats.notModified++;old.at=Date.now();return old.data}if(!res.ok)throw Error(`make.fun API ${res.status}`);const raw=await res.text();requestStats.jsonBytes+=new TextEncoder().encode(raw).length;const data=JSON.parse(raw);cache.set(key,{data,etag:res.headers.get('ETag'),at:Date.now()});return data})().finally(()=>inFlight.delete(key));inFlight.set(key,task);return task}
export async function getBounties(){const all=[];let cursor='';do{const q=new URLSearchParams({activity:'times',limit:'100',status:'open'});if(cursor)q.set('cursor',cursor);const d=await cacheWithEtag(`/competitions?${q}`);all.push(...(d.items||[]));cursor=d.next_cursor||''}while(cursor&&all.length<1000);return all}
export const getBounty=s=>cacheWithEtag(`/competitions/${encodeURIComponent(s)}?submissions=summary`);
export const getLeaderboard=(s,page=1)=>cacheWithEtag(`/competitions/${encodeURIComponent(s)}/leaderboard?phase=dev&view=overall&rows=all&ties=ids&page=${page}&limit=${PAGE_SIZE}`);
export const getProfile=h=>cacheWithEtag(`/profiles/${encodeURIComponent(h)}`);
export const getRecentSubmissions=s=>cacheWithEtag(`/competitions/${encodeURIComponent(s)}/submissions?limit=100`);
