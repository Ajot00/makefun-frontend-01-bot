import { getProfile } from './api.js';
import { esc, money } from './format.js';
import { avatar, date } from './view-format.js';

export async function renderProfile(app, handle) {
  const profile = await getProfile(handle);
  const record = profile.record || {};
  const solutions = profile.solutions || profile.submissions || profile.entries || [];
  app.innerHTML = `<p class="eyebrow">PUBLIC ACCOUNT</p>
    <section class="card profile-head">${avatar(profile.image || profile.avatar?.url, handle)}<div><h1 class="section-title">${esc(profile.display_name || profile.displayName || handle)}</h1><span class="muted">@${esc(handle)}</span><p class="muted">${esc(profile.bio || '')}</p></div></section>
    <section class="detail-stats"><div><small>WINS</small><strong>${Number(record.competitions_won || 0).toLocaleString()}</strong></div><div><small>PLACEMENTS</small><strong>${Number(record.competitions_placed || 0).toLocaleString()}</strong></div><div><small>PRIZE MONEY</small><strong>${money(record.prize_usd)}</strong></div><div><small>COMPETITIONS</small><strong>${Number(record.competitions_entered || 0).toLocaleString()}</strong></div></section>
    <h2 class="section-title">Recent work</h2><div class="cards">${solutions.map(solution => {
      const competition = solution.competition || {};
      return `<article class="card"><p class="eyebrow">${esc(competition.category || 'PUBLIC ENTRY')}</p><h3><a href="#/bounty/${encodeURIComponent(competition.slug || '')}">${esc(competition.title || solution.title || 'Competition')}</a></h3><p>${esc(solution.title || '')}</p><p class="muted">${esc(solution.status || 'Entry')} · ${date(solution.created_at || solution.createdAt)}</p></article>`;
    }).join('') || '<p class="muted">No public entries listed.</p>'}</div>`;
}
