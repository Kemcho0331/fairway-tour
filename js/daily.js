/* Fairway Tour · Daily challenge: one seeded course a day with a fixed field to beat */
'use strict';
function dayKey(d=new Date()){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
const DAILY_SETS = ['parkland','pines','coast','hill','desert','links','bayou','plains','azalea','mountain','cliffs','resort','florida','sandhills','heartland','eastlinks'];
const SET_LABEL = {parkland:'Texas parkland', pines:'East Texas pines', coast:'Gulf Coast', hill:'Hill Country', desert:'Big Bend desert', links:'Galveston links', bayou:'Caddo Lake bayou', plains:'Panhandle plains', azalea:'Azalea parkland',
  mountain:'Rocky Mountains', cliffs:'Pacific cliffs', resort:'Arizona desert', florida:'Florida', sandhills:'Carolina sandhills', heartland:'Midwest parkland', eastlinks:'Northeast links'};
function dailyEvent(key){
  const r=mulberry32(idSeed('daily'+key)), set=DAILY_SETS[(r()*DAILY_SETS.length)|0], d=new Date(key+'T12:00:00');
  const name=`Daily · ${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
  const ev=makeEvent(3, 3, ['daily'+key, name, set, 6, {tag:`${SET_LABEL[set]}. Same course for everyone today.`}], 'season');
  return ev;
}
// today's field: five rivals whose scores are fixed by the date
function dailyGhosts(key, ev){
  const r=mulberry32(idSeed('ghosts'+key)), pool=TOUR[3].roster.concat(TOUR[2].roster), pick=[];
  while(pick.length<5){ const p=pool[(r()*pool.length)|0]; if(!pick.includes(p)) pick.push(p); }
  const keepRandom=Math.random; Math.random=r;
  try{ return pick.map(([name,sk])=>{ const skill=Math.min(1.03,sk+0.35+r()*0.1), form=gauss()*0.1; return {name, skill, scores:ev.holes.map(h=>rivalScore(h.par,skill,ev.diff,form))}; }); }
  finally{ Math.random=keepRandom; }
}
function dailyRec(){ save.daily=save.daily||{days:{}, streak:0, last:null}; return save.daily; }
function startDaily(){
  const key=dayKey(), ev=dailyEvent(key); Sound.init();
  EV=Object.create(ev); Object.assign(EV,{kind:'daily', practice:true, daily:true, dayKey:key, fee:0, major:false, rounds:1, _goals:null, _owed:0});
  EV._ghosts=dailyGhosts(key, ev);
  const d=dailyRec(), rec=d.days[key]||(d.days[key]={best:null, tries:0}); rec.tries++; persist();
  closeSheet(); newTournament(); beginIntro();
}
function finishDaily(){
  const d=dailyRec(), key=EV.dayKey, rec=d.days[key], rel=playerScores.reduce((a,s,i)=>a+s-HOLES[i].par,0), first=rec.best===null, better=first||rel<rec.best;
  if(better) rec.best=rel;
  if(d.last!==key){ const y=new Date(); y.setDate(y.getDate()-1); d.streak = d.last===dayKey(y) ? d.streak+1 : 1; d.last=key; }
  const keys=Object.keys(d.days).sort(); if(keys.length>40) keys.slice(0,keys.length-40).forEach(k=>delete d.days[k]);
  persist();
  const st=standings(), me=st.find(x=>x.you), pos=posOf(st,me).label;
  openSheet('results',`
    <div class="sheet-head"><span class="kicker">${EV.name} · final</span><span class="title ${pos==='1'?'gold':''}">${pos==='1'?'You won today':`Finished ${pos}`}</span>
      <span class="head-sub">${fmtPar(rel)} · ${better&&!first?'new best for today':first?'first try today':`today's best is ${fmtPar(rec.best)}`} · ${d.streak}-day streak</span></div>
    <div class="sheet-body">${boardHTML()}${cardHTML()}
      <div class="row"><button class="btn primary" id="againBtn" type="button">Try again</button><button class="btn ghost" id="hubBtn" type="button">Clubhouse</button></div></div>`, '#hubBtn');
  $('#againBtn').onclick=startDaily; $('#hubBtn').onclick=()=>{ hubTab='tour'; showHub(); };
}
function dailyCardHTML(){
  const d=dailyRec(), key=dayKey(), rec=d.days[key], ev=dailyEvent(key);
  return `<h3 class="sec">Daily challenge</h3><div class="ev"><div class="ev-top"><div style="display:flex;flex-direction:column;gap:4px;min-width:0"><span class="ev-step">${ev.name} · ${SET_LABEL[ev.set]}</span><span class="ev-name">6 holes · par ${ev.par}</span></div></div>
    <div class="ev-meta">Same course and same five rivals for everyone today. Play as often as you like; your best score counts. Nothing here touches your career.<br>${rec&&rec.best!==null?`Today's best <strong>${fmtPar(rec.best)}</strong> · `:''}${d.streak?`Streak <strong>${d.streak} day${d.streak===1?'':'s'}</strong>`:'Start a streak today'}</div>
    <div class="row"><button class="btn primary sm" type="button" data-act="daily">${rec?'Play again':'Play today\'s course'}</button></div></div>`;
}
