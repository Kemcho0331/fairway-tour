/* Fairway Tour · The National Tour field, relegation, and the Hall of Fame */
'use strict';
/* ---------- National Tour ---------- */
const NAT = 4;
const STATES = [['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
  ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],
  ['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],
  ['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']];
const NAT_FIRST = ['Jake','Carter','Wyatt','Logan','Grant','Miles','Reese','Owen','Brooks','Hayes','Dawson','Emmett','Rhett','Silas','Graham','Tucker','Parker','Declan','Bennett','Jonah',
  'Mason','Rory','Kai','Mateo','Theo','Ezra','Callum','Nico','Luca','Dante','Soren','Isaac','Andre','Marcus','Tariq','Hiro','Kenji','Min-jun','Ravi','Arjun','Felix','Rowan','Quinn','Beckett','Fletcher'];
const NAT_LAST = ['Morrow','Callaway','Prescott','Whitmore','Ashby','Danforth','Kessler','Lindgren','Hollins','Ashworth','Brennan','Calloway','Mercer','Stafford','Thibodeaux','Vance','Kowalczyk','Okafor',
  'Nakamura','Delgado','Fairbanks','Hargrove','Ellison','Pruett','Sinclair','Waverly','Holloway','Draper','Easton','Garrity','Langley','McCready','Abernathy','Rhodes','Sorensen','Tanaka','Park',
  'Iverson','Quarles','Redding','Shepherd','Underwood','Yates','Castellano','Beaumont','Crowley','Dunmore','Fontaine','Galloway','Hennessy'];
const NAT_SKILL = [0.93, 1.1];
const HOF_TARGET = 1000, HOF_PTS = {win:5, major:15, champ:10, poy:25, card:3};
const LEGENDS = [{name:'Walt Harmon', st:'OH', cls:"Class of '71"}, {name:'Buck Delacroix', st:'LA', cls:"Class of '79"}, {name:'Arnie Coates', st:'PA', cls:"Class of '88"}, {name:'Sam Whitlock', st:'NC', cls:"Class of '96"}, {name:'Danny Okimura', st:'HI', cls:"Class of '09"}];
const stateName = st => (STATES.find(s=>s[0]===st)||[st,st==='TX'?'Texas':st])[1];
function natKnownNames(){ const n=new Set(); TOUR.slice(0,4).forEach(T=>T.roster.forEach(r=>n.add(r[0]))); (save.nat?save.nat.field:[]).forEach(p=>n.add(p.name)); (save.hofList||[]).forEach(p=>n.add(p.name)); LEGENDS.forEach(p=>n.add(p.name)); return n; }
function natDraw(){ return NAT_SKILL[0]+Math.random()*(NAT_SKILL[1]-NAT_SKILL[0]); }
// a brand-new state champion from a state not already in the field
function newStateChamp(){
  const used=new Set(save.nat.field.map(p=>p.st)), open=STATES.filter(s=>!used.has(s[0])), st=(open.length?open:STATES)[(Math.random()*(open.length||STATES.length))|0][0], known=natKnownNames();
  let name; const lasts=new Set(save.nat.field.map(p=>p.name.split(" ").slice(1).join(" ")));
  for(let i=0;i<200;i++){ const ln=NAT_LAST[(Math.random()*NAT_LAST.length)|0]; name=NAT_FIRST[(Math.random()*NAT_FIRST.length)|0]+" "+ln; if(!known.has(name) && (i>150 || !lasts.has(ln))) break; }
  return {name, st, skill:natDraw()};
}
// Texas's champion while you are away: Pro regulars, plus old nemeses who never stopped grinding
function texasChamp(){
  const on=new Set(save.nat.field.map(p=>p.name)), cur=nem(), pool=[];
  (save.nemDormant||[]).forEach(d=>{ if(!on.has(d.name) && d.st==='TX') pool.push([d.name,4]); });
  (save.nemPast||[]).forEach(p=>{ if(!on.has(p.name)) pool.push([p.name,3]); });
  TOUR[3].roster.forEach(([n])=>{ if(!on.has(n) && !(cur&&cur.name===n)) pool.push([n,1]); });
  const seen=new Set(), list=pool.filter(([n])=>!seen.has(n)&&seen.add(n));
  if(!list.length) return null;
  let r=Math.random()*list.reduce((a,x)=>a+x[1],0), pick=list[0][0]; for(const [n,w] of list){ r-=w; if(r<=0){ pick=n; break; } }
  const pro=TOUR[3].roster.find(x=>x[0]===pick);
  return {name:pick, st:'TX', skill:Math.max(natDraw(), pro?Math.min(1.08,pro[1]+TOUR[3].boost+0.02):0.98)};
}
function natInit(){
  if(save.nat) return save.nat;
  save.nat={field:[], hof:{}};
  for(let i=0;i<15;i++) save.nat.field.push(newStateChamp());
  return save.nat;
}
const onNational = name => !!(save.nat && save.nat.field.some(p=>p.name===name));
function stateOf(name){ const p=save.nat&&save.nat.field.find(x=>x.name===name); return p?p.st:null; }
function natRoster(){ return natInit().field.slice().sort((a,b)=>b.skill-a.skill).map(p=>[p.name,p.skill]); }
const stTag = name => { if(career().tier!==NAT && !(EV&&EV.tier===NAT)) return ''; const st=stateOf(name); return st?` <small class="st" title="${stateName(st)}">${st}</small>`:''; };
// someone joins the National field; returning nemeses pick their feud back up
function natJoin(p, notes){
  save.nat.field.push(p);
  const di=(save.nemDormant||[]).findIndex(d=>d.name===p.name);
  if(di>=0){ const d=save.nemDormant[di];
    if(!nem()){ save.stats.reunions=(save.stats.reunions||0)+1; save.nemDormant.splice(di,1); save.nem={name:d.name, persona:d.persona, w:d.w, l:d.l, year:d.year};
      notes.push(`<div class="nemq"><span class="nemtag">Nemesis</span> <b>${esc(p.name)}</b> is back as ${stateName(p.st)}'s champion, and still remembers you. Head to head ${d.w}-${d.l}.</div>`); return; } }
  if((save.nemPast||[]).some(x=>x.name===p.name)){ save.stats.reunions=(save.stats.reunions||0)+1; } if((save.nemPast||[]).some(x=>x.name===p.name)) notes.push(`<div class="career">Old rival <b>${esc(p.name)}</b> made it to the National Tour as ${stateName(p.st)}'s champion.</div>`);
}
// any rival leaving the National field who is your nemesis waits in the wings instead of vanishing
function natLeave(p){
  save.nat.field=save.nat.field.filter(x=>x.name!==p.name);
  const n=nem(); if(n && n.name===p.name){ save.nemDormant=(save.nemDormant||[]).concat([{...n, st:p.st}]); save.nem=null; }
}
function freshEntrant(){
  // a dormant nemesis from another state sometimes wins their state again
  const back=(save.nemDormant||[]).filter(d=>d.st && d.st!=='TX' && !onNational(d.name));
  if(back.length && Math.random()<0.25){ const d=back[(Math.random()*back.length)|0]; return {name:d.name, st:d.st, skill:natDraw()}; }
  return newStateChamp();
}
function addHof(name, pts){ if(name===ME){ save.hofPts=(save.hofPts||0)+pts; return; } const h=save.nat.hof; h[name]=(h[name]||0)+pts; }
// National season over: points for the Hall, inductions, relegation churn, and new state champions
function natYearEnd(rows){
  const c=career(), notes=[];
  rows.forEach((r,i)=>{ if(r.you) return; if(i===0) addHof(r.n, HOF_PTS.poy); if(i<10) addHof(r.n, HOF_PTS.card); });
  // rivals who reach the Hall retire
  for(const p of save.nat.field.slice()){ if((save.nat.hof[p.name]||0)>=HOF_TARGET){ save.hofList=(save.hofList||[]).concat([{name:p.name, st:p.st, year:c.year}]); natLeave(p);
    notes.push(`<div class="season" style="--sc:#5c4708"><div class="season-top"><span>Hall of Fame</span><span>Year ${c.year}</span></div><span class="season-name">${esc(p.name)} is inducted</span><span class="season-blurb">${stateName(p.st)}'s champion retires into the Hall of Fame. Very few ever make it.</span></div>`); } }
  // bottom six are replaced
  rows.slice(10).forEach(r=>{ if(r.you) return; const p=save.nat.field.find(x=>x.name===r.n); if(p) natLeave(p); });
  save.nat.field.forEach(p=>{ p.skill=clamp(p.skill+(Math.random()*2-1)*0.02, NAT_SKILL[0]-0.03, NAT_SKILL[1]+0.04); });
  const tx=texasChamp(); if(tx && save.nat.field.length<15) natJoin(tx, notes);
  while(save.nat.field.length<15) natJoin(freshEntrant(), notes);
  return notes.join('');
}
// you won Texas again: the National field moved on while you were away
function natReturn(notes){
  natInit();
  const out=save.nat.field.slice().sort((a,b)=>a.skill-b.skill).slice(0,3); out.forEach(natLeave);
  const tx=texasChamp(); if(tx) natJoin(tx, notes);
  while(save.nat.field.length<15) natJoin(freshEntrant(), notes);
}
// a Texas rival who wins Texas Player of the Year goes to the National Tour
function texasWinnerUp(name){
  if(!save.nat || onNational(name)) return '';
  const low=save.nat.field.slice().sort((a,b)=>a.skill-b.skill)[0]; if(low) natLeave(low);
  const pro=TOUR[3].roster.find(x=>x[0]===name), notes=[];
  natJoin({name, st:'TX', skill:Math.max(natDraw(), pro?Math.min(1.08,pro[1]+TOUR[3].boost+0.02):0.98)}, notes);
  return `<div class="career">${esc(name)} won Texas Player of the Year and moves up to the National Tour.</div>`+notes.join('');
}
function moveToNational(){
  const c=career(), n=nem();
  if(n && !onNational(n.name)){ save.nemDormant=(save.nemDormant||[]).concat([{...n, st:'TX'}]); save.nem=null; }
  c.tier=NAT; newYear(); save.stats.promotions=(save.stats.promotions||0)+1; addTrophy('promo:4','National Tour card','promo');
  return n && !onNational(n.name) ? `<div class="nemq"><span class="nemtag">Nemesis</span> <b>${esc(n.name)}</b> stays behind in Texas. You have not seen the last of ${firstName(n.name)}.</div>` : '';
}
function hofHTML(){
  const pts=save.hofPts||0, pct=Math.min(100,pts/HOF_TARGET*100), inn=save.hofIn;
  const meter = save.nat
    ? `<div class="hof"><div class="hof-top"><b>${pts.toLocaleString('en-US')}</b><span>of ${HOF_TARGET.toLocaleString('en-US')} points${inn?` · inducted in year ${inn}`:''}</span></div><div class="hofbar"><i style="width:${pct}%"></i></div>
        <small>National Tour only. Win ${HOF_PTS.win} · Major ${HOF_PTS.major} · National Championship ${HOF_PTS.champ} · National Player of the Year ${HOF_PTS.poy} · Keep your card ${HOF_PTS.card}</small></div>`
    : `<div class="field">Hall of Fame points are only earned on the National Tour. Win Texas Player of the Year to get there.</div>`;
  const list=LEGENDS.map(l=>({name:l.name, st:l.st, when:l.cls})).concat((save.hofList||[]).map(p=>({name:p.name===ME?playerName():p.name, st:p.st, when:`Year ${p.year}`, you:p.name===ME})));
  return meter+`<div class="hofwall">${list.map(p=>`<div class="hofp ${p.you?'you':''}"><b>${esc(p.name)}</b><small>${stateName(p.st)} · ${p.when}</small></div>`).join('')}</div>`;
}
