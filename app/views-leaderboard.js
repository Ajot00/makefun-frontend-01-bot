import { getLeaderboard } from './api.js';
import { esc } from './format.js';
import { avatar } from './view-format.js';

export async function renderLeaderboard(app, slug) {
  const data=await getLeaderboard(slug);
  const rows=(data.entries||[]).slice(0,10);
  document.title='Top 10 builders | Lightboard';
  app.innerHTML=`<p class="crumb"><a href="#/">Bounty board</a> / <a href="#/bounty/${encodeURIComponent(slug)}">${esc(data.competition?.title||slug)}</a> / Leaderboard</p>
    <header class="leader-head"><div><p class="eyebrow">LIVE STANDINGS · ${esc(data.view||'overall')}</p><h1>Top 10 builders</h1><p>${esc(data.competition?.title||slug)} · ${rows.length} ranked entries</p></div><a class="shimmer-button" href="https://make.fun/bounty/${encodeURIComponent(slug)}/leaderboard">Full standings on make.fun ↗</a></header>
    <div class="rank-grid">${rows.map((row,index)=>{const judge=row.judge||{};const raw=Number(row.values?.judge??row.value);const rate=Number.isFinite(raw)?(raw/10000).toFixed(2)+'%':'Awaiting';const record=`${judge.wins||0}W · ${judge.draws||0}D · ${judge.losses||0}L`;return`<article class="rank-card ${index<3?'podium':''}"><b class="rank-number">${row.rank}</b>${avatar(row.image,row.handle)}<div><a class="rank-name" href="#/profile/${encodeURIComponent(row.handle)}">${esc(row.handle)}</a><span class="rank-meta">${record} · ${Number(judge.matches||0)} matches</span></div><strong class="rank-rate">${rate}</strong></article>`}).join('')||'<p class="table-note">No ranked entries published yet.</p>'}</div>`;
}
