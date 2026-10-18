/* Fairway Tour · Sponsors, goals, reward items, and the bag */
'use strict';
/* ---------- Sponsors ---------- */
const RANKS=['Bronze','Silver','Gold','Legendary'];
const RANK_COL=['#d39a62','#c9d0d4','#f3c437','#9b6bd6'];
// every reward is fixed to its sponsor; clubs are tied to the tier the sponsor comes from
const ITEMS = {
  pecanball: {kind:'color', name:'Pecan ball', c1:'#f0bf84', c2:'#8a5a2b'},
  pecancap:  {kind:'hat',   name:'Pecan brown hat', c:'#8a5a2b'},
  pecanpolo: {kind:'shirt', name:'Pecan polo', c:'#efe2c4', s2:'#8a5a2b'},
  pecanwedge:{kind:'club',  slot:'wedge', tier:1, name:'Pecan Sand Wedge', short:'Pecan', desc:'Bronze-level wedge. Nearly full power out of bunkers, but 4% shorter everywhere.', mod:{sand:0.97, carry:0.96}},
  gulfball:  {kind:'color', name:'Seafoam ball', c1:'#c8fff2', c2:'#3fb8a0'},
  gulfhat:   {kind:'hat',   name:'Gulf teal hat', c:'#1f9e8f'},
  gulfshirt: {kind:'shirt', name:'Breeze stripe', c:'#2bb3a3', s2:'#f4f5ef'},
  gulfputter:{kind:'club',  slot:'putter', tier:2, name:'Tidewater Putter', short:'Tidewater', desc:'Silver-level putter. Putts break 15% less, but speed control is only Bronze-level.', mod:{brk:0.85, speedTier:1}},
  bbhat:     {kind:'hat',   name:'Bluebonnet hat', c:'#3a5fcf'},
  bbpants:   {kind:'pants', name:'Bluebonnet slate pants', c:'#4a5878'},
  bbshirt:   {kind:'shirt', name:'Bluebonnet polo', c:'#3a5fcf', s2:'#f4f5ef'},
  bbball:    {kind:'color', name:'Wildflower ball', c1:'#d9c9ff', c2:'#4a5fcf', cash:6000, desc:'Plus a $6,000 endorsement check.'},
  mesaball:  {kind:'color', name:'Desert Clay ball', c1:'#f6b48f', c2:'#a34a25'},
  mesahat:   {kind:'hat',   name:'Mesa clay hat', c:'#b5532d'},
  mesatour:  {kind:'ball',  name:'Mesa Tour ball', desc:'+2% carry and lands a little softer.', carry:1.02, keep:0.9},
  mesairon:  {kind:'club',  slot:'iron', tier:3, name:'Mesa Blade Iron', short:'Mesa', desc:'Gold-level iron. Close to full power from rough and desert, but overswings curve 40% more.', mod:{rough:0.92, hook:1.4}},
  caphat:    {kind:'hat',   name:'Capitol gold hat', c:'#c9a227'},
  capshirt:  {kind:'shirt', name:'Capitol pinstripe', c:'#23272b', s2:'#c9a227'},
  cappants:  {kind:'pants', name:'Capitol cream pants', c:'#e8dcc0'},
  capwatch:  {kind:'watch', name:'Capitol Chronograph', cash:25000, desc:'A gold watch on your wrist, plus a $25,000 endorsement check.'},
  lsball:    {kind:'color', name:'Lone Star red ball', c1:'#ff9a8a', c2:'#b0221a'},
  lsshirt:   {kind:'shirt', name:'Lone Star stripe', c:'#b0221a', s2:'#f4f5ef'},
  lstour:    {kind:'ball',  name:'Lone Star Tour ball', desc:'+3% carry and bites on landing.', carry:1.03, keep:0.85},
  lsdriver:  {kind:'club',  slot:'driver', tier:4, name:'Lone Star Cannon', short:'Cannon', desc:'Pro-level driver. 5% longer than a Pro driver, but misses are 40% wider.', mod:{carry:1.05, spread:1.4}},
  summithat: {kind:'hat',   name:'Summit navy hat', c:'#1d2f5c'},
  summitpolo:{kind:'shirt', name:'Summit stars polo', c:'#1d2f5c', s2:'#c8352b'},
  summitpants:{kind:'pants', name:'Summit stone pants', c:'#b9b2a2'},
  summitball:{kind:'color', name:'Platinum ball', c1:'#ffffff', c2:'#9fb3c8', cash:100000, desc:'Plus a $100,000 endorsement check.'},
  keyball:   {kind:'color', name:'Keystone blue ball', c1:'#a9caff', c2:'#1f4fa8'},
  keyhat:    {kind:'hat',   name:'Keystone steel hat', c:'#5b6670'},
  keytour:   {kind:'ball',  name:'Keystone Tour X ball', desc:'+4% carry and bites on landing. The best ball in the game.', carry:1.04, keep:0.85},
  keyiron:   {kind:'club',  slot:'iron', tier:4, name:'Keystone Forged Iron', short:'Keystone', desc:'Pro-level iron, 3% longer and 15% straighter than a Pro iron, with no drawback.', mod:{carry:1.03, spread:0.85}},
};
const SPONSORS = [
  {id:'pecan', tier:0, name:'Pecan Golf Co.', kind:'Clubs and apparel', color:'#8a5a2b', blurb:'A family club shop in Seguin that backs young amateurs.',
    sets:[{goals:['top:5','birdies:1'], item:'pecanball'}, {goals:['clean','fw:2','under:1'], item:'pecancap'}, {goals:['top:3','gir:3','putt:20'], item:'pecanpolo'}, {goals:['win','under:3'], item:'pecanwedge'}]},
  {id:'gulf', tier:1, name:'Gulf Breeze', kind:'Clubs and apparel', color:'#1f9e8f', blurb:'A Galveston surf and sunglasses brand moving into golf.',
    sets:[{goals:['top:5','drive:250'], item:'gulfball'}, {goals:['bogeyfree','gir:3','birdies:2'], item:'gulfhat'}, {goals:['top:3','sandsave','putt:25'], item:'gulfshirt'}, {goals:['win','eagle'], item:'gulfputter'}]},
  {id:'bluebonnet', tier:2, name:'Bluebonnet Apparel', kind:'Apparel', color:'#3a5fcf', blurb:'Austin-made polos. They pay for results and screen time.',
    sets:[{goals:['top:5','birdies:2'], item:'bbhat'}, {goals:['under:2','bogeyfree','top:3'], item:'bbpants'}, {goals:['birdies:4','streak:2','under:4'], item:'bbshirt'}, {goals:['win','streak:3'], item:'bbball'}]},
  {id:'mesa', tier:2, name:'Mesa Clubs', kind:'Equipment', color:'#b5532d', blurb:'Forged irons from the Trans-Pecos. They pay for ball striking.',
    sets:[{goals:['fw:3','drive:260'], item:'mesaball'}, {goals:['gir:4','clean','no3'], item:'mesahat'}, {goals:['putt:30','sandsave','fw:5'], item:'mesatour'}, {goals:['chipin','gir:6'], item:'mesairon'}]},
  {id:'capitol', tier:3, name:'Capitol Timepieces', kind:'Apparel', color:'#c9a227', blurb:'Austin watchmakers. They only sign players who win.',
    sets:[{goals:['top:5','under:2'], item:'caphat'}, {goals:['top:3','birdies:4','bogeyfree'], item:'capshirt'}, {goals:['win','under:5','streak:3'], item:'cappants'}, {goals:['major','eagle'], item:'capwatch'}]},
  {id:'lonestar', tier:3, name:'Lone Star Golf Works', kind:'Equipment', color:'#b0221a', blurb:'The biggest club maker in Texas. Tour gear for tour players.',
    sets:[{goals:['fw:4','drive:275'], item:'lsball'}, {goals:['gir:5','no3','putt:30'], item:'lsshirt'}, {goals:['drive:300','sandsave','chipin'], item:'lstour'}, {goals:['gir:7','putt:40'], item:'lsdriver'}]},
  {id:'summit', tier:4, name:'Summit Outfitters', kind:'Apparel', color:'#1d2f5c', blurb:'A Denver outdoor brand. They pay for wins on the biggest stages.',
    sets:[{goals:['top:5','under:3'], item:'summithat'}, {goals:['top:3','birdies:5','bogeyfree'], item:'summitpolo'}, {goals:['win','streak:3','under:6'], item:'summitpants'}, {goals:['major','eagle'], item:'summitball'}]},
  {id:'keystone', tier:4, name:'Keystone Golf Works', kind:'Equipment', color:'#5b6670', blurb:'A Pennsylvania forge. The finest clubs in the country, for the best ball strikers.',
    sets:[{goals:['fw:5','drive:285'], item:'keyball'}, {goals:['gir:6','no3','putt:35'], item:'keyhat'}, {goals:['drive:310','sandsave','chipin'], item:'keytour'}, {goals:['gir:8','under:6'], item:'keyiron'}]},
];
// sponsor balls and colors join the normal lists, hidden until earned
Object.entries(ITEMS).forEach(([id,it])=>{
  if(it.kind==='color') COLORS.push({id, name:it.name.replace(/ ball$/,''), price:0, c1:it.c1, c2:it.c2, excl:true});
  if(it.kind==='ball') BALLS.push({id, name:it.name, price:0, desc:it.desc, carry:it.carry, keep:it.keep, excl:true});
  if(it.kind==='shirt'||it.kind==='hat') LOOK.shirts.push({id, name:it.name, c:it.c, s2:it.s2, excl:it.kind});
  if(it.kind==='pants') LOOK.pants.push({id, name:it.name, c:it.c, excl:'pants'});
});
const hasItem = id => (save.items||[]).includes(id);
const tierSponsors = t => SPONSORS.filter(s=>s.tier===t);
function spState(id){ save.sp=save.sp||{}; return save.sp[id]||(save.sp[id]={set:0, done:[]}); }
function sigClub(slot){ const id=(save.bag||{})[slot], it=id&&ITEMS[id]; return it&&it.slot===slot&&hasItem(id)?it:null; }
function sigFor(slot){ return Object.entries(ITEMS).filter(([id,it])=>it.kind==='club'&&it.slot===slot&&hasItem(id)); }

const goalKey = g => g.split(':');
function goalText(g){ const [k,v]=goalKey(g), n=+v;
  return {top:`Finish top ${n}`, win:'Win the event outright', under:`Finish ${n} under par or better`, birdies:n===1?'Make a birdie or better':`Make ${n} birdies or better`,
    eagle:'Make an eagle or better', clean:'No penalty strokes', bogeyfree:'Go bogey-free', fw:`Hit ${n} fairways off the tee`, gir:`Hit ${n} greens in regulation`,
    no3:'No three-putts', drive:`Hit a ${n}-yard drive`, putt:`Hole a putt from ${n}+ feet`, chipin:'Hole out from off the green', sandsave:'Make par or better after landing in a bunker',
    streak:`Make ${n} birdies in a row`, major:'Win a major'}[k]; }
// can this goal be completed at this event at all?
function goalPossible(g, e){ const [k,v]=goalKey(g), n=+v, holes=e.pars.length, long=e.pars.filter(p=>p>3).length, fieldN=e.kind==='champ'?6:tierRoster(e.kind==='q'?Math.min(3,e.tier+1):e.tier).length+1;
  if(k==='major') return e.major ? '' : 'Only at a major';
  if(k==='top') return fieldN>n+2 ? '' : 'Field too small';
  if(k==='fw') return long>=n ? '' : `Only ${long} driving holes here`;
  if((k==='gir'||k==='birdies'||k==='streak') && holes<n) return `Only ${holes} holes here`;
  if(k==='eagle' && !e.pars.some(p=>p>=4)) return 'No par 4s or 5s here';
  return ''; }
// round stats for goals, reset every event
let RS=null, HS=null;
function resetRS(){ RS={fw:0,gir:0,pens:0,three:0,chipin:0,longPutt:0,longDrive:0,sandSave:0,run:0,streak:0,birdies:0,eagles:0,bogeys:0,ledAll:true,maxDef:0}; }
function resetHS(){ HS={putts:0,gir:false,sand:false,from:null,club:-1,lie:null,pen:false}; }
// returns {done, failed, prog}
function goalCheck(g, final, res){ const [k,v]=goalKey(g), n=+v, R=RS||{};
  const now=()=>{ if(!playerScores.length) return 'Decided at the finish'; const st=standings(), me=st.find(x=>x.you); return `You're ${posOf(st,me).label} right now`; };
  const count=(have)=>({done:have>=n, failed:false, prog:`${Math.min(have,n)} of ${n}`});
  switch(k){
    case 'top': return {done:final&&!res.wd&&res.pos<=n, failed:final&&(res.wd||res.pos>n), prog:now()};
    case 'win': return {done:final&&res.champ, failed:final&&!res.champ, prog:now()};
    case 'major': return {done:final&&res.champ&&EV.major, failed:final&&!(res.champ&&EV.major), prog:now()};
    case 'under': { const cur=playerScores.reduce((a,s,i)=>a+s-HOLES[i].par,0); return {done:final&&!res.wd&&cur<=-n, failed:final&&(res.wd||cur>-n), prog:`${fmtPar(cur)} so far`}; }
    case 'birdies': return count(R.birdies);
    case 'eagle': return {done:R.eagles>0, failed:false, prog:R.eagles?'Done':'Not yet'};
    case 'clean': return {done:final&&!res.wd&&R.pens===0, failed:R.pens>0||(final&&res.wd), prog:R.pens?'Took a penalty':'Clean so far'};
    case 'bogeyfree': return {done:final&&!res.wd&&R.bogeys===0, failed:R.bogeys>0||(final&&res.wd), prog:R.bogeys?'Made a bogey':'No bogeys so far'};
    case 'no3': return {done:final&&!res.wd&&R.three===0, failed:R.three>0||(final&&res.wd), prog:R.three?'Three-putted':'No three-putts so far'};
    case 'fw': return count(R.fw);
    case 'gir': return count(R.gir);
    case 'streak': return count(R.streak);
    case 'drive': return {done:R.longDrive>=n, failed:false, prog:`Longest ${Math.round(R.longDrive)} yds`};
    case 'putt': return {done:R.longPutt>=n, failed:false, prog:R.longPutt?`Longest made ${Math.round(R.longPutt)} ft`:'Not yet'};
    case 'chipin': return {done:R.chipin>0, failed:false, prog:R.chipin?'Done':'Not yet'};
    case 'sandsave': return {done:R.sandSave>0, failed:false, prog:R.sandSave?'Done':'Not yet'};
  }
  return {done:false, failed:false, prog:''};
}
function spRemaining(s){ const st=spState(s.id); if(st.set>=4) return []; return s.sets[st.set].goals.filter(g=>!st.done.includes(g)); }
function defaultPick(s, e){ return spRemaining(s).find(g=>!goalPossible(g,e)) || null; }
// pick shown in the pre-round sheet, kept on the event
function pickFor(s, e){ e._goals=e._goals||{}; const cur=e._goals[s.id]; if(cur!==undefined && (cur===null || (spRemaining(s).includes(cur) && !goalPossible(cur,e)))) return cur; return (e._goals[s.id]=defaultPick(s,e)); }

function spBar(s){ const st=spState(s.id); if(st.set>=4) return ''; const n=s.sets[st.set].goals.length, d=st.done.length;
  return `<span class="spbar" aria-label="${d} of ${n} goals done">${Array.from({length:n},(_,i)=>`<i class="${i<d?'on':''}"></i>`).join('')}</span>`; }
function rankChip(r){ return `<span class="rank" style="--rc:${RANK_COL[r]}">${RANKS[r]}</span>`; }
function itemLabel(id){ const it=ITEMS[id]; return it.kind==='club'?`${it.name} <span class="tier t${it.tier}">${TIERS[it.tier]}</span>`:it.name; }
function sponsorCard(s, e){
  const st=spState(s.id);
  const head=`<div class="sp-top"><span class="sp-logo" style="background:${s.color}">${s.name[0]}</span><div class="sp-id"><b>${s.name}</b><small>${s.kind} · ${s.blurb}</small></div></div>`;
  if(st.set>=4) return `<div class="spcard" style="--spc:${s.color}">${head}<div class="field">Contract complete. You earned every piece of ${s.name} gear.</div></div>`;
  const set=s.sets[st.set], pick=e?pickFor(s,e):null;
  const goals=set.goals.map(g=>{ const done=st.done.includes(g), why=e&&!done?goalPossible(g,e):'';
    if(!e) return `<li class="${done?'gdone':''}">${done?'✓ ':''}${goalText(g)}</li>`;
    return `<button type="button" class="goal" data-goal="${s.id}|${g}" aria-pressed="${pick===g}" ${done||why?'disabled':''}><span>${goalText(g)}</span><small>${done?'Done':why||(pick===g?'Chasing this one':'Tap to chase')}</small></button>`; }).join('');
  return `<div class="spcard" style="--spc:${s.color}">${head}
    <div class="sp-set">${rankChip(st.set)}<span>Reward: <b>${itemLabel(set.item)}</b></span>${spBar(s)}</div>
    ${e?`<div class="goals">${goals}</div>`:`<ul class="glist">${goals}</ul>`}
    ${e&&pick===null&&spRemaining(s).length?`<div class="career">None of the goals left in this set can be done here. Try the next event.</div>`:''}</div>`;
}
// club slots, ball and color, used in the Golfer tab and before tee-off
function bagHTML(){
  const slots=CLUBS.map(c=>{ const sigs=sigFor(c.id), cur=(save.bag||{})[c.id]||null, t=save.gear[c.id]||0;
    const opts=[[null,`${TIERS[t]} ${c.name}`,'Shop club']].concat(sigs.map(([id,it])=>[id,it.name,`Signature · ${TIERS[it.tier]}`]));
    const sel=opts.find(o=>o[0]===cur)||opts[0];
    return `<div class="slot"><span class="lbl">${c.name}</span>${opts.length>1?`<div class="chips">${opts.map(o=>`<button class="tchip sm" type="button" data-bag="${c.id}|${o[0]||''}" aria-pressed="${o[0]===sel[0]}">${o[1]}</button>`).join('')}</div>`:`<b>${sel[1]}</b>`}
      ${sel[0]?`<small>${ITEMS[sel[0]].desc}</small>`:''}</div>`; }).join('');
  const balls=BALLS.filter(b=>save.ballsOwned.includes(b.id)).map(b=>`<button class="tchip sm" type="button" data-useball="${b.id}" aria-pressed="${save.ball===b.id}">${b.name}</button>`).join('');
  const cols=COLORS.filter(c=>save.colorsOwned.includes(c.id)).map(c=>`<button class="chip" type="button" data-usecolor="${c.id}" aria-pressed="${save.color===c.id}" aria-label="${c.name}" title="${c.name}" style="background:radial-gradient(circle at 35% 35%,${c.c1},${c.c2})"></button>`).join('');
  return `<div class="bag">${slots}
    <div class="slot"><span class="lbl">Ball</span><div class="chips">${balls}</div><small>${ballDef().desc}</small></div>
    <div class="slot"><span class="lbl">Ball color</span><div class="chips">${cols}</div></div></div>`;
}
function wireBag(redraw){
  sheet.querySelectorAll('[data-bag]').forEach(b=>b.onclick=()=>{ const [slot,id]=b.dataset.bag.split('|'); save.bag=save.bag||{}; save.bag[slot]=id||null; persist(); Sound.tick(); redraw(); });
  sheet.querySelectorAll('[data-useball]').forEach(b=>b.onclick=()=>{ save.ball=b.dataset.useball; persist(); Sound.tick(); redraw(); });
  sheet.querySelectorAll('[data-usecolor]').forEach(b=>b.onclick=()=>{ save.color=b.dataset.usecolor; persist(); Sound.tick(); redraw(); });
}
function showPreTee(keepScroll){
  const e=currentEvent(), sps=tierSponsors(career().tier);
  openSheet('pretee',`
    <div class="sheet-head"><span class="kicker">Before you tee off</span><span class="title">${e.name}</span>
      <span class="head-sub">${sps.length>1?'Pick one goal for each sponsor, then check your bag.':sps.length?'Pick one goal to chase, then check your bag.':'Check your bag.'}</span></div>
    <div class="sheet-body">
      <h3 class="sec">${sps.length>1?'Sponsors':'Sponsor'}</h3>${sps.length?sps.map(s=>sponsorCard(s,e)).join(''):'<div class="field">National sponsors are on the way.</div>'}
      <h3 class="sec">Your bag</h3>${bagHTML()}
      <div class="row"><button class="btn primary" id="goBtn" type="button">Tee off${e.fee?' · '+money(e.fee):''}</button><button class="btn ghost" id="backHub" type="button">Back</button></div>
    </div>`, '#goBtn', keepScroll);
  sheet.querySelectorAll('[data-goal]').forEach(b=>b.onclick=()=>{ const [id,g]=b.dataset.goal.split('|'); e._goals=e._goals||{}; e._goals[id]=g; Sound.tick(); showPreTee(true); });
  wireBag(()=>showPreTee(true));
  $('#goBtn').onclick=()=>playCurrent();
  $('#backHub').onclick=()=>showHub();
}
function goalLines(final, res){
  const out=[]; if(!EV._goals) return out;
  for(const s of tierSponsors(EV.tier)){ const g=EV._goals[s.id]; if(!g) continue; out.push({s, g, r:goalCheck(g, final, res)}); }
  return out;
}
function goalHoleHTML(){
  return goalLines(false,{}).map(({s,g,r})=>`<div class="gline ${r.done?'ok':r.failed?'bad':''}" style="--spc:${s.color}"><b>${s.name}</b> ${goalText(g)} · <span>${r.done?'Goal complete':r.failed?'Missed':r.prog}</span></div>`).join('');
}
function unlockItem(id){
  const it=ITEMS[id]; save.items=save.items||[]; if(!save.items.includes(id)) save.items.push(id);
  if(it.kind==='color' && !save.colorsOwned.includes(id)) save.colorsOwned.push(id);
  if(it.kind==='ball' && !save.ballsOwned.includes(id)) save.ballsOwned.push(id);
  if(it.kind==='watch') save.golfer.watch=true;
  if(it.cash) save.cash+=it.cash;
}
const KIND_WHERE={color:'Pick it in your bag.', ball:'Pick it in your bag.', club:'Swap it into your bag in the Golfer tab or before tee-off.', hat:'Find it under hat colors in the Golfer tab.', shirt:'Find it under shirts in the Golfer tab.', pants:'Find it under pants in the Golfer tab.', watch:'It is on your wrist now.'};
// called from finishEvent; settles goals and returns HTML for the results sheet
function sponsorsAfterEvent(res){
  let html='';
  for(const {s,g,r} of goalLines(true,res)){
    const st=spState(s.id);
    if(!r.done){ html+=`<div class="gline bad" style="--spc:${s.color}"><b>${s.name}</b> ${goalText(g)} · <span>Missed</span></div>`; continue; }
    if(!st.done.includes(g)) st.done.push(g);
    html+=`<div class="gline ok" style="--spc:${s.color}"><b>${s.name}</b> ${goalText(g)} · <span>Goal complete</span></div>`;
    const set=s.sets[st.set];
    if(set && set.goals.every(x=>st.done.includes(x))){
      const rank=st.set; unlockItem(set.item); st.set++; st.done=[]; Sound.cheer(0.8); save.stats.setsDone=(save.stats.setsDone||0)+1; if(rank===3) save.stats.legends=(save.stats.legends||0)+1;
      const it=ITEMS[set.item];
      html+=`<div class="season" style="--sc:${s.color}"><div class="season-top"><span>${s.name}</span><span>${RANKS[rank]} set complete</span></div><span class="season-name">${it.name}</span><span class="season-blurb">${it.desc?it.desc+' ':''}${KIND_WHERE[it.kind]}${st.set<4?` Next up: the ${RANKS[st.set]} set.`:' That completes the contract.'}</span></div>`;
    }
  }
  return html;
}
function sponsorSummary(){
  if(!tierSponsors(career().tier).length) return '<div class="field">National sponsors are on the way.</div>';
  return tierSponsors(career().tier).map(s=>{ const st=spState(s.id); return `<div class="spline" style="--spc:${s.color}"><b>${s.name}</b><span>${st.set>=4?'Contract complete':`${RANKS[st.set]} set · ${st.done.length} of ${s.sets[st.set].goals.length} goals`}</span>${spBar(s)}</div>`; }).join('');
}
// a sponsor's contract status, shown on its gear group in Career > Sponsors
function sponsorNote(s){ const c=career(), st=spState(s.id);
  return s.tier===4&&c.tier===3&&save.nat?'On hold until you return to the National Tour':s.tier>c.tier?`Signs you on the ${TOUR[s.tier].name}`:s.tier===3&&c.tier===4&&st.set<4?'On hold while you play the National Tour':s.tier<c.tier&&st.set<4?'Contract ended when you moved up':s.tier===c.tier?'Current sponsor':'Contract complete'; }
