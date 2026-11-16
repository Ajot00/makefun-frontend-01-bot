const app=document.querySelector('#app');
const started=performance.now();
const route=()=>{window.__shotReady=false;import('./views-board.js').then(m=>m.route(app,location.hash)).then(()=>{window.__shotReady=true;const ready=document.querySelector('#perf-ready');if(ready)ready.textContent=`ready in ${Math.round(performance.now()-started)} ms · ${window.__jsonKB??'0.0'} KB JSON`}).catch(()=>{window.__shotReady=true})};
window.addEventListener('hashchange',route);route();
