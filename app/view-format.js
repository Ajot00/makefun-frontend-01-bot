import{esc}from'./format.js';
export function date(v){if(!v)return'—';return new Intl.DateTimeFormat('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC',timeZoneName:'short'}).format(new Date(v))}
export function avatar(src,name){const image=src?.startsWith('/')?`https://make.fun${src}`:src;return image?`<img class="avatar" crossorigin="anonymous" src="${esc(image)}" alt="">`:`<span class="avatar">${esc(String(name||'?').slice(0,1))}</span>`}
