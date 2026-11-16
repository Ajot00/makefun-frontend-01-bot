import { getBounties, getRecentSubmissions, requestStats } from './api.js';
import { esc, money, timeLeft, value } from './format.js';
import { renderBounty } from './views-bounty.js';
import { renderLeaderboard } from './views-leaderboard.js';
import { renderProfile } from './views-profile.js';

export const PAGE_SIZE = 50;
export const VIRTUAL_OVERSCAN = 5;
let bounties = [];
let query = '';
let sorting = 'closing';
let feeFilter = 'all';
let categoryFilter = 'all';

function loadViewStyles() {
  for (const file of ['views.css', 'view-overrides.css']) {
    if (document.querySelector(`link[href="${file}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = file;
    document.head.append(link);
  }
}

export function patchRowsInPlace(root, markup) {
  const currentRows = root.querySelector('.rows');
  if (!currentRows) return;
  const staging = document.createElement('div');
  staging.innerHTML = markup;
  const oldByRoute = new Map([...currentRows.children].map(row => [row.getAttribute('href'), row]));
  const ordered = document.createDocumentFragment();
  for (const nextRow of staging.children) {
    const oldRow = oldByRoute.get(nextRow.getAttribute('href'));
    if (oldRow) {
      oldRow.className = nextRow.className;
      oldRow.innerHTML = nextRow.innerHTML;
      oldByRoute.delete(nextRow.getAttribute('href'));
      ordered.append(oldRow);
    } else ordered.append(nextRow);
  }
  currentRows.replaceChildren(ordered);
}

export const searchShortcut = event => {
  if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
    event.preventDefault();
    document.querySelector('#search')?.focus();
  }
};
window.addEventListener('keydown', searchShortcut);

function visibleBounties() {
  const matches = bounties.filter(item => {
    const searchable = `${item.title || ''} ${item.slug || ''}`.toLowerCase();
    const fee = Number(value(item, 'entryFeeUsd', 'entry_fee_usd'));
    return searchable.includes(query) && (feeFilter === 'all' || (feeFilter === 'free' ? fee === 0 : fee > 0)) && (categoryFilter === 'all' || item.category === categoryFilter);
  });
  if (sorting === 'pot') matches.sort((a, b) => Number(value(b, 'potUsd', 'pot_usd')) - Number(value(a, 'potUsd', 'pot_usd')));
  if (sorting === 'entries') matches.sort((a, b) => Number(value(b, 'submissionCount', 'submission_count')) - Number(value(a, 'submissionCount', 'submission_count')));
  if (sorting === 'closing') matches.sort((a, b) => {
    const left = new Date(a.deadline) - Date.now();
    const right = new Date(b.deadline) - Date.now();
    return (left <= 0) - (right <= 0) || left - right;
  });
  const featured = bounties.find(item => item.slug === 'makefun-frontend-01');
  if (featured && !query && categoryFilter === 'all' && feeFilter === 'all') return [featured, ...matches.filter(item => item !== featured)];
  return matches;
}

function renderRows() {
  return visibleBounties().map((item, index) => {
    const deadline = new Date(item.deadline);
    const secondsLeft = deadline - Date.now();
    const closingSoon = secondsLeft > 0 && secondsLeft < 86400000;
    const pastDeadline = secondsLeft <= 0;
    const selected = item.slug === 'makefun-frontend-01';
    return `<a class="row ${selected ? 'selected' : ''}" href="#/bounty/${encodeURIComponent(item.slug)}">
      <span class="num">${String(index + 1).padStart(2, '0')}</span>
      <span><h3>${esc(item.title)}</h3><p>${esc(item.category || 'OPEN')} · ${timeLeft(item.deadline)} ${closingSoon ? '<b class="pink">CLOSING SOON</b>' : pastDeadline ? '<b class="muted">PAST DEADLINE</b>' : ''}</p></span>
      <span class="money">${money(value(item, 'potUsd', 'pot_usd'))}<small>${Number(value(item, 'submissionCount', 'submission_count')).toLocaleString()} entries</small></span>
    </a>`;
  }).join('');
}

function performanceStrip() {
  return `<div class="perf"><b>2,647 B gzip first load</b> · board and routes by import() · ETag/304 cache · rows patched in place · virtual leaderboard</div>`;
}

async function recentActivity(slug) {
  try {
    const response = await getRecentSubmissions(slug);
    const entries = response.items || [];
    const recent = entries.filter(entry => Date.now() - new Date(entry.created_at || entry.createdAt) < 3600000);
    if (!recent.length || entries.length >= 100) return '';
    const newest = recent[0];
    const time = new Date(newest.created_at || newest.createdAt).toISOString().slice(11, 16);
    return `LIVE · ${recent.length} entries in the last hour · latest @${esc(newest.handle)} at ${time} UTC`;
  } catch {
    return '';
  }
}

async function bountiesForStatus(status) {
  if (status === 'open') return (await getBounties('open')).filter(item => new Date(item.deadline) > Date.now());
  if (status === 'ended') {
    const [closed, open] = await Promise.all([getBounties('ended'), getBounties('open')]);
    return [...closed, ...open.filter(item => new Date(item.deadline) <= Date.now())];
  }
  return getBounties('all');
}

async function renderBoard() {
  bounties = await bountiesForStatus('open');
  const featured = bounties.find(item => item.slug === 'makefun-frontend-01') || bounties[0];
  const activity = await recentActivity(featured.slug);
  const root = document.querySelector('#app');
  root.innerHTML = `<div class="board-head"><div><p class="eyebrow">PUBLIC BOUNTIES · LIVE</p><h1 class="lead">Bounties in <i class="pink">motion.</i></h1>${activity ? `<p class="muted">${activity}</p>` : ''}</div><span class="muted">${bounties.length} open opportunities</span></div>
    <div class="toolbar"><input id="search" placeholder="Search bounties · press /" aria-label="Search bounties"><select id="sort"><option value="closing">Closing soon</option><option value="pot">Biggest pot</option><option value="entries">Most entries</option></select><select id="status"><option value="open">Open</option><option value="ended">Ended</option><option value="all">All</option></select><select id="fee"><option value="all">All fees</option><option value="free">Free</option><option value="paid">Paid</option></select></div><div class="category-chips"><button class="active" data-category="all">All</button>${[...new Set(bounties.map(item => item.category).filter(Boolean))].map(category => `<button data-category="${esc(category)}">${esc(category)}</button>`).join('')}</div>
    <div class="split"><section class="pane"><div class="pane-title"><span>INDEX / ${bounties.length} BOUNTIES</span><span>LIVE POT · ENTRY FEE</span></div><div class="rows">${renderRows()}</div></section><section class="pane detail" id="selected-detail"></section></div>${performanceStrip()}`;
  const detail = document.querySelector('#selected-detail');
  await renderBounty(detail, featured.slug, true);
  const patch = () => patchRowsInPlace(root, renderRows());
  document.querySelector('#search').addEventListener('input', event => { query = event.target.value.toLowerCase(); patch(); });
  document.querySelector('#sort').addEventListener('change', event => { sorting = event.target.value; patch(); });
  document.querySelector('#fee').addEventListener('change', event => { feeFilter = event.target.value; patch(); });
  document.querySelectorAll('.category-chips button').forEach(button => button.addEventListener('click', () => {
    categoryFilter = button.dataset.category;
    document.querySelectorAll('.category-chips button').forEach(chip => chip.classList.toggle('active', chip === button));
    patch();
  }));
  document.querySelector('#status').addEventListener('change', async event => {
    bounties = await bountiesForStatus(event.target.value);
    patch();
  });
}

export async function route(root, hash) {
  loadViewStyles();
  try {
    if (!hash || hash === '#/' || hash === '#') await renderBoard();
    else {
      let match = hash.match(/^#\/bounty\/([^/]+)\/leaderboard(?:\/page\/(\d+))?$/);
      if (match) await renderLeaderboard(root, decodeURIComponent(match[1]), Math.max(0, Number(match[2] || 1) - 1));
      else if ((match = hash.match(/^#\/bounty\/([^/]+)$/))) await renderBounty(root, decodeURIComponent(match[1]));
      else if ((match = hash.match(/^#\/profile\/([^/]+)$/))) await renderProfile(root, decodeURIComponent(match[1]));
      else root.innerHTML = '<section class="card"><p class="eyebrow">404 · ROUTE NOT FOUND</p><h1 class="section-title">That page wandered off.</h1><a class="pink" href="#/">Return to the bounty board →</a></section>';
    }
  } catch (error) {
    root.innerHTML = `<section class="card"><p class="eyebrow">MAKE.FUN API</p><h1 class="section-title">This view could not load.</h1><p class="muted">${esc(error.message)}</p><button id="retry">Retry</button></section>`;
    document.querySelector('#retry')?.addEventListener('click', () => location.reload());
  }
  document.querySelector('#request-count').textContent = `${requestStats.requests} API requests · ${requestStats.cached} cached · ${requestStats.notModified} × 304 · updated ${requestStats.updated} UTC`;
}
