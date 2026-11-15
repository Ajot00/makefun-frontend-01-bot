import{esc}from'./format.js';
export const date=v=>v?new Date(v).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):'—';
export const avatar=(url,name='Builder')=>{const src=String(url||''),safe=src.startsWith('/api/')?'https://make.fun'+src:src.startsWith('https://make.fun/')?src:'';return safe?'<img crossorigin="anonymous" class="avatar" src="'+esc(safe)+'" alt="'+esc(name)+'">':'<span class="avatar initials">'+esc(String(name||'B').slice(0,1).toUpperCase())+'</span>';};
