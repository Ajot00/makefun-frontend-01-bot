import { getBounty, getLeaderboard } from './api.js';
import { esc, money, timeLeft, list } from './format.js';
import { date, avatar } from './view-format.js';

const watermark = '<svg class="about-watermark" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="49" fill="#f04491"/><path d="M27 34Q27 23 39 23h22q12 0 12 12v29q0 8-9 8H36q-9 0-9-9z" fill="white"/><path d="m39 39 3-4 3 4-3 4zm16 0 3-4 3 4-3 4zM82 18l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#f04491"/></svg>';

export async function renderBounty(app, slug) {
  const [b, board] = await Promise.all([getBounty(slug), getLeaderboard(slug)]);
  const pot = Number(list(b,'potUsd','pot_usd','rewardAmount') || 0);
  const fees = Number(list(b,'entryFeesUsd','entry_fees_usd') || 0);
  const entryFee = Number(list(b,'entryFeeUsd','entry_fee_usd') || 0);
  const count = Number(list(b,'submissionCount','submission_count') || 0);
  const closed = new Date(b.deadline) <= Date.now();
  const rewards = b.rewardsNow || Object.entries(b.rewards || {}).map(([place,baseUsd])=>({place,baseUsd,feeShareUsd:0,amountUsd:baseUsd}));
  const max = Math.max(1,...rewards.map(r=>Number(r.amountUsd)||0));
  const entries = (board.entries || []).slice(0,5);
  const results = b.resultsBy || b.results_by || b.resolutionAt || b.resolution_at || b.deadline;
  const description = b.description || 'Details will appear here.';
  const rules = typeof b.rules==='string' ? b.rules : b.rules?.summary || b.resolution?.summary || 'Entries are ranked by the published competition criteria. See the full bounty on make.fun for complete terms.';
  const topEntries=entries.map(row=>{const rate=Number((row.values?.judge??row.value)||0)/10000;const won=rewards.find(r=>parseInt(r.place,10)===Number(row.prize_rank))?.amountUsd||0;return`<div class="entry">${avatar(row.image,row.handle)}<div><a href="#/profile/${encodeURIComponent(row.handle)}">${esc(row.handle)}</a><small>${rate.toFixed(2)}% rate</small></div><b>${money(won)} won</b></div>`}).join('')||'<p class="table-note">No ranked entries published yet.</p>';
  document.title = `${b.title} | Lightboard`;

  app.innerHTML = `<p class="crumb"><a href="#/">Bounty board</a> / ${esc(b.category||'Competition')}</p>
    <section class="page-title"><div><p class="eyebrow">${esc(b.category||b.harnessKind||'MAKE.FUN BOUNTY')}</p><h1>${esc(b.title)}</h1></div><span class="status">${closed?'CLOSED':'TAKING ENTRIES'}</span></section>
    <section class="stats"><div class="stat"><span>Live pot</span><strong>${money(pot)}</strong><div class="sub">${money(b.rewardAmount)} base + ${money(fees)} fees</div></div><div class="stat"><span>Entry fee</span><strong>${entryFee?money(entryFee):'Free'}</strong><div class="sub">${entryFee?'once per account':'no payment required'}</div></div><div class="stat"><span>Time left</span><strong>${timeLeft(b.deadline)}</strong><div class="sub">Deadline · ${date(b.deadline)} UTC</div></div><div class="stat"><span>Entries</span><strong>${count.toLocaleString()}</strong><div class="sub">Public submissions</div></div></section>
    <div class="content-grid"><section><div class="about-panel">${watermark}<h2>About this bounty</h2><div class="prose">${esc(description)}</div><details class="desc-toggle"><summary>Read full description</summary><div class="prose" style="display:block;max-height:none">${esc(description)}</div></details></div>
      <div class="stepper"><div class="step">Published<b>${date(b.publishedAt||b.startsAt)} UTC</b></div><div class="step">Deadline<b>${date(b.deadline)} UTC</b></div><div class="step">Results by<b>${date(results)} UTC</b></div></div>
      <h2>Rules</h2><div class="rules">${esc(rules)}</div></section>
      <aside><div class="top-entries"><h2>Top entries</h2>${topEntries}</div><h2>Rewards by place</h2><div class="table-wrap"><table class="reward-table"><thead><tr><th>PLACE</th><th>BASE</th><th>FEE SHARE</th><th>AMOUNT</th></tr></thead><tbody>${rewards.map(r=>{const base=Number(r.baseUsd)||0,share=Number(r.feeShareUsd)||0;return`<tr><td>${esc(r.place)}</td><td>${money(base)}<div class="bar"><i style="width:${base/max*100}%"></i></div></td><td>+${money(share)}<div class="bar"><i class="share" style="width:${share/max*100}%"></i></div></td><td><strong>${money(r.amountUsd)}</strong></td></tr>`}).join('')}</tbody></table></div><p class="fee-note">Magenta shows each place's share of the ${money(fees)} in entry fees.</p><div class="pot-total"><span>Total live pot</span><span>${money(pot)}</span></div><a class="shimmer-button" href="#/bounty/${encodeURIComponent(slug)}/leaderboard">Full leaderboard ↗</a></aside></div>`;
}
