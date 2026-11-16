const app = document.querySelector('#app');
const BOUNTY_ROUTE = /^#\/bounty\/([^/]+)$/;
const LEADERBOARD_ROUTE = /^#\/bounty\/([^/]+)\/leaderboard(?:\/page\/(\d+))?$/;
let view;

async function route() {
  window.__shotReady = false;
  clearInterval(window.lightTick);
  const hash = decodeURIComponent(location.hash || '#/');
  app.innerHTML = '<p class="loading">Opening live make.fun data…</p>';
  try {
    view ||= await import('./views-board.js');
    const leaderboard = hash.match(LEADERBOARD_ROUTE);
    const bounty = hash.match(BOUNTY_ROUTE);
    if (leaderboard) await view.showLeaderboard(app, leaderboard[1], Number(leaderboard[2]) || 1);
    else if (bounty) await view.showBounty(app, bounty[1]);
    else if (/^#\/profile\/[^/]+$/.test(hash)) await view.showProfile(app, hash.slice('#/profile/'.length));
    else if (hash === '#/' || hash === '#') await view.showBoard(app);
    else view.showNotFound(app);
  } catch (error) {
    app.innerHTML = `<p class="error">${String(error.message)} <a href="#/">Return to board</a></p>`;
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

addEventListener('hashchange', route);
route();
