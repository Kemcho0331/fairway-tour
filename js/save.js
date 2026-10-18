/* Fairway Tour · Saving, loading, and per-hole palettes */
'use strict';
/* ---------- Roll physics helper ---------- */
function rollDist(v, fric){ let d=0; const dt=1/120; let n=0; while(v>4 && n++<5000){ const nv=Math.max(0, v-(fric+0.3*v)*dt); d+=(v+nv)/2*dt; v=nv; } return d; }

/* ---------- Save ---------- */
const SAVE_KEY = 'fairway-tour-v3', OLD_KEYS = ['fairway-tour-v2','fairway-tour-v1'];
function defaultSave(){ return {cash:0, muted:false, nem:null, nemPast:[], trophies:{}, form:[], career:{tier:0, year:1, k:0, phase:'season', pts:{}, wins:{}, played:{}}, stats:{events:0, wins:0, best:null, hio:0, birdies:0, earnings:0, top5:0, majors:0}, events:{}, gear:{driver:0,iron:0,wedge:0,putter:0}, ballsOwned:['std'], ball:'std', colorsOwned:['white'], color:'white', items:[], sp:{}, bag:{driver:null,iron:null,wedge:null,putter:null}, golfer:{name:'', skin:1, shirt:'navy', pants:'khaki', hat:'cap', hatColor:'white', hand:'R'}}; }
function loadSave(){
  const d=defaultSave();
  try{
    const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
    if(s && typeof s.cash==='number'){
      const out={...d, ...s, stats:{...d.stats, ...(s.stats||{})}, gear:{...d.gear, ...(s.gear||{})}, events:{...(s.events||{})}, golfer:{...d.golfer, ...(s.golfer||{})}, bag:{...d.bag, ...(s.bag||{})}, career:{...d.career, ...(s.career||{})}};
      if(!Array.isArray(out.ballsOwned)) out.ballsOwned=['std'];
      if(!Array.isArray(out.colorsOwned)) out.colorsOwned=['white'];
      return out;
    }
    // new career: carry over only the golfer's look, name and sound setting
    for(const k of OLD_KEYS){ const o=JSON.parse(localStorage.getItem(k)||'null'); if(o){ if(o.golfer) d.golfer={...d.golfer, ...o.golfer}; d.muted=!!o.muted; d.carried=true; break; } }
  }catch(e){}
  return d;
}
function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }
const save = loadSave();
const esc = t => String(t).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function playerName(){ const n=(save.golfer.name||'').trim(); return n||'You'; }
function lookColors(){ const g=save.golfer; const find=(arr,id)=>{ const x=arr.find(x=>x.id===id); return x&&(!x.excl||hasItem(x.id))?x:arr[0]; }, sh=find(LOOK.shirts,g.shirt);
  return {skin:LOOK.skins[g.skin]||LOOK.skins[1], shirt:sh.c, shirt2:sh.s2||null, pants:find(LOOK.pants,g.pants).c, hat:g.hat, hatC:find(LOOK.shirts,g.hatColor).c, watch:!!(g.watch&&hasItem('capwatch'))}; }
const WARM_WINTER = {...SEASONS[3], blurb:'Winter in the sun belt. Dry, firm, and warm, with quick greens.', fric:{[GREEN]:0.86}, roll:1.15, carry:1, weather:'sun', col:'summer', warm:true};
function season(){ const S=SEASONS[seasonIdx()]; return S.id==='winter' && save.career.tier===4 ? WARM_WINTER : S; }
const DESERT_COL = {outside:'#4a3826', rough:'#c4a06a', cut:'#a29d63', fair:'#79a54e', tee:'#82ad56', trees:['#7d8652','#6f7a48','#8a8d5a'], waste:'#e3d2a4'};
const isDesert=h=>!!(h&&(h.theme==='desert'||h.theme==='resort'));
// course looks layered over the season palette
const THEME_COL = {
  links: {outside:'#3b5a5a', rough:'#97a05d', cut:'#8fa35c', fair:'#86b158', tee:'#8db85e', green:'#8cc062', green2:'#acd682', trees:['#5b6b3a','#66753f'], sand:'#ece0b6'},
  bayou: {outside:'#24392c', rough:'#3f6c35', cut:'#4b7b3d', fair:'#62a04a', water:'#3c6656', water2:'#5a8a70', bank:'#a3bd92', trees:['#4d5c32','#58673a','#43532c']},
  plains:{outside:'#7a6a3c', rough:'#8f9c54', cut:'#99a75c', fair:'#7fac50', tee:'#86b257', trees:['#5d6f3a','#687a40']},
};
// bald cypress draped in Spanish moss
function drawCypress(g,t,r,C){
  g.fillStyle='rgba(10,25,15,.32)'; g.beginPath(); g.ellipse(t.x+t.r*.4,t.y+t.r*.5,t.r,t.r*.8,0.3,0,7); g.fill();
  g.fillStyle=C.trees[(r()*C.trees.length)|0];
  for(let k=0;k<7;k++){ const a=k/7*Math.PI*2+r(); g.beginPath(); g.arc(t.x+Math.cos(a)*t.r*.45,t.y+Math.sin(a)*t.r*.45,t.r*.5,0,7); g.fill(); }
  g.beginPath(); g.arc(t.x,t.y,t.r*.7,0,7); g.fill();
  g.strokeStyle='rgba(185,195,175,.55)'; g.lineWidth=1.4; g.lineCap='round';
  for(let k=0;k<7;k++){ const x=t.x+(r()*2-1)*t.r*.75, y=t.y+(r()*2-1)*t.r*.6; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+2,y+5,x,y+9+r()*5); g.stroke(); }
}
