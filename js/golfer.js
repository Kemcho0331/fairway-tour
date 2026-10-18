/* Fairway Tour · The golfer and the swing animation */
'use strict';
/* ---------- Drawing helpers ---------- */
function shadeHex(hex, k){ if(typeof hex!=='string'||!/^#[0-9a-f]{6}$/i.test(hex)) return hex; const n=parseInt(hex.slice(1),16); let r=n>>16, g=(n>>8)&255, b=n&255; const f=v=>Math.round(Math.max(0,Math.min(255, k<0?v*(1+k):v+(255-v)*k))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
// tapered limb between two circles
function capsule(g, a, b, ra, rb){
  const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||0.001, ang=Math.atan2(dy,dx);
  g.moveTo(a[0]+Math.cos(ang+Math.PI/2)*ra, a[1]+Math.sin(ang+Math.PI/2)*ra);
  g.arc(a[0],a[1],ra,ang+Math.PI/2,ang+Math.PI*1.5);
  g.arc(b[0],b[1],rb,ang-Math.PI/2,ang+Math.PI/2);
  g.closePath();
}
// the style decides outline, shading strength, and cel vs smooth shading
const GSTYLE = {
  clean: {outline:0.55, olc:'rgba(22,30,24,.85)', light:0.16, dark:0.2, cel:false, rim:false},
  painted:{outline:0, olc:null, light:0.24, dark:0.3, cel:false, rim:true},
  bold:  {outline:0.85, olc:'#151c18', light:0.12, dark:0.26, cel:true, rim:false},
};
// draw one group of shapes: outline pass for the whole group, then shaded fills, so joints inside a limb show no seams
function group(g, S, parts){
  if(S.outline){ g.save(); g.strokeStyle=S.olc; g.lineWidth=S.outline*2; g.lineJoin='round'; for(const p of parts){ g.beginPath(); p.path(g); g.stroke(); } g.restore(); }
  for(const p of parts){
    g.beginPath(); p.path(g); g.fillStyle=p.col; g.fill();
    if(p.noShade) continue;
    const [x0,y0,x1,y1]=p.axis; // shading runs across the axis: light from the upper left
    g.save(); g.beginPath(); p.path(g); g.clip();
    const gr=g.createLinearGradient(x0,y0,x1,y1);
    if(S.cel){ gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(0.55,'rgba(255,255,255,0)'); gr.addColorStop(0.551,`rgba(0,0,0,${S.dark})`); gr.addColorStop(1,`rgba(0,0,0,${S.dark})`); }
    else { gr.addColorStop(0,`rgba(255,255,255,${S.light})`); gr.addColorStop(0.45,'rgba(255,255,255,0)'); gr.addColorStop(1,`rgba(0,0,0,${S.dark})`); }
    g.restore(); g.save(); g.beginPath(); p.path(g); g.clip(); g.fillStyle=gr; g.fillRect(-60,-80,120,100);
    if(S.rim){ g.globalCompositeOperation='source-atop'; g.strokeStyle='rgba(255,255,255,.28)'; g.lineWidth=0.7; g.beginPath(); p.path(g); g.translate(0.45,0.45); g.stroke(); }
    g.restore();
  }
}
// axis helper for shading: perpendicular to a limb, light side toward the upper left
function across(a, b, r){ const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||1; let nx=-dy/L, ny=dx/L; if(nx+ny>0){ nx=-nx; ny=-ny; } const m=[(a[0]+b[0])/2,(a[1]+b[1])/2]; return [m[0]+nx*r, m[1]+ny*r, m[0]-nx*r, m[1]-ny*r]; }
/* Face-on golfer: he faces the camera, the ball sits in front of his feet, and the target is to screen right.
   Local space: feet at the origin, y up is negative. Right-handed: lead (left) side is screen right.
   The swing is a pendulum: the hands travel on an arc around a pivot at the top of his chest (angle phi),
   and the club hangs off the hands at its own angle (psi). Both are measured from straight down,
   positive toward the backswing (screen left). The gap between them is the wrist hinge. */
const D2R=Math.PI/180;
const F_ARM=[7.2,7.0], F_CLUB=[18.6,17.0,15.8,13.6];
const FP_KEYS=['hipL','hipR','kneeL','kneeR','ankL','ankR','toeL','toeR','Ls','Rs','Le','Re','H','H2','C','neck','head'];
function lerpF(a, b, t){ const o={}; for(const k of FP_KEYS) o[k]=[a[k][0]+(b[k][0]-a[k][0])*t, a[k][1]+(b[k][1]-a[k][1])*t];
  o.yaw=a.yaw+(b.yaw-a.yaw)*t; o.roll=a.roll+(b.roll-a.roll)*t; o.front=t<0.5?a.front:b.front; o.clubBehind=t<0.5?a.clubBehind:b.clubBehind; return o; }
// two-bone reach: the elbow sits where both segments meet, bending toward +y (down)
function fBend(a, b, l1, l2){
  const dx=b[0]-a[0], dy=b[1]-a[1], d=Math.hypot(dx,dy)||0.001, dd=Math.min(d,l1+l2-0.02), ux=dx/d, uy=dy/d;
  const along=(l1*l1-l2*l2+dd*dd)/(2*dd), perp=Math.sqrt(Math.max(0,l1*l1-along*along));
  let nx=-uy, ny=ux; if(ny<0||(ny===0&&nx>0)){ nx=-nx; ny=-ny; }
  return [a[0]+ux*along+nx*perp, a[1]+uy*along+ny*perp];
}
// the club angle for a given hands angle on the way back: wrists set gradually, club parallel to the ground by hip height
const F_BACK=[[0,-6],[30,34],[52,92],[95,182],[150,274],[165,292]];
function backPsi(phi){ const T=F_BACK; if(phi<=T[0][0]) return phi-6; for(let i=1;i<T.length;i++){ if(phi<=T[i][0]){ const f=(phi-T[i-1][0])/(T[i][0]-T[i-1][0]); return T[i-1][1]+(T[i][1]-T[i-1][1])*f; } } return T[T.length-1][1]; }
// build every joint from a handful of swing numbers
function rigF(s, clubI=1){
  const putt=clubI===3, Lc=F_CLUB[clubI]||17, crouch=(18.6-Lc)*0.55;
  const tu=s.turn||0, fwd=Math.max(0,-tu), bk=Math.max(0,tu), sh=s.shift||0, up=s.rise||0;
  // feet: the trail heel comes up late in the follow-through and the foot turns onto its toe
  const heel=Math.max(0,(fwd-0.35)/0.65), stance=putt?2.6:3.9;
  const ankL=[stance,-1.2], toeL=[stance+1.6,0.2];
  const ankR=[-stance+heel*2.8,-1.2-heel*2.2], toeR=[-stance-1.6+heel*4.6,0.2-heel*0.1];
  // hips: slide toward the target on the way down, turn half as much as the shoulders
  const ht=tu*0.55, hw=2.15*(1-0.3*Math.abs(ht)), hx=sh, hy=-18.2+crouch*0.45-up*0.5;
  const hipL=[hx+hw,hy-fwd*0.5], hipR=[hx-hw,hy+fwd*0.3];
  const kneeL=[(hipL[0]+ankL[0])/2-0.3-bk*1.7+fwd*0.3,(hipL[1]+ankL[1])/2+0.2-fwd*0.3];
  const kneeR=[(hipR[0]+ankR[0])/2+0.3+fwd*2.2-bk*0.2,(hipR[1]+ankR[1])/2+0.3+fwd*0.6];
  // shoulders: spine tilted away from the target at address, turning back narrows them, finish stands him up
  const th=tu*92*D2R, W=4.4*(0.5+0.5*Math.abs(Math.cos(th)));
  const cx=hx-0.7-bk*0.5+fwd*0.9, cy=-30.4+crouch-up*1.5;
  const dyL=-0.45+bk*2.0+fwd*0.5;
  const Ls=[cx+W,cy+dyL], Rs=[cx-W,cy-dyL];
  const neck=[cx+0.1+fwd*0.3,cy-1.8];
  const look=Math.max(0,(fwd-0.2)/0.8);
  const head=[-0.4+sh*0.15+look*2.4+bk*-0.2, cy-5.6+look*0.2];
  const yaw=putt?0:(-0.12*bk+look*0.85), roll=-0.07+bk*0.04+look*0.11;
  // hands on the pendulum arc, then the club off the hands
  const ph=s.phi*D2R, ps=s.psi*D2R, a=Math.min(1,Math.abs(s.phi)/150);
  const P=[cx,cy+1.4], R=(putt?11.6:12.3)-0.9*a;
  const H=[P[0]-R*Math.sin(ph), P[1]+R*Math.cos(ph)];
  const fold=s.phi<-110?0.78:1, ux=-Math.sin(ps), uy=Math.cos(ps);
  const C=[H[0]+ux*Lc*fold, H[1]+uy*Lc*fold], H2=[H[0]+ux*1.5, H[1]+uy*1.5];
  const Le=fBend(Ls,H,F_ARM[0],F_ARM[1]), Re=fBend(Rs,H2,F_ARM[0],F_ARM[1]);
  return {hipL,hipR,kneeL,kneeR,ankL,ankR,toeL,toeR,Ls,Rs,Le,Re,H,H2,C,neck,head,yaw,roll,
    front:s.phi>=-8?'lead':'trail', clubBehind:s.psi>215||s.phi<-115};
}
// where the ball sits for a club: just under the clubhead at address
function fBall(clubI=1){ const p=rigF(stBack(0,clubI),clubI); return [p.C[0]+0.3, Math.max(0.6,p.C[1]+0.8)]; }

function drawGolferF(g, o, L, styleName, clubI=0){
  const S=GSTYLE[styleName]||GSTYLE.clean;
  g.lineJoin='round'; g.lineCap='round';
  g.fillStyle='rgba(0,0,0,.24)'; g.beginPath(); g.ellipse(1.2,0.6,9.5,2.4,0,0,7); g.fill();
  const far=k=>shadeHex(k,-0.16), shoe='#22272b', sole='#e9e6dd';
  const leg=(hip,knee,ank,col)=>[{path:g=>capsule(g,hip,knee,1.6,1.25), col, axis:across(hip,knee,1.6)},{path:g=>capsule(g,knee,ank,1.42,1.0), col, axis:across(knee,ank,1.4)}];
  const shoeP=(ank,toe,col)=>[{path:g=>{ const dx=toe[0]-ank[0], dy=toe[1]-ank[1]; g.ellipse(ank[0]+dx*0.55, ank[1]+dy*0.55+0.4, Math.max(1.4,Math.hypot(dx,dy)*0.6), 1.2, Math.atan2(dy,dx)*0.5, 0, 7); }, col, axis:[ank[0],ank[1]-1,ank[0],ank[1]+1.6]},
    {path:g=>{ const dx=toe[0]-ank[0], dy=toe[1]-ank[1]; g.ellipse(ank[0]+dx*0.55, ank[1]+dy*0.55+1.45, Math.max(1.4,Math.hypot(dx,dy)*0.58), 0.35, Math.atan2(dy,dx)*0.5, 0, 7); }, col:sole, noShade:true}];
  // club helper
  const drawClub=()=>{ const h=o.H, c=o.C, dx=c[0]-h[0], dy=c[1]-h[1], Ls=Math.hypot(dx,dy)||1, ux=dx/Ls, uy=dy/Ls;
    if(S.outline){ g.strokeStyle=S.olc; g.lineWidth=0.75+S.outline*1.4; g.beginPath(); g.moveTo(h[0]-ux*1.2,h[1]-uy*1.2); g.lineTo(c[0],c[1]); g.stroke(); }
    g.strokeStyle='#c9ced2'; g.lineWidth=0.75; g.beginPath(); g.moveTo(h[0],h[1]); g.lineTo(c[0],c[1]); g.stroke();
    g.strokeStyle='#26292c'; g.lineWidth=1.25; g.beginPath(); g.moveTo(h[0]-ux*1.4,h[1]-uy*1.4); g.lineTo(h[0]+ux*2.6,h[1]+uy*2.6); g.stroke();
    const head=clubI===0?'#2b2f33':clubI===3?'#a9b0b5':'#d9dde0', a=Math.atan2(uy,ux);
    g.save(); g.translate(c[0],c[1]); g.rotate(a); g.fillStyle=head; if(S.outline){ g.strokeStyle=S.olc; g.lineWidth=S.outline; }
    g.beginPath(); if(clubI===0) g.ellipse(0.8,0,2.2,1.5,0,0,7); else if(clubI===3){ g.rect(-0.4,-1.9,1.3,3.8); } else { g.moveTo(-0.6,-0.5); g.lineTo(2.0,-1.1); g.lineTo(2.4,1.0); g.lineTo(-0.6,0.8); g.closePath(); } g.fill(); if(S.outline) g.stroke(); g.restore(); };
  if(o.clubBehind) drawClub();
  // torso: shoulders taper to the waist, belt, then hips in pants
  const mid=(a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
  const wL=mid([o.Ls[0]-0.3,o.Ls[1]],[o.hipL[0]+1.3,o.hipL[1]],0.6), wR=mid([o.Rs[0]+0.3,o.Rs[1]],[o.hipR[0]-1.3,o.hipR[1]],0.6);
  const torso=g=>{ g.moveTo(o.Rs[0],o.Rs[1]-0.6); g.quadraticCurveTo((o.Rs[0]+o.Ls[0])/2,(o.Rs[1]+o.Ls[1])/2-1.6,o.Ls[0],o.Ls[1]-0.6);
    g.quadraticCurveTo(o.Ls[0]+1.4,o.Ls[1]+1.2,o.Ls[0]+0.7,o.Ls[1]+3.2); g.quadraticCurveTo(wL[0]+0.8,wL[1]-2,wL[0]+0.2,wL[1]);
    g.quadraticCurveTo(o.hipL[0]+1.5,o.hipL[1]-1.5,o.hipL[0]+1.55,o.hipL[1]+1.0); g.lineTo(o.hipR[0]-1.55,o.hipR[1]+1.0);
    g.quadraticCurveTo(o.hipR[0]-1.5,o.hipR[1]-1.5,wR[0]-0.2,wR[1]); g.quadraticCurveTo(wR[0]-0.8,wR[1]-2,o.Rs[0]-0.7,o.Rs[1]+3.2);
    g.quadraticCurveTo(o.Rs[0]-1.4,o.Rs[1]+1.2,o.Rs[0],o.Rs[1]-0.6); g.closePath(); };
  const tAxis=[o.Rs[0]-2,o.Rs[1]-2,o.hipL[0]+2,o.hipL[1]+2];
  group(g,S,[{path:torso, col:L.shirt, axis:tAxis}]);
  g.save(); g.beginPath(); torso(g); g.clip();
  const bL=mid(wL,o.hipL,0.45), bR=mid(wR,o.hipR,0.45);
  g.fillStyle=L.pants; g.beginPath(); g.moveTo(bR[0]-6,bR[1]); g.lineTo(bL[0]+6,bL[1]); g.lineTo(bL[0]+6,bL[1]+12); g.lineTo(bR[0]-6,bR[1]+12); g.fill();
  g.strokeStyle='#2a2420'; g.lineWidth=0.9; g.beginPath(); g.moveTo(bR[0]-6,bR[1]); g.lineTo(bL[0]+6,bL[1]); g.stroke();
  g.fillStyle='#bfa25a'; const bc=mid(bR,bL,0.5); g.fillRect(bc[0]-0.6,bc[1]-0.5,1.2,1);
  if(L.shirt2){ [0.3,0.42].forEach((t,i)=>{ const a=mid(o.Rs,o.hipR,t), b=mid(o.Ls,o.hipL,t); g.strokeStyle=L.shirt2; g.lineWidth=i?0.6:1.3; g.beginPath(); g.moveTo(a[0]-4,a[1]); g.lineTo(b[0]+4,b[1]); g.stroke(); }); }
  // placket and collar
  const nk=o.neck; g.strokeStyle=shadeHex(L.shirt,-0.25); g.lineWidth=0.35; g.beginPath(); g.moveTo(nk[0],nk[1]+1.2); g.lineTo(nk[0]+0.2,nk[1]+4.6); g.stroke();
  const gr=g.createLinearGradient(tAxis[0],tAxis[1],tAxis[2],tAxis[3]); gr.addColorStop(0,`rgba(255,255,255,${S.light*0.6})`); gr.addColorStop(0.5,'rgba(255,255,255,0)'); gr.addColorStop(1,`rgba(0,0,0,${S.dark*0.7})`); g.fillStyle=gr; g.fillRect(-60,-80,120,100);
  g.restore();
  if(S.outline){ g.strokeStyle=S.olc; g.lineWidth=S.outline*1.2; g.beginPath(); torso(g); g.stroke(); }
  // legs go over the bottom of the torso so the hips read as pants, not a box
  const hipDown=h=>[h[0],h[1]+1.2];
  group(g,S,leg(hipDown(o.hipR),o.kneeR,o.ankR,far(L.pants))); group(g,S,shoeP(o.ankR,o.toeR,shoe));
  group(g,S,leg(hipDown(o.hipL),o.kneeL,o.ankL,L.pants)); group(g,S,shoeP(o.ankL,o.toeL,shoe));
  g.fillStyle=shadeHex(L.shirt,0.14); g.beginPath(); g.moveTo(nk[0]-2.0,nk[1]+0.3); g.lineTo(nk[0],nk[1]+2.0); g.lineTo(nk[0]+2.0,nk[1]+0.3); g.lineTo(nk[0]+1.2,nk[1]-0.5); g.lineTo(nk[0],nk[1]+0.9); g.lineTo(nk[0]-1.2,nk[1]-0.5); g.closePath(); g.fill();
  // head: yaw turns the face toward the target, roll tilts it
  const hc=o.head, yaw=o.yaw, ro=o.roll, cs=Math.cos(ro), sn=Math.sin(ro), R=(x,y)=>[hc[0]+x*cs-y*sn, hc[1]+x*sn+y*cs];
  const headPath=g=>g.ellipse(hc[0],hc[1],2.75-Math.abs(yaw)*0.25,3.2,ro,0,7);
  group(g,S,[{path:g=>capsule(g,nk,[hc[0],hc[1]+1.6],1.3,1.2), col:L.skin, axis:across(nk,hc,1.3)},{path:headPath, col:L.skin, axis:[hc[0]-2.5,hc[1]-2.5,hc[0]+2.5,hc[1]+2.5]}]);
  const hair=L.hair||'#3a2a1e';
  g.save(); g.beginPath(); headPath(g); g.clip();
  g.fillStyle=hair; const hb=R(-yaw*1.8,-2.6); g.beginPath(); g.ellipse(hb[0],hb[1],3.2,1.6,ro,0,7); g.fill();
  if(yaw>0.4){ const back=R(-2.4,-0.6); g.beginPath(); g.ellipse(back[0],back[1],1.4,2.8,ro,0,7); g.fill(); }
  g.restore();
  // face
  const ex=yaw*1.7;
  g.fillStyle='#1d1612';
  const eyes=yaw>0.55?[[ex+0.9,-0.1]]:[[ex-1.0,-0.1],[ex+1.0,-0.1]];
  eyes.forEach(([x,y])=>{ const p=R(x,y); g.beginPath(); g.arc(p[0],p[1],0.3,0,7); g.fill(); });
  const nose=R(ex+(yaw>0.55?1.6:0),0.9); g.fillStyle=shadeHex(L.skin,-0.12); g.beginPath(); g.ellipse(nose[0],nose[1],0.4,0.55,ro,0,7); g.fill();
  const mouth=R(ex*0.9+(yaw>0.55?0.9:0),1.9); g.strokeStyle=shadeHex(L.skin,-0.35); g.lineWidth=0.3; g.beginPath(); g.moveTo(mouth[0]-0.7,mouth[1]); g.lineTo(mouth[0]+0.7,mouth[1]); g.stroke();
  // hat: crown plus a brim seen from the front, swinging to the side as he turns
  const hat=L.hat, hcol=L.hatC;
  if(hat==='cap'||hat==='visor'){
    if(hat==='cap') group(g,S,[{path:g=>{ g.save(); g.translate(hc[0],hc[1]); g.rotate(ro); g.moveTo(-2.95,-0.9); g.quadraticCurveTo(-2.9,-4.2,0,-4.2); g.quadraticCurveTo(2.9,-4.2,2.95,-0.9); g.closePath(); g.restore(); }, col:hcol, axis:[hc[0]-2,hc[1]-4,hc[0]+2,hc[1]-1]}]);
    else group(g,S,[{path:g=>{ g.save(); g.translate(hc[0],hc[1]); g.rotate(ro); g.rect(-2.9,-2.4,5.8,1.25); g.restore(); }, col:hcol, axis:[hc[0],hc[1]-3,hc[0],hc[1]-1]}]);
    group(g,S,[{path:g=>{ g.save(); g.translate(hc[0],hc[1]); g.rotate(ro); const bx=yaw*2.6, w=3.3-yaw*1.4;
      g.moveTo(bx-w,-1.2); g.quadraticCurveTo(bx,0.2,bx+w+yaw*1.4,-1.2); g.quadraticCurveTo(bx,-1.9,bx-w,-1.2); g.closePath(); g.restore(); }, col:shadeHex(hcol,-0.1), axis:[hc[0],hc[1]-2,hc[0],hc[1]]}]);
  } else if(hat==='bucket'){
    group(g,S,[{path:g=>{ g.save(); g.translate(hc[0],hc[1]); g.rotate(ro); g.moveTo(-4.4,-0.5); g.quadraticCurveTo(0,0.6,4.4,-0.5); g.lineTo(2.7,-1.6); g.quadraticCurveTo(2.5,-4.6,0,-4.6); g.quadraticCurveTo(-2.5,-4.6,-2.7,-1.6); g.closePath(); g.restore(); }, col:hcol, axis:[hc[0]-3,hc[1]-4,hc[0]+3,hc[1]]}]);
  }
  // arms: whichever arm crosses in front is drawn last
  const sleeve=(sh,el)=>mid(sh,el,0.55);
  const arm=(sh,el,hand,shirtCol,skin,glove)=>[
    {path:g=>capsule(g,el,hand,1.05,0.82), col:skin, axis:across(el,hand,1.05)},
    {path:g=>capsule(g,sh,el,1.35,1.1), col:skin, axis:across(sh,el,1.35)},
    {path:g=>capsule(g,sh,sleeve(sh,el),1.7,1.45), col:shirtCol, axis:across(sh,el,1.7)},
    {path:g=>g.ellipse(hand[0],hand[1],1.3,1.1,0,0,7), col:glove||skin, axis:[hand[0]-1,hand[1]-1,hand[0]+1,hand[1]+1]}];
  const leadArm=()=>{ group(g,S,arm(o.Ls,o.Le,o.H,L.shirt,L.skin,'#f4f4f0')); if(L.watch){ const w=mid(o.Le,o.H,0.78); g.fillStyle='#e2b93b'; g.beginPath(); g.arc(w[0],w[1],0.7,0,7); g.fill(); } };
  const trailArm=()=>group(g,S,arm(o.Rs,o.Re,o.H2||o.H,L.shirt,L.skin,null));
  if(!o.clubBehind) drawClub();
  if(o.front==='lead'){ trailArm(); leadArm(); } else { leadArm(); trailArm(); }
}
/* Swing states. b is the backswing amount (0..1.1, like the drag power), u and e run 0..1 */
const F_TOP=150;
function stBack(b, clubI=1){
  if(clubI===3){ const phi=18*b; return {phi, psi:phi, turn:0, shift:0, rise:0}; }
  const phi=F_TOP*b; return {phi, psi:backPsi(phi), turn:Math.min(1.06,b), shift:-0.7*Math.min(1,b), rise:0};
}
// downswing: the hands fall like a pendulum (slow at the top, fastest at the bottom) and the club whips through late
function stDown(b, u, clubI=1){
  if(clubI===3){ const p0=18*b, phi=p0*Math.cos(Math.PI/2*u); return {phi, psi:phi, turn:0, shift:0, rise:0}; }
  const p0=F_TOP*b, h0=backPsi(p0)-p0, phi=-6+(p0+6)*Math.cos(Math.PI/2*u), h=8+(h0-8)*(1-u**2.2), bb=Math.min(1,b);
  return {phi, psi:phi+h, turn:bb*((phi+6)/(p0+6))-0.2*u, shift:-0.7*bb+(1.4*Math.sqrt(bb)+0.7*bb)*u**0.7, rise:0};
}
// follow-through: the club passes the hands, then everything decelerates into a balanced finish
function stThrough(b, v, clubI=1){
  const e=1-(1-v)**2.2;
  if(clubI===3){ const f=18*Math.max(0.4,b)*0.9, phi=-f*e; return {phi, psi:phi, turn:0, shift:0, rise:0}; }
  const f=0.3+0.7*Math.min(1,b), sh0=1.4*Math.sqrt(Math.min(1,b));
  return {phi:-6-149*f*e, psi:2-292*f*e**0.75, turn:-0.2-0.8*f*e, shift:sh0+0.9*f*e, rise:f*e};
}
// in the game the downswing is quick so the strike lines up with the ball taking off
const F_DOWN=0.2, F_THRU=0.36;
// a released swing: t seconds after letting go
function releaseF(b, t, clubI=1){
  const putt=clubI===3, dn=putt?0.24:F_DOWN, th=putt?0.42:F_THRU; t=Math.max(0,t);
  if(t<dn) return {s:stDown(b,t/dn,clubI), phase:'down', hit:false};
  const v=Math.min(1,(t-dn)/th); return {s:stThrough(b,v,clubI), phase:v<1?'through':'finish', hit:true, v};
}
// auto loop for the preview: address, a smooth takeaway, a beat at the top, the strike, hold the finish, reset
function swingF(t, clubI=1){
  const AD=0.7, BK=1.05, TP=0.14, DN=F_DOWN, TH=F_THRU, FI=0.9, RS=0.6, total=AD+BK+TP+DN+TH+FI+RS;
  let u=t%total;
  if(u<AD) return {pose:rigF(stBack(0,clubI),clubI), phase:'address'}; u-=AD;
  if(u<BK){ const f=u/BK, b=(1-Math.cos(Math.PI*f))/2; return {pose:rigF(stBack(b,clubI),clubI), phase:'back', b}; } u-=BK;
  if(u<TP) return {pose:rigF(stBack(1,clubI),clubI), phase:'top', b:1}; u-=TP;
  if(u<DN+TH+FI){ const r=releaseF(1,u,clubI); return {pose:rigF(r.s,clubI), phase:r.phase, hit:r.hit, v:r.v}; } u-=DN+TH+FI;
  const f=u/RS, k=f<0.5?2*f*f:1-2*(1-f)*(1-f);
  return {pose:lerpF(rigF(stThrough(1,1,clubI),clubI), rigF(stBack(0,clubI),clubI), k), phase:'reset', hit:true};
}

/* ---------- In the game ---------- */
const G_A0=0;   // address: no backswing
const G_STYLE='clean';
const F_BALLS=[]; function ballSpot(ci){ return F_BALLS[ci]||(F_BALLS[ci]=fBall(ci)); }
let gpos=null;
// cur is the backswing amount (follows the aim drag), from is where the downswing started, t is time since the shot
const swing={phase:'address', t:0, from:0, to:0, cur:G_A0, side:1, putt:false};
const artClub=()=>Math.max(0,Math.min(3,clubIdx|0));
const downTime=ci=>ci===3?0.24:F_DOWN;
// the ball waits for the clubhead to arrive
function swingHolding(){ return swing.phase==='down' && swing.t<downTime(artClub()); }
function updateSwing(dt){
  if(swing.phase==='down'){ swing.t+=dt; const ci=artClub(); if(swing.t>downTime(ci)+(ci===3?0.42:F_THRU)) swing.phase='finish'; return; }
  if(swing.phase==='finish'){ swing.t+=dt; return; }
  let target=0;
  if(state==='ready' && aim){ const a=aimInfo(); if(a) target=Math.min(1.1,a.p); }
  swing.cur+=(target-swing.cur)*(1-Math.exp(-dt*14));
}
function updateSide(){
  if(!gpos || swing.phase!=='address') return;
  let dx;
  const a=state==='ready'?aimInfo():null;
  if(a) dx=a.dx; else { const d=Math.hypot(hole.cup.x-gpos.x,hole.cup.y-gpos.y)||1; dx=(hole.cup.x-gpos.x)/d; }
  if(swing.side===1 && dx<-0.3) swing.side=-1; else if(swing.side===-1 && dx>0.3) swing.side=1;
}
function swingPoseNow(ci){
  if(swing.phase==='down'||swing.phase==='finish') return rigF(releaseF(swing.from, swing.t, ci).s, ci);
  return rigF(stBack(swing.cur, ci), ci);
}
// the swoosh: the clubhead's path over the last eighth of a second
function drawSwoosh(g, at, w){
  const pts=[]; for(let k=0;k<=24;k++){ const c=at(k*0.0055); if(!c) break; pts.push(c); }
  for(let i=1;i<pts.length;i++){ const k=1-i/25; g.strokeStyle=`rgba(255,255,255,${(0.6*k).toFixed(3)})`; g.lineWidth=(2.4*k+0.3)*w; g.beginPath(); g.moveTo(pts[i-1][0],pts[i-1][1]); g.lineTo(pts[i][0],pts[i][1]); g.stroke(); }
}
function drawGolferWorld(z){
  if(!gpos) return;
  const s=Math.max(1,22/(40*z)), side=swing.side, ci=artClub(), FB=ballSpot(ci);
  ctx.save(); ctx.translate(gpos.x-FB[0]*side*s, gpos.y-FB[1]*s); ctx.scale(side*s,s);
  drawGolferF(ctx, swingPoseNow(ci), lookColors(), G_STYLE, ci);
  if(swing.phase==='down'||swing.phase==='finish'){ const from=swing.from, t=swing.t; ctx.lineCap='round';
    drawSwoosh(ctx, dt=>{ if(t-dt<0) return null; const q=releaseF(from, t-dt, ci); return q.phase==='finish'?null:rigF(q.s,ci).C; }, 1); }
  ctx.restore();
}
// Golfer tab: a practice swing with the driver on a loop
function drawPreview(){
  const c=document.getElementById('gprev'); if(!c) return;
  const g=c.getContext('2d'), W=c.width, H=c.height; g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H);
  const t=time*0.9, r=swingF(t,0), FB=ballSpot(0), sc=H/62; g.setTransform(sc,0,0,sc,W*0.42,H*0.84);
  if(!r.hit){ const col=colorDef(); const bg=g.createRadialGradient(FB[0]-0.4,FB[1]-0.4,0.1,FB[0],FB[1],1.3); bg.addColorStop(0,col.c1); bg.addColorStop(1,col.c2);
    g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(FB[0]+0.5,FB[1]+0.6,1.1,0.6,0,0,7); g.fill(); g.fillStyle=bg; g.beginPath(); g.arc(FB[0],FB[1],1.1,0,7); g.fill(); }
  drawGolferF(g, r.pose, lookColors(), G_STYLE, 0);
  g.lineCap='round'; drawSwoosh(g, dt=>{ const q=swingF(t-dt*0.9,0); return (q.phase==='down'||q.phase==='through')?q.pose.C:null; }, 1);
}
