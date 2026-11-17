export function dollar(value){if(value==null||value==='')return '—';let n=Number(value);return Number.isFinite(n)?`${n<0?'-':''}$${Math.abs(n).toFixed(2)}`:'—'}
export function scoreText(value){if(value==null||value==='')return '—';let n=Number(value);return Number.isFinite(n)?`${(n/10000).toFixed(2)}%`:'—'}
export function entriesOf(data){return data.entries||data.rows||data.items||data.board?.entries||[]}
export function displayName(entry){return entry.handle||entry.username||entry.name||'Entrant'}
export function entryTitle(entry){return entry.solution?.title||entry.submission?.title||entry.entry?.title||entry.solution_title||entry.submission_title||entry.title||'Competition entry'}
