/* Fairway Tour · Menus and sheets: clubhouse tabs, pre-round, results, cut, ceremonies */
'use strict';
/* ---------- Sheets ---------- */
const overlay=$('#overlay'), sheet=$('#sheet');
let sheetKind=null, hubTab='tour';
function openSheet(kind,html,focusSel,keepScroll){ if(toastSticky) hideToast(); const st=keepScroll?sheet.scrollTop:0; sheetKind=kind; sheet.innerHTML=html; overlay.hidden=false; sheet.scrollTop=st; const f=focusSel&&sheet.querySelector(focusSel); if(f) setTimeout(()=>f.focus({preventScroll:true}),30); }
function closeSheet(){ overlay.hidden=true; sheetKind=null; }
function careerLine(){ const s=save.stats; if(!s.events) return ''; return `<div class="career">Career: ${s.events} event${s.events===1?'':'s'} · ${s.wins} win${s.wins===1?'':'s'} · best round ${fmtPar(s.best)} · ${s.birdies} birdies or better${s.hio?` · ${s.hio} hole${s.hio===1?'':'s'} in one`:''} · ${money(s.earnings)} earned</div>`; }

function showHub(keepScroll){
  Sound.setTension(false); state='menu'; updateHud(); $('#rack').innerHTML=''; checkAch(); achNew=[];
  const tabs=[['tour','Tour'],['standings','Points'],['career','Career'],['golfer','Golfer'],['shop','Shop']];
  const head=`
    <div class="sheet-head">
      <div class="head-row">
        <div style="display:flex;flex-direction:column;gap:6px"><span class="kicker">Clubhouse · ${tierDef().name}</span><span class="title">Fairway Tour</span></div>
        <div class="bank"><span>Bank</span><b>${money(save.cash)}</b></div>
      </div>
      <div class="tabs" role="tablist">${tabs.map(([k,l])=>`<button class="tab" role="tab" type="button" data-tab="${k}" aria-selected="${hubTab===k}">${l}</button>`).join('')}</div>
    </div>`;
  const body=hubTab==='tour'?tourHTML():hubTab==='standings'?standingsHTML():hubTab==='career'?careerTabHTML():hubTab==='golfer'?golferHTML():shopHTML();
  openSheet('hub', head + `<div class="sheet-body">${body}</div>`, null, keepScroll);
  sheet.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ if(hubTab!==b.dataset.tab){ hubTab=b.dataset.tab; Sound.tick(); showHub(); } });
  sheet.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{ const a=b.dataset.act; if(a==='play') showPreTee(); else if(a==='range') startRange(); else if(a==='practice') showPracticePicker(); else if(a==='simchamp') simulateChamp(); else if(a==='skipq'){ newYear(); persist(); toast(`Year ${career().year} starts. Back on the ${tierDef().name}.`,2400); showHub(); } });
  sheet.querySelectorAll('[data-xsort]').forEach(b=>b.onclick=()=>{ save.exclSort=b.dataset.xsort; persist(); Sound.tick(); showHub(true); });
  sheet.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>buyUpgrade(b.dataset.up));
  sheet.querySelectorAll('[data-ball]').forEach(b=>b.onclick=()=>buyBall(b.dataset.ball));
  sheet.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>buyColor(b.dataset.color));
  sheet.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{ const [k,v]=b.dataset.g.split(':'); save.golfer[k]=k==='skin'?+v:k==='watch'?!!v:v; persist(); Sound.tick(); showHub(true); });
  wireBag(()=>showHub(true));
  const gn=$('#gname'); if(gn) gn.oninput=()=>{ save.golfer.name=gn.value.slice(0,16); persist(); };
  const st=$('#soundToggle'); if(st) st.onclick=()=>{ toggleSound(); st.textContent=Sound.muted?'Sound off':'Sound on'; };
}
function careerCard(){
  const c=career(), T=tierDef(), S=season(), rows=tableRows(), me=rows.find(r=>r.you), rank=rows.indexOf(me)+1;
  const dots=Array.from({length:8},(_,k)=>`<i class="${c.played[k]?'on':''}"></i>`).join('')+`<i class="${c.played.champ?'on':''}" style="border-radius:2px"></i>`;
  const goal=c.tier===NAT?'Top 6 make the Championship · Top 10 keep their cards':c.tier<3?'Top 2 move up · Top 6 make the Championship':`Finish 1st to be Player of the Year${fieldHeat(3)>0?` · Field level +${Math.round(fieldHeat(3)/HEAT_STEP)}`:''}`;
  return `<div class="season" style="--sc:${S.color}">
    <div class="season-top"><span>${T.name} · Year ${c.year}</span><span>${ordinal(rank)} · ${me.pts} pts</span></div>
    <span class="season-name">${S.name}</span>
    <span class="season-blurb">${S.blurb}</span>
    <div class="season-foot"><span class="spips" aria-label="Schedule progress">${dots}</span><span>${goal}</span></div>
  </div>`;
}
function eventMeta(e){
  const owed=e.fee>save.cash && e.fee>0;
  return `${e.tagline?`<strong>${e.tagline}</strong><br>`:''}${e.pars.length} holes${e.rounds===2?' × 2 rounds, cut after round 1':''} · par ${e.par} · field of ${e.kind==='champ'?6:tierRoster(e.kind==='q'?Math.min(3,e.tier+1):e.tier).length+1} · wind up to ${e.windMax} mph<br>
    Winner <strong>${money(e.payouts[0])}</strong> · Entry <strong>${e.fee?money(e.fee):'Free'}</strong>${owed?' (on credit, taken from winnings)':''}${e.kind==='q'?'':` · ${e.mult>1?'<strong>Double points</strong>':'Standings points'}`}`;
}
function tourHTML(){
  const c=career(), T=tierDef(), e=currentEvent(), rank=myRank();
  let next;
  if(c.phase==='champ' && rank>6){
    next=`<div class="ev"><div class="ev-top"><div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="ev-step">Season finale</span><span class="ev-name">${e.name}</span></div></div>
      <div class="ev-meta">Only the top 6 in the standings play. You finished the regular season <strong>${ordinal(rank)}</strong>.</div>
      <button class="btn primary sm" type="button" data-act="simchamp">See the results</button></div>`;
  } else {
    const step=c.phase==='season'?`Event ${c.k+1} of 8 · ${season().name}`:c.phase==='champ'?'Season finale · Top 6 only':'Q-School · win to move up';
    next=`<div class="ev" style="border-color:var(--ink)"><div class="ev-top"><div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="ev-step">Next up · ${step}</span><span class="ev-name">${e.name}</span></div>${e.major?'<span class="trophy">Major</span>':''}</div>
      <div class="ev-meta">${eventMeta(e)}</div>
      ${nem() && (e.kind!=='champ' || rank<=6) ? `<div class="nemq"><span class="nemtag">Nemesis</span> <b>${esc(nem().name)}:</b> "${nemQuote('pre')}"</div>`:''}
      <div class="row"><button class="btn primary sm" type="button" data-act="play">Tee off${e.fee?' · '+money(e.fee):''}</button>${c.phase==='qschool'?'<button class="btn ghost sm" type="button" data-act="skipq">Skip, replay the year</button>':''}</div></div>`;
  }
  const row=(n,ev,res,cur,chipS)=>`<div class="srow ${cur?'next':res?'done':''}"><span class="n">${n}</span><span class="nm"><b>${ev.name}</b><small>${ev.region||(ev.set==='azalea'?'parkland':ev.set)} · ${ev.pars.length} holes${ev.rounds===2?' × 2 rounds':''}${ev.major?' · major':''}</small></span>
    <span class="res">${res?`${res.label} · ${res.pts} pts`:cur?'<span class="chip-s" style="background:var(--ink)">Next</span>':chipS}</span></div>`;
  const rows=T.events.map((ev,k)=>{ const S=SEASONS[Math.floor(k/2)]; return row(k+1,ev,c.played[k],c.phase==='season'&&c.k===k,`<span class="chip-s" style="background:${S.color}">${S.name}</span>`); }).join('')
    + row('★',T.champEv,c.played.champ,c.phase==='champ','<span class="chip-s" style="background:var(--pine-2)">Top 6</span>')
    + (c.phase==='qschool'?row('Q',T.qEv,null,true,''):'');
  return careerCard() + next + `<h3 class="sec">${tierSponsors(c.tier).length>1?'Sponsors':'Sponsor'}</h3><div>${sponsorSummary()}</div><h3 class="sec">${T.name} schedule · Year ${c.year}</h3><div class="sched">${rows}</div>
    ${practiceButtons()}
    <details class="how"><summary>How to play</summary><ul class="howto">
      <li>Drag back from anywhere and let go to swing. A longer pull hits harder.</li>
      <li>Pull past the white tick to overswing. You get extra distance, but risk a hook or slice.</li>
      <li>Your club is picked for you. Tap another club or press 1 to 4 to switch.</li>
      <li>Arrows on the green point downhill. Putts break that way.</li>
      <li>Each tier plays 8 events, two per season. Finishes earn standings points, and majors and the Championship count double.</li>
      <li>The top 6 play the Tour Championship. The top 2 after it move up a tier. Miss out and you can try Q-School, where only a win gets you through.</li>
      <li>Short on money? You can still enter. The fee comes out of your winnings.</li>
      <li>Majors on the Pro and National tours are two rounds. After round 1, only the top half of the field and ties make the cut. Miss it and you get no points or money.</li>
      <li>Win Player of the Year on the Pro Tour to become Texas Champion and join the National Tour: you plus 15 state champions. Top 10 keep their cards, 11th or worse goes back to Texas.</li>
      <li>National Tour results earn Hall of Fame points. Reach 1,000 to be inducted.</li>
      <li>Before each event, pick a sponsor goal to chase. Clear every goal in a set to earn that sponsor's gear. Signature clubs swap into your bag in place of your shop club.</li>
    </ul></details>
    <div class="row"><button class="btn ghost sm" id="soundToggle" type="button">${Sound.muted?'Sound off':'Sound on'}</button></div>`;
}
function standingsHTML(){
  const c=career(), T=tierDef(), rows=tableRows();
  const note=c.tier===NAT?'Top 6 play the <strong>National Championship</strong>. Top 10 keep their cards. <strong>11th or worse goes back to Texas</strong>, and new state champions take their places.':c.tier<3?`After the Tour Championship, the top 2 move up to the <strong>${TOUR[c.tier+1].name}</strong>. Top 6 qualify for the Championship.`:'Finish 1st after the Tour Championship to be <strong>Player of the Year</strong>.';
  return `<div class="field">${note}</div>
    <table class="lb"><thead><tr><th>Pos</th><th>Player</th><th class="r">Wins</th><th class="r">Points</th></tr></thead><tbody>${
      rows.map((r,i)=>`<tr class="${r.you?'you':''} ${r.nem?'nem':''} ${i===2&&c.tier<3?'cutline':''} ${i===6?'cutline':''} ${i===10&&c.tier===NAT?'cutline dropline':''}"><td class="pos">${i+1}</td><td>${esc(r.name)}${r.you?'':stTag(r.n)}${r.nem?' <span class="nemtag">Nemesis</span>':''}</td><td class="r">${r.wins}</td><td class="num">${r.pts}</td></tr>`).join('')
    }</tbody></table>
    <div class="career">${T.name} · Year ${c.year} · ${Object.keys(c.played).filter(k=>k!=='champ'&&k!=='q').length} of 8 events played</div>`;
}
function golferHTML(){
  const g=save.golfer, ok=(x,kind)=>!x.excl||(x.excl===kind&&hasItem(x.id));
  const bg=(key,it)=>key==='skin'?it:it.s2?`linear-gradient(${it.c} 0 38%,${it.s2} 38% 56%,${it.c} 56%)`:it.c;
  const chips=(key,list,cur,isText)=>list.map((it,i)=>{ const id=isText||key!=='skin'?it.id:i, on=String(cur)===String(id);
    return isText ? `<button class="tchip" type="button" data-g="${key}:${id}" aria-pressed="${on}">${it.name}</button>`
                  : `<button class="chip ${it.excl?'excl':''}" type="button" data-g="${key}:${id}" aria-pressed="${on}" aria-label="${key==='skin'?'Skin tone '+(i+1):it.name}" title="${key==='skin'?'':it.name}" style="background:${bg(key,it)}"></button>`; }).join('');
  const shirts=LOOK.shirts.filter(x=>ok(x,'shirt')), hats=LOOK.shirts.filter(x=>ok(x,'hat')), pants=LOOK.pants.filter(x=>ok(x,'pants'));
  return `<div class="golfer-wrap"><canvas id="gprev" width="300" height="300" aria-label="Your golfer taking a practice swing"></canvas>
      <div class="name-field"><label class="lbl" for="gname">Name on the leaderboard</label><input id="gname" type="text" maxlength="16" autocomplete="off" spellcheck="false" placeholder="You" value="${esc(g.name||'')}"><small>Leave blank to show up as "You."</small></div></div>
    <h3 class="sec">Your bag</h3>${bagHTML()}
    <h3 class="sec">Look</h3>
    <div class="opt"><span class="lbl">Skin tone</span><div class="chips">${chips('skin',LOOK.skins,g.skin)}</div></div>
    <div class="opt"><span class="lbl">Shirt</span><div class="chips">${chips('shirt',shirts,g.shirt)}</div></div>
    <div class="opt"><span class="lbl">Pants</span><div class="chips">${chips('pants',pants,g.pants)}</div></div>
    <div class="opt"><span class="lbl">Hat</span><div class="chips">${chips('hat',LOOK.hats,g.hat,true)}</div></div>
    ${g.hat!=='none'?`<div class="opt"><span class="lbl">Hat color</span><div class="chips">${chips('hatColor',hats,g.hatColor)}</div></div>`:''}
    ${hasItem('capwatch')?`<div class="opt"><span class="lbl">Capitol Chronograph</span><div class="chips"><button class="tchip" type="button" data-g="watch:1" aria-pressed="${!!g.watch}">On</button><button class="tchip" type="button" data-g="watch:" aria-pressed="${!g.watch}">Off</button></div></div>`:''}
    <div class="career">Gold-ringed swatches are sponsor exclusives. Earn more in the Career tab's sponsor gear list.</div>`;
}
function pips(t){ return `<span class="pips" aria-label="Tier ${t} of 4">${[1,2,3,4].map(k=>`<i class="${k<=t?'on':''}"></i>`).join('')}</span>`; }
function shopHTML(){
  const clubs=CLUBS.map(c=>{ const t=save.gear[c.id]||0, up=UPGRADES[c.id], next=up.prices[t];
    const btn = t>=4 ? `<button class="btn ghost sm" type="button" disabled>Maxed</button>` : `<button class="btn ${save.cash>=next?'primary':'ghost'} sm" type="button" data-up="${c.id}" ${save.cash>=next?'':'disabled'}>${TIERS[t+1]} · ${money(next)}</button>`;
    return `<div class="item"><div class="item-main"><span class="item-name">${c.name} <span class="tier t${t}">${TIERS[t]}</span></span>${pips(t)}<span class="item-desc">${up.desc}</span></div>${btn}</div>`; }).join('');
  const balls=BALLS.filter(b=>!b.excl).map(b=>{ const own=save.ballsOwned.includes(b.id), on=save.ball===b.id;
    const btn = on ? `<button class="btn dark sm" type="button" disabled>In bag</button>` : own ? `<button class="btn ghost sm" type="button" data-ball="${b.id}">Use</button>` : `<button class="btn ${save.cash>=b.price?'primary':'ghost'} sm" type="button" data-ball="${b.id}" ${save.cash>=b.price?'':'disabled'}>${money(b.price)}</button>`;
    return `<div class="item"><div class="item-main"><span class="item-name">${b.name}</span><span class="item-desc">${b.desc}</span></div>${btn}</div>`; }).join('');
  const colors=COLORS.filter(c=>!c.excl).map(c=>{ const own=save.colorsOwned.includes(c.id), on=save.color===c.id, afford=save.cash>=c.price;
    return `<button class="swatch" type="button" data-color="${c.id}" aria-pressed="${on}" ${own||afford?'':'disabled'}><span class="dot" style="background:radial-gradient(circle at 35% 35%,${c.c1},${c.c2})"></span>${c.name}<small>${on?'Using':own?'Owned':money(c.price)}</small></button>`; }).join('');
  return `<h3 class="sec">Clubs</h3><div>${clubs}</div>
    <h3 class="sec">Balls</h3><div>${balls}</div>
    <h3 class="sec">Ball colors</h3><div class="swatches">${colors}</div>
    <h3 class="sec">Sponsor exclusives</h3><div class="career" style="border:0;padding:0">Not for sale. Clear a sponsor's goal set to earn each one.</div>${shopExclHTML()}`;
}
function shopExclHTML(){
  const src={}; SPONSORS.forEach(s=>s.sets.forEach((x,i)=>src[x.item]={s,rank:i}));
  const KIND={color:'Ball color', ball:'Ball', club:'Signature club', shirt:'Polo', hat:'Hat color', pants:'Pants', watch:'Watch'};
  const prev=it=>{ const k=it.kind;
    if(k==='color') return `<span class="xprev" style="border-radius:50%;background:radial-gradient(circle at 35% 35%,${it.c1},${it.c2})"></span>`;
    if(k==='shirt') return `<span class="xprev" style="background:linear-gradient(${it.c} 0 38%,${it.s2} 38% 56%,${it.c} 56%)"></span>`;
    if(k==='hat'||k==='pants') return `<span class="xprev" style="background:${it.c}"></span>`;
    if(k==='ball') return `<span class="xprev" style="border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,#c4cac2)"></span>`;
    if(k==='watch') return `<span class="xprev" style="border-radius:50%;background:radial-gradient(circle,#fbf0c6 0 42%,#c9a227 44% 70%,transparent 72%)"></span>`;
    return `<span class="xprev xclub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3 9 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M9 17c-1 2-3 3.5-5.5 3.5-.8 0-1-.9-.3-1.3L8 16.5z" fill="currentColor"/></svg></span>`; };
  const mode=save.exclSort||'type';
  const row=([id,it])=>{ const {s,rank}=src[id], own=hasItem(id);
    return `<div class="item xitem ${own?'':'locked'}">${prev(it)}<div class="item-main"><span class="item-name">${it.name}${it.kind==='club'?` <span class="tier t${it.tier}">${TIERS[it.tier]}</span>`:''}</span><span class="item-desc">${it.desc||KIND[it.kind]}</span></div>
      <div class="xsrc">${own?'<b class="owned">Owned</b>':mode==='sponsor'?'':`<b style="color:${s.color}">${s.name}</b>`}<small>${rankChip(rank)} ${TOUR[s.tier].name}</small></div></div>`; };
  const all=Object.entries(ITEMS), byTour=(a,b)=>src[a[0]].s.tier-src[b[0]].s.tier||src[a[0]].rank-src[b[0]].rank;
  const head=(label,col,count)=>`<div class="xgroup" style="--gc:${col}"><b>${label}</b><small>${count}</small></div>`;
  const got=list=>`${list.filter(([id])=>hasItem(id)).length} of ${list.length} earned`;
  let groups;
  if(mode==='sponsor') groups=SPONSORS.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(sp=>[sp.name, sp.color, all.filter(([id])=>src[id].s===sp).sort((a,b)=>src[a[0]].rank-src[b[0]].rank)]);
  else if(mode==='level') groups=[3,2,1,0].map(r=>[RANKS[r], RANK_COL[r], all.filter(([id])=>src[id].rank===r).sort((a,b)=>src[a[0]].s.tier-src[b[0]].s.tier||src[a[0]].s.name.localeCompare(src[b[0]].s.name))]);
  else groups=[['Signature clubs',['club']],['Sponsor balls',['ball']],['Ball colors',['color']],['Apparel',['shirt','hat','pants','watch']]].map(([l,ks])=>[l,'var(--pine-2)',all.filter(([,it])=>ks.includes(it.kind)).sort(byTour)]);
  const bar=`<div class="xsort" role="group" aria-label="Sort sponsor exclusives"><span class="lbl">Sort by</span>${[['type','Type'],['sponsor','Sponsor'],['level','Level']].map(([k,l])=>`<button class="tchip sm" type="button" data-xsort="${k}" aria-pressed="${mode===k}">${l}</button>`).join('')}</div>`;
  return bar+groups.map(([l,col,list])=>head(l,col,got(list))+list.map(row).join('')).join('');
}
function buyUpgrade(id){ const t=save.gear[id]||0, price=UPGRADES[id].prices[t]; if(t>=4||save.cash<price) return; save.cash-=price; save.gear[id]=t+1; persist(); Sound.coin(); toast(`${TIERS[t+1]} ${CLUBS.find(c=>c.id===id).name} in the bag`); showHub(true); }
function buyBall(id){ const b=BALLS.find(x=>x.id===id); if(!save.ballsOwned.includes(id)){ if(save.cash<b.price) return; save.cash-=b.price; save.ballsOwned.push(id); Sound.coin(); toast(`Bought ${b.name}`); } else Sound.tick(); save.ball=id; persist(); showHub(true); }
function buyColor(id){ const c=COLORS.find(x=>x.id===id); if(!save.colorsOwned.includes(id)){ if(save.cash<c.price) return; save.cash-=c.price; save.colorsOwned.push(id); Sound.coin(); } else Sound.tick(); save.color=id; persist(); showHub(true); }

function showHoleSheet(i,score){
  const h=HOLES[i], rel=score-h.par, last=i===HOLES.length-1, cutHole=EV.rounds===2 && i===roundLen()-1;
  openSheet('hole',`
    <div class="sheet-head">
      <span class="kicker">${holeText(i)} · ${h.name} · par ${h.par}</span>
      <span class="title ${rel<0?'gold':''}">${scoreName(score,h.par).replace('!','')}</span>
      <span class="head-sub">${score} stroke${score===1?'':'s'}${score>=MAX_STROKES?' (picked up)':''}</span>
    </div>
    <div class="sheet-body">
      ${live()?nemHoleLine(i)+goalHoleHTML()+boardHTML():cardHTML()}
      <div class="row"><button class="btn primary" id="nextBtn" type="button">${last?'Final results':cutHole?'Round 1 results':'Next hole'}</button></div>
    </div>`, '#nextBtn');
  $('#nextBtn').onclick=()=>{ closeSheet(); if(last){ if(live()) showResults(); else showPracticeDone(); } else if(cutHole) showCut(); else { startHole(i+1); beginIntro(); } };
}
function playCurrent(){
  EV=currentEvent(); Sound.init();
  EV._owed=Math.max(0, EV.fee-save.cash); if(EV._owed>0) save.stats.credits=(save.stats.credits||0)+1; save.cash=Math.max(0, save.cash-EV.fee); persist(); checkAch();
  closeSheet(); newTournament(); beginIntro();
}
function newYear(){ const c=career(); c.year++; c.k=0; c.phase='season'; c.pts={}; c.wins={}; c.played={}; }
function sumRel(scores, pars){ return scores.reduce((a,s,i)=>a+s-pars[i],0); }
// season finish: promotion, Q-School or Player of the Year
function yearEnd(){
  const c=career(), rank=myRank(), T=tierDef();
  if(c.tier<3 && rank<=2){
    const to=TOUR[c.tier+1].name; addTrophy('promo:'+(c.tier+1), `${to} card`, 'promo'); c.tier++; newYear(); save.stats.promotions=(save.stats.promotions||0)+1;
    return `<div class="season" style="--sc:#1f6b45"><div class="season-top"><span>Promotion</span><span>Finished ${ordinal(rank)}</span></div><span class="season-name">Welcome to the ${to}</span><span class="season-blurb">Bigger purses, tougher courses, and a stronger field start now.</span></div>`;
  }
  if(c.tier===3){
    const rows=tableRows(), poy=rank===1, first=poy&&!save.texasChamp;
    if(poy){ save.stats.poy=(save.stats.poy||0)+1; addTrophy('poy','Player of the Year','poy'); }
    if(first){ save.texasChamp={year:c.year}; save.pendingCeremony='texas'; }
    if(save.texasChamp) save.proHeat=Math.min(HEAT_MAX,(save.proHeat||0)+HEAT_STEP);
    if(poy){ const notes=[]; if(first) natInit(); else natReturn(notes); const nemNote=moveToNational();
      return (first?`<div class="season" style="--sc:#8a6a12"><div class="season-top"><span>Season over</span><span>Finished 1st</span></div><span class="season-name">Texas Champion</span><span class="season-blurb">Player of the Year on the Pro Tour. Head to the clubhouse. Something is waiting for you.</span></div>`
        :`<div class="season" style="--sc:#8a6a12"><div class="season-top"><span>Player of the Year</span><span>Finished 1st</span></div><span class="season-name">Back to the National Tour</span><span class="season-blurb">Texas is yours again, and so is your National Tour card.</span></div>`)+nemNote+notes.join(''); }
    const up=save.nat?texasWinnerUp(rows[0].n):''; newYear();
    return `<div class="season" style="--sc:#3f6c8a"><div class="season-top"><span>Season over</span><span>Finished ${ordinal(rank)}</span></div><span class="season-name">Year ${career().year} awaits</span><span class="season-blurb">${save.texasChamp?'Win Player of the Year to earn your way back to the National Tour.':'A new Pro Tour season starts in spring.'}</span></div>`+up;
  }
  if(c.tier===NAT){
    const rows=tableRows(), poy=rank===1, keep=rank<=10, st=save.stats;
    st.natYears=(st.natYears||0)+1;
    if(poy){ st.npoy=(st.npoy||0)+1; addTrophy('npoy','National Player of the Year','poy'); addHof(ME,HOF_PTS.poy); }
    if(keep){ addHof(ME,HOF_PTS.card); st.cardsKept=(st.cardsKept||0)+1; }
    const churn=natYearEnd(rows);
    if(!keep) c.tier=3;
    newYear();
    const card=poy?['#8a6a12','National Player of the Year',`The best player in the country. +${HOF_PTS.poy+HOF_PTS.card} Hall of Fame points.`]
      :keep?['#1f6b45','Card kept',`Top 10 keep their cards. +${HOF_PTS.card} Hall of Fame points. The bottom 6 are replaced by new state champions.`]
      :['#8a2a1e','Back to Texas','11th or worse loses the National Tour card. Win Texas Player of the Year again to return.'];
    return `<div class="season" style="--sc:${card[0]}"><div class="season-top"><span>National season over</span><span>Finished ${ordinal(rank)}</span></div><span class="season-name">${card[1]}</span><span class="season-blurb">${card[2]}</span></div>`+churn;
  }
  c.phase='qschool';
  return `<div class="season" style="--sc:#5a3f8a"><div class="season-top"><span>Season over</span><span>Finished ${ordinal(rank)}</span></div><span class="season-name">Q-School is next</span><span class="season-blurb">You missed the top 2. Win ${T.qEv.name} to move up anyway, or skip it and replay the year.</span></div>`;
}
function finishEvent(wd, mc){
  const c=career(), kind=EV.kind, pars=HOLES.map(h=>h.par), prevSeason=season().id, RN=EV.holes.length, out=wd||mc;
  const keys=field.map(p=>p.you?ME:p.name);
  // missed cuts rank below everyone who played both rounds
  const totals=field.map(p=>p.you ? (wd?9999:mc?1000+sumRel(playerScores,pars):sumRel(playerScores,pars)) : p.cut ? 1000+sumRel(p.scores.slice(0,RN),pars) : sumRel(p.scores,pars));
  const best=Math.min(...totals), outright=totals.filter(t=>t===best).length===1;
  const order=totals.map((t,i)=>i).sort((a,b)=>totals[a]-totals[b]);
  const myPos=wd?null:1+totals.filter(t=>t<totals[0]).length, tied=!out && totals.filter(t=>t===totals[0]).length>1;
  const label=wd?'WD':mc?'MC':(tied?'T':'')+myPos;
  let pts=totals.map(()=>0);
  if(kind!=='q'){ pts=awardPoints(totals, EV.mult).map((v,i)=>totals[i]>=1000?0:v); if(wd) pts[0]=0; keys.forEach((k,i)=>{ c.pts[k]=(c.pts[k]||0)+pts[i]; }); if(outright){ const w=keys[order[0]]; c.wins[w]=(c.wins[w]||0)+1; } }
  const champ=!out && myPos===1 && !tied, tierAt=c.tier, yrAt=c.year;
  if(EV.tier===NAT && outright){ const w=keys[order[0]]; if(w!==ME || !wd) addHof(w, kind==='champ'?HOF_PTS.champ:EV.major?HOF_PTS.major:HOF_PTS.win); if(w===ME) save.stats.natWins=(save.stats.natWins||0)+1; }
  const prize=out?0:(EV.payouts[myPos-1]||0), owed=EV._owed||0, net=Math.max(0, prize-owed);
  save.cash+=net;
  const s=save.stats, r=rec(EV.id);
  if(!wd){ s.events++; s.earnings+=net; if(champ) s.wins++; r.played++; if(champ) r.wins++; }
  if(!out){ if(s.best===null || totals[0]<s.best) s.best=totals[0]; if(r.bestFinish===null || myPos<r.bestFinish) r.bestFinish=myPos; if(r.bestScore===null || totals[0]<r.bestScore) r.bestScore=totals[0]; }
  const myPts=Math.round(pts[0]);
  if(!out){ if(myPos<=5) s.top5=(s.top5||0)+1;
    const implied=(0.30+0.25*EV.diff+season().rival-totals[0]/pars.length)/0.62; save.form=(save.form||[]).concat([clamp(implied,0,1)]).slice(-6); }
  if(champ && EV.major){ s.majors=(s.majors||0)+1; addTrophy('major:'+EV.id, EV.name, 'major'); }
  if(champ && kind==='champ') addTrophy('champ:'+tierAt, EV.name, 'champ');
  let nemNote=nemesisAfterEvent(keys, totals, wd);
  const spNote=sponsorsAfterEvent({wd:out, pos:myPos, champ}); EV._goals=null;
  let note='';
  if(kind==='season'){
    c.played[c.k]={label, pts:myPts};
    c.k++;
    if(c.k>=8){ c.phase='champ'; const rk=myRank();
      note=rk<=6?`<div class="unlock">You made the <span>Tour Championship</span> as the ${ordinal(rk)} seed</div>`:`<div class="career">You finished the regular season ${ordinal(rk)}. Only the top 6 play the Tour Championship.</div>`; }
  } else if(kind==='champ'){
    c.played.champ={label, pts:myPts}; note=yearEnd();
  } else {
    if(champ){ addTrophy('qschool','Q-School','q'); const to=TOUR[c.tier+1].name; addTrophy('promo:'+(c.tier+1), `${to} card`, 'promo'); c.tier++; newYear(); save.stats.promotions=(save.stats.promotions||0)+1;
      note=`<div class="season" style="--sc:#1f6b45"><div class="season-top"><span>Q-School</span><span>Won it</span></div><span class="season-name">Welcome to the ${to}</span><span class="season-blurb">You earned your card the hard way.</span></div>`; }
    else { newYear(); note=`<div class="career">Only a win gets through Q-School. Year ${c.year} starts back on the ${tierDef().name}.</div>`; }
  }
  if(!save.hofIn && (save.hofPts||0)>=HOF_TARGET){ save.hofIn=yrAt; save.hofList=(save.hofList||[]).concat([{name:ME, st:'TX', year:yrAt}]); save.pendingCeremony='hof'; addTrophy('hof','Hall of Fame','hof');
    note+=`<div class="season" style="--sc:#5c4708"><div class="season-top"><span>Hall of Fame</span><span>${(save.hofPts).toLocaleString('en-US')} points</span></div><span class="season-name">You made it</span><span class="season-blurb">Head to the clubhouse for your induction.</span></div>`; }
  if(season().id!==prevSeason && kind==='season' && c.phase==='season'){ Sound.setSeason(season().id); note+=`<div class="season" style="--sc:${season().color}"><div class="season-top"><span>Season change</span><span>${tierDef().name}</span></div><span class="season-name">${season().name} is here</span><span class="season-blurb">${season().blurb}</span></div>`; }
  else if(season().id!==prevSeason) Sound.setSeason(season().id);
  persist();
  if(!wd){ s.sets=s.sets||{}; s.sets[EV.set]=1; }
  if(!out && RS){ if(RS.bogeys===0 && HOLES.length>=6) s.cleanCards=(s.cleanCards||0)+1; if(RS.pens===0 && HOLES.length>=9) s.dryNines=(s.dryNines||0)+1;
    if(champ){ s.seasonWins=s.seasonWins||{}; s.seasonWins[prevSeason]=1; if(RS.ledAll) s.wires=(s.wires||0)+1; if(RS.maxDef>=3) s.comebacks=(s.comebacks||0)+1; } }
  checkAch(false,true); const achNote=achResultsHTML(); persist();
  const rows=tableRows(), rk=rows.findIndex(x=>x.you)+1;
  openSheet('results',`
    <div class="sheet-head">
      <span class="kicker">${EV.name} · final</span>
      <span class="title ${champ?'gold':''}">${wd?'Withdrew':mc?'Missed the cut':champ?'Champion':`Finished ${label}`}</span>
      <span class="head-sub">${wd?'No points or prize money':mc?`${fmtPar(totals[0]-1000)} after round 1 · no points or prize money`:`${playerScores.reduce((a,b)=>a+b,0)} strokes · ${fmtPar(totals[0])}${tied&&myPos===1?' · a tie does not count as a win':''}`}</span>
    </div>
    <div class="sheet-body">
      ${note}${nemNote}${spNote}${achNote}
      <div class="facts">
        <div><span class="lbl">Prize</span><b>${money(net)}</b></div>
        <div><span class="lbl">${kind==='q'?'Bank':'Points'}</span><b>${kind==='q'?money(save.cash):'+'+myPts}</b></div>
        <div><span class="lbl">${kind==='q'?'Result':'Standing'}</span><b>${kind==='q'?(champ?'Won':label):ordinal(rk)}</b></div>
      </div>
      ${owed&&!out?`<div class="career">Entry fee of ${money(owed)} came out of your winnings.</div>`:''}
      ${wd?'':boardHTML()}
      <div class="row"><button class="btn primary" id="hubBtn" type="button">Clubhouse</button></div>
    </div>`, '#hubBtn');
  if(champ) Sound.cheer(1.2);
  $('#hubBtn').onclick=()=>{ hubTab='tour'; if(save.pendingCeremony) showCeremony(); else showHub(); };
}
function showCeremony(){
  const kind=save.pendingCeremony==='hof'?'hof':'texas'; save.pendingCeremony=false; persist();
  const s=save.stats, tro=Object.keys(save.trophies).length, past=save.nemPast||[], fact=(l,v)=>`<div><span class="lbl">${l}</span><b>${v}</b></div>`;
  let head, body;
  if(kind==='hof'){
    head=`<div class="sheet-head cere"><span class="kicker">Year ${save.hofIn} · Hall of Fame</span><span class="title gold">Inducted</span><span class="head-sub">${playerName()==='You'?'You are':esc(playerName())+' is'} in the Hall of Fame. Very few players ever get here.</span></div>`;
    body=`<div class="facts facts4">${fact('Years',save.hofIn)}${fact('Events',s.events)}${fact('Wins',s.wins)}${fact('Majors',s.majors||0)}${fact('National wins',s.natWins||0)}${fact('National POY',s.npoy||0)}${fact('Earnings',money(s.earnings))}${fact('Trophies',tro)}</div>
      <div class="invite"><span class="kicker">The plaque reads</span><b>${esc(playerName()==='You'?'Texas Champion':playerName())}</b><span>Texas. ${s.natYears||0} National Tour season${s.natYears===1?'':'s'}, ${(save.hofPts||0).toLocaleString('en-US')} Hall of Fame points. You have beaten Fairway Tour. Keep playing as long as you like.</span></div>`;
  } else {
    const tc=save.texasChamp||{year:career().year};
    head=`<div class="sheet-head cere"><span class="kicker">Year ${tc.year} · Pro Tour</span><span class="title gold">Texas Champion</span><span class="head-sub">${playerName()==='You'?'You':esc(playerName())} topped the Pro Tour. From the Amateur tour to the summit of Texas golf.</span></div>`;
    body=`<div class="facts facts4">${fact('Years',tc.year)}${fact('Events',s.events)}${fact('Wins',s.wins)}${fact('Majors',s.majors||0)}${fact('Top 5s',s.top5||0)}${fact('Earnings',money(s.earnings))}${fact('Best round',s.best===null?'-':fmtPar(s.best))}${fact('Trophies',tro)}</div>
      <div class="career" style="border:0;padding:0">${s.promotions||0} promotion${s.promotions===1?'':'s'} · ${s.birdies} birdies or better${s.hio?` · ${s.hio} hole${s.hio===1?'':'s'} in one`:''}${past.length?` · rivalries settled with ${past.map(p=>esc(p.name)).join(', ')}`:''}</div>
      <div class="invite"><span class="kicker">An envelope arrives</span><b>The National Tour wants you</b><span>Next season you play the National Tour as Texas's champion, against fifteen champions from other states. Top 10 keep their cards. Finish 11th or worse and you are back in Texas, where the Pro field gets sharper every year. Only National Tour results count toward the Hall of Fame.</span></div>`;
  }
  openSheet('ceremony', head+`<div class="sheet-body">${body}<div class="row"><button class="btn primary" id="hubBtn" type="button">Keep playing</button></div></div>`, '#hubBtn');
  Sound.cheer(1.4);
  $('#hubBtn').onclick=()=>{ hubTab='tour'; showHub(); };
}
// end of round 1 in a major: the top half and ties play on
function showCut(){
  const n=roundLen(), rel=sc=>sc.slice(0,n).reduce((a,v,k)=>a+v-HOLES[k].par,0), all=field.map(p=>p.you?rel(playerScores):rel(p.scores)).sort((a,b)=>a-b);
  const keep=Math.ceil(field.length/2), line=all[keep-1];
  field.forEach(p=>{ if(!p.you) p.cut=rel(p.scores)>line; });
  const mine=rel(playerScores), made=mine<=line, nm=nem(), np=nm&&field.find(f=>f.name===nm.name);
  if(!made){ EV._mc=true; finishEvent(false,true); return; }
  const playing=field.filter(p=>p.you||!p.cut).length; save.stats.cutsMade=(save.stats.cutsMade||0)+1; checkAch();
  openSheet('cut',`
    <div class="sheet-head"><span class="kicker">${EV.name} · round 1 complete</span><span class="title gold">Made the cut</span>
      <span class="head-sub">Cut line ${fmtPar(line)} · ${playing} of ${field.length} play round 2 · you are ${fmtPar(mine)}</span></div>
    <div class="sheet-body">
      ${np?`<div class="nemq"><span class="nemtag">Nemesis</span> <b>${esc(nm.name)}</b> ${np.cut?'missed the cut.':'made the cut too.'}</div>`:''}
      <div class="career" style="border:0;padding:0">Round 2 is the same course with new pin positions. Only the 36-hole total counts.</div>
      ${boardHTML()}
      <div class="row"><button class="btn primary" id="nextBtn" type="button">Start round 2</button></div>
    </div>`, '#nextBtn');
  Sound.cheer(0.5);
  $('#nextBtn').onclick=()=>{ closeSheet(); EV.holes.forEach(h=>{ const ps=h.pins.filter(p=>p.name!==h.pinName); setPin(h,(ps.length?ps:h.pins)[(Math.random()*(ps.length||h.pins.length))|0]); }); startHole(n); beginIntro(); };
}
function showResults(){ finishEvent(false); }
// the player missed the Championship: play it out without them
function simulateChamp(){
  const c=career(), T=tierDef(), e=T.champEv, top=tableRows().filter(r=>!r.you).slice(0,6);
  const full=tierRoster(c.tier), nn=nem(); const res=top.map(r=>{ const isN=!!(nn&&r.n===nn.name), sk=isN?nemSkill(c.tier):Math.min(skillCap(c.tier),full.find(x=>x[0]===r.n)[1]+e.boost+fieldHeat(c.tier)), f=gauss()*.1; return {n:r.n, tot:e.pars.reduce((a,p)=>a+rivalScore(p,sk,e.diff,f,isN?nn.persona:null)-p,0)}; });
  const pts=awardPoints(res.map(x=>x.tot), e.mult); res.forEach((x,i)=>{ c.pts[x.n]=(c.pts[x.n]||0)+pts[i]; });
  const best=Math.min(...res.map(x=>x.tot)); if(res.filter(x=>x.tot===best).length===1){ const w=res.find(x=>x.tot===best).n; c.wins[w]=(c.wins[w]||0)+1; }
  c.played.champ={label:'DNQ', pts:0};
  const note=yearEnd(); persist(); Sound.setSeason(season().id);
  res.sort((a,b)=>a.tot-b.tot);
  openSheet('results',`
    <div class="sheet-head"><span class="kicker">${e.name} · final</span><span class="title">${esc(res[0].n)} wins</span><span class="head-sub">You did not qualify this year</span></div>
    <div class="sheet-body">${note}
      <table class="lb"><thead><tr><th>Pos</th><th>Player</th><th class="r">To par</th></tr></thead><tbody>${res.map((x,i)=>`<tr><td class="pos">${i+1}</td><td>${esc(x.n)}</td><td class="num ${x.tot<0?'under':''}">${fmtPar(x.tot)}</td></tr>`).join('')}</tbody></table>
      <div class="row"><button class="btn primary" id="hubBtn" type="button">Clubhouse</button></div></div>`, '#hubBtn');
  $('#hubBtn').onclick=()=>{ hubTab='tour'; showHub(); };
}
function showBoard(){
  if(sheetKind || state==='menu') return;
  if(EV.range) return showRangeSheet();
  if(EV.practice){ openSheet('board',`<div class="sheet-head"><span class="kicker">${EV.name} · practice</span><span class="title">Scorecard</span></div>
      <div class="sheet-body">${cardHTML()}<div class="row"><button class="btn primary" id="backBtn" type="button">Back to the course</button><button class="btn ghost" id="endBtn" type="button">End practice</button></div></div>`, '#backBtn');
    $('#backBtn').onclick=closeSheet; $('#endBtn').onclick=()=>{ aim=null; hubTab='tour'; showHub(); }; return; }
  openSheet('board',`
    <div class="sheet-head"><span class="kicker">Leaderboard · after ${playerScores.length} of ${HOLES.length}</span><span class="title">${EV.name}</span></div>
    <div class="sheet-body">${goalHoleHTML()}${boardHTML()}
      <div class="row"><button class="btn primary" id="backBtn" type="button">Back to the course</button><button class="btn ghost" id="wdBtn" type="button">Withdraw</button></div>
    </div>`, '#backBtn');
  $('#backBtn').onclick=closeSheet;
  let armed=false;
  $('#wdBtn').onclick=e=>{ if(!armed){ armed=true; e.currentTarget.textContent=EV.kind==='q'?'Tap again · give up Q-School':'Tap again · 0 points, fee lost'; return; } aim=null; hideToast(); $('#banner').classList.remove('show'); finishEvent(true); };
}
