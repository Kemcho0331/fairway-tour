/* Fairway Tour · Drawing the golfer and the swing animation */
'use strict';
/* ---------- Golfer ---------- */
const G_BX=18, G_BY=-4, G_SX=1, G_SY=-28;
const G_A0=Math.atan2(G_BY-G_SY, G_BX-G_SX), G_REACH=Math.hypot(G_BX-G_SX, G_BY-G_SY);
function drawGolfer(g, ang, clubI, L){
  // local space: feet at origin, facing +x, ball at (G_BX,G_BY)
  const dk='rgba(0,0,0,.35)';
  g.lineJoin='round'; g.lineCap='round';
  g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(1,0,10,3.2,0,0,7); g.fill();
  // legs + shoes
  g.fillStyle=L.pants; g.fillRect(-4.6,-16,4.2,15); g.fillRect(0.6,-16,4.2,15);
  g.fillStyle='#1d2124'; g.fillRect(-5.2,-2.4,5,2.6); g.fillRect(0.6,-2.4,5.8,2.6);
  // torso
  g.fillStyle=L.shirt; rrect(g,-6.6,-30.5,13.2,15.5,3.2); g.fill();
  if(L.shirt2){ g.fillStyle=L.shirt2; g.fillRect(-6.4,-26,12.8,2.6); g.fillRect(-6.4,-21.6,12.8,1.2); }
  g.strokeStyle=dk; g.lineWidth=0.7; rrect(g,-6.6,-30.5,13.2,15.5,3.2); g.stroke();
  g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(-6.4,-16.6,12.8,1.3);
  // head
  const hx=0.4, hy=-35.5;
  g.fillStyle=L.skin; g.beginPath(); g.arc(hx,hy,5.4,0,7); g.fill(); g.strokeStyle=dk; g.lineWidth=0.7; g.stroke();
  g.fillStyle='#1b1410'; g.beginPath(); g.arc(hx+2.7,hy+0.2,0.75,0,7); g.fill();
  if(L.hat==='cap'){ g.fillStyle=L.hatC; g.beginPath(); g.arc(hx,hy-0.6,5.8,Math.PI,0); g.fill(); g.fillRect(hx,hy-1.6,9,1.8); g.strokeStyle=dk; g.lineWidth=0.6; g.beginPath(); g.arc(hx,hy-0.6,5.8,Math.PI,0); g.stroke(); }
  else if(L.hat==='visor'){ g.fillStyle='#3a2a1e'; g.beginPath(); g.arc(hx,hy-0.8,5.5,Math.PI*1.05,Math.PI*1.95); g.fill(); g.fillStyle=L.hatC; g.fillRect(hx-5.8,hy-3.2,11.6,2.2); g.fillRect(hx+2,hy-1.6,7.5,1.6); }
  else if(L.hat==='bucket'){ g.fillStyle=L.hatC; g.beginPath(); g.moveTo(hx-7.6,hy-1); g.lineTo(hx+7.6,hy-1); g.lineTo(hx+4.6,hy-8); g.lineTo(hx-4.6,hy-8); g.closePath(); g.fill(); g.strokeStyle=dk; g.lineWidth=0.6; g.stroke(); }
  else { g.fillStyle='#3a2a1e'; g.beginPath(); g.arc(hx,hy-0.8,5.6,Math.PI*1.02,Math.PI*1.98); g.fill(); }
  // arms + club
  const c=Math.cos(ang), sn=Math.sin(ang), hxp=G_SX+c*10, hyp=G_SY+sn*10, ex=G_SX+c*G_REACH, ey=G_SY+sn*G_REACH;
  g.strokeStyle='#cfd4d8'; g.lineWidth=1.3; g.beginPath(); g.moveTo(hxp,hyp); g.lineTo(ex,ey); g.stroke();
  g.fillStyle=clubI===0?'#262a2e':clubI===3?'#9aa1a6':'#dfe3e6';
  g.beginPath(); g.arc(ex,ey,clubI===0?2.4:1.7,0,7); g.fill();
  [[-2.2,0.4],[2.2,1]].forEach(([ox,oy])=>{ const sx=G_SX+ox, sy=G_SY+oy;
    g.strokeStyle=L.skin; g.lineWidth=2.5; g.beginPath(); g.moveTo(sx,sy); g.lineTo(hxp,hyp); g.stroke();
    g.strokeStyle=L.shirt; g.lineWidth=3.2; g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx+(hxp-sx)*0.38,sy+(hyp-sy)*0.38); g.stroke(); });
  g.fillStyle=L.skin; g.beginPath(); g.arc(hxp,hyp,1.7,0,7); g.fill();
  if(L.watch){ const sx=G_SX-2.2, sy=G_SY+0.4; g.fillStyle='#e2b93b'; g.beginPath(); g.arc(sx+(hxp-sx)*0.8,sy+(hyp-sy)*0.8,1.5,0,7); g.fill(); }
}
let gpos=null;
const swing={phase:'address', t:0, from:0, to:0, cur:G_A0, side:1, putt:false};
function updateSwing(dt){
  const putt=!!CLUBS[clubIdx].putt;
  if(swing.phase==='down'){
    swing.t+=dt; const u=Math.min(1,swing.t/0.3), e=u<0.55 ? (u/0.55)**2*0.55 : 0.55+(1-(1-(u-0.55)/0.45)**2)*0.45;
    swing.cur=swing.from+(swing.to-swing.from)*e; if(u>=1) swing.phase='finish'; return;
  }
  if(swing.phase==='finish') return;
  let target=G_A0;
  if(state==='ready' && aim){ const a=aimInfo(); if(a) target=G_A0+a.p*(putt?1.1:3.4); }
  swing.cur+=(target-swing.cur)*(1-Math.exp(-dt*14));
}
function updateSide(){
  if(!gpos || swing.phase!=='address') return;
  let dx;
  const a=state==='ready'?aimInfo():null;
  if(a) dx=a.dx; else { const d=Math.hypot(hole.cup.x-gpos.x,hole.cup.y-gpos.y)||1; dx=(hole.cup.x-gpos.x)/d; }
  if(swing.side===1 && dx<-0.3) swing.side=-1; else if(swing.side===-1 && dx>0.3) swing.side=1;
}
function drawGolferWorld(z){
  if(!gpos) return;
  const s=Math.max(1,22/(40*z)), side=swing.side;
  ctx.save(); ctx.translate(gpos.x-G_BX*side*s, gpos.y-G_BY*s); ctx.scale(side*s,s);
  drawGolfer(ctx, swing.cur, clubIdx, lookColors()); ctx.restore();
}
function drawPreview(){
  const c=document.getElementById('gprev'); if(!c) return;
  const g=c.getContext('2d'), W=c.width, H=c.height; g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H);
  const f=(time*0.5)%1; let a;
  if(f<0.55) a=G_A0+3.4*Math.pow(f/0.55,0.8);
  else if(f<0.62) a=G_A0+3.4-5.9*((f-0.55)/0.07);
  else if(f<0.85) a=G_A0-2.5;
  else a=G_A0-2.5+2.5*((f-0.85)/0.15);
  const sc=W/64; g.setTransform(sc,0,0,sc,W*0.36,H*0.8);
  const col=colorDef(); const bg=g.createRadialGradient(G_BX-0.8,G_BY-0.8,0.2,G_BX,G_BY,2.4); bg.addColorStop(0,col.c1); bg.addColorStop(1,col.c2);
  if(f<0.58){ g.fillStyle=bg; g.beginPath(); g.arc(G_BX,G_BY,2.2,0,7); g.fill(); }
  drawGolfer(g,a,0,lookColors());
}
