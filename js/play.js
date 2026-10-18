/* Fairway Tour · Round flow: shots, ball physics, scoring, standings, and the HUD */
'use strict';
/* ---------- Game state ---------- */
const cv=$('#game'), ctx=cv.getContext('2d');
let dpr=1, vw=0, vh=0;
let state='menu', holeIdx=0, strokes=0, clubIdx=0, autoIdx=0;
let ball=null, lastPos=null, wind={mph:0,a:0,ax:0,ay:0};
let cam={x:500,y:1000,z:0.5}, overview=true;
let introT=0, holedT=0, penT=0, time=0, aim=null, fx=[];
let field=[], playerScores=[], duckUsed=false, lieAim=false;

function resize(){ dpr=Math.min(2,window.devicePixelRatio||1); const r=cv.getBoundingClientRect(); vw=r.width; vh=r.height; cv.width=Math.round(vw*dpr); cv.height=Math.round(vh*dpr); }

const gauss=()=>{ let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
function rivalScore(par, skill, diff, form, persona){
  const P=persona&&PERSONAS[persona];
  let rel=Math.round(0.30-0.62*skill+0.25*diff+season().rival+form+(P?P.mean:0)+(P?P.sd:0.62)*gauss());
  if(rel<=-2){ const e=P?P.eagle:1; if(par===3) rel=Math.random()<0.08*e?-2:-1; else if(par===4) rel=Math.random()<0.15*e?-2:-1; else rel=-2; }
  return par+Math.min(3,rel);
}
function newTournament(){
  HOLES=EV.rounds===2?EV.holes.concat(EV.holes):EV.holes; EV._mc=false;
  const rt = EV.kind==='q' ? Math.min(3,EV.tier+1) : EV.tier, full=tierRoster(rt), n=nem();
  const ros = EV.kind==='champ' ? tableRows().filter(r=>!r.you).slice(0,5).map(r=>full.find(x=>x[0]===r.n)) : full;
  field=[{name:'You',you:true}, ...ros.map(([name,sk])=>{ const isN=!!(n&&name===n.name), skill=isN?nemSkill(rt):Math.min(skillCap(rt),sk+EV.boost+fieldHeat(rt)), form=gauss()*0.1, per=isN?n.persona:null; return {name, skill, nem:isN, scores:HOLES.map(h=>rivalScore(h.par,skill,EV.diff,form,per))}; })];
  playerScores=[]; duckUsed=false; resetRS();
  HOLES.forEach(h=>setPin(h, h.pins[(Math.random()*h.pins.length)|0]));
  startHole(0);
}
function setWind(mph,a,base){ wind={mph,a,ax:Math.cos(a)*mph*5,ay:Math.sin(a)*mph*5,base:base||wind.base}; }
function rollWind(){ const mph=Math.round(Math.random()*EV.windMax*(hole&&hole.seaWind?Math.max(1,season().wind):season().wind)), a=Math.random()*Math.PI*2; setWind(mph,a,{mph,a}); }
function gust(){
  const b=wind.base; if(!b) return;
  const mph=Math.round(clamp(b.mph*(0.55+Math.random()*0.9)+(Math.random()*4-2),0,40)), a=b.a+(Math.random()*2-1)*0.35, jump=mph-wind.mph;
  setWind(mph,a);
  if(Math.abs(jump)>=5) toast(jump>0?`Gust! Wind up to ${mph} mph`:`Wind dropped to ${mph} mph`,1500);
}
function startHole(i){
  resetHS(); holeIdx=i; Sound.setTension(!!(EV&&EV.major&&i===HOLES.length-1)); buildHole(HOLES[i]); strokes=0; rollWind(); fx=[]; aim=null;
  ball={x:hole.tee.x,y:hole.tee.y,z:0,vx:0,vy:0,t:0,T:1,h:0,sink:0,holed:false,hidden:false,trail:[],keep:1,windMult:1,capture:CAPTURE_V,pull:6,lipped:false};
  lastPos={x:ball.x,y:ball.y}; gpos={x:ball.x,y:ball.y}; swing.phase='address'; swing.cur=G_A0;
  setOverview(true); snapCamera();
  autoIdx=clubIdx=pickClub(); renderRack(); updateHud();
}
function beginIntro(){
  state='intro'; introT=2.6;
  $('#bnTop').textContent=`${season().name} · ${EV.name} · ${holeText(holeIdx)}`;
  $('#bnMain').textContent=hole.name;
  $('#bnSub').textContent=`Par ${hole.par} · ${hole.yards} yds · ${hole.pinName} pin`;
  $('#banner').classList.add('show');
}
function endIntro(){ $('#banner').classList.remove('show'); setOverview(false); setReady(); }
function trackLie(){ if(!HS||!RS||strokes===0||!HS.from) return; const lie=terrainAt(ball.x,ball.y);
  if(!HS.pen){ if(HS.club===0) RS.longDrive=Math.max(RS.longDrive, dist(HS.from,ball)*YPP); if(strokes===1 && hole.par>3 && lie===FAIR) RS.fw++; }
  if(lie===GREEN && strokes<=hole.par-2) HS.gir=true;
  if(lie===SAND||lie===POT) HS.sand=true;
  HS.from=null; }
function setReady(){
  trackLie(); state='ready'; ball.lipped=false; gpos={x:ball.x,y:ball.y}; swing.phase='address'; swing.cur=G_A0;
  if(season().gusty && strokes>0) gust();
  autoIdx=clubIdx=pickClub(); renderRack(); updateHud();
  if(holeIdx===0 && strokes===0 && save.stats.events<2) toast('Drag back from anywhere, then let go to swing', 0);
}
function pickClub(){
  const lie=terrainAt(ball.x,ball.y), d=dist(ball,hole.cup), w=eff(2).total, ir=eff(1).total;
  if(lie===GREEN) return 3;
  if(lie===FAIR && d<=75) return 3;
  if(lie===SAND||lie===POT) return d>w*1.2 ? 1 : 2;
  if(d<=w*0.95) return 2;
  if(d<=ir*0.95) return 1;
  return 0;
}
function lieFactor(e, lie){ if(lie===SAND) return e.putt?0.55:e.sand; if(lie===POT) return e.putt?0.4:e.sand*0.62; let f=(lie===ROUGH && !e.putt && (season().roughLie||isDesert(hole))) ? Math.min(season().roughLie||1, isDesert(hole)?0.7:1) : (TER[lie]?TER[lie].lie:1); if(lie===ROUGH && !e.putt && hole && hole.roughLie) f=Math.min(f,hole.roughLie); if(lie===ROUGH && e.rough) f=Math.max(f,e.rough); return f; }

function shoot(dx,dy,p){
  const e=eff(clubIdx), lie=terrainAt(ball.x,ball.y), pc=Math.min(p,1);
  if(HS){ HS.from={x:ball.x,y:ball.y}; HS.club=clubIdx; HS.lie=lie; HS.pen=false; if(lie===GREEN) HS.putts++; }
  lastPos={x:ball.x,y:ball.y}; strokes++;
  const spread=(TER[lie]?TER[lie].spread:1)*e.spread*(e.putt?0.25:1)*(0.6+pc*0.6);
  const ang=Math.atan2(dy,dx)+(Math.random()*2-1)*spread*Math.PI/180;
  const ux=Math.cos(ang), uy=Math.sin(ang), lf=lieFactor(e,lie), pt=eff(3);
  swing.phase='down'; swing.t=0; swing.from=swing.cur; swing.to=G_A0-(e.putt?0.9:2.5);
  ball.trail=[]; ball.lipped=false; ball.capture=pt.capture*(e.putt?1:0.7); ball.pull=pt.pull; ball.windMult=e.wind; ball.keep=e.keep||1; ball.cax=0; ball.cay=0; ball.curveMsg=null; ball.brk=e.putt?(e.brk||1):1;
  if(e.putt){
    const v=e.v*p*lf*(1+clamp(gauss(),-2.5,2.5)*e.speedErr); ball.vx=ux*v; ball.vy=uy*v; ball.z=0; state='rolling'; Sound.putt(p);
  } else {
    const carry=p*e.carry*lf, T=e.T*(0.45+0.55*pc), v=carry/T;
    ball.vx=ux*v; ball.vy=uy*v; ball.t=0; ball.T=T; ball.h=e.h*(0.5+0.5*pc); state='flying';
    if(p>1){
      const over=(p-1)/0.1;
      if(Math.random()<0.35+0.65*over){
        // side 1 = hook (curves left of the target line), -1 = slice
        const D=carry*(0.05+0.15*over)*(0.45+0.55*Math.random())*e.hook, side=Math.random()<0.5?1:-1, k=2*D/(T*T);
        ball.cax=uy*k*side; ball.cay=-ux*k*side;
        ball.curveMsg = side===1 ? (D>carry*0.1?'Overswing! Big hook':'Overswing. Hooked it') : (D>carry*0.1?'Overswing! Big slice':'Overswing. Sliced it');
      }
    }
    Sound.swing(pc); Sound.hit(); if(isSand(lie)){ Sound.land(SAND); fx.push({type:'puff',x:ball.x,y:ball.y,t:0}); }
  }
  updateHud();
}

function hitTree(inAir){
  for(const t of hole.trees){
    const dx=ball.x-t.x, dy=ball.y-t.y, d=Math.hypot(dx,dy), rr=t.r*0.9+BALL_R;
    if(d<rr && d>0.001){
      const nx=dx/d, ny=dy/d; ball.x=t.x+nx*(rr+0.5); ball.y=t.y+ny*(rr+0.5);
      const vn=ball.vx*nx+ball.vy*ny; if(vn<0){ ball.vx-=2*vn*nx; ball.vy-=2*vn*ny; }
      const k=inAir?0.3:0.5; ball.vx*=k; ball.vy*=k; Sound.thunk(); save.stats.trees=(save.stats.trees||0)+1; return true;
    }
  }
  return false;
}
function stepFlight(dt){
  const n=Math.max(1,Math.ceil(Math.hypot(ball.vx,ball.vy)*dt/5)), h=dt/n;
  for(let i=0;i<n;i++){
    ball.t+=h; ball.vx+=(wind.ax*ball.windMult+ball.cax)*h; ball.vy+=(wind.ay*ball.windMult+ball.cay)*h; ball.x+=ball.vx*h; ball.y+=ball.vy*h;
    const u=Math.min(1,ball.t/ball.T); ball.z=4*ball.h*u*(1-u);
    if(ball.z<18 && hitTree(true)) ball.t=ball.T;
    if(ball.t>=ball.T){ land(); return; }
  }
  ball.trail.push({x:ball.x,y:ball.y-ball.z}); if(ball.trail.length>28) ball.trail.shift();
}
function land(){
  ball.z=0; const t=terrainAt(ball.x,ball.y);
  if(ball.curveMsg){ toast(ball.curveMsg,1500); ball.curveMsg=null; }
  if(t===OOB) return penalty('oob');
  if(t===WATER) return penalty('water');
  if(dist(ball,hole.cup)<CUP_R-3.5) return holeOut();
  const k=Math.min(1,ball.keep)*TER[t].keep; ball.vx*=k; ball.vy*=k;
  Sound.land(t); if(isSand(t)) fx.push({type:'puff',x:ball.x,y:ball.y,t:0});
  state='rolling';
}
function stepRoll(dt){
  let s=Math.hypot(ball.vx,ball.vy);
  const n=Math.max(1,Math.ceil(s*dt/3)), h=dt/n;
  for(let i=0;i<n;i++){
    const t=terrainAt(ball.x,ball.y);
    if(t===OOB) return penalty('oob');
    if(t===WATER) return penalty('water');
    if(t===GREEN && hole.slope){ const sv=slopeAtS(hole.slope,ball.x,ball.y), bk=ball.brk||1; ball.vx+=sv.ax*h*bk; ball.vy+=sv.ay*h*bk; }
    s=Math.hypot(ball.vx,ball.vy);
    const dx=hole.cup.x-ball.x, dy=hole.cup.y-ball.y, d=Math.hypot(dx,dy);
    if(d<CUP_R){
      const b=s>1?Math.abs(ball.vx*dy-ball.vy*dx)/s:0, cap=ball.capture*Math.max(0,1-(b/CUP_R)**2);
      if(s<cap || s<12) return holeOut();
      if(!ball.lipped){ ball.lipped=true;
        const A=0.2+0.5*b/CUP_R, rot=a=>[ball.vx*Math.cos(a)-ball.vy*Math.sin(a), ball.vx*Math.sin(a)+ball.vy*Math.cos(a)];
        const v1=rot(A), v2=rot(-A), v=(v1[0]*dx+v1[1]*dy)<(v2[0]*dx+v2[1]*dy)?v1:v2;
        ball.vx=v[0]*0.75; ball.vy=v[1]*0.75; Sound.lip(); }
    } else if(d>CUP_R+3) ball.lipped=false;
    if(d<CUP_R+2 && d>0.5 && s<45){ const pull=120*h; ball.vx+=dx/d*pull; ball.vy+=dy/d*pull; }
    s=Math.hypot(ball.vx,ball.vy);
    const ns=Math.max(0,s-(fricOf(t)+0.3*s)*h), f=s>0?ns/s:0;
    ball.vx*=f; ball.vy*=f; ball.x+=ball.vx*h; ball.y+=ball.vy*h;
    hitTree(false);
    if(ns<=0) break;
  }
  if(Math.hypot(ball.vx,ball.vy)<4){ ball.vx=ball.vy=0; stopped(); }
}
function stopped(){
  if(strokes>=MAX_STROKES){ state='holed'; holedT=1.6; toast(`Picked up at ${MAX_STROKES} strokes`); return; }
  setReady();
}
function penalty(kind){
  state='penalty'; penT=1.5; ball.vx=ball.vy=0; ball.z=0; ball.hidden=true; ball.trail=[];
  ball.dropTo=(kind==='water' && hole.drop) ? {x:hole.drop.x, y:hole.drop.y} : null;
  if(kind==='water'){
    Sound.splash(); fx.push({type:'splash',x:ball.x,y:ball.y,t:0});
    if(save.ball==='duck' && !duckUsed){ duckUsed=true; save.stats.ducks=(save.stats.ducks||0)+1; toast('Lucky Duck! No penalty this time'); }
    else { strokes++; save.stats.splashes=(save.stats.splashes||0)+1; if(RS){ RS.pens++; HS.pen=true; } toast(ball.dropTo?'Splash! +1. Play from the drop zone':'Splash! +1 penalty stroke'); }
  } else { strokes++; if(RS){ RS.pens++; HS.pen=true; } Sound.thunk(); toast('Out of bounds. +1 penalty stroke'); }
  updateHud();
}
function holeOut(){
  if(HS&&RS&&HS.from){ if(HS.lie===GREEN) RS.longPutt=Math.max(RS.longPutt, dist(HS.from,hole.cup)*YPP*3); else { RS.chipin++; save.stats.chipins=(save.stats.chipins||0)+1; } if(strokes<=hole.par-1) HS.gir=true; HS.from=null; }
  state='holed'; holedT=1.5; ball.holed=true; ball.x=hole.cup.x; ball.y=hole.cup.y; ball.vx=ball.vy=0; ball.z=0;
  Sound.cup();
  const rel=strokes-hole.par;
  if(strokes===1) Sound.cheer(1.2); else if(rel<=-2) Sound.cheer(1); else if(rel===-1) Sound.cheer(0.6);
  toast(scoreName(strokes,hole.par));
  updateHud();
}
function scoreName(score,par){
  if(score===1) return 'Hole in one!';
  const r=score-par, names={'-3':'Albatross','-2':'Eagle','-1':'Birdie','0':'Par','1':'Bogey','2':'Double bogey','3':'Triple bogey'};
  return names[r] || (r>0?`+${r}`:`${r}`);
}
function completeHole(){
  state='done'; hideToast(); Sound.setTension(false);
  const score=Math.min(strokes,MAX_STROKES), i=holeIdx, rel=score-HOLES[i].par;
  playerScores.push(score);
  if(rel<=-1) save.stats.birdies++;
  if(RS){ if(HS.gir) RS.gir++; if(HS.putts>=3) RS.three++; if(rel<=-1){ RS.birdies++; RS.run++; RS.streak=Math.max(RS.streak,RS.run); } else RS.run=0; if(rel<=-2) RS.eagles++; if(rel>=1) RS.bogeys++; if(HS.sand&&rel<=0) RS.sandSave++; }
  if(score===1) save.stats.hio++;
  const S=save.stats; if(rel<=-2) S.eagles=(S.eagles||0)+1; if(rel<=-3) S.albatross=(S.albatross||0)+1; if(score>=8) S.snowmen=(S.snowmen||0)+1;
  if(RS){ if(HS.sand&&rel<=0) S.sandSaves=(S.sandSaves||0)+1; S.streakBest=Math.max(S.streakBest||0,RS.streak); S.maxPutt=Math.max(S.maxPutt||0,RS.longPutt); S.maxDrive=Math.max(S.maxDrive||0,RS.longDrive);
    const stn=standings(), me=stn.find(x=>x.you), lead=Math.min(...stn.filter(x=>!x.mc).map(x=>x.tot)), def=me.tot-lead; if(def>0) RS.ledAll=false; RS.maxDef=Math.max(RS.maxDef,def); }
  checkAch();
  persist(); updateHud(); showHoleSheet(i,score);
}

/* ---------- Standings ---------- */
const fmtPar = n => n===0 ? 'E' : n>0 ? `+${n}` : `−${Math.abs(n)}`;
const money = n => '$'+n.toLocaleString('en-US');
const ordinal = n => n+(['th','st','nd','rd'][(n%100>10&&n%100<14)?0:(n%10<4?n%10:0)]);
const roundLen=()=>EV.holes.length;
function holeText(i, short){ const n=roundLen(); if(EV.rounds!==2) return short?`Hole ${i+1}/${HOLES.length}`:`Hole ${i+1} of ${HOLES.length}`; const rd=i<n?1:2; return short?`R${rd} · Hole ${i%n+1}/${n}`:`Round ${rd} · Hole ${i%n+1} of ${n}`; }
function standings(){
  const done=EV._mc?HOLES.length:playerScores.length, n=roundLen();
  return field.map(p=>{ const mc=p.you?!!EV._mc:!!p.cut, sc=p.you?playerScores:mc?p.scores.slice(0,n):p.scores.slice(0,done); const tot=sc.reduce((a,s,i)=>a+s-HOLES[i].par,0); return {name:p.you?playerName():p.name,you:!!p.you,nem:!!p.nem,mc,tot,thru:sc.length,strokes:sc.reduce((a,b)=>a+b,0)}; })
    .sort((a,b)=>(a.mc?1:0)-(b.mc?1:0) || a.tot-b.tot || (b.you?1:0)-(a.you?1:0));
}
function posOf(st,s){ if(s.mc) return {pos:99,tied:false,label:'MC'}; const live=st.filter(o=>!o.mc), pos=1+live.filter(o=>o.tot<s.tot).length; const tied=live.filter(o=>o.tot===s.tot).length>1; return {pos,tied,label:(tied?'T':'')+pos}; }
function boardHTML(){
  const st=standings();
  return `<table class="lb"><thead><tr><th>Pos</th><th>Player</th><th class="r">Thru</th><th class="r">To par</th></tr></thead><tbody>${
    st.map(s=>`<tr class="${s.you?'you':''} ${s.nem?'nem':''}"><td class="pos">${posOf(st,s).label}</td><td>${esc(s.name)}${s.you?'':stTag(s.name)}${s.nem?' <span class="nemtag">Nemesis</span>':''}</td><td class="r">${s.mc?'MC':s.thru===HOLES.length?'F':s.thru}</td><td class="num ${s.tot<0?'under':''}">${fmtPar(s.tot)}</td></tr>`).join('')
  }</tbody></table>`;
}

/* ---------- HUD ---------- */
function updateHud(){
  if(!hole) return;
  $('#hHole').textContent=holeText(holeIdx,true);
  $('#hPar').textContent=`Par ${hole.par}`;
  $('#hYds').textContent=`${hole.yards} yds`;
  $('#hStrokes').textContent=strokes;
  { const pd=dist(ball,hole.cup)*YPP; $('#hPin').textContent = (terrainAt(ball.x,ball.y)===GREEN || pd<20) ? `Pin ${Math.round(pd*3)} ft` : `Pin ${Math.round(pd)} yds`; }
  const st=standings(), me=st.find(s=>s.you);
  const tot=$('#hTotal'); tot.textContent=fmtPar(me.tot); tot.classList.toggle('under',me.tot<0);
  $('#hPos').textContent=playerScores.length? `Pos ${posOf(st,me).label}` : 'Round 1';
  $('#hWind').textContent=wind.mph;
  $('#hWindArrow').style.transform=`rotate(${wind.a}rad)`;
  $('#hWindArrow').style.opacity=wind.mph===0?.25:1;
  const lie=terrainAt(ball.x,ball.y), lieEl=$('#lie');
  if(state==='menu') lieEl.textContent=`Clubhouse · ${season().name}`;
  else if(state==='ready'){
    const atTee=dist(ball,hole.tee)<2;
    lieEl.textContent = atTee ? 'Tee box · full power' : lie===GREEN ? 'On the green · putt it' : (lie===ROUGH&&hole.roughName ? hole.roughName : lie===ROUGH&&isDesert(hole) ? 'Desert · rocky, less power' : `${TER[lie]?TER[lie].name:'Rough'} · ${TER[lie]?TER[lie].note:''}`);
  } else if(state==='flying'||state==='rolling') lieEl.textContent='Ball in motion';
}
function renderRack(){
  $('#rack').innerHTML=CLUBS.map((c,i)=>{ const e=eff(i); return `<button type="button" class="club${i===clubIdx?' active':''}" data-i="${i}" aria-pressed="${i===clubIdx}" title="${e.sig?e.sig.name:TIERS[e.tier]+' '+c.name} (${i+1})">${i===autoIdx?'<span class="auto">AUTO</span>':''}<b>${c.name}</b><small>${c.putt?(e.sig?e.sig.short:TIERS[e.tier]):Math.round(e.total*YPP)+' yds'}</small></button>`; }).join('');
}
$('#rack').addEventListener('click',e=>{ const b=e.target.closest('.club'); if(!b) return; selectClub(+b.dataset.i); });
function selectClub(i){ if(state!=='ready'||i===clubIdx) return; clubIdx=i; Sound.tick(); renderRack(); }

let toastTimer=null;
let toastSticky=false;
function toast(msg,ms=1800){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastTimer); toastSticky=ms<=0; if(ms>0) toastTimer=setTimeout(hideToast,ms); }
function hideToast(){ toastSticky=false; $('#toast').classList.remove('show'); }

function setOverview(on){ overview=on; $('#viewBtn').setAttribute('aria-pressed',String(on)); }
const SOUND_ON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const SOUND_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
const LOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
function renderSound(){ const b=$('#soundBtn'); b.innerHTML=Sound.muted?SOUND_OFF:SOUND_ON; b.setAttribute('aria-pressed',String(!Sound.muted)); b.setAttribute('aria-label',Sound.muted?'Turn sound on':'Turn sound off'); }
function toggleSound(){ Sound.init(); Sound.setMuted(!Sound.muted); save.muted=Sound.muted; persist(); renderSound(); }
