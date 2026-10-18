/* Fairway Tour · The golfer: a 3D body and pendulum swing, drawn from the side on the course and face-on in the Golfer tab */
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

/* 3D golfer. X points at the target, Y is down (negative is up), Z is the way he faces at address (toward the ball).
   Right-handed: his lead (left) side is +X. A lefty is the mirror image, drawn flipped on screen.
   The swing is a pendulum: the hands ride a circle in a tilted plane around his sternum (angle phi), and the club
   hangs off the hands in a flatter plane (angle psi). Both angles are 0 at address and grow on the way back. */
const D2R=Math.PI/180;
const v3={
  add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], mul:(a,k)=>[a[0]*k,a[1]*k,a[2]*k],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  len:a=>Math.hypot(a[0],a[1],a[2]), norm:a=>{ const l=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/l,a[1]/l,a[2]/l]; },
  lerp:(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],
  // rotate v around the unit axis u (Rodrigues)
  rot:(v,u,a)=>{ const c=Math.cos(a), s=Math.sin(a), d=v3.dot(u,v), x=v3.cross(u,v); return [v[0]*c+x[0]*s+u[0]*d*(1-c), v[1]*c+x[1]*s+u[1]*d*(1-c), v[2]*c+x[2]*s+u[2]*d*(1-c)]; },
};
const G3_ARM=[7.2,7.0], G3_CLUB=[23,20,19,17.5], G3_UP=[0,-1,0], G3_X=[1,0,0];
// two-bone reach in 3D: the elbow (or knee) bends toward the pole
function bend3(a, b, l1, l2, pole){
  const d=v3.sub(b,a), dl=v3.len(d)||0.001, dd=Math.min(dl,l1+l2-0.02), ud=v3.mul(d,1/dl);
  const along=(l1*l1-l2*l2+dd*dd)/(2*dd), perp=Math.sqrt(Math.max(0,l1*l1-along*along));
  let p=v3.sub(pole, v3.mul(ud, v3.dot(pole,ud))); if(v3.len(p)<1e-3) p=[0,0,1]; p=v3.norm(p);
  return v3.add(a, v3.add(v3.mul(ud,along), v3.mul(p,perp)));
}
const G3_AC=[];
// club plane angle per club, set so the clubhead rests on the ground at address
function clubPlane(ci){ if(G3_AC[ci]===undefined){ G3_AC[ci]=0.6; const p=rig3(stBack(0,ci),ci), drop=-p.H[1]-0.5; G3_AC[ci]=Math.acos(Math.min(0.97,drop/(G3_CLUB[ci]||20))); } return G3_AC[ci]; }
function rig3(s, ci=1){
  const putt=ci===3, Lc=G3_CLUB[ci]||20, crouch=putt?1.6:ci===2?0.7:ci===1?0.35:0;
  const tu=s.turn||0, fw=Math.max(0,-tu), bk=Math.max(0,tu), sh=s.shift||0, up=s.rise||0;
  const heel=Math.max(0,(fw-0.35)/0.65), st=putt?2.5:ci===0?4.3:3.8;
  // feet point at the ball; the trail heel comes up late and the foot turns onto its toe
  const ankL=[st,-1.1,0], toeL=[st+0.8,0.1,2.6];
  const ankR=[-st+heel*2.6,-1.1-heel*2.2,heel*0.6], toeR=[-st-0.6+heel*3.6,0.1,2.6-heel*1.2];
  // pelvis: slides toward the target, turns about half as much as the shoulders
  const c=[sh, -16.9+crouch*0.6-up*1.0, -1.3+up*0.9];
  const bh=(tu>=0?42:82)*tu*D2R, lh=v3.rot(G3_X,G3_UP,bh), hw=2.15;
  const hipL=v3.add(c,v3.mul(lh,hw)), hipR=v3.sub(c,v3.mul(lh,hw));
  const kneeL=v3.add(v3.lerp(hipL,ankL,0.5),[-bk*1.5+fw*0.2, 0.2, 2.1*(1-fw*0.75)]);
  const kneeR=v3.add(v3.lerp(hipR,ankR,0.5),[fw*2.3-bk*0.2, 0.3+fw*0.3, 2.1+fw*0.5]);
  // spine: bent toward the ball, leaning a touch away from the target; standing up in the finish
  const al=(putt?40:35)*(1-up*0.75)*D2R, ga=(-8+fw*9)*D2R;
  const u=v3.norm([Math.sin(ga), -Math.cos(al)*Math.cos(ga), Math.sin(al)*Math.cos(ga)]);
  const S=v3.add(c, v3.mul(u,13.0));
  const l0=v3.norm(v3.sub(G3_X, v3.mul(u, v3.dot(u,G3_X))));
  // shoulders turn around the tilted spine, which is what makes the lead shoulder dip at the top
  const bs=(tu>=0?95:108)*tu*D2R, ls=v3.rot(l0,u,bs), n=v3.cross(u,ls);
  const Ls=v3.add(S,v3.mul(ls,4.3)), Rs=v3.sub(S,v3.mul(ls,4.3));
  const neck=v3.add(v3.add(S,v3.mul(u,1.5)),[0,-0.5,0]), head=v3.add(v3.add(v3.add(S,v3.mul(u,4.0)),v3.mul(n,0.7)),[0,-1.8,0]);
  // eyes on the ball until after impact, then the head turns to watch it fly
  const ballAt=[1.5,-1,14], look=Math.max(0,(fw-0.25)/0.75);
  const tb=v3.sub(ballAt,head); tb[0]*=0.45; // eyes on the ball with only a slight turn of the head
  const F=v3.norm(v3.lerp(v3.norm(tb), v3.norm([1,-0.12,0.25]), look));
  // hands on the pendulum, the lead arm kept straight
  const P=v3.add(v3.add(S,v3.mul(n,0.9)),v3.mul(u,-1.2));
  const ah=22*D2R, Dh=[0,Math.cos(ah),Math.sin(ah)], ph=s.phi*D2R, ps=s.psi*D2R, R=putt?11.4:12.0;
  let H=v3.add(P, v3.add(v3.mul(G3_X,-Math.sin(ph)*R), v3.mul(Dh,Math.cos(ph)*R)));
  const reach=(o,h,L)=>{ const d=v3.sub(h,o), dl=v3.len(d); return dl>L ? v3.add(o,v3.mul(d,L/dl)) : h; };
  H=reach(Ls,H,14.1); if(s.phi<0) H=reach(Rs,H,14.1);
  const ac=G3_AC[ci]!==undefined?G3_AC[ci]:clubPlane(ci), Dc=[0,Math.cos(ac),Math.sin(ac)];
  // past about 240 degrees through, the club leaves the plane and wraps behind his neck
  const wrap=Math.max(0,Math.min(1,(-s.psi-235)/60));
  const cd=v3.norm(v3.add(v3.add(v3.mul(G3_X,-Math.sin(ps)), v3.mul(Dc,Math.cos(ps))),[0,0,-1.5*wrap]));
  const C=v3.add(H,v3.mul(cd,Lc)), H2=v3.add(H,v3.mul(cd,1.5));
  const Le=bend3(Ls,H,G3_ARM[0],G3_ARM[1],[0.15,1,-0.1]), Re=bend3(Rs,H2,G3_ARM[0],G3_ARM[1],[-0.15,1,-0.1]);
  return {hipL,hipR,kneeL,kneeR,ankL,ankR,toeL,toeR,Ls,Rs,Le,Re,H,H2,C,neck,head,S,c,u,ls,lh,n,F};
}
const G3_KEYS=['hipL','hipR','kneeL','kneeR','ankL','ankR','toeL','toeR','Ls','Rs','Le','Re','H','H2','C','neck','head','S','c','u','ls','lh','n','F'];
function lerp3(a, b, t){ const o={}; for(const k of G3_KEYS) o[k]=v3.lerp(a[k],b[k],t); o.u=v3.norm(o.u); o.ls=v3.norm(o.ls); o.lh=v3.norm(o.lh); o.n=v3.norm(o.n); o.F=v3.norm(o.F); return o; }
// where the ball sits for a club
const G3_BALL=[]; function ball3(ci=1){ return G3_BALL[ci]||(G3_BALL[ci]=(()=>{ const p=rig3(stBack(0,ci),ci); return [p.C[0]+0.4,-1.0,p.C[2]]; })()); }

/* ---------- Camera ---------- yaw 0 is face-on (Golfer tab), yaw 90 is from his trail side (on the course) */
function view3(yaw, pitch){ const a=yaw*D2R, p=pitch*D2R; return {r:[Math.cos(a),0,Math.sin(a)], t:[-Math.sin(a),0,Math.cos(a)], cp:Math.cos(p), sp:Math.sin(p)}; }
const pr3=(V,v)=>[v3.dot(v,V.r), v[1]*V.cp+v3.dot(v,V.t)*V.sp];
const dp3=(V,v)=>v3.dot(v,V.t)*V.cp-v[1]*V.sp;
// left and right screen edges of a horizontal body slice (shoulders, waist, hips). The slice keeps the body's depth when
// seen from the side, and lies across the spine so a bent torso stays one solid shape.
function slice3(V, ctr, lat, nrm, W, D, spine2){
  const c=pr3(V,ctr), a=pr3(V,v3.add(ctr,v3.mul(lat,W))), b=pr3(V,v3.sub(ctr,v3.mul(lat,W)));
  const half=Math.max(0.6,Math.hypot(W*v3.dot(lat,V.r), D*v3.dot(nrm,V.r)));
  let lx=a[0]-b[0], ly=a[1]-b[1]; if(lx<0){ lx=-lx; ly=-ly; } const ll=Math.hypot(lx,ly)||1;
  let px=-spine2[1], py=spine2[0]; if(px<0){ px=-px; py=-py; }
  const k=Math.max(0,Math.min(1,(ll/(2*W)-0.3)/0.4)), dx=px+(lx/ll-px)*k, dy=py+(ly/ll-py)*k, dl=Math.hypot(dx,dy)||1;
  const ux=dx/dl*half, uy=dy/dl*half;
  return {c, R:[c[0]+ux, c[1]+uy], L:[c[0]-ux, c[1]-uy]};
}
function drawGolfer3(g, P3, V, L, styleName, ci=0){
  const S=GSTYLE[styleName]||GSTYLE.clean, p=k=>pr3(V,P3[k]), d=k=>dp3(V,P3[k]);
  const mid=(a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
  g.lineJoin='round'; g.lineCap='round';
  { const sc=pr3(V,[0,0,1.6]); g.fillStyle='rgba(0,0,0,.24)'; g.beginPath(); g.ellipse(sc[0],sc[1],9.5,1.4+6.5*V.sp,0,0,7); g.fill(); }
  const far=k=>shadeHex(k,-0.16), shoe='#22272b', sole='#e9e6dd';
  // ---- body: torso, then legs (far one first) over the bottom of the torso
  const body=()=>{
    const wc=v3.lerp(P3.c,P3.S,0.4), wl=v3.norm(v3.lerp(P3.lh,P3.ls,0.4)), wn=v3.norm(v3.lerp(v3.cross(G3_UP,P3.lh),P3.n,0.4));
    const s0=pr3(V,P3.c), s1=pr3(V,P3.S), sl=Math.hypot(s1[0]-s0[0],s1[1]-s0[1])||1, sp2=[(s1[0]-s0[0])/sl,(s1[1]-s0[1])/sl];
    const sS=slice3(V,P3.S,P3.ls,P3.n,4.6,3.3,sp2), sW=slice3(V,wc,wl,wn,3.75,2.9,sp2), sH=slice3(V,P3.c,P3.lh,v3.cross(G3_UP,P3.lh),3.75,3.3,sp2);
    // the torso outline is laid out along the spine, so it bends with him
    const ax=-sp2[0], ay=-sp2[1]; // "down" the torso, from shoulders to hips
    const Q=(sl,side,out,down)=>{ const e=side>0?sl.R:sl.L, ex=e[0]-sl.c[0], ey=e[1]-sl.c[1], el=Math.hypot(ex,ey)||1, k=1+out/el; return [sl.c[0]+ex*k+ax*down, sl.c[1]+ey*k+ay*down]; };
    const torso=g=>{ const a=Q(sS,-1,-0.5,-0.4), b=Q(sS,1,-0.5,-0.4), top=[sS.c[0]-ax*1.5, sS.c[1]-ay*1.5];
      g.moveTo(a[0],a[1]); g.quadraticCurveTo(top[0],top[1],b[0],b[1]);
      let c1=Q(sS,1,0.5,0.6), c2=Q(sS,1,0.1,2.6); g.quadraticCurveTo(c1[0],c1[1],c2[0],c2[1]);
      c1=Q(sW,1,0.3,-1.5); c2=Q(sW,1,0,0); g.quadraticCurveTo(c1[0],c1[1],c2[0],c2[1]);
      c1=Q(sH,1,0.1,-1.2); c2=Q(sH,1,0,1.0); g.quadraticCurveTo(c1[0],c1[1],c2[0],c2[1]);
      c2=Q(sH,-1,0,1.0); g.lineTo(c2[0],c2[1]);
      c1=Q(sH,-1,0.1,-1.2); c2=Q(sW,-1,0,0); g.quadraticCurveTo(c1[0],c1[1],c2[0],c2[1]);
      c1=Q(sW,-1,0.3,-1.5); c2=Q(sS,-1,0.1,2.6); g.quadraticCurveTo(c1[0],c1[1],c2[0],c2[1]);
      c1=Q(sS,-1,0.5,0.6); g.quadraticCurveTo(c1[0],c1[1],a[0],a[1]); g.closePath(); };
    const tAxis=[sS.c[0]-3,sS.c[1]-3,sH.c[0]+3,sH.c[1]+3];
    group(g,S,[{path:torso, col:L.shirt, axis:tAxis}]);
    g.save(); g.beginPath(); torso(g); g.clip();
    const bL=mid(sW.L,sH.L,0.45), bR=mid(sW.R,sH.R,0.45), bx=bR[0]-bL[0], by=bR[1]-bL[1], bl=Math.hypot(bx,by)||1, ex=bx/bl*6, ey=by/bl*6;
    g.fillStyle=L.pants; g.beginPath(); g.moveTo(bL[0]-ex,bL[1]-ey); g.lineTo(bR[0]+ex,bR[1]+ey); g.lineTo(bR[0]+ex+ax*14,bR[1]+ey+ay*14); g.lineTo(bL[0]-ex+ax*14,bL[1]-ey+ay*14); g.fill();
    g.strokeStyle='#2a2420'; g.lineWidth=0.9; g.beginPath(); g.moveTo(bL[0]-ex,bL[1]-ey); g.lineTo(bR[0]+ex,bR[1]+ey); g.stroke();
    const facing=v3.dot(P3.n,V.t);
    if(facing>0.15){ g.fillStyle='#bfa25a'; const bc=mid(bL,bR,0.5+v3.dot(P3.lh,V.r)*0); g.fillRect(bc[0]-0.6,bc[1]-0.5,1.2,1); }
    if(L.shirt2){ [0.3,0.42].forEach((t,i)=>{ const a=mid(sS.L,sH.L,t), b=mid(sS.R,sH.R,t), dx=b[0]-a[0], dy=b[1]-a[1], dl=Math.hypot(dx,dy)||1; g.strokeStyle=L.shirt2; g.lineWidth=i?0.6:1.3; g.beginPath(); g.moveTo(a[0]-dx/dl*4,a[1]-dy/dl*4); g.lineTo(b[0]+dx/dl*4,b[1]+dy/dl*4); g.stroke(); }); }
    if(facing>0.2){ const a=pr3(V,v3.add(P3.neck,v3.mul(P3.n,0.9))), b=pr3(V,v3.add(v3.add(P3.neck,v3.mul(P3.n,1.2)),v3.mul(P3.u,-4.2)));
      g.strokeStyle=shadeHex(L.shirt,-0.25); g.lineWidth=0.35; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
    const gr=g.createLinearGradient(tAxis[0],tAxis[1],tAxis[2],tAxis[3]); gr.addColorStop(0,`rgba(255,255,255,${S.light*0.6})`); gr.addColorStop(0.5,'rgba(255,255,255,0)'); gr.addColorStop(1,`rgba(0,0,0,${S.dark*0.7})`); g.fillStyle=gr; g.fillRect(-80,-90,160,110);
    g.restore();
    if(S.outline){ g.strokeStyle=S.olc; g.lineWidth=S.outline*1.2; g.beginPath(); torso(g); g.stroke(); }
    const leg=(hip,knee,ank,col)=>[{path:g=>capsule(g,hip,knee,1.6,1.25), col, axis:across(hip,knee,1.6)},{path:g=>capsule(g,knee,ank,1.42,1.0), col, axis:across(knee,ank,1.4)}];
    const shoeP=(ank,toe,col)=>{ const dx=toe[0]-ank[0], dy=toe[1]-ank[1], ln=Math.max(1.4,Math.hypot(dx,dy)*0.6), a=Math.atan2(dy,dx), aa=Math.abs(dx)>Math.abs(dy)?a:a*0.5;
      return [{path:g=>g.ellipse(ank[0]+dx*0.55, ank[1]+dy*0.55+0.4, ln, 1.2, aa, 0, 7), col, axis:[ank[0],ank[1]-1,ank[0],ank[1]+1.6]},
        {path:g=>g.ellipse(ank[0]+dx*0.55, ank[1]+dy*0.55+1.35, ln*0.95, 0.35, aa, 0, 7), col:sole, noShade:true}]; };
    const hd=h=>{ const q=pr3(V,v3.add(h,[0,1.2,0])); return q; };
    const legs=[['hipL','kneeL','ankL','toeL'],['hipR','kneeR','ankR','toeR']].map(k=>({k, dep:(d(k[1])+d(k[2]))/2}));
    legs.sort((a,b)=>a.dep-b.dep);
    legs.forEach((lg,i)=>{ const [h,k,a,t]=lg.k, col=i===0&&legs.length>1&&Math.abs(legs[0].dep-legs[1].dep)>0.6?far(L.pants):L.pants;
      group(g,S,leg(hd(P3[h]),p(k),p(a),col)); group(g,S,shoeP(p(a),p(t),shoe)); });
    // collar
    const nk=p('neck');
    if(facing>-0.1){ g.fillStyle=shadeHex(L.shirt,0.14); g.beginPath(); g.moveTo(nk[0]-2.0,nk[1]+0.3); g.lineTo(nk[0],nk[1]+2.0); g.lineTo(nk[0]+2.0,nk[1]+0.3); g.lineTo(nk[0]+1.2,nk[1]-0.5); g.lineTo(nk[0],nk[1]+0.9); g.lineTo(nk[0]-1.2,nk[1]-0.5); g.closePath(); g.fill(); }
    else { g.fillStyle=shadeHex(L.shirt,0.1); g.beginPath(); g.ellipse(nk[0],nk[1]+0.4,2.1,0.9,0,0,7); g.fill(); }
  };
  // ---- head: the face follows where he is looking, the cap brim points the same way
  const headDraw=()=>{
    // the face turns with where he looks across the ground; looking down only lowers the eyes
    const hc=p('head'), nk=p('neck'), F=P3.F, Fh=v3.norm([F[0],0,F[2]]), fr=v3.dot(Fh,V.r), fc=v3.dot(Fh,V.t), fd=Math.max(0,F[1]);
    const ro=Math.max(-0.5,Math.min(0.5,Math.atan2(hc[0]-nk[0], nk[1]-hc[1])*0.6)), cs=Math.cos(ro), sn=Math.sin(ro), R=(x,y)=>[hc[0]+x*cs-y*sn, hc[1]+x*sn+y*cs];
    const af=Math.abs(fr), sg=fr<0?-1:1;
    const headPath=g=>g.ellipse(hc[0],hc[1],2.75-af*0.2,3.2,ro,0,7);
    group(g,S,[{path:g=>capsule(g,nk,mid(nk,hc,0.6),1.3,1.2), col:L.skin, axis:across(nk,hc,1.3)},{path:headPath, col:L.skin, axis:[hc[0]-2.5,hc[1]-2.5,hc[0]+2.5,hc[1]+2.5]}]);
    const hair=L.hair||'#3a2a1e';
    g.save(); g.beginPath(); headPath(g); g.clip(); g.fillStyle=hair;
    if(fc<-0.55){ const q=R(-fr*0.6,-0.6); g.beginPath(); g.ellipse(q[0],q[1],3.0,2.9,ro,0,7); g.fill(); }
    else { const hb=R(-fr*1.8,-2.6); g.beginPath(); g.ellipse(hb[0],hb[1],3.2,1.6,ro,0,7); g.fill();
      if(af>0.4){ const bq=R(-sg*2.4,-0.6); g.beginPath(); g.ellipse(bq[0],bq[1],1.4,2.8,ro,0,7); g.fill(); } }
    g.restore();
    if(fc>=-0.55){ const ex=fr*(af>0.55?1.2:1.7), ey=-0.1+fd*0.7; g.fillStyle='#1d1612';
      const eyes=af>0.55?[[ex+sg*0.55,ey]]:[[ex-1.0,ey],[ex+1.0,ey]];
      eyes.forEach(([x,y])=>{ const q=R(x,y); g.beginPath(); g.arc(q[0],q[1],0.3,0,7); g.fill(); });
      const no=R(ex+(af>0.55?sg*1.35:0),0.9+fd*0.5); g.fillStyle=shadeHex(L.skin,-0.12); g.beginPath(); g.ellipse(no[0],no[1],0.4,0.55,ro,0,7); g.fill();
      const mo=R(ex*0.9+(af>0.55?sg*0.6:0),1.9+fd*0.4); g.strokeStyle=shadeHex(L.skin,-0.35); g.lineWidth=0.3; g.beginPath(); g.moveTo(mo[0]-0.7,mo[1]); g.lineTo(mo[0]+0.7,mo[1]); g.stroke(); }
    const hat=L.hat, hcol=L.hatC;
    const brim=()=>group(g,S,[{path:g=>{ g.save(); g.translate(hc[0],hc[1]); g.rotate(ro); const bx=fr*2.6, w=3.3-af*1.4, lx=bx-w-(fr<0?af*1.6:0), rx=bx+w+(fr>0?af*1.6:0), by=-1.2+fd*0.4;
      g.moveTo(lx,by); g.quadraticCurveTo(bx,by+1.4*Math.max(0.2,fc),rx,by); g.quadraticCurveTo(bx,by-0.7,lx,by); g.closePath(); g.restore(); }, col:shadeHex(hcol,-0.1), axis:[hc[0],hc[1]-2,hc[0],hc[1]]}]);
    if(hat==='cap'||hat==='visor'){
      if(fc<0) brim();
      if(hat==='cap') group(g,S,[{path:g=>{ g.save(); g.translate(hc[0],hc[1]); g.rotate(ro); g.moveTo(-2.95,-0.9); g.quadraticCurveTo(-2.9,-4.2,0,-4.2); g.quadraticCurveTo(2.9,-4.2,2.95,-0.9); g.closePath(); g.restore(); }, col:hcol, axis:[hc[0]-2,hc[1]-4,hc[0]+2,hc[1]-1]}]);
      else group(g,S,[{path:g=>{ g.save(); g.translate(hc[0],hc[1]); g.rotate(ro); g.rect(-2.9,-2.4,5.8,1.25); g.restore(); }, col:hcol, axis:[hc[0],hc[1]-3,hc[0],hc[1]-1]}]);
      if(fc>=0) brim();
    } else if(hat==='bucket'){
      group(g,S,[{path:g=>{ g.save(); g.translate(hc[0],hc[1]); g.rotate(ro); g.moveTo(-4.4,-0.5); g.quadraticCurveTo(0,0.6,4.4,-0.5); g.lineTo(2.7,-1.6); g.quadraticCurveTo(2.5,-4.6,0,-4.6); g.quadraticCurveTo(-2.5,-4.6,-2.7,-1.6); g.closePath(); g.restore(); }, col:hcol, axis:[hc[0]-3,hc[1]-4,hc[0]+3,hc[1]]}]);
    }
  };
  // ---- arms and club
  const sleeve=(sh,el)=>mid(sh,el,0.55);
  const arm=(sh,el,hand,shirtCol,skin,glove)=>[
    {path:g=>capsule(g,el,hand,1.05,0.82), col:skin, axis:across(el,hand,1.05)},
    {path:g=>capsule(g,sh,el,1.35,1.1), col:skin, axis:across(sh,el,1.35)},
    {path:g=>capsule(g,sh,sleeve(sh,el),1.7,1.45), col:shirtCol, axis:across(sh,el,1.7)},
    {path:g=>g.ellipse(hand[0],hand[1],1.3,1.1,0,0,7), col:glove||skin, axis:[hand[0]-1,hand[1]-1,hand[0]+1,hand[1]+1]}];
  const leadArm=()=>{ const le=p('Le'), h=p('H'); group(g,S,arm(p('Ls'),le,h,L.shirt,L.skin,'#f4f4f0')); if(L.watch){ const w=mid(le,h,0.78); g.fillStyle='#e2b93b'; g.beginPath(); g.arc(w[0],w[1],0.7,0,7); g.fill(); } };
  const trailArm=()=>group(g,S,arm(p('Rs'),p('Re'),p('H2'),L.shirt,L.skin,null));
  const club=()=>{ const h=p('H'), c=p('C'), dx=c[0]-h[0], dy=c[1]-h[1], Ls=Math.hypot(dx,dy)||1, ux=dx/Ls, uy=dy/Ls;
    if(S.outline){ g.strokeStyle=S.olc; g.lineWidth=0.75+S.outline*1.4; g.beginPath(); g.moveTo(h[0]-ux*1.2,h[1]-uy*1.2); g.lineTo(c[0],c[1]); g.stroke(); }
    g.strokeStyle='#c9ced2'; g.lineWidth=0.75; g.beginPath(); g.moveTo(h[0],h[1]); g.lineTo(c[0],c[1]); g.stroke();
    g.strokeStyle='#26292c'; g.lineWidth=1.25; g.beginPath(); g.moveTo(h[0]-ux*1.4,h[1]-uy*1.4); g.lineTo(h[0]+ux*2.6,h[1]+uy*2.6); g.stroke();
    const head=ci===0?'#2b2f33':ci===3?'#a9b0b5':'#d9dde0', a=Math.atan2(uy,ux);
    g.save(); g.translate(c[0],c[1]); g.rotate(a); g.fillStyle=head; if(S.outline){ g.strokeStyle=S.olc; g.lineWidth=S.outline; }
    g.beginPath(); if(ci===0) g.ellipse(0.8,0,2.2,1.5,0,0,7); else if(ci===3) g.rect(-0.4,-1.9,1.3,3.8); else { g.moveTo(-0.6,-0.5); g.lineTo(2.0,-1.1); g.lineTo(2.4,1.0); g.lineTo(-0.6,0.8); g.closePath(); }
    g.fill(); if(S.outline) g.stroke(); g.restore(); };
  // painter's order by depth: whatever is closest to the camera is drawn last
  const avg=(...ks)=>ks.reduce((a,k)=>a+d(k),0)/ks.length;
  const bodyDep=dp3(V,v3.lerp(P3.c,P3.S,0.5));
  const items=[
    {f:body, dep:bodyDep},
    {f:headDraw, dep:d('head')+0.3},
    {f:leadArm, dep:avg('Ls','Le','H')},
    {f:trailArm, dep:avg('Rs','Re','H2')},
    {f:club, dep:dp3(V,v3.lerp(P3.H,P3.C,0.35))},
  ];
  items.sort((a,b)=>a.dep-b.dep).forEach(it=>it.f());
}

/* ---------- Swing states ---------- b is the backswing amount (0..1.1, like the drag power); u and v run 0..1 */
const F_BACK=[[0,-6],[30,34],[52,92],[95,182],[150,274],[165,292]];
function backPsi(phi){ const T=F_BACK; if(phi<=T[0][0]) return phi-6; for(let i=1;i<T.length;i++){ if(phi<=T[i][0]){ const f=(phi-T[i-1][0])/(T[i][0]-T[i-1][0]); return T[i-1][1]+(T[i][1]-T[i-1][1])*f; } } return T[T.length-1][1]; }
const F_TOP=150;
function stBack(b, ci=1){
  if(ci===3){ const phi=16*b; return {phi, psi:phi, turn:0, shift:0, rise:0}; }
  const phi=F_TOP*b; return {phi, psi:backPsi(phi), turn:Math.min(1.06,b), shift:-0.7*Math.min(1,b), rise:0};
}
// downswing: the hands fall like a pendulum (slow at the top, fastest at the bottom) and the club whips through late
function stDown(b, u, ci=1){
  if(ci===3){ const p0=16*b, phi=p0*Math.cos(Math.PI/2*u); return {phi, psi:phi, turn:0, shift:0, rise:0}; }
  const p0=F_TOP*b, h0=backPsi(p0)-p0, phi=-6+(p0+6)*Math.cos(Math.PI/2*u), h=8+(h0-8)*(1-u**2.2), bb=Math.min(1,b);
  return {phi, psi:phi+h, turn:bb*((phi+6)/(p0+6))-0.2*u, shift:-0.7*bb+(1.4*Math.sqrt(bb)+0.7*bb)*u**0.7, rise:0};
}
// follow-through: the club passes the hands, then everything slows into a balanced finish
function stThrough(b, v, ci=1){
  const e=1-(1-v)**2.2;
  if(ci===3){ const f=16*Math.max(0.4,b)*0.9, phi=-f*e; return {phi, psi:phi, turn:0, shift:0, rise:0}; }
  const f=0.3+0.7*Math.min(1,b), sh0=1.4*Math.sqrt(Math.min(1,b));
  return {phi:-6-149*f*e, psi:2-307*f*e**0.75, turn:-0.2-0.8*f*e, shift:sh0+0.9*f*e, rise:f*e};
}
// in the game the downswing is quick, and the ball waits for the clubhead
let F_DOWN=0.2, F_THRU=0.36;
// a released swing, t seconds after letting go
function releaseF(b, t, ci=1){
  const putt=ci===3, dn=putt?0.24:F_DOWN, th=putt?0.42:F_THRU; t=Math.max(0,t);
  if(t<dn) return {s:stDown(b,t/dn,ci), phase:'down', hit:false};
  const v=Math.min(1,(t-dn)/th); return {s:stThrough(b,v,ci), phase:v<1?'through':'finish', hit:true, v};
}
// auto loop: address, a smooth takeaway, a beat at the top, the strike, hold the finish, then reset
function swing3(t, ci=1){
  const AD=0.7, BK=1.05, TP=0.14, DN=ci===3?0.3:F_DOWN, TH=ci===3?0.42:F_THRU, FI=0.9, RS=0.6, total=AD+BK+TP+DN+TH+FI+RS;
  let u=((t%total)+total)%total;
  if(u<AD) return {pose:rig3(stBack(0,ci),ci), phase:'address'}; u-=AD;
  if(u<BK){ const f=u/BK, b=(1-Math.cos(Math.PI*f))/2; return {pose:rig3(stBack(b,ci),ci), phase:'back', b}; } u-=BK;
  if(u<TP) return {pose:rig3(stBack(1,ci),ci), phase:'top', b:1}; u-=TP;
  if(u<DN+TH+FI){ const r=releaseF(1,u,ci); return {pose:rig3(r.s,ci), phase:r.phase, hit:r.hit, v:r.v}; } u-=DN+TH+FI;
  const f=u/RS, k=f<0.5?2*f*f:1-2*(1-f)*(1-f);
  return {pose:lerp3(rig3(stThrough(1,1,ci),ci), rig3(stBack(0,ci),ci), k), phase:'reset', hit:true};
}

/* ---------- In the game ---------- */
const G_A0=0;   // address: no backswing
const G_STYLE='clean';
// on the course you stand off his trail shoulder looking up the hole; the Golfer tab shows him face-on
const G_COURSE=view3(90,22), G_FACE=view3(0,6);
const handSign=()=>save.golfer&&save.golfer.hand==='L'?-1:1;
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
function updateSide(){}  // the course view is always from the side now
function swingPoseNow(ci){
  if(swing.phase==='down'||swing.phase==='finish') return rig3(releaseF(swing.from, swing.t, ci).s, ci);
  return rig3(stBack(swing.cur, ci), ci);
}
// the swoosh: the clubhead's path over the last eighth of a second
function drawSwoosh(g, V, at){
  const pts=[]; for(let k=0;k<=24;k++){ const c=at(k*0.0055); if(!c) break; pts.push(pr3(V,c)); }
  g.lineCap='round';
  for(let i=1;i<pts.length;i++){ const k=1-i/25; g.strokeStyle=`rgba(255,255,255,${(0.6*k).toFixed(3)})`; g.lineWidth=2.4*k+0.3; g.beginPath(); g.moveTo(pts[i-1][0],pts[i-1][1]); g.lineTo(pts[i][0],pts[i][1]); g.stroke(); }
}
function drawGolferWorld(z){
  if(!gpos) return;
  const s=Math.max(1,22/(40*z)), ci=artClub(), V=G_COURSE, FB=pr3(V,ball3(ci));
  ctx.save(); ctx.translate(gpos.x, gpos.y); ctx.scale(handSign()*s, s); ctx.translate(-FB[0], -FB[1]);
  drawGolfer3(ctx, swingPoseNow(ci), V, lookColors(), G_STYLE, ci);
  if(swing.phase==='down'||swing.phase==='finish'){ const from=swing.from, t=swing.t;
    drawSwoosh(ctx, V, dt=>{ if(t-dt<0) return null; const q=releaseF(from, t-dt, ci); return q.phase==='finish'?null:rig3(q.s,ci).C; }); }
  ctx.restore();
}
// Golfer tab: a face-on practice swing with the driver on a loop
function drawPreview(){
  const c=document.getElementById('gprev'); if(!c) return;
  const g=c.getContext('2d'), W=c.width, H=c.height, m=handSign(); g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H);
  const t=time*0.9, r=swing3(t,0), V=G_FACE, FB=pr3(V,ball3(0)), sc=H/58; g.setTransform(sc*m,0,0,sc,m>0?W*0.45:W*0.55,H*0.88);
  if(!r.hit){ const col=colorDef(); const bg=g.createRadialGradient(FB[0]-0.4,FB[1]-0.4,0.1,FB[0],FB[1],1.3); bg.addColorStop(0,col.c1); bg.addColorStop(1,col.c2);
    g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(FB[0]+0.5,FB[1]+0.6,1.1,0.6,0,0,7); g.fill(); g.fillStyle=bg; g.beginPath(); g.arc(FB[0],FB[1],1.1,0,7); g.fill(); }
  drawGolfer3(g, r.pose, V, lookColors(), G_STYLE, 0);
  drawSwoosh(g, V, dt=>{ const q=swing3(t-dt*0.9,0); return (q.phase==='down'||q.phase==='through')?q.pose.C:null; });
}
