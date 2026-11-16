export const value=(x,...keys)=>{for(const k of keys)if(x?.[k]!=null)return x[k];return null};
export const ends=x=>new Date(value(x,'deadline','endsAt','ends_at','deadlineAt','deadline_at')||Date.now()).getTime();
export const starts=x=>new Date(value(x,'opensAt','opens_at','startsAt','starts_at','createdAt','created_at')||ends(x)-86400000).getTime();
export function remain(x,now=Date.now()){return Math.max(0,ends(x)-now)}
export function total(x){return Math.max(1,ends(x)-starts(x))}
export function label(x,now=Date.now()){let n=remain(x,now);if(!n)return 'Closed';let s=Math.floor(n/1000);if(s<60)return `${s}s`;let m=Math.floor(s/60);if(m<60)return `${m}m ${s%60}s`;return `${Math.floor(m/60)}h ${m%60}m ${s%60}s`}
export function barStyle(x,now=Date.now()){let r=remain(x,now),t=total(x);return r?`--progress:${Math.max(.002,r/t)}`:'--progress:0'}
export const cents=(n)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:Number(n||0)%1?2:0,maximumFractionDigits:2}).format(Number(n||0));
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
