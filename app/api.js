const root='https://make.fun/api', age=60000;
const key=url=>'lightboard:'+url;
const pending=new Map();
async function updateCache(url,id,old){
 if(pending.has(id))return pending.get(id);
 const work=(async()=>{
  const response=await fetch(url,{headers:old?.tag?{'If-None-Match':old.tag}:{}});
  if(response.status===304){old.at=Date.now();localStorage.setItem(id,JSON.stringify(old));return old.data;}
  if(!response.ok)throw Error('make.fun answered '+response.status);
  const data=await response.json();localStorage.setItem(id,JSON.stringify({data,tag:response.headers.get('ETag'),at:Date.now()}));return data;
 })().finally(()=>pending.delete(id));
 pending.set(id,work);return work;
}
async function cacheWithEtag(path,{refresh=false}={}){
 const url=root+path, id=key(url), old=JSON.parse(localStorage.getItem(id)||'null');
 if(old&&!refresh){if(Date.now()-old.at>=age)updateCache(url,id,old).catch(()=>{});return old.data;}
 try{
  return await updateCache(url,id,old);
 }catch(error){if(old)return old.data;throw error;}
}
export const getBounties=()=>cacheWithEtag('/competitions?status=open&activity=times&limit=100');
export const getBounty=slug=>cacheWithEtag('/competitions/'+encodeURIComponent(slug)+'?submissions=summary');
export const getLeaderboard=slug=>cacheWithEtag('/competitions/'+encodeURIComponent(slug)+'/leaderboard?phase=dev&view=overall&rows=first&ties=ids');
export const getProfile=handle=>cacheWithEtag('/profiles/'+encodeURIComponent(handle));
