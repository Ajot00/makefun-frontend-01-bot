export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const value=(o,...keys)=>{for(const k of keys)if(o?.[k]!=null)return o[k];return 0};
export const money=n=>{const x=Number(n)||0, cents=Math.abs(x-Math.round(x))>.00001;return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:cents?2:0,maximumFractionDigits:2}).format(x)};
export const timeLeft=d=>{const s=Math.max(0,Math.floor((Date.parse(d)-Date.now())/1000));return `${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m ${s%60}s`};
export const elapsed=(a,b)=>Math.min(100,Math.max(1,Math.round((Date.now()-Date.parse(a))/(Date.parse(b)-Date.parse(a))*100)||1));
export const date=d=>d?new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
