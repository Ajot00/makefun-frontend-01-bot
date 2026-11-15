import{getBounties}from'./api.js';
import{esc,money,timeLeft,list}from'./format.js';
const app=document.querySelector('#app');
const unwrap=x=>x?.data??x;
function boardMarkup(items){
 const rows=items.map(b=>{const pot=list(b,'potUsd','pot_usd','rewardAmount')??0,fee=list(b,'entryFeeUsd','entry_fee_usd'),count=list(b,'submissionCount','submission_count')??0,when=timeLeft(b.deadline);return`<tr><td><a class="title-link" href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a><small>${esc(b.category||b.harness_kind||'Open bounty')}</small></td><td><strong>${money(pot)}</strong><small>live pot · ${money(b.rewardAmount)} base</small></td><td>${fee?money(fee):'—'}<small>${fee?'per entry':'no fee'}</small></td><td><span class="time ${when==='Closed'?'closed':''}">${when}</span><small>${esc(b.deadline?.slice(0,10)||'Date pending')}</small></td><td>${Number(count).toLocaleString()}<small>entries</small></td></tr>`;}).join('');
 return rows||'<tr><td colspan="5">No bounties found.</td></tr>';
}
async function renderBoard(){
 const result=unwrap(await getBounties()), items=result.items||[];
 const taking=items.filter(b=>new Date(b.deadline)>Date.now()), pots=items.reduce((n,b)=>n+Number(list(b,'potUsd','pot_usd','rewardAmount')||0),0), entries=items.reduce((n,b)=>n+Number(list(b,'submissionCount','submission_count')||0),0), next=[...taking].sort((a,b)=>new Date(a.deadline)-new Date(b.deadline))[0];
 document.title='Bounty board | Lightboard';
 app.innerHTML=`<section class="intro"><div><p class="eyebrow">THE OPEN FIELD</p><h1>Bounties in motion</h1><p class="lede">Find a challenge. Follow the pot. Meet the builders.</p></div><span class="live-mark"><i></i> LIVE PUBLIC DATA</span></section><section class="summary" aria-label="Bounty summary"><div><span>Taking entries</span><b>${taking.length}</b></div><div><span>Live pots</span><b>${money(pots)}</b></div><div><span>Total entries</span><b>${entries.toLocaleString()}</b></div><div><span>Next to close</span><b>${next?timeLeft(next.deadline):'—'}</b></div></section><div class="section-head"><div><p class="eyebrow">MAKE SOMETHING THAT SCORES</p><h2>Competition board</h2></div><span class="count">${items.length} bounties</span></div><div class="table-wrap"><table class="board-table"><thead><tr><th>BOUNTY</th><th>REWARD · LIVE POT</th><th>ENTRY FEE</th><th>TIME LEFT</th><th>ENTRIES</th></tr></thead><tbody>${boardMarkup(items)}</tbody></table></div><p class="table-note">Deadlines determine entry status. Past-due bounties are marked closed.</p>`;
}
async function route(){
 window.__shotReady=false;app.innerHTML='<div class="loading">Loading live make.fun data…</div>';
 try{
  const hash=decodeURIComponent(location.hash||'#/');let m;
  if((m=hash.match(/^#\/bounty\/([^/]+)\/leaderboard(?:\/page\/(\d+))?$/))){const v=await import('./views-leaderboard.js');await v.renderLeaderboard(app,m[1],Number(m[2]||1));}
  else if((m=hash.match(/^#\/bounty\/([^/]+)$/))){const v=await import('./views-bounty.js');await v.renderBounty(app,m[1]);}
  else if((m=hash.match(/^#\/profile\/([^/]+)$/))){const v=await import('./views-profile.js');await v.renderProfile(app,m[1]);}
  else await renderBoard();
 }catch(e){app.innerHTML=`<section class="error"><p class="eyebrow">A MOMENTARY PAUSE</p><h1>Couldn’t load this view</h1><p>${esc(e.message||'Please try again.')}</p><a class="button" href="#/">Back to the board</a></section>`;}
 window.scrollTo(0,0);window.__shotReady=true;
}
window.__shotReady=false;addEventListener('hashchange',route);route();
