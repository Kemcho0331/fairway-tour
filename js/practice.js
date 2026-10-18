/* Fairway Tour · Practice: the driving range, free practice rounds, and the scorecard */
'use strict';
const live = () => !(EV && EV.practice);
/* ---------- Scorecard ---------- */
function scoreMark(score, par){ if(score==null) return ''; const r=score-par, cls=r<=-2?'eag':r===-1?'bir':r===1?'bog':r>=2?'dbl':''; return `<span class="sc ${cls}">${score}</span>`; }
function cardTable(label, holes, offset){
  const mine=playerScores.slice(offset, offset+holes.length), nm=nem(), np=nm&&live()&&field.find(f=>f.name===nm.name);
  const tot=a=>a.length?a.reduce((x,y)=>x+y,0):'', par=holes.reduce((a,h)=>a+h.par,0);
  const theirs=np?np.scores.slice(offset, offset+Math.min(holes.length, Math.max(0,playerScores.length-offset))):null;
  const cut=np&&np.cut&&offset>0;
  return `<div class="cardwrap"><table class="card"><caption>${label}</caption>
    <tr class="hd"><th>Hole</th>${holes.map((h,i)=>`<td>${i+1}</td>`).join('')}<td class="t">Tot</td></tr>
    <tr><th>Par</th>${holes.map(h=>`<td>${h.par}</td>`).join('')}<td class="t">${par}</td></tr>
    <tr class="me"><th>${esc(playerName())}</th>${holes.map((h,i)=>`<td>${scoreMark(mine[i],h.par)}</td>`).join('')}<td class="t">${tot(mine)}</td></tr>
    ${np?`<tr class="nm"><th>${esc(firstName(nm.name))}</th>${holes.map((h,i)=>`<td>${cut?'':theirs&&theirs[i]!=null?scoreMark(theirs[i],h.par):''}</td>`).join('')}<td class="t">${cut?'MC':tot(theirs||[])}</td></tr>`:''}
  </table></div>`;
}
function cardHTML(){
  const n=EV.holes.length, rel=playerScores.reduce((a,s,i)=>a+s-HOLES[i].par,0);
  const tables=EV.rounds===2 ? cardTable('Round 1',EV.holes,0)+cardTable('Round 2',EV.holes,n) : cardTable(EV.practice?'Practice round':'Round',HOLES,0);
  return `<div class="cardsum"><b>${fmtPar(rel)}</b><span>${playerScores.length} of ${HOLES.length} holes · ${playerScores.reduce((a,b)=>a+b,0)} strokes</span></div>${tables}
    <div class="cardkey"><span class="sc eag">3</span> Eagle or better <span class="sc bir">4</span> Birdie <span class="sc bog">6</span> Bogey <span class="sc dbl">7</span> Double or worse</div>`;
}
function showScorecard(){
  if(sheetKind || state==='menu') return;
  if(EV.range) return showRangeSheet();
  openSheet('card',`
    <div class="sheet-head"><span class="kicker">${EV.name}${EV.practice?' · practice':''}</span><span class="title">Scorecard</span></div>
    <div class="sheet-body">${cardHTML()}
      <div class="row"><button class="btn primary" id="backBtn" type="button">Back to the course</button></div></div>`, '#backBtn');
  $('#backBtn').onclick=closeSheet;
}
/* ---------- Free practice ---------- */
function practiceCourses(){
  const c=career(), tiers=TOUR.map((T,t)=>t).filter(t=>t<=Math.min(c.tier,3) || (t===4 && save.nat));
  return tiers.map(t=>[TOUR[t].name, TOUR[t].events.concat([TOUR[t].champEv])]);
}
function showPracticePicker(){
  openSheet('practice',`
    <div class="sheet-head"><span class="kicker">Clubhouse · practice</span><span class="title">Free practice</span>
      <span class="head-sub">Play any course you have reached. No fee, no field, no points, and nothing counts toward stats or achievements.</span></div>
    <div class="sheet-body">
      ${practiceCourses().map(([name,evs])=>`<h3 class="sec">${name}</h3><div class="sched">${evs.map(e=>`<div class="srow"><span class="nm"><b>${e.name}</b><small>${e.region||(e.set==='azalea'?'parkland':e.set)} · ${e.pars.length} holes · par ${e.par}</small></span><span class="res"><button class="btn ghost sm" type="button" data-prac="${e.id}">Play</button></span></div>`).join('')}</div>`).join('')}
      <div class="row"><button class="btn ghost" id="backHub" type="button">Back</button></div>
    </div>`, '#backHub');
  sheet.querySelectorAll('[data-prac]').forEach(b=>b.onclick=()=>{ const all=practiceCourses().flatMap(x=>x[1]); startPractice(all.find(e=>e.id===b.dataset.prac)); });
  $('#backHub').onclick=()=>showHub();
}
function startPractice(ev){
  Sound.init(); EV=Object.create(ev); Object.assign(EV,{kind:'practice', practice:true, fee:0, major:false, rounds:1, _goals:null, _owed:0});
  closeSheet(); newTournament(); beginIntro();
}
function showPracticeDone(){
  openSheet('results',`
    <div class="sheet-head"><span class="kicker">${EV.name} · practice</span><span class="title">Round complete</span>
      <span class="head-sub">${playerScores.reduce((a,b)=>a+b,0)} strokes · ${fmtPar(playerScores.reduce((a,s,i)=>a+s-HOLES[i].par,0))}</span></div>
    <div class="sheet-body">${cardHTML()}
      <div class="row"><button class="btn primary" id="againBtn" type="button">Play again</button><button class="btn ghost" id="hubBtn" type="button">Clubhouse</button></div></div>`, '#againBtn');
  $('#againBtn').onclick=()=>startPractice(Object.getPrototypeOf(EV));
  $('#hubBtn').onclick=()=>{ hubTab='tour'; showHub(); };
}
/* ---------- Driving range ---------- */
const RANGE_STARTS = {tee:{x:500,y:1600,name:'Tee'}, fairway:{x:500,y:1380,name:'Fairway'}, rough:{x:850,y:1480,name:'Rough'}, bunker:{x:190,y:1470,name:'Bunker'}};
const RANGE_WIND = {calm:[0,'Calm'], breezy:[12,'Breezy'], strong:[25,'Strong']};
let RANGE = {shots:[], start:'tee', wind:'calm'}, rangeHole=null;
function makeRangeHole(){
  const h={name:'Driving Range', par:3, w:1000, H:1720, seed:4242, tee:{x:500,y:1600}, cup:{x:640,y:1055},
    fairway:[{w:640, pts:[[500,1560],[500,1200],[500,800],[500,400],[500,140]]}],
    green:{x:640,y:1055,rx:110,ry:80,rot:0,seed:5},
    sand:[{x:190,y:1470,rx:80,ry:52,rot:0.2,seed:9}], water:[]};
  h.diff=0; h.treeMul=0; h.arch='range'; h.surround='forest'; h.route=[[500,1600],[640,1055]];
  h.slope=makeSlope(mulberry32(77), h.green, 0); h.slope.tx*=0.3; h.slope.ty*=0.3; h.slope.A*=0.2;
  postHole(h, mulberry32(4242));
  return h;
}
// yardage lines and target flags painted onto the range
function markRange(h){
  if(!h.vis || h.vis._marked) return; const g=h.vis.getContext('2d'); g.setTransform(VIS,0,0,VIS,0,0);
  g.font='700 26px "Barlow Condensed",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  for(let yd=50; yd<=330; yd+=50){ const y=h.tee.y-yd/YPP; if(y<40) break;
    g.strokeStyle='rgba(255,255,255,.55)'; g.lineWidth=3; g.setLineDash([18,14]); g.beginPath(); g.moveTo(190,y); g.lineTo(810,y); g.stroke(); g.setLineDash([]);
    g.fillStyle='rgba(255,255,255,.9)'; g.fillText(String(yd),150,y); g.fillText(String(yd),850,y); }
  [[100,380],[150,600],[200,420],[250,590],[300,470]].forEach(([yd,x])=>{ const y=h.tee.y-yd/YPP; if(y<60) return;
    g.fillStyle='rgba(150,215,110,.75)'; g.beginPath(); g.ellipse(x,y,46,32,0,0,7); g.fill(); g.strokeStyle='rgba(255,255,255,.6)'; g.lineWidth=2; g.stroke();
    g.strokeStyle='#f4f5ef'; g.lineWidth=2.4; g.beginPath(); g.moveTo(x,y); g.lineTo(x,y-34); g.stroke(); g.fillStyle='#d9473a'; g.beginPath(); g.moveTo(x,y-34); g.lineTo(x+18,y-28); g.lineTo(x,y-22); g.fill(); });
  h.vis._marked=true;
}
function rangeSpot(){ return RANGE_STARTS[RANGE.start]||RANGE_STARTS.tee; }
function startRange(){
  Sound.init(); rangeHole=rangeHole||makeRangeHole();
  EV={kind:'range', range:true, practice:true, name:'Driving Range', holes:[rangeHole], pars:[3], par:3, windMax:RANGE_WIND[RANGE.wind][0], rounds:1, tier:career().tier, major:false, diff:0};
  field=[{name:'You',you:true}]; HOLES=[rangeHole]; playerScores=[]; duckUsed=false; resetRS();
  closeSheet(); startHole(0); markRange(rangeHole); clubIdx=0; rangeReset(); setOverview(false); toast('Driving range. Hit away. Tap the list button for options.',2600);
}
function rangeReset(){
  const p=rangeSpot(); strokes=0; ball.x=p.x; ball.y=p.y; ball.z=0; ball.vx=ball.vy=0; ball.hidden=false; ball.holed=false; ball.sink=0; ball.trail=[]; ball.landAt=null;
  if(DRILL && DRILL.kind==='low') setWind(25,0,{mph:25,a:0}); else if(RANGE.wind!=='calm') rollWind(); else setWind(0,0,{mph:0,a:0});
  const keep=clubIdx; setReady(); clubIdx=keep; if(DRILL) drillShotFor(); renderRack(); updateHud();
}
// called when a range ball stops, goes out, or drops in
function rangeShot(kind){
  const from=HS&&HS.from||rangeSpot(), club=CLUBS[HS?HS.club:clubIdx]||CLUBS[0];
  const carry=ball.landAt?dist(from,ball.landAt)*YPP:0, total=kind==='ob'?0:dist(from,ball)*YPP, off=(ball.x-from.x)*YPP;
  const shot={club:club.name, carry:Math.round(carry), total:Math.round(total), off:Math.round(off), note:kind==='ob'?'Out of play':kind==='holed'?'Holed it!':''};
  RANGE.shots.unshift(shot); RANGE.shots=RANGE.shots.slice(0,12);
  if(DRILL) drillAfterShot(shot); else toast(shot.note && kind==='ob' ? `${club.name} · out of play` : `${club.name} · carry ${shot.carry} · total ${shot.total} yds${Math.abs(shot.off)>=2?` · ${Math.abs(shot.off)} ${shot.off<0?'left':'right'}`:''}${kind==='holed'?' · holed it!':''}`, 2600);
  updateHud(); setTimeout(()=>{ if(EV&&EV.range&&state!=='menu') rangeReset(); }, 900);
  state='range-wait';
}
function rangeHud(){
  const s=RANGE.shots[0];
  if(DRILL){ $('#hHole').textContent=`${LESSONS.find(l=>l.id===DRILL.kind).name} drill`; $('#hPar').textContent=`${DRILL.made}/${DRILL.need}`; $('#hYds').textContent=`ball ${Math.min(DRILL.ball+1,DRILL.total)} of ${DRILL.total}`; }
  else { $('#hHole').textContent='Driving range'; $('#hPar').textContent=RANGE.shots.length; $('#hYds').textContent='shots hit'; }
  $('#hL2').textContent='Carry'; $('#hStrokes').textContent=s?s.carry:'-'; $('#hPin').textContent='yards';
  $('#hL3').textContent='Total'; const t=$('#hTotal'); t.textContent=s?s.total:'-'; t.classList.remove('under'); $('#hPos').textContent=s?(Math.abs(s.off)<2?'on line':`${Math.abs(s.off)} yds ${s.off<0?'left':'right'}`):'yards';
}
function showRangeSheet(){
  const by={}; RANGE.shots.forEach(s=>{ if(!s.total) return; (by[s.club]=by[s.club]||[]).push(s); });
  const avg=Object.entries(by).map(([c,a])=>`<div><span class="lbl">${c}</span><b>${Math.round(a.reduce((x,s)=>x+s.carry,0)/a.length)}</b><small>avg carry · ${a.length} shot${a.length===1?'':'s'}</small></div>`).join('');
  const chip=(key,cur,opts)=>Object.entries(opts).map(([k,v])=>`<button class="tchip sm" type="button" data-r="${key}:${k}" aria-pressed="${cur===k}">${Array.isArray(v)?v[1]:v.name}</button>`).join('');
  openSheet('board',`
    <div class="sheet-head"><span class="kicker">Practice</span><span class="title">Driving range</span><span class="head-sub">Nothing here counts toward stats or achievements.</span></div>
    <div class="sheet-body">${DRILL?`<div class="field">${DRILL_INFO[DRILL.kind].how}</div>`:''}
      <div class="opt" ${DRILL?'hidden':''}><span class="lbl">Hit from</span><div class="chips">${chip('start',RANGE.start,RANGE_STARTS)}</div></div>
      <div class="opt" ${DRILL?'hidden':''}><span class="lbl">Wind</span><div class="chips">${chip('wind',RANGE.wind,RANGE_WIND)}</div></div>
      ${avg?`<div class="facts" style="grid-template-columns:repeat(${Math.min(4,Object.keys(by).length)},1fr)">${avg}</div>`:''}
      ${RANGE.shots.length?`<table class="lb"><thead><tr><th>Club</th><th class="r">Carry</th><th class="r">Total</th><th class="r">Line</th></tr></thead><tbody>${RANGE.shots.map(s=>`<tr><td>${s.club}</td><td class="r">${s.note==='Out of play'?'-':s.carry}</td><td class="r">${s.note==='Out of play'?'OB':s.total}</td><td class="r">${s.note==='Out of play'?'':Math.abs(s.off)<2?'on line':Math.abs(s.off)+(s.off<0?' L':' R')}</td></tr>`).join('')}</tbody></table>`:'<div class="field">No shots yet. Your last 12 shots show up here.</div>'}
      <div class="row"><button class="btn primary" id="backBtn" type="button">Keep hitting</button><button class="btn ghost" id="leaveBtn" type="button">${DRILL?'Quit the drill':'Leave the range'}</button></div>
    </div>`, '#backBtn');
  sheet.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{ const [k,v]=b.dataset.r.split(':'); RANGE[k]=v; if(k==='wind') EV.windMax=RANGE_WIND[v][0]; Sound.tick(); showRangeSheet(); });
  $('#backBtn').onclick=()=>{ closeSheet(); if(state==='ready') rangeReset(); };
  $('#leaveBtn').onclick=()=>{ DRILL=null; resetShotSel(); rangeHole.vis=null; rangeHole.built=false; hubTab='tour'; showHub(); };
}
function practiceButtons(){
  return `<h3 class="sec">Practice</h3><div class="row"><button class="btn ghost sm" type="button" data-act="range">Driving range</button><button class="btn ghost sm" type="button" data-act="practice">Free practice</button></div>`;
}
