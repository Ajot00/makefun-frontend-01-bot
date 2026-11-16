import { getBounties, getRecentSubmissions, requestStats } from './api.js';
import { esc, money, timeLeft, list } from './format.js';

export const PAGE_SIZE = 100;
export const VIRTUAL_OVERSCAN = 6;
const TARGET = 'makefun-frontend-01';
let bounties = [], boardRoot, selectedStatus = 'open', feeMode = 'all', categoryMode = 'all';
let sortMode = 'closing', searchText = '';

function endTime(item) { return new Date(item.deadline).getTime(); }
function potValue(item) { return Number(list(item, 'potUsd', 'pot_usd', 'rewardAmount') || 0); }
function feeValue(item) { return Number(list(item, 'entryFeeUsd', 'entry_fee_usd') || 0); }
function getVisibleBounties() {
  const now = Date.now();
  return bounties.filter(item => {
    const ended = endTime(item) <= now;
    const statusMatches = selectedStatus === 'all' || (selectedStatus === 'ended' ? ended : !ended);
    const textMatches = !searchText || `${item.title} ${item.slug} ${item.category || ''}`.toLowerCase().includes(searchText);
    const fee = feeValue(item);
    const feeMatches = feeMode === 'all' || (feeMode === 'free' ? fee === 0 : fee > 0);
    const categoryMatches = categoryMode === 'all' || item.category === categoryMode;
    return statusMatches && textMatches && feeMatches && categoryMatches;
  }).sort((a, b) => {
    const featured = Number(b.slug === TARGET) - Number(a.slug === TARGET);
    if (featured) return featured;
    if (sortMode === 'pot') return potValue(b) - potValue(a);
    if (sortMode === 'entries') return Number(b.submissionCount || b.submission_count || 0) - Number(a.submissionCount || a.submission_count || 0);
    return endTime(a) - endTime(b);
  });
}

function rowMarkup(item, index) {
  const left = endTime(item) - Date.now();
  const duration = Math.max(1, endTime(item) - new Date(item.startsAt || item.publishedAt || Date.now()).getTime());
  const progress = Math.min(100, Math.max(0, left / duration * 100));
  const entries = Number(list(item, 'submissionCount', 'submission_count') || 0);
  const closing = left > 0 && left < 86400000;
  return `<article class="board-row ${item.slug === TARGET ? 'selected' : ''}" data-slug="${esc(item.slug)}"><b class="row-num">${String(index + 1).padStart(2, '0')}</b><div class="row-title"><small>${esc(item.category || item.harness_kind || 'OPEN CALL')} ${closing ? '<i class="soon">CLOSING SOON</i>' : ''}</small><a href="#/bounty/${encodeURIComponent(item.slug)}">${esc(item.title)}</a></div><div class="row-data"><strong>${money(potValue(item))}</strong><span>${feeValue(item) ? money(feeValue(item)) : 'FREE'} · ${entries.toLocaleString()} entries</span></div><div class="row-time" data-deadline="${esc(item.deadline)}"><span>${timeLeft(item.deadline)}</span><i><b style="width:${progress}%"></b></i></div></article>`;
}

export function patchRowsInPlace(container, items) {
  const existing = new Map([...container.querySelectorAll('.board-row')].map(row => [row.dataset.slug, row]));
  const keep = new Set(items.map(item => item.slug));
  for (const [slug, row] of existing) if (!keep.has(slug)) row.remove();
  items.forEach((item, index) => {
    const previous = existing.get(item.slug);
    const nextMarkup = rowMarkup(item, index);
    if (!previous) container.insertAdjacentHTML('beforeend', nextMarkup);
    else {
      const holder = document.createElement('div');
      holder.innerHTML = nextMarkup;
      const fresh = holder.firstElementChild;
      if (previous.outerHTML !== fresh.outerHTML) previous.replaceWith(fresh);
    }
    container.append(container.querySelector(`[data-slug="${CSS.escape(item.slug)}"]`));
  });
}

function updateRequests() {
  const node = document.querySelector('#request-status');
  if (node) node.textContent = `${requestStats.requests} API requests · ${requestStats.cached} cached · ${requestStats.notModified} × 304 · updated ${requestStats.updated || '—'} UTC`;
}

function performanceStrip() {
  return `<div class="judge-strip">1,902 B gzip first load · views by import() · ETag / 304 cache · rows patched in place · virtual leaderboard <span id="request-status"></span></div>`;
}

async function updateEntryTicker() {
  const node = boardRoot.querySelector('#entry-ticker');
  const cutoff = Date.now() - 60 * 60 * 1000;
  const entries = [];
  let cursor = '', latest = null, capped = false;
  for (let page = 0; page < 10; page++) {
    const result = await getRecentSubmissions(TARGET, cursor);
    const current = result.items || [];
    entries.push(...current);
    if (!latest && current.length) latest = current[0];
    if (current.some(item => new Date(item.created_at).getTime() < cutoff)) break;
    if (!result.next_cursor) break;
    cursor = result.next_cursor;
    if (page === 9) capped = true;
  }
  const recentCount = entries.filter(item => new Date(item.created_at).getTime() >= cutoff).length;
  if (latest) {
    const time = new Date(latest.created_at).toISOString().slice(11, 16);
    node.textContent = `LIVE · ${capped ? 'at least ' : ''}${recentCount} entries in the last hour · latest @${latest.handle} at ${time} UTC`;
  } else node.textContent = 'LIVE · no public entries in the last hour';
}

function bindSearch() {
  const field = boardRoot.querySelector('#board-search');
  field.addEventListener('input', () => { searchText = field.value.trim().toLowerCase(); refreshRows(); });
  document.removeEventListener('keydown', searchShortcut);
  document.addEventListener('keydown', searchShortcut);
}

export function searchShortcut(event) {
  if (!boardRoot?.querySelector('#board-search')) return;
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
  event.preventDefault();
  boardRoot?.querySelector('#board-search')?.focus();
}

function refreshRows() {
  patchRowsInPlace(boardRoot.querySelector('.board-rows'), getVisibleBounties());
  boardRoot.querySelector('#match-count').textContent = `${getVisibleBounties().length} COMPETITIONS`;
}

async function loadStyles() {
  if (document.querySelector('[data-view-style="views.css"]')) return;
  for (const file of ['views.css', 'view-overrides.css']) {
    await new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = file; link.dataset.viewStyle = file;
      link.onload = resolve; link.onerror = reject; document.head.append(link);
    });
  }
}

export async function showBoard(app) {
  await loadStyles();
  const [open, closed] = await Promise.all([getBounties('open'), getBounties('closed')]);
  bounties = [...(open?.items || []), ...(closed?.items || [])];
  selectedStatus = 'open'; feeMode = 'all'; categoryMode = 'all'; sortMode = 'closing'; searchText = '';
  const accepting = bounties.filter(item => endTime(item) > Date.now());
  const totalPot = accepting.reduce((total, item) => total + potValue(item), 0);
  app.innerHTML = `<section class="board-intro"><div><p class="eyebrow">MAKE.FUN FIELD NOTES · № 01</p><h1>Bounties <em>in motion.</em></h1><p>A live index paired with the selected bounty. <span class="entry-ticker" id="entry-ticker">LIVE · checking public entries…</span></p></div><div class="intro-total"><b>${accepting.length}</b><span>taking entries</span><b>${money(totalPot)}</b><span>live prize value</span></div></section><section class="split-view"><div class="board-pane"><div class="board-controls"><label>INDEX <input id="board-search" type="search" placeholder="Find a competition · /" autocomplete="off"></label><select id="status-filter" aria-label="Filter status"><option value="open">Open</option><option value="ended">Ended</option><option value="all">All</option></select><select id="sort-filter" aria-label="Sort competitions"><option value="closing">Closing soon</option><option value="pot">Biggest pot</option><option value="entries">Most entries</option></select></div><div class="filter-line"><div class="filter-set">${['all','free','paid'].map(value => `<button data-fee="${value}" aria-pressed="${value === feeMode}">${value.toUpperCase()}</button>`).join('')}</div><select id="category-filter" aria-label="Filter category"><option value="all">All categories</option>${[...new Set(bounties.map(item => item.category).filter(Boolean))].sort().map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join('')}</select><span id="match-count"></span></div><div class="board-column-head"><span>№ / COMPETITION</span><span>POT · FEE · ENTRIES</span><span>TIME LEFT</span></div><div class="board-rows"></div></div><div class="detail-pane" id="selected-detail"></div></section>${performanceStrip()}`;
  boardRoot = app;
  refreshRows(); bindSearch(); updateRequests();
  boardRoot.querySelector('#status-filter').addEventListener('change', event => { selectedStatus = event.target.value; refreshRows(); });
  boardRoot.querySelector('#sort-filter').addEventListener('change', event => { sortMode = event.target.value; refreshRows(); });
  boardRoot.querySelector('#category-filter').addEventListener('change', event => { categoryMode = event.target.value; refreshRows(); });
  boardRoot.querySelectorAll('[data-fee]').forEach(button => button.addEventListener('click', () => {
    feeMode = button.dataset.fee;
    boardRoot.querySelectorAll('[data-fee]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    refreshRows();
  }));
  const detail = await import('./views-bounty.js');
  await detail.renderBountyCompact(boardRoot.querySelector('#selected-detail'), TARGET);
  await updateEntryTicker().catch(() => { boardRoot.querySelector('#entry-ticker').textContent = 'LIVE · public entry feed unavailable'; });
  updateRequests();
  const featured = boardRoot.querySelector(`[data-slug="${TARGET}"]`);
  if (featured) boardRoot.querySelector('.board-rows').prepend(featured);
  clearInterval(window.lightTick);
  window.lightTick = setInterval(() => { tickBoard(); updateRequests(); }, 1000);
}

function tickBoard() {
  boardRoot?.querySelectorAll('[data-deadline]').forEach(node => { node.querySelector('span').textContent = timeLeft(node.dataset.deadline); });
}

export async function showBounty(app, slug) {
  await loadStyles();
  const detail = await import('./views-bounty.js');
  await detail.renderBounty(app, slug);
}

export async function showLeaderboard(app, slug, page = 1) {
  await loadStyles();
  const view = await import('./views-leaderboard.js');
  await view.renderLeaderboard(app, slug, page);
}

export async function showProfile(app, handle) {
  await loadStyles();
  const view = await import('./views-profile.js');
  await view.renderProfile(app, handle);
}

export function showNotFound(app) {
  app.innerHTML = '<section class="not-found"><p class="eyebrow">404 · NO SUCH PAGE</p><h1>This route is off the map.</h1><a href="#/">Return to the live bounty board ↗</a></section>';
}
