/* Fairway Tour · Shot shaping: lessons, drills, mastery, and the shaped-shot physics */
'use strict';
// lessons follow how coaches teach it: height first, then curve, then the nine-shot exam
const LESSONS = [
  {id:'low',  name:'Low punch', tier:1, price:1500,  blurb:'Ball back, hands ahead, low finish. Stays under the wind and branches and runs out a long way.'},
  {id:'high', name:'High shot', tier:1, price:1500,  blurb:'Ball forward, full release. Climbs over trees and stops fast, but the wind grabs it.'},
  {id:'draw', name:'Draw',      tier:2, price:6000,  blurb:'Aim right, swing in to out. Curves right to left and runs out after landing.'},
  {id:'fade', name:'Fade',      tier:2, price:6000,  blurb:'Aim left, swing out to in. Curves left to right and lands soft.'},
  {id:'exam', name:'Nine-Shot Exam', tier:3, price:20000, blurb:'Every height with every shape. Pass it to combine them (a low draw, a high fade) and to unlock the big curve.'},
];
const MASTERY = [['Learning',0,0.4],['Solid',30,0.2],['Mastered',100,0.08]];
const SHAPE_MOD = {draw:{carry:1, keep:1.2}, fade:{carry:0.97, keep:0.75}, straight:{carry:1, keep:1}};
const HEIGHT_MOD = {low:{carry:0.95, h:0.5, wind:0.5, keep:1.6}, high:{carry:0.96, h:1.6, wind:1.4, keep:0.45}, normal:{carry:1, h:1, wind:1, keep:1}};
const CLUB_CURVE = {driver:1.15, iron:1, wedge:0.45};
let shotSel = {shape:'straight', big:false, height:'normal'};
function shotState(id){ save.shots=save.shots||{}; return save.shots[id]||(save.shots[id]={paid:false, unlocked:false, uses:0}); }
const shotOK = id => !!shotState(id).unlocked || !!(DRILL && DRILL.allow && DRILL.allow.includes(id));
function masteryOf(id){ const u=shotState(id).uses; let m=0; MASTERY.forEach((x,i)=>{ if(u>=x[1]) m=i; }); return m; }
function resetShotSel(){ shotSel={shape:'straight', big:false, height:'normal'}; }
// everything a shaped shot changes, given the club and lie; used by the swing and the aim preview
function shotMods(e, lie, carry){
  const out={carry:1, h:1, wind:1, keep:1, D:0, side:0, spread:0, low:false, label:''};
  if(e.putt || isSand(lie)) return out;
  const sh=shotSel.shape, ht=shotSel.height, S=SHAPE_MOD[sh], Hm=HEIGHT_MOD[ht];
  out.carry=S.carry*Hm.carry; out.h=Hm.h; out.wind=Hm.wind; out.keep=S.keep*Hm.keep; out.low=ht==='low';
  if(sh!=='straight'){
    out.side = sh==='draw' ? 1 : -1;
    out.D = carry*out.carry*(shotSel.big?0.17:0.09)*(CLUB_CURVE[e.id]||1)*(lie===ROUGH?0.6:1);
  }
  // nerves: on the last hole of a major, shots you are still learning wobble more
  const nerves = EV && EV.major && holeIdx===HOLES.length-1 && !EV.practice;
  const vOf=id=>{ const m=masteryOf(id); return MASTERY[m][2]*(nerves?[1.6,1.25,1][m]:1); };
  const ids=[sh!=='straight'?sh:null, ht!=='normal'?ht:null].filter(Boolean);
  out.spread = ids.length ? Math.max(...ids.map(vOf)) : 0;
  out.label=[ht!=='normal'?ht:'', sh!=='straight'?(shotSel.big?'big '+sh:sh):''].filter(Boolean).join(' ');
  return out;
}
// applied inside shoot() after the club's base flight is set
function applyShape(e, lie, carry, ux, uy){
  ball.lowFlight=false;
  const m=shotMods(e, lie, carry); if(!m.label) { resetShotSel(); return; }
  ball.h*=m.h; ball.windMult*=m.wind; ball.keep*=m.keep; ball.lowFlight=m.low;
  const sc=m.carry; ball.vx*=sc; ball.vy*=sc;
  if(m.D>0){ const D=m.D*Math.max(0.1,1+clamp(gauss(),-2.2,2.2)*m.spread), k=2*D/(ball.T*ball.T); ball.cax+=uy*k*m.side; ball.cay+=-ux*k*m.side; }
  if(shotSel.shape!=='straight') shotState(shotSel.shape).uses++;
  if(shotSel.height!=='normal') shotState(shotSel.height).uses++;
  resetShotSel();
}
/* ---------- Shot bar above the clubs ---------- */
function shotBarHTML(){
  const e=eff(clubIdx), lie=ball?terrainAt(ball.x,ball.y):FAIR;
  const anyShape=shotOK('draw')||shotOK('fade'), anyHeight=shotOK('low')||shotOK('high');
  if(e.putt || isSand(lie) || (!anyShape && !anyHeight) || state!=='ready') return '';
  const b=(k,v,label,on)=>`<button type="button" class="sb${on?' on':''}" data-shot="${k}:${v}">${label}</button>`;
  const big=shotOK('exam')||(DRILL&&DRILL.kind==='exam');
  const shapes=anyShape?`<div class="sbg">${shotOK('draw')?b('shape','draw',shotSel.shape==='draw'&&shotSel.big?'Big draw':'Draw',shotSel.shape==='draw'):''}${b('shape','straight','Straight',shotSel.shape==='straight')}${shotOK('fade')?b('shape','fade',shotSel.shape==='fade'&&shotSel.big?'Big fade':'Fade',shotSel.shape==='fade'):''}</div>`:'';
  const heights=anyHeight?`<div class="sbg">${shotOK('low')?b('height','low','Low',shotSel.height==='low'):''}${b('height','normal','Normal',shotSel.height==='normal')}${shotOK('high')?b('height','high','High',shotSel.height==='high'):''}</div>`:'';
  return shapes+heights;
}
function renderShotBar(){ const el=$('#shotbar'); if(!el) return; el.innerHTML=shotBarHTML(); el.hidden=!el.innerHTML; }
function pickShot(k,v){
  if(state!=='ready' || (DRILL && DRILL.locked)) return;
  const combo=shotOK('exam')||(DRILL&&DRILL.kind==='exam'), big=combo;
  if(k==='shape'){ if(shotSel.shape===v && v!=='straight' && big) shotSel.big=!shotSel.big; else { shotSel.shape=v; shotSel.big=false; } if(!combo && v!=='straight') shotSel.height='normal'; }
  else { shotSel.height=v; if(!combo && v!=='normal'){ shotSel.shape='straight'; shotSel.big=false; } }
  Sound.tick(); renderShotBar();
}
/* ---------- Drills at the range ---------- */
let DRILL=null;
const POLE_Y = () => rangeHole.tee.y - 50/YPP, CX=500;
const EXAM_ORDER=[['low','draw'],['low','straight'],['low','fade'],['normal','draw'],['normal','straight'],['normal','fade'],['high','draw'],['high','straight'],['high','fade']];
const DRILL_INFO = {
  low:{need:3,total:5,wind:'strong',allow:['low'],how:'Strong crosswind. Hit low punch shots that go at least 120 yards and finish within 12 yards of the center line. Aim into the wind.'},
  high:{need:3,total:5,wind:'breezy',allow:['high'],how:'Hit high shots that stop on the target green within 30 feet of the cup. It is about 120 yards out.'},
  draw:{need:3,total:5,wind:'calm',allow:['draw'],how:'Start the ball right of the pole at 50 yards, then curve it back to finish within 25 yards left of the center line. Use an iron or driver.'},
  fade:{need:3,total:5,wind:'calm',allow:['fade'],how:'Start the ball left of the pole at 50 yards, then curve it back to finish within 25 yards right of the center line. Use an iron or driver.'},
  exam:{need:7,total:9,wind:'calm',allow:['low','high','draw','fade','exam'],how:'Nine shots in order: low, normal, and high, each as a draw, straight, and fade. Each must go 100 yards, finish within 12 yards of the center line, and curve the right way. Pass 7 of 9.'},
};
function startDrill(kind){
  const I=DRILL_INFO[kind];
  RANGE.start='tee'; RANGE.wind=I.wind;
  DRILL={kind, ball:0, made:0, need:I.need, total:I.total, allow:I.allow, log:[]};
  startRange(); toast(I.how, 4200);
}
function drillShotFor(){ if(!DRILL) return; if(DRILL.kind==='exam'){ const [h,s]=EXAM_ORDER[DRILL.ball]||EXAM_ORDER[0]; shotSel={shape:s, big:false, height:h}; DRILL.locked=true; }
  else if(DRILL.kind==='draw'||DRILL.kind==='fade') shotSel={shape:DRILL.kind, big:false, height:'normal'}; else shotSel={shape:'straight', big:false, height:DRILL.kind}; DRILL.locked=true; renderShotBar(); }
// judge one drill ball; returns [made, reason]
function judgeDrill(shot){
  const k=DRILL.kind, fx=ball.x, yds=v=>v*YPP, off=yds(fx-CX), total=shot.total, pole=ball.poleX;
  if(shot.note==='Out of play') return [false,'out of play'];
  if(k==='low') return total>=120 && Math.abs(off)<=12 ? [true,'held the line'] : [false, total<120?'too short':'blown off line'];
  if(k==='high'){ const ft=dist(ball,rangeHole.cup)*YPP*3; return terrainAt(ball.x,ball.y)===GREEN && ft<=30 ? [true,`${Math.round(ft)} ft from the cup`] : [false, terrainAt(ball.x,ball.y)===GREEN?`${Math.round(ft)} ft, too far`:'missed the green']; }
  if(k==='draw'||k==='fade'){ const s=k==='draw'?1:-1; if(pole==null) return [false,'never reached the pole'];
    if(s*(pole-CX)<=0) return [false,`started ${k==='draw'?'left':'right'} of the pole`];
    return s*off<0 && Math.abs(off)<=25 ? [true,'shaped it'] : [false, s*off>=0?'did not curve back':'curved too far']; }
  const [h,sh]=EXAM_ORDER[DRILL.ball-1]; if(total<100) return [false,'too short']; if(Math.abs(off)>12) return [false,'off line'];
  if(sh!=='straight'){ if(pole==null) return [false,'too short']; const s=sh==='draw'?1:-1; if(s*(fx-pole)>=0) return [false,'curved the wrong way']; }
  return [true,`${h} ${sh}`];
}
function drillAfterShot(shot){
  DRILL.ball++; const [ok,why]=judgeDrill(shot); if(ok) DRILL.made++; DRILL.log.push({ok,why});
  toast(`${ok?'Made it':'Missed'}: ${why} · ${DRILL.made} of ${DRILL.need}`, 2200);
  const left=DRILL.total-DRILL.ball, passed=DRILL.made>=DRILL.need, failed=DRILL.made+left<DRILL.need;
  if(passed||failed||left===0) setTimeout(()=>finishDrill(passed), 1400);
}
function finishDrill(passed){
  const kind=DRILL.kind, L=LESSONS.find(l=>l.id===kind), log=DRILL.log; DRILL=null; resetShotSel();
  if(passed){ const st=shotState(kind); st.unlocked=true; if(kind==='exam') shotState('combo').unlocked=true; save.stats.drills=(save.stats.drills||0)+1; persist(); checkAch(); Sound.cheer(0.8); }
  openSheet('results',`
    <div class="sheet-head"><span class="kicker">Shot School · ${L.name}</span><span class="title ${passed?'gold':''}">${passed?'Passed':'Not yet'}</span>
      <span class="head-sub">${log.filter(x=>x.ok).length} of ${log.length} made</span></div>
    <div class="sheet-body">
      <div class="field">${passed?(kind==='exam'?'You can now combine heights and shapes, and tap Draw or Fade twice for a big curve.':`${L.name} is unlocked for every round. It starts at Learning, so expect it to wander until you have hit it more.`):'The lesson is paid for. Try the drill again as many times as you like.'}</div>
      <div>${log.map((x,i)=>`<div class="item"><div class="item-main"><span class="item-desc">Ball ${i+1}${kind==='exam'?` · ${EXAM_ORDER[i].join(' ')}`:''}: ${x.ok?'✓':'✗'} ${x.why}</span></div></div>`).join('')}</div>
      <div class="row">${passed?'':`<button class="btn primary" id="againBtn" type="button">Try again</button>`}<button class="btn ${passed?'primary':'ghost'}" id="hubBtn" type="button">Clubhouse</button></div>
    </div>`, passed?'#hubBtn':'#againBtn');
  const a=$('#againBtn'); if(a) a.onclick=()=>startDrill(kind);
  $('#hubBtn').onclick=()=>{ if(rangeHole){ rangeHole.vis=null; rangeHole.built=false; } hubTab='golfer'; showHub(); };
}
// the pole and target lanes drawn on the range during a drill
function drawDrill(z){
  if(!DRILL || !EV || !EV.range) return; const k=DRILL.kind, y0=rangeHole.tee.y, Y=yd=>y0-yd/YPP, X=yd=>CX+yd/YPP;
  ctx.save();
  const lane=(a,b,from,to,col)=>{ ctx.fillStyle=col; ctx.fillRect(Math.min(X(a),X(b)), Y(to), Math.abs(X(b)-X(a)), Y(from)-Y(to)); };
  if(k==='draw') lane(-25,0,100,330,'rgba(243,196,55,.16)');
  if(k==='fade') lane(0,25,100,330,'rgba(243,196,55,.16)');
  if(k==='low') lane(-12,12,120,330,'rgba(243,196,55,.16)');
  if(k==='exam') lane(-12,12,100,330,'rgba(243,196,55,.14)');
  if(k==='draw'||k==='fade'||k==='exam'){ const py=POLE_Y(); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(CX+10,py+4,14,4,0,0,7); ctx.fill(); ctx.strokeStyle='#f3c437'; ctx.lineWidth=5/Math.max(z,.6); ctx.beginPath(); ctx.moveTo(CX,py); ctx.lineTo(CX,py-46); ctx.stroke(); ctx.fillStyle='#d9473a'; ctx.beginPath(); ctx.arc(CX,py-46,6,0,7); ctx.fill(); }
  if(k==='high'){ ctx.strokeStyle='rgba(243,196,55,.8)'; ctx.lineWidth=2.5/z; ctx.setLineDash([8/z,6/z]); ctx.beginPath(); ctx.arc(rangeHole.cup.x,rangeHole.cup.y,30/(YPP*3),0,7); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
}
/* ---------- Shot School panel (Golfer tab) ---------- */
function shotSchoolHTML(){
  const c=career(), tierOK=t=>c.tier>=t;
  return `<div class="school">${LESSONS.map(L=>{ const st=shotState(L.id), m=masteryOf(L.id), next=MASTERY[m+1];
    let right;
    if(st.unlocked) right = L.id==='exam' ? `<span class="chip-s" style="background:var(--pine-2)">Passed</span>` : `<span class="mast m${m}">${MASTERY[m][0]}</span><small>${next?`${st.uses}/${next[1]} shots`:`${st.uses} shots`}</small>`;
    else if(!tierOK(L.tier)) right=`<small>Opens on the ${TOUR[L.tier].name}</small>`;
    else if(L.id==='exam' && !['low','high','draw','fade'].every(k=>shotState(k).unlocked)) right=`<small>Pass the other four lessons first</small>`;
    else if(st.paid) right=`<button class="btn primary sm" type="button" data-drill="${L.id}">Take the drill</button>`;
    else right=`<button class="btn ${save.cash>=L.price?'primary':'ghost'} sm" type="button" data-lesson="${L.id}" ${save.cash>=L.price?'':'disabled'}>${money(L.price)}</button>`;
    return `<div class="item"><div class="item-main"><span class="item-name">${L.name}</span><span class="item-desc">${L.blurb}</span></div><div class="lesson-r">${right}</div></div>`; }).join('')}</div>
    <div class="career" style="border:0;padding:0">Pay once, then retry the drill free until you pass. Shots get steadier with use: Learning, then Solid at 30 shots, then Mastered at 100. On the last hole of a major, shots you are still learning wobble more.</div>`;
}
function wireSchool(){
  sheet.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{ const L=LESSONS.find(l=>l.id===b.dataset.lesson); if(save.cash<L.price) return; save.cash-=L.price; shotState(L.id).paid=true; persist(); Sound.coin(); startDrill(L.id); });
  sheet.querySelectorAll('[data-drill]').forEach(b=>b.onclick=()=>startDrill(b.dataset.drill));
}
