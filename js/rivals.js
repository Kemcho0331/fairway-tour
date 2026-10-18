/* Fairway Tour · Nemesis rivalries, the Career tab, and the trophy case */
'use strict';
/* ---------- Nemesis ---------- */
const PERSONAS = {
  bomber:  {name:'The Bomber',  sd:.86, eagle:1,   mean:0,   blurb:'Long and wild. Lots of birdies, plenty of doubles.',
    pre:["Hope you brought a few extra balls.","I'll be hitting wedge where you're hitting iron.","Try to keep up off the tee."],
    win:["Told you. Distance wins.","Maybe next time hit it past me once."], lose:["The wind cost me. Won't happen twice.","Enjoy it. I'll be bombing past you next week."]},
  grinder: {name:'The Grinder', sd:.42, eagle:1,   mean:.03, blurb:'Fairways, greens, pars. Almost never makes a mistake.',
    pre:["Pars win tournaments.","I'll be in the fairway. Where will you be?","Make one mistake. That's all I need."],
    win:["Steady wins again.","You blinked. I didn't."], lose:["One good week doesn't make a career.","I'll still be here when you slip."]},
  showman: {name:'The Showman', sd:.78, eagle:2.5, mean:0,   blurb:'Eagles and blowups. Never boring.',
    pre:["The crowd's here for me, you know.","Feeling an eagle this week.","Let's put on a show."],
    win:["Did you see that eagle? Everybody did.","Thanks for the supporting role."], lose:["Fine. You get one highlight reel.","The cameras were on me anyway."]},
};
const SETTLE_WINS = 5;
// the Pro Tour's best can climb past everyone else, and the field sharpens every year after you become Texas Champion
const fieldHeat = t => (t===3 ? (save.proHeat||0) : 0) + Math.min(3, save.ngp||0)*0.03;
const skillCap = t => t===3 ? 1.03+fieldHeat(t) : t===4 ? 1.15 : 0.97;
const HEAT_STEP = 0.015, HEAT_MAX = 0.09;
const nem = () => save.nem || null;
const firstName = n => n.split(' ')[0];
function personaFor(name){ return ['bomber','grinder','showman'][idSeed(name)%3]; }
// the nemesis plays just ahead of your recent form, never below the middle of the tier
function nemSkill(t){
  const f=save.form||[], base=f.length ? f.reduce((a,b)=>a+b,0)/f.length : 0.45, T=TOUR[t];
  const ros=t===NAT?natRoster():T.roster; return clamp(base+0.05, ros[3][1]+T.boost+fieldHeat(t), skillCap(t));
}
// a tier's roster, plus your nemesis if they followed you up from another tier
function tierRoster(t){ if(t===NAT) return natRoster(); let ros=TOUR[t].roster.slice(); if(t===3 && save.nat) ros=ros.filter(r=>!onNational(r[0])); const n=nem(); if(n && !onNational(n.name) && !ros.some(r=>r[0]===n.name)) ros.push([n.name, null]); return ros; }
function nemQuote(kind){ const n=nem(); if(!n) return ''; const L=PERSONAS[n.persona][kind], c=career(); return L[(c.year*7+c.k+(n.w+n.l)*3)%L.length]; }
function addTrophy(key, label, kind){ const t=save.trophies[key]||(save.trophies[key]={label, kind, count:0, years:[]}); t.count++; t.years.push(career().year); }
// called after every finished event; returns HTML notes for the results sheet
function nemesisAfterEvent(keys, totals, wd){
  let note='';
  const n=nem(), mine=totals[0];
  if(n){
    const i=keys.indexOf(n.name);
    if(i>0){
      const theirs=totals[i];
      if(wd || theirs<mine){ n.l++; note+=`<div class="nemq"><span class="nemtag">Nemesis</span> <b>${esc(n.name)}:</b> "${PERSONAS[n.persona].win[(n.l)%2]}" <small>Head to head ${n.w}-${n.l}</small></div>`; }
      else if(mine<theirs){ n.w++;
        if(n.w>=SETTLE_WINS){
          addTrophy('rival:'+n.name, `Rivalry: ${n.name}`, 'rival');
          save.nemPast.push({name:n.name, persona:n.persona, w:n.w, l:n.l, year:career().year});
          note+=`<div class="season" style="--sc:#8a2a1e"><div class="season-top"><span>Rivalry settled</span><span>${n.w}-${n.l}</span></div><span class="season-name">${esc(n.name)} is beaten</span><span class="season-blurb">"${PERSONAS[n.persona].lose[0]}" A rivalry trophy is in your case, and someone new will want a shot at you.</span></div>`;
          save.nem=null;
        } else note+=`<div class="nemq"><span class="nemtag">Nemesis</span> <b>${esc(n.name)}:</b> "${PERSONAS[n.persona].lose[(n.w)%2]}" <small>Head to head ${n.w}-${n.l} · ${SETTLE_WINS-n.w} more to settle it</small></div>`;
      }
    }
  } else if(!wd){
    // a close finish near the top starts a rivalry
    const past=new Set((save.nemPast||[]).map(p=>p.name)), myPos=1+totals.filter(t=>t<mine).length;
    let best=null;
    keys.forEach((k,i)=>{ if(i===0||past.has(k)) return; const d=totals[i]-mine, pos=1+totals.filter(t=>t<totals[i]).length;
      if(Math.abs(d)<=1 && Math.min(pos,myPos)<=3){ const score=Math.abs(d)+(d>0?0.5:0); if(!best || score<best.score) best={k,score}; } });
    if(best){
      const persona=personaFor(best.k); save.nem={name:best.k, persona, w:0, l:0, year:career().year};
      note+=`<div class="season" style="--sc:#8a2a1e"><div class="season-top"><span>A rivalry begins</span><span>${PERSONAS[persona].name}</span></div><span class="season-name">${esc(best.k)}</span><span class="season-blurb">${PERSONAS[persona].blurb} "${PERSONAS[persona].pre[0]}" Finish ahead of ${firstName(best.k)} in ${SETTLE_WINS} events to settle it.</span></div>`;
    }
  }
  return note;
}
function nemHoleLine(i){
  const n=nem(); if(!n) return ''; const p=field.find(f=>f.name===n.name); if(!p) return ''; if(p.cut) return `<div class="nemq"><span class="nemtag">Nemesis</span> <b>${esc(firstName(n.name))}</b> missed the cut and is watching from the clubhouse.</div>`;
  const par=HOLES[i].par, hs=p.scores[i], theirs=p.scores.slice(0,i+1).reduce((a,s,k)=>a+s-HOLES[k].par,0), mine=playerScores.reduce((a,s,k)=>a+s-HOLES[k].par,0), d=theirs-mine;
  const what=scoreName(hs,par).replace('!','').toLowerCase();
  return `<div class="nemq"><span class="nemtag">Nemesis</span> <b>${esc(firstName(n.name))}</b> made ${what==='hole in one'?'a hole in one':what==='par'?'par':'a'+(/^[aeiou]/.test(what)?'n':'')+' '+what} here. ${d>0?`You lead by ${d}.`:d<0?`${firstName(n.name)} leads you by ${-d}.`:'You are all square.'}</div>`;
}
const CUP=(c)=>`<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M12 5h16v9a8 8 0 0 1-16 0z" fill="${c}"/><path d="M12 8H7.5a4.5 4.5 0 0 0 4.5 7M28 8h4.5A4.5 4.5 0 0 1 28 15" fill="none" stroke="${c}" stroke-width="2.4"/><rect x="18" y="21" width="4" height="7" fill="${c}"/><rect x="11" y="28" width="18" height="6" rx="1.5" fill="${c}"/><path d="M15 8v6" stroke="rgba(255,255,255,.45)" stroke-width="2" stroke-linecap="round"/></svg>`;
const TROPHY_LIST = [
  ['champ:0','Amateur Tour Championship','#9aa7ae'], ['champ:1','Mini-Tour Championship','#9aa7ae'], ['champ:2','Challenger Tour Championship','#9aa7ae'], ['champ:3','Pro Tour Championship','#c9a227'],
  ['major:masters','Texas Masters','#c9a227'], ['major:lonestar','Lone Star Championship','#c9a227'],
  ['promo:1','Mini-Tour card','#2f7d4a'], ['promo:2','Challenger Tour card','#2f7d4a'], ['promo:3','Pro Tour card','#2f7d4a'],
  ['qschool','Q-School','#b8763c'], ['poy','Player of the Year','#c9a227'],
  ['promo:4','National Tour card','#2f7d4a'], ['major:natamerican','American Championship','#c9a227'], ['major:natopen','The National Open','#c9a227'], ['major:natatlantic','Atlantic Championship','#c9a227'],
  ['champ:4','National Championship','#c9a227'], ['npoy','National Player of the Year','#c9a227'], ['hof','Hall of Fame','#5c4708'],
];
function careerTabHTML(part){
  const s=save.stats, c=career(), n=nem();
  const fact=(l,v)=>`<div><span class="lbl">${l}</span><b>${v}</b></div>`;
  const facts=`<div class="facts facts4">${fact('Events',s.events)}${fact('Wins',s.wins)}${fact('Top 5s',s.top5||0)}${fact('Majors',s.majors||0)}${fact('Earnings',money(s.earnings))}${fact('Best round',s.best===null?'-':fmtPar(s.best))}${fact('Birdies+',s.birdies)}${fact('Aces',s.hio)}</div>`;
  const nemBlock = n ? `<div class="nemcard"><div class="season-top"><span>Your nemesis · ${PERSONAS[n.persona].name}</span><span>Since year ${n.year}</span></div>
      <span class="season-name">${esc(n.name)}</span><span class="season-blurb">${PERSONAS[n.persona].blurb}</span>
      <div class="h2h"><div><b>${n.w}</b><span>Your wins</span></div><div><b>${n.l}</b><span>Their wins</span></div><div><b>${Math.max(0,SETTLE_WINS-n.w)}</b><span>To settle it</span></div></div></div>`
    : `<div class="field">No nemesis yet. Finish within a stroke of a rival near the top of the leaderboard and one will emerge.</div>`;
  const past=(save.nemPast||[]).map(p=>`<div class="item"><div class="item-main"><span class="item-name">${esc(p.name)}</span><span class="item-desc">${PERSONAS[p.persona].name} · settled in year ${p.year} · ${p.w}-${p.l}</span></div></div>`).join('');
  const tro=(key,label,col)=>{ const t=save.trophies[key]; return `<div class="tro ${t?'':'off'}">${CUP(t?col:'#b8c2bb')}<b>${esc(label)}</b><small>${t?`${t.count>1?'×'+t.count+' · ':''}Year ${t.years.join(', ')}`:'Not yet'}</small></div>`; };
  const rivalT=Object.entries(save.trophies).filter(([k])=>k.startsWith('rival:')).map(([k,t])=>tro(k,t.label,'#a8392a')).join('');
  const won=Object.keys(save.trophies).length;
  // the Trophies view: everything you have won, in one place
  if(part==='trophies') return `<h3 class="sec">Trophy case · ${won} won</h3><div class="trophies">${TROPHY_LIST.map(([k,l,col])=>tro(k,l,col)).join('')}${rivalT}</div>
    <h3 class="sec">Achievements</h3>${achHTML()}
    <h3 class="sec">Hall of Fame</h3>${hofHTML()}`;
  return `<div class="season" style="--sc:var(--pine-2)"><div class="season-top"><span>Career</span><span>Year ${c.year}</span></div><span class="season-name">${tierDef().name}</span>
      <span class="season-blurb">${s.promotions||0} promotion${s.promotions===1?'':'s'} · ${s.poy||0} Player of the Year award${s.poy===1?'':'s'} · ${won} troph${won===1?'y':'ies'}</span></div>
    ${facts}
    <h3 class="sec">Nemesis</h3>${nemBlock}${past?`<div>${past}</div>`:''}
    <h3 class="sec">New Game+</h3>${ngpHTML()}`;
}
let EV=null, HOLES=[];
