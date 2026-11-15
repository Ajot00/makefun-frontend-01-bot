import { getProfile } from './api.js';
import { esc, money } from './format.js';
import { avatar, date } from './view-format.js';

export async function renderProfile(app, handle) {
  const profile=await getProfile(handle);
  const record=profile.record||{};
  const entries=profile.solutions||[];
  const wins=Number(record.competitions_won||0);
  const prize=Number(record.prize_usd||0);
  const entered=Number(record.competitions_entered||entries.length);
  document.title=`@${profile.handle||handle} | Lightboard`;
  app.innerHTML=`<p class="crumb"><a href="#/">Bounty board</a> / Public profile</p>
    <section class="profile-top">${avatar(profile.avatar||profile.image,profile.handle||handle)}<div><p class="eyebrow">PUBLIC BUILDER PROFILE</p><h1>@${esc(profile.handle||handle)}</h1><p>${esc(profile.bio||'Building in the open on make.fun')}</p></div></section>
    <section class="profile-stats"><div class="stat"><span>Wins</span><strong>${wins.toLocaleString()}</strong></div><div class="stat"><span>Money won</span><strong>${money(prize)}</strong></div><div class="stat"><span>Entries</span><strong>${entered.toLocaleString()}</strong></div></section>
    <section><div class="section-head"><div><p class="eyebrow">RECENT WORK</p><h2>Recent entries</h2></div><span class="count">${entries.length} shown</span></div>${entries.length?entries.map(item=>{const competition=item.competition||{};const result=item.placement?`#${item.placement}`:item.score?.display?esc(item.score.display):'No result';return`<article class="solution"><div><a href="#/bounty/${encodeURIComponent(competition.slug||'')}">${esc(competition.title||item.title||'Competition entry')}</a><small>${esc(item.title||'Entry')} · ${date(item.entered_at)}</small></div><div class="rate">${result}</div></article>`}).join(''):'<p class="table-note">No public entries yet.</p>'}</section>`;
}
