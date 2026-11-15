export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=v=>Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:Number(v)%1?2:0});
export const timeLeft=v=>{let n=new Date(v).getTime()-Date.now();if(n<=0)return'Closed';let d=Math.floor(n/864e5),h=Math.floor(n%864e5/36e5),m=Math.floor(n%36e5/6e4);return d?d+'d '+h+'h':h+'h '+m+'m';};
export const list=(x,...keys)=>keys.reduce((v,k)=>v??x?.[k],undefined);
