import { getBounty, getLeaderboard } from './api.js';
import { esc, money, timeLeft, value } from './format.js';
import { date } from './view-format.js';

export async function renderBounty(app, slug, compact = false) {
  const [bounty, standings] = await Promise.all([
    getBounty(slug),
    getLeaderboard(slug).catch(() => ({ entries: [] })),
  ]);
  const rewards = bounty.rewardsNow || Object.entries(bounty.rewards || {}).map(([place, amountUsd]) => ({ place, amountUsd }));
  const livePot = Number(value(bounty, 'potUsd', 'pot_usd', 'rewardAmount'));
  const fees = Number(value(bounty, 'entryFeesUsd', 'entry_fees_usd'));
  const entryFee = Number(value(bounty, 'entryFeeUsd', 'entry_fee_usd'));
  const entries = Number(value(bounty, 'submissionCount', 'submission_count'));
  const largestPrize = Math.max(1, ...rewards.map(reward => Number(reward.amountUsd) || 0));
  const topRows = (standings.entries || []).slice(0, 5).map(row => {
    const rate = Number(row.values?.judge || row.value || 0) / 10000;
    const prize = rewards.find(reward => Number(reward.place) === Number(row.prize_rank));
    return `<div class="entry"><span>${esc(row.handle || row.name || 'Builder')} <small>${rate.toFixed(2)}% rate</small></span><b>${money(prize?.amountUsd)}</b></div>`;
  }).join('');
  const rewardRows = rewards.map(reward => {
    const amount = Number(reward.amountUsd) || 0;
    const base = Number(reward.baseUsd ?? reward.base_usd ?? amount);
    const share = Number(reward.feeShareUsd ?? reward.fee_share_usd ?? Math.max(0, amount - base));
    return `<div class="reward"><span>${esc(reward.place)}</span><span>${money(base)}</span><span>+${money(share)}</span><span class="bar"><i style="width:${amount / largestPrize * 100}%"></i></span><strong>${money(amount)}</strong></div>`;
  }).join('');
  const published = bounty.publishedAt || bounty.startsAt || bounty.createdAt;
  const resultsBy = bounty.resolutionAt || bounty.resolution_at || bounty.deadline;
  const rules = typeof bounty.rules === 'string' ? bounty.rules : bounty.rules?.summary || bounty.resolution?.summary || 'See make.fun for the complete competition rules.';
  const detail = `<div class="kicker">SELECTED BOUNTY · LIVE DATA</div><h2>${esc(bounty.title || slug)}</h2>
    <div class="detail-stats"><div><small>LIVE POT</small><strong>${money(livePot)}</strong></div><div><small>ENTRY FEE</small><strong>${entryFee ? money(entryFee) : 'Free'}</strong></div><div><small>TIME LEFT</small><strong>${timeLeft(bounty.deadline)}</strong><div class="progress"><i style="width:${Math.max(0, Math.min(100, (new Date(bounty.deadline) - Date.now()) / 604800000 * 100))}%"></i></div></div><div><small>ENTRIES</small><strong>${entries.toLocaleString()}</strong></div></div>
    <div class="dates"><div class="date-card"><small>OPENS</small><b>${date(published)}</b></div><div class="date-card"><small>DEADLINE</small><b>${date(bounty.deadline)}</b></div><div class="date-card"><small>RESULTS BY</small><b>${date(resultsBy)}</b></div></div>
    <div class="detail-actions"><a class="button-link" href="https://make.fun/bounty/${encodeURIComponent(slug)}">Enter on make.fun ↗</a><a href="#/bounty/${encodeURIComponent(slug)}/leaderboard">Full leaderboard →</a></div>
    <div class="mini-columns"><section><h3>Rewards by place</h3><p class="fee-note">Each place receives its share of ${money(fees)} in entry fees; bars scale to the total prize.</p><div class="reward-list"><div class="reward reward-head"><b>PLACE</b><b>BASE</b><b>FEE</b><b>SHARE</b><b>TOTAL</b></div>${rewardRows}</div></section><aside><h3>Top entries</h3>${topRows || '<p class="muted">No published standings yet.</p>'}</aside></div>
    <details class="about-brief"><summary>About and rules</summary><p>${esc(bounty.description || 'The bounty details are published on make.fun.')}</p><p>${esc(rules)}</p></details>`;
  app.innerHTML = compact ? detail : `<p><a href="#/">← Bounty board</a></p><section class="pane detail">${detail}</section>`;
}
