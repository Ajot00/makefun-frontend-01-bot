window.__shotReady=false;
import('./controller.js').then(app=>app.boot()).catch(error=>{document.querySelector('#vlist').textContent=error.message;window.__shotReady=true});
