import { getLeaderboard } from './api.js';
import { esc } from './format.js';
import { avatar } from './view-format.js';

export const PAGE_SIZE = 100;
export const VIRTUAL_OVERSCAN = 6;
const ROW_HEIGHT = 56;
const WINDOW_ROWS = 14;

export function renderVirtualRows(container, rows, offset = 0) {
  const first = Math.max(0, Math.floor(offset / ROW_HEIGHT) - VIRTUAL_OVERSCAN);
  const last = Math.min(rows.length, first + WINDOW_ROWS + VIRTUAL_OVERSCAN * 2);
  const visibleRows = rows.slice(first, last);
  container.style.height = `${rows.length * ROW_HEIGHT}px`;
  container.innerHTML = visibleRows.map((row, index) => {
    const rank = first + index;
    const judge = row.judge || {};
    const raw = Number(row.values?.judge ?? row.value);
    const rate = Number.isFinite(raw) ? `${(raw / 10000).toFixed(2)}%` : 'Awaiting';
    const record = `${judge.wins || 0}W · ${judge.draws || 0}D · ${judge.losses || 0}L`;
    return `<article class="rank-card ${rank < 3 ? 'podium' : ''}" style="position:absolute;top:${rank * ROW_HEIGHT}px;left:0;right:0;height:${ROW_HEIGHT}px"><b class="rank-number">${esc(row.rank || rank + 1)}</b>${avatar(row.image, row.handle)}<div><a class="rank-name" href="#/profile/${encodeURIComponent(row.handle)}">${esc(row.handle)}</a><span class="rank-meta">${record} · ${Number(judge.matches || 0)} matches</span></div><strong class="rank-rate">${rate}</strong></article>`;
  }).join('');
}

export async function renderLeaderboard(app, slug, page = 1) {
  const data = await getLeaderboard(slug);
  const rows = data.entries || [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(pageCount, Math.max(1, page));
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  document.title = `Leaderboard · ${data.competition?.title || slug} | Lightboard`;
  const pageLinks = Array.from({ length: Math.min(5, pageCount) }, (_, index) => {
    const number = Math.max(1, Math.min(pageCount - 4, safePage - 2)) + index;
    return `<a class="page-number ${number === safePage ? 'active' : ''}" href="#/bounty/${encodeURIComponent(slug)}/leaderboard/page/${number}" aria-current="${number === safePage ? 'page' : 'false'}">${number}</a>`;
  }).join('');
  app.innerHTML = `<p class="crumb"><a href="#/">Bounty board</a> / <a href="#/bounty/${encodeURIComponent(slug)}">${esc(data.competition?.title || slug)}</a> / Leaderboard</p><header class="leader-head"><div><p class="eyebrow">LIVE STANDINGS · ${esc(data.view || 'overall')}</p><h1>Leaderboard</h1><p>${esc(data.competition?.title || slug)} · ${rows.length.toLocaleString()} ranked entries · page ${safePage} of ${pageCount}</p></div><a class="shimmer-button" href="https://make.fun/bounty/${encodeURIComponent(slug)}/leaderboard">Full standings on make.fun ↗</a></header><nav class="pager" aria-label="Leaderboard pages"><a href="#/bounty/${encodeURIComponent(slug)}/leaderboard/page/${Math.max(1, safePage - 1)}" aria-disabled="${safePage === 1}">← Prev</a>${pageLinks}<a href="#/bounty/${encodeURIComponent(slug)}/leaderboard/page/${Math.min(pageCount, safePage + 1)}" aria-disabled="${safePage === pageCount}">Next →</a></nav><div class="rank-window"><div class="rank-grid" id="virtual-ranks"></div></div><p class="table-note">Showing ${pageRows.length.toLocaleString()} of ${rows.length.toLocaleString()} entries on this page. Rows outside the visible window are not in the DOM.</p>`;
  const window = app.querySelector('.rank-window');
  const rankContainer = app.querySelector('#virtual-ranks');
  renderVirtualRows(rankContainer, pageRows, 0);
  window.addEventListener('scroll', () => renderVirtualRows(rankContainer, pageRows, window.scrollTop), { passive: true });
}
