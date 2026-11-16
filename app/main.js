const app=document.querySelector('#app');
const route=()=>{window.__shotReady=false;return import('./views-board.js').then(m=>m.route(app,location.hash)).then(()=>{window.__shotReady=true})};
window.addEventListener('hashchange',route);route();
