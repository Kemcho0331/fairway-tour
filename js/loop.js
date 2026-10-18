/* Fairway Tour · Input, camera, weather, drawing, and the frame loop */
'use strict';
/* ---------- Input ---------- */
function maxDrag(){ return clamp(Math.min(vw,vh)*0.34,110,230); }
function aimInfo(){
  if(!aim) return null;
  const dx=aim.x-aim.sx, dy=aim.y-aim.sy, L=Math.hypot(dx,dy); if(L<10) return null;
  const md=maxDrag(), putt=!!CLUBS[clubIdx].putt, om=md*1.3, Lc=Math.min(L, putt?md:om);
  const p = Lc<=md ? Lc/md : 1+0.1*(Lc-md)/(om-md);
  return {dx:-dx/L, dy:-dy/L, p, L:Lc, md};
}
cv.addEventListener('pointerdown',e=>{
  if(!overlay.hidden) return;
  if(state==='intro'){ endIntro(); return; }
  if(state!=='ready') return;
  if(overview){ setOverview(false); return; }
  aim={id:e.pointerId,sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY};
  try{ cv.setPointerCapture(e.pointerId); }catch(_){}
  hideToast();
});
cv.addEventListener('pointermove',e=>{ if(aim && e.pointerId===aim.id){ aim.x=e.clientX; aim.y=e.clientY; } });
cv.addEventListener('pointerup',e=>{ if(!aim || e.pointerId!==aim.id) return; const a=aimInfo(); aim=null; if(a && a.p>0.04 && state==='ready') shoot(a.dx,a.dy,a.p); });
cv.addEventListener('pointercancel',()=>{ aim=null; });
$('#viewBtn').onclick=()=>{ if(state==='ready'){ setOverview(!overview); } else if(state==='intro') endIntro(); };
$('#boardBtn').onclick=showBoard;
$('#cardBtn').onclick=()=>showScorecard();
$('#soundBtn').onclick=toggleSound;
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ if(aim) aim=null; else if(sheetKind==='board'||sheetKind==='card') closeSheet(); return; }
  if(!overlay.hidden) return;
  if(e.key>='1'&&e.key<='4') selectClub(+e.key-1);
  else if(e.key==='v'||e.key==='V'){ if(state==='ready') setOverview(!overview); }
  else if(e.key==='l'||e.key==='L') showBoard();
  else if(e.key==='c'||e.key==='C') showScorecard();
  else if(e.key==='m'||e.key==='M') toggleSound();
});
document.addEventListener('visibilitychange',()=>{ if(document.hidden) Sound.suspend(); else Sound.resume(); });

/* ---------- Camera ---------- */
function baseZoom(){ return clamp(Math.min(vw/720, vh/860), 0.32, 1.25); }
function overviewZoom(){ return Math.max(0.05, Math.min(vw/(hole.w+60), (vh-150)/(hole.H+60))); }
function fitTwo(a,b){
  const z=Math.max(overviewZoom(), Math.min(baseZoom(), (vw-90)/(Math.abs(a.x-b.x)+80), (vh-230)/(Math.abs(a.y-b.y)+80)));
  return {x:(a.x+b.x)/2, y:(a.y+b.y)/2-10/z, z};
}
function fitPts(pts){
  const xs=pts.map(q=>q.x), ys=pts.map(q=>q.y), x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  const z=Math.max(overviewZoom(), Math.min(baseZoom(), (vw-90)/(x1-x0+80), (vh-230)/(y1-y0+80)));
  return {x:(x0+x1)/2, y:(y0+y1)/2-10/z, z};
}
function shotEnd(ux,uy,p){
  const e=eff(clubIdx), lie=terrainAt(ball.x,ball.y), lf=lieFactor(e,lie);
  if(e.putt){ const r=rollDist(e.v*p*lf, fricOf(lie)); return {x:ball.x+ux*r, y:ball.y+uy*r}; }
  const carry=p*e.carry*lf, T=e.T*(0.45+0.55*p), roll=rollDist(carry/T*Math.min(1,e.keep), fricOf(FAIR)), wm=e.wind;
  return {x:ball.x+ux*(carry+roll)+0.5*wind.ax*wm*T*T, y:ball.y+uy*(carry+roll)+0.5*wind.ay*wm*T*T};
}
function camTarget(){
  if(overview) return {x:hole.w/2, y:hole.H/2+20, z:overviewZoom()};
  if(state==='ready'){
    const a=aimInfo();
    if(a){ const end=shotEnd(a.dx,a.dy,Math.max(1,a.p)), tl=(a.md*1.3*BAND+40)/cam.z;
      return fitPts([ball, end, {x:ball.x-a.dx*tl, y:ball.y-a.dy*tl}]); }
    const tg=EV&&EV.range?{x:ball.x,y:ball.y-2000}:hole.cup, dx=tg.x-ball.x, dy=tg.y-ball.y, d=Math.hypot(dx,dy)||1;
    const reach=Math.min(d, eff(clubIdx).total*1.05);
    return fitTwo(ball, {x:ball.x+dx/d*reach, y:ball.y+dy/d*reach});
  }
  return {x:ball.x, y:ball.y, z:baseZoom()};
}
function clampCam(){
  if(aim && state==='ready') return; // let the camera leave the hole so the pull-back stays on screen
  const hw=vw/2/cam.z, hh=vh/2/cam.z, m=50;
  cam.x = hole.w+2*m > 2*hw ? clamp(cam.x, hw-m, hole.w-hw+m) : hole.w/2;
  cam.y = hole.H+2*m > 2*hh ? clamp(cam.y, hh-m-60, hole.H-hh+m+40) : hole.H/2;
}
function snapCamera(){ const t=camTarget(); cam.x=t.x; cam.y=t.y; cam.z=t.z; clampCam(); }
function updateCamera(dt){ const t=camTarget(), k=1-Math.exp(-dt*(overview?3:4.5)); cam.z+=(t.z-cam.z)*k; cam.x+=(t.x-cam.x)*k; cam.y+=(t.y-cam.y)*k; clampCam(); }

/* ---------- Loop ---------- */
const RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
let wx=[], wxSeason=null;
function resetWeather(){
  const w=season().weather; wxSeason=season().id;
  const n = RM ? 0 : w==='rain'?150 : w==='snow'?110 : w==='leaves'?26 : 0;
  wx=Array.from({length:n},()=>({x:Math.random()*Math.max(vw,1), y:Math.random()*Math.max(vh,1), s:Math.random(), r:Math.random()*6.28, c:(Math.random()*4)|0}));
}
function stepWeather(dt){
  if(wxSeason!==season().id) resetWeather();
  const w=season().weather, wxs=wind.mph*Math.cos(wind.a)*3, wys=wind.mph*Math.sin(wind.a)*1.5;
  for(const p of wx){
    if(w==='rain'){ p.x+=(wxs*1.4-30)*dt; p.y+=(560+p.s*220)*dt; }
    else if(w==='snow'){ p.x+=(wxs+Math.sin(time*1.2+p.r)*16)*dt; p.y+=(34+p.s*38+wys*0.3)*dt; }
    else { p.x+=(wxs*2+Math.sin(time*1.8+p.r)*30)*dt; p.y+=(26+p.s*28+wys)*dt; p.r+=dt*(1.5+p.s*3); }
    if(p.y>vh+20){ p.y=-20; p.x=Math.random()*vw; } if(p.y<-30) p.y=vh+10;
    if(p.x>vw+20) p.x=-20; else if(p.x<-20) p.x=vw+20;
  }
}
function drawWeather(){
  const w=season().weather;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle = w==='rain'?'rgba(40,60,90,.07)' : w==='sun'?'rgba(255,214,120,.05)' : w==='snow'?'rgba(210,230,250,.06)' : 'rgba(200,120,40,.04)';
  ctx.fillRect(0,0,vw,vh);
  if(w==='rain'){ ctx.strokeStyle='rgba(205,222,255,.32)'; ctx.lineWidth=1.1; ctx.beginPath(); for(const p of wx){ ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-2.5,p.y+11+p.s*5); } ctx.stroke(); }
  else if(w==='snow'){ ctx.fillStyle='rgba(255,255,255,.85)'; for(const p of wx){ ctx.beginPath(); ctx.arc(p.x,p.y,1.1+p.s*1.9,0,7); ctx.fill(); } }
  else if(w==='leaves'){ const cols=['#c4622d','#d88a2c','#a8432a','#d9b13e']; for(const p of wx){ ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.scale(1,Math.abs(Math.cos(p.r*1.3))*0.8+0.2); ctx.fillStyle=cols[p.c]; ctx.beginPath(); ctx.ellipse(0,0,5,2.6,0,0,7); ctx.fill(); ctx.restore(); } }
}
function update(dt){
  time+=dt;
  if(state==='intro'){ introT-=dt; if(introT<=0) endIntro(); }
  else if(state==='flying') stepFlight(dt);
  else if(state==='rolling') stepRoll(dt);
  else if(state==='holed'){ holedT-=dt; if(ball.holed) ball.sink=Math.min(1,ball.sink+dt*3); if(holedT<=0) completeHole(); }
  else if(state==='penalty'){ penT-=dt; if(penT<=0){ const to=ball.dropTo||lastPos; ball.hidden=false; ball.x=to.x; ball.y=to.y; ball.dropTo=null; stopped(); } }
  fx.forEach(f=>f.t+=dt*1.2); fx=fx.filter(f=>f.t<1);
  const ai=state==='ready'?aimInfo():null, lieEl=$('#lie');
  if(ai){ const txt=CLUBS[clubIdx].putt?`Putt · ${Math.round(ai.p*100)}%`:`Power ${Math.round(ai.p*100)}%${ai.p>1?' · overswing':''}`;
    if(lieEl.textContent!==txt) lieEl.textContent=txt; lieEl.classList.toggle('hot',ai.p>1); lieAim=true; }
  else if(lieAim){ lieAim=false; lieEl.classList.remove('hot'); updateHud(); }
  if(hole){ updateSide(); updateSwing(dt); updateCamera(dt); }
  stepWeather(dt);
  if(sheetKind==='hub' && hubTab==='golfer') drawPreview();
}
function draw(){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle=(hole&&hole.surOuter)||pal().outside; ctx.fillRect(0,0,vw,vh);
  if(!hole) return;
  const z=cam.z, ox=vw/2-cam.x*z, oy=vh/2-cam.y*z;
  ctx.setTransform(dpr*z,0,0,dpr*z,dpr*ox,dpr*oy);
  const x0=Math.max(0,-ox/z), y0=Math.max(0,-oy/z), x1=Math.min(hole.w,(vw-ox)/z), y1=Math.min(hole.H,(vh-oy)/z);
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  if(hole.sur){ const sx0=Math.max(-SMX,-ox/z), sy0=Math.max(-SMY,-oy/z), sx1=Math.min(hole.w+SMX,(vw-ox)/z), sy1=Math.min(hole.H+SMY,(vh-oy)/z);
    if(sx1>sx0 && sy1>sy0) ctx.drawImage(hole.sur, (sx0+SMX)*SS, (sy0+SMY)*SS, (sx1-sx0)*SS, (sy1-sy0)*SS, sx0, sy0, sx1-sx0, sy1-sy0); }
  if(x1>x0 && y1>y0) ctx.drawImage(vis, x0*VIS, y0*VIS, (x1-x0)*VIS, (y1-y0)*VIS, x0, y0, x1-x0, y1-y0);
  drawCup(z); drawDrill(z); drawFx(z);
  if(state!=='menu'){ drawBall(z); drawGolferWorld(z); }
  if(aim && state==='ready') drawAim(z);
  drawWeather();
}
function drawCup(z){
  const c=hole.cup, r=Math.max(CUP_R,4/z);
  ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(c.x,c.y,r+1.6/z,0,7); ctx.fill();
  ctx.fillStyle='#10180f'; ctx.beginPath(); ctx.arc(c.x,c.y,r,0,7); ctx.fill();
  const ph=Math.max(46,30/z), top=c.y-ph;
  ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=Math.max(2.2,1.5/z); ctx.beginPath(); ctx.moveTo(c.x,c.y); ctx.lineTo(c.x+ph*0.55,c.y+ph*0.25); ctx.stroke();
  ctx.strokeStyle='#f4f5ef'; ctx.lineWidth=Math.max(2.4,1.6/z); ctx.beginPath(); ctx.moveTo(c.x,c.y); ctx.lineTo(c.x,top); ctx.stroke();
  const s=Math.min(1,wind.mph/Math.max(1,EV.windMax)), wx=wind.mph?Math.cos(wind.a):1, wy=wind.mph?Math.sin(wind.a):0.6;
  const len=Math.max(26,18/z)*(0.75+0.25*s), flut=Math.sin(time*(6+s*8))*3*(0.4+s);
  ctx.fillStyle=COL.flag; ctx.beginPath(); ctx.moveTo(c.x,top); ctx.lineTo(c.x,top+len*0.5);
  ctx.lineTo(c.x+wx*len, top+len*0.25+wy*len*0.35+flut+(1-s)*len*0.3); ctx.closePath(); ctx.fill();
}
function drawFx(z){
  fx.forEach(f=>{ const a=1-f.t;
    if(f.type==='splash'){ ctx.strokeStyle=`rgba(230,245,255,${a})`; ctx.lineWidth=2.5/z; [0,0.25].forEach(o=>{ const t=f.t-o; if(t<0) return; ctx.beginPath(); ctx.ellipse(f.x,f.y,8+t*48,(8+t*48)*0.7,0,0,7); ctx.stroke(); }); }
    else { ctx.fillStyle=`rgba(232,214,160,${a*0.8})`; for(let k=0;k<8;k++){ const ang=k/8*Math.PI*2, d=6+f.t*26; ctx.beginPath(); ctx.arc(f.x+Math.cos(ang)*d,f.y+Math.sin(ang)*d*0.7-f.t*10,3.5*(1-f.t*0.5),0,7); ctx.fill(); } }
  });
}
function drawBall(z){
  if(!ball || ball.hidden) return;
  const col=colorDef();
  if(ball.trail.length>1){ ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=2.2/z; ctx.lineCap='round'; ctx.beginPath(); ball.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.lineTo(ball.x,ball.y-ball.z); ctx.stroke(); }
  const sc=1-ball.sink; if(sc<=0.03) return;
  const r=Math.max(BALL_R,3.8/z)*sc;
  ctx.fillStyle=`rgba(0,0,0,${0.32-Math.min(0.2,ball.z/400)})`; ctx.beginPath(); ctx.ellipse(ball.x+1.5+ball.z*0.12,ball.y+1.8,r*(1+ball.z/160),r*0.75*(1+ball.z/160),0,0,7); ctx.fill();
  const by=ball.y-ball.z, br=r*(1+ball.z/90);
  const g=ctx.createRadialGradient(ball.x-br*.35,by-br*.35,br*.1,ball.x,by,br); g.addColorStop(0,col.c1); g.addColorStop(1,col.c2);
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(ball.x,by,br,0,7); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=1/z; ctx.stroke();
}
const BAND=0.6; // pull-back band is drawn at 60% of the finger's drag so it fits on screen
function aimLabel(text,x,y,z){
  ctx.font=`700 ${16/z}px "Barlow Condensed","Arial Narrow",sans-serif`; ctx.textAlign='center'; ctx.textBaseline='bottom';
  ctx.lineWidth=4/z; ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.strokeText(text,x,y); ctx.fillStyle='#fff'; ctx.fillText(text,x,y);
}
function drawAim(z){
  const a=aimInfo(); if(!a) return;
  const e=eff(clubIdx), lie=terrainAt(ball.x,ball.y), lf=lieFactor(e,lie), p=a.p, pc=Math.min(p,1), over=p>1;
  const col = over ? `hsl(${3+9*Math.sin(time*16)},90%,56%)` : `hsl(${130-90*p},78%,52%)`;
  const bx=ball.x-a.dx*a.L*BAND/z, by=ball.y-a.dy*a.L*BAND/z;
  ctx.lineCap='round';
  ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=8/z; ctx.beginPath(); ctx.moveTo(ball.x,ball.y); ctx.lineTo(bx,by); ctx.stroke();
  ctx.strokeStyle=col; ctx.lineWidth=5/z; ctx.beginPath(); ctx.moveTo(ball.x,ball.y); ctx.lineTo(bx,by); ctx.stroke();
  if(!e.putt){ const tx=ball.x-a.dx*a.md*BAND/z, ty=ball.y-a.dy*a.md*BAND/z, nx=-a.dy, ny=a.dx, tl=8/z;
    ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=4/z; ctx.beginPath(); ctx.moveTo(tx-nx*tl,ty-ny*tl); ctx.lineTo(tx+nx*tl,ty+ny*tl); ctx.stroke();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2/z; ctx.beginPath(); ctx.moveTo(tx-nx*tl,ty-ny*tl); ctx.lineTo(tx+nx*tl,ty+ny*tl); ctx.stroke(); }
  ctx.fillStyle=col; ctx.beginPath(); ctx.arc(bx,by,7/z,0,7); ctx.fill();
  aimLabel(`${Math.round(p*100)}%${over?' OVERSWING':''}`, bx-a.dx*24/z, by-a.dy*24/z+8/z, z);
  ctx.strokeStyle='rgba(255,255,255,.92)'; ctx.lineWidth=2.4/z;
  if(e.putt){
    const v=e.v*p*lf, roll=rollDist(v,fricOf(lie)), ex=ball.x+a.dx*roll*0.45, ey=ball.y+a.dy*roll*0.45, ft=roll*YPP*3;
    ctx.setLineDash([7/z,6/z]); ctx.beginPath(); ctx.moveTo(ball.x,ball.y); ctx.lineTo(ex,ey); ctx.stroke(); ctx.setLineDash([]);
    aimLabel(`~${Math.max(5,Math.round(ft/5)*5)} ft`, ex, ey-10/z, z);
    return;
  }
  const sm=shotMods(e,lie,p*e.carry*lf), hh=e.h*(0.5+0.5*pc)*sm.h, nx=a.dy*sm.side, ny=-a.dx*sm.side;
  {
    const full=p*e.carry*sm.carry, n=10, frac=sm.D?0.6:0.42;
    for(let i=1;i<=n;i++){ const u=frac*i/n, w=sm.D*u*u, x=ball.x+a.dx*full*u+nx*w, y=ball.y+a.dy*full*u+ny*w-4*hh*u*(1-u)*0.9; if(sm.D&&sm.spread){ ctx.fillStyle='rgba(255,255,255,.1)'; ctx.beginPath(); ctx.arc(x,y,Math.max(3/z,w*sm.spread*1.6),0,7); ctx.fill(); } ctx.fillStyle=`rgba(255,255,255,${(0.92*(1-i/(n+2))).toFixed(3)})`; ctx.beginPath(); ctx.arc(x,y,2.6/z,0,7); ctx.fill(); }
    const lw=sm.D*frac*frac, lx=ball.x+a.dx*full*frac+nx*lw, ly=ball.y+a.dy*full*frac+ny*lw-4*hh*frac*(1-frac)*0.9;
    aimLabel(`~${Math.round(full*YPP/10)*10} yds${sm.label?' · '+sm.label:''}`, lx, ly-10/z, z);
  }
}

let last=performance.now();
function frame(ts){ const dt=Math.min(0.033,Math.max(0,(ts-last)/1000)); last=ts; update(dt); draw(); requestAnimationFrame(frame); }
