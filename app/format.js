export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n)||0);
export const timeLeft=d=>{const s=Math.max(0,Math.floor((new Date(d)-Date.now())/1000));return`${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m ${s%60}s`};
export const value=(o,...keys)=>{for(const k of keys)if(o?.[k]!=null)return o[k];return 0};
