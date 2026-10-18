/* Fairway Tour · Tour Wire: a running news feed of results, rivalries, and gossip */
'use strict';
function wirePost(tag, text){ save.wire=save.wire||[]; const c=career(); save.wire.unshift({tag, text, y:c.year, t:c.tier}); if(save.wire.length>30) save.wire.length=30; }
const GOSSIP = [
  r=>`${r} blames his putter after a rough week. The putter has declined to comment.`,
  r=>`Spotted: ${r} hitting balls at the range well past midnight.`,
  r=>`${r} says the greens this week were "faster than a jackrabbit on a hot skillet."`,
  r=>`Rumor: ${r} switched to a lucky ball. Results pending.`,
  r=>`${r} was seen eating brisket between nines and still made the turn under par.`,
  r=>`${r}'s caddie quit mid-round. They made up in the parking lot.`,
  r=>`${r} predicts a win next week. He predicted that last week too.`,
  r=>`A dog ran across the 7th green during ${r}'s group. Witnesses say it two-putted.`,
  r=>`${r}'s mom called the tournament office about his tee time. Again.`,
  r=>`Sources say ${r} talks to his golf ball. Sources also say it listens.`,
  r=>`${r} showed up in plaid pants. The fashion desk is still recovering.`,
  r=>`${r} took a selfie with a longhorn on the drive in. The longhorn did not smile.`,
  (r,y)=>`Local paper calls ${y==='you'?'your swing':y+"'s swing"} "the most interesting in Texas." Unclear if that is a compliment.`,
  (r,y)=>`${r} on ${y}: "Good player. I'm better."`,
];
function wireAfterEvent(o){
  // o: {totals, keys, order, outright, champ, label, wd, mc, tierAt}
  const named=playerName()!=='You', you=named?playerName():'You', them=named?playerName():'you', ev=EV, best=o.totals[o.order[0]], winKey=o.keys[o.order[0]];
  const n=nem(), ni=n?o.keys.indexOf(n.name):-1;
  if(ni>0 && Math.random()<0.6) wirePost('Rivalry', `${n.name} on ${them}: "${nemQuote(o.wd||o.totals[ni]<o.totals[0]?'win':'lose')}"`);
  if(Math.random()<0.4){ const ros=tierRoster(career().tier).map(r=>r[0]).filter(x=>x!==ME); if(ros.length){ const g=GOSSIP[(Math.random()*GOSSIP.length)|0]; wirePost('Gossip', g(ros[(Math.random()*ros.length)|0], them)); } }
  if(o.outright){
    if(winKey===ME) wirePost('Result', `${you} wins the ${ev.name} at ${fmtPar(best)}${ev.major?'. A major!':'.'}`);
    else { const margin=o.totals[o.order[1]]-best; wirePost('Result', `${winKey} wins the ${ev.name} at ${fmtPar(best)}${margin>=3?`, ${margin} shots clear`:''}. ${o.wd?`${you} withdrew.`:o.mc?`${you} missed the cut.`:`${you} finished ${o.label}.`}`); }
  } else wirePost('Result', `A tie at the top of the ${ev.name} at ${fmtPar(best)}. Nobody gets the win. ${o.wd?`${you} withdrew.`:`${you} finished ${o.label}.`}`);
  const c=career(); if(c.tier!==o.tierAt) wirePost('Tour', c.tier>o.tierAt ? `${you} moves up to the ${TOUR[c.tier].name}.` : `${you} drops back to the ${TOUR[c.tier].name}.`);
}
const WIRE_COL = {Result:'var(--pine-2)', Rivalry:'var(--under)', Gossip:'#8a5a2b', Tour:'#3f5fb5', 'Hall of Fame':'#5c4708'};
function wireHTML(){
  const w=(save.wire||[]).slice(0,6);
  if(!w.length) return `<h3 class="sec">Tour Wire</h3><div class="field">News from around the tour shows up here after each event.</div>`;
  return `<h3 class="sec">Tour Wire</h3><div class="wire">${w.map(p=>`<div class="wpost"><span class="wtag" style="--wc:${WIRE_COL[p.tag]||'var(--ink)'}">${p.tag}</span><span>${esc(p.text)}</span><small>Year ${p.y} · ${TOUR[p.t]?TOUR[p.t].name:''}</small></div>`).join('')}</div>`;
}
