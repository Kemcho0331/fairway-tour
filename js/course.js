/* Fairway Tour · Course building: classic holes, the 15+ hole archetypes, greens, slopes, and pins */
'use strict';
/* ---------- Courses ---------- */
const WILLOW_HOLES = [
  { name:'The Opener', par:4, yards:351, w:1000, H:2000, seed:101,
    tee:{x:500,y:1880}, cup:{x:530,y:285},
    fairway:[{w:240, pts:[[500,1770],[505,1500],[545,1150],[560,900],[525,640],[500,460]]}],
    green:{x:505,y:300,rx:150,ry:115,rot:0.1,seed:3},
    sand:[{x:330,y:345,rx:70,ry:44,rot:-0.5,seed:11},{x:700,y:860,rx:76,ry:48,rot:0.4,seed:12},{x:665,y:205,rx:56,ry:36,rot:0.35,seed:13}],
    water:[{x:250,y:1150,rx:115,ry:185,rot:0.15,seed:21}] },
  { name:'Ferry Crossing', par:3, yards:174, w:1000, H:1200, seed:202,
    tee:{x:500,y:1090}, cup:{x:490,y:300},
    fairway:[{w:200, pts:[[500,1050],[498,930]]},{w:76, pts:[[400,478],[640,478]]}],
    green:{x:520,y:310,rx:140,ry:104,rot:-0.1,seed:32},
    sand:[{x:712,y:392,rx:62,ry:40,rot:0.5,seed:33},{x:332,y:232,rx:58,ry:38,rot:-0.4,seed:34},{x:600,y:168,rx:72,ry:30,rot:0,seed:35}],
    water:[{x:500,y:665,rx:345,ry:130,rot:0.04,seed:31}] },
  { name:'Long Bend', par:5, yards:469, w:1000, H:2400, seed:303,
    tee:{x:260,y:2290}, cup:{x:700,y:312},
    fairway:[{w:230, pts:[[260,2180],[270,1800],[330,1450],[520,1200],[720,950],[760,650],[700,470]]}],
    green:{x:685,y:330,rx:150,ry:118,rot:-0.2,seed:41},
    sand:[{x:480,y:1420,rx:80,ry:52,rot:0.6,seed:42},{x:870,y:420,rx:52,ry:70,rot:0,seed:43},{x:530,y:300,rx:58,ry:40,rot:-0.3,seed:44}],
    water:[{x:660,y:1640,rx:160,ry:220,rot:0.3,seed:45},{x:420,y:640,rx:110,ry:68,rot:0.2,seed:46}] },
];

const ePt=(e,t)=>{ const c=Math.cos(e.rot||0), s=Math.sin(e.rot||0), x=Math.cos(t)*e.rx, y=Math.sin(t)*e.ry; return [e.x+x*c-y*s, e.y+x*s+y*c]; };
const inE=(e,x,y)=>{ const c=Math.cos(-(e.rot||0)), s=Math.sin(-(e.rot||0)), dx=x-e.x, dy=y-e.y, lx=dx*c-dy*s, ly=dx*s+dy*c; return (lx/e.rx)**2+(ly/e.ry)**2<1; };
const growE=(e,g)=>({x:e.x,y:e.y,rot:e.rot||0,rx:e.rx*1.18+g,ry:e.ry*1.18+g});
// true when two hazard blobs (incl. their wobble) come within `gap` of each other
function ellOverlap(a,b,gap){
  const A=growE(a,gap/2), B=growE(b,gap/2);
  if(inE(B,A.x,A.y)||inE(A,B.x,B.y)) return true;
  for(let k=0;k<72;k++){ const t=k/72*Math.PI*2, p=ePt(A,t), q=ePt(B,t); if(inE(B,p[0],p[1])||inE(A,q[0],q[1])) return true; }
  return false;
}
// green slope: a tilted plane plus one mound or bowl. accel units are world units/s^2, capped below rolling friction
function makeSlope(r, G, diff, o={}){
  const a=r()*Math.PI*2, m=12+diff*28+r()*8, tiered=!!(o.steps&&o.steps.length);
  const peak=(14+diff*26)*(0.6+r()*0.6), sig=0.42*Math.min(G.rx,G.ry), A=(r()<.5?1:-1)*peak*sig/0.607*(tiered?0.45:1);
  const ma=r()*Math.PI*2, md=r()*0.45;
  let tx=Math.cos(a)*m, ty=Math.sin(a)*m;
  if(o.tilt){ const L=Math.hypot(o.tilt[0],o.tilt[1])||1; tx=o.tilt[0]/L*o.tilt[2]; ty=o.tilt[1]/L*o.tilt[2]; }
  if(tiered){ tx*=0.5; ty*=0.5; }
  // a tier is a sigmoid step: peak = steepest pull in world units/s^2 (can beat friction, so balls roll off the step)
  const steps=(o.steps||[]).map(st=>({nx:st.nx, ny:st.ny, c:st.c, w:9, H:st.peak*36, gx:G.x, gy:G.y}));
  return {tx, ty, mx:G.x+Math.cos(ma)*G.rx*md, my:G.y+Math.sin(ma)*G.ry*md, A, sig, cap:72, steps};
}
function slopeAtS(s,x,y){
  if(!s) return {ax:0,ay:0};
  const dx=x-s.mx, dy=y-s.my, s2=s.sig*s.sig, g=Math.exp(-(dx*dx+dy*dy)/(2*s2));
  let ax=-(s.tx - s.A*g*dx/s2), ay=-(s.ty - s.A*g*dy/s2);
  const m=Math.hypot(ax,ay); if(m>s.cap){ ax*=s.cap/m; ay*=s.cap/m; }
  if(s.steps) for(const st of s.steps){ const t=((x-st.gx)*st.nx+(y-st.gy)*st.ny-st.c)/st.w; if(t<-8||t>8) continue; const sg=1/(1+Math.exp(-t)), k=-st.H*sg*(1-sg)/st.w; ax+=k*st.nx; ay+=k*st.ny; }
  return {ax,ay};
}
const Yd=v=>v/YPP;
function genHole(seed, par, diff, name, wet=0, opts={}){
  const r=mulberry32(seed);
  const yds = par===3 ? 145+r()*55 : par===4 ? 340+r()*90 : 475+r()*65;
  const len = yds/YPP;
  const n = par===3 ? 1 : Math.max(3, Math.round(len/360));
  const sl = len/n;
  let x = par===3 ? 380+r()*240 : 320+r()*360, y=0, drift=r()<.5?-1:1;
  const raw=[[x,y]];
  for(let i=0;i<n;i++){
    let dx = par===3 ? (r()*2-1)*sl*0.22 : ((r()*2-1)*0.5*(0.5+diff) + drift*0.18)*sl;
    if(x+dx<240||x+dx>760){ dx=-dx; drift=-drift; }
    dx=clamp(x+dx,240,760)-x;
    const dy=Math.sqrt(Math.max(sl*sl-dx*dx, sl*sl*0.35));
    x+=dx; y-=dy; raw.push([x,y]);
  }
  const top=250, H=Math.round(-y+top+200);
  const P=raw.map(([a,b])=>[a,b-y+top]);
  const tee={x:P[0][0],y:P[0][1]}, cup={x:P[n][0],y:P[n][1]};
  const ang=i=>Math.atan2(P[i+1][1]-P[i][1],P[i+1][0]-P[i][0]);
  const segL=[]; let tot=0; for(let i=0;i<n;i++){ const l=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]); segL.push(l); tot+=l; }
  const at=d=>{ d=clamp(d,0,tot); for(let i=0;i<n;i++){ if(d<=segL[i]||i===n-1){ const t=Math.min(1,d/segL[i]); return {x:P[i][0]+(P[i+1][0]-P[i][0])*t, y:P[i][1]+(P[i+1][1]-P[i][1])*t, a:ang(i)}; } d-=segL[i]; } return {x:cup.x,y:cup.y,a:ang(n-1)}; };
  const aIn=ang(n-1), fdx=Math.cos(aIn), fdy=Math.sin(aIn);
  const grx=150-diff*40+r()*14, gry=grx*(0.72+r()*0.14);
  const green={x:cup.x+(r()*2-1)*18, y:cup.y+(r()*2-1)*14, rx:grx, ry:gry, rot:(r()*2-1)*0.4, seed:seed+1};
  const fw=270-diff*120, fairway=[];
  if(par===3){
    const a0=ang(0), c0=Math.cos(a0), s0=Math.sin(a0);
    fairway.push({w:190, pts:[[tee.x+c0*40,tee.y+s0*40],[tee.x+c0*150,tee.y+s0*150]]});
    fairway.push({w:95-diff*30, pts:[[cup.x-fdx*(gry+95),cup.y-fdy*(gry+95)],[cup.x-fdx*(gry+15),cup.y-fdy*(gry+15)]]});
  } else {
    const a0=ang(0), fp=P.map(p=>[p[0],p[1]]);
    fp[0]=[tee.x+Math.cos(a0)*120, tee.y+Math.sin(a0)*120];
    fp[n]=[cup.x-fdx*gry*0.6, cup.y-fdy*gry*0.6];
    fairway.push({w:fw, pts:fp});
  }
  const sand=[], water=[]; let sid=10;
  const okSand=b=>!sand.some(o=>ellOverlap(o,b,14));
  const front=Math.atan2(-fdy,-fdx), used=[];
  const gs=2+(diff>0.45?1:0)+(r()<0.4?1:0)+(opts.sand?1:0);
  for(let k=0;k<gs;k++){
    for(let t=0;t<30;t++){
      const a=r()*Math.PI*2;
      if(Math.abs(angDiff(a,front))<0.6 && !(diff>0.6&&k===0)) continue;
      if(used.some(u=>Math.abs(angDiff(a,u))<0.9)) continue;
      const b={x:green.x+Math.cos(a)*(grx+30), y:green.y+Math.sin(a)*(gry+30), rx:45+r()*25, ry:28+r()*12, rot:a+Math.PI/2, seed:seed+(sid++)};
      if(!okSand(b)) continue;
      used.push(a); sand.push(b); break;
    }
  }
  if(par>3){
    const fb=1+(diff>0.5?1:0)+(par===5?1:0)+(opts.sand||0);
    for(let k=0;k<fb;k++){
      for(let t=0;t<8;t++){
        const p=at(tot*(0.28+r()*0.5)), side=r()<.5?-1:1, px=-Math.sin(p.a), py=Math.cos(p.a), off=fw/2+12;
        const b={x:p.x+px*side*off, y:p.y+py*side*off, rx:62+r()*22, ry:38+r()*14, rot:p.a, seed:seed+(sid++)};
        if(okSand(b)){ sand.push(b); break; }
      }
    }
  }
  const gc=Math.cos(-green.rot), gsn=Math.sin(-green.rot);
  const inGreen=(x,y)=>{ const dx=x-green.x, dy=y-green.y, lx=dx*gc-dy*gsn, ly=dx*gsn+dy*gc; return (lx/(grx*1.3))**2+(ly/(gry*1.3))**2<1; };
  const okWater=w=>{
    if(w.x<60||w.x>940) return false;
    const G=growE(w,0);
    for(let k=0;k<48;k++){ const q=ePt(G,k/48*Math.PI*2); if(Math.hypot(q[0]-tee.x,q[1]-tee.y)<150 || inGreen(q[0],q[1])) return false; }
    return !water.some(o=>ellOverlap(o,w,70)) && !sand.some(o=>ellOverlap(o,w,30));
  };
  const tryWater=make=>{ for(let t=0;t<10;t++){ const w=make(); if(okWater(w)){ water.push(w); return; } } };
  if(par===3){
    if(r()<0.45+diff*0.6+wet) tryWater(()=>{ const wry=70+r()*40, wrx=230+r()*90, d=gry+75+wry+r()*40; return {x:cup.x-fdx*d, y:cup.y-fdy*d, rx:wrx, ry:wry, rot:aIn+Math.PI/2+(r()*2-1)*0.15, seed:seed+50}; });
  } else {
    if(r()<0.45+diff*0.5+wet) tryWater(()=>{ const p=at(tot*(0.25+r()*0.5)), side=r()<.5?-1:1, prx=150+r()*70, pry=80+r()*40, px=-Math.sin(p.a), py=Math.cos(p.a), off=fw/2+pry*1.2+25;
      let cx=p.x+px*side*off, cy=p.y+py*side*off;
      if(cx<prx*0.6||cx>1000-prx*0.6){ cx=p.x-px*side*off; cy=p.y-py*side*off; }
      return {x:cx,y:cy,rx:prx,ry:pry,rot:p.a,seed:seed+60}; });
    if(r()<0.15+diff*0.7+wet) tryWater(()=>{ const p=at(tot-(380+r()*170)); return {x:p.x,y:p.y,rx:fw/2+170+r()*80,ry:40+r()*14,rot:p.a+Math.PI/2,seed:seed+70}; });
  }
  const slope=makeSlope(r, green, diff);
  const lp=at(Math.min(tot*0.55, 245/YPP));
  return {name, par, yards:Math.round(tot*YPP), w:1000, H, seed, tee, cup, fairway, green, sand, water, diff, treeMul:opts.trees||1, slope, arch:'classic',
    route:P.slice(0,n).map(q=>[q[0],q[1]]).concat([[green.x,green.y]]), open: par>3?[{x:lp.x,y:lp.y,w:fw}]:[]};
}
/* ---------- Hole archetypes ----------
   Each builder lays a hole out with the tee at (x,0) and play running up the screen (negative y).
   finalizeSpec mirrors it at random, shifts it onto its canvas, and postHole adds slope, pins and yardage. */
function rotV(x,y,a){ const c=Math.cos(a), s=Math.sin(a); return [x*c-y*s, x*s+y*c]; }
function ellR(e,dx,dy){ const [lx,ly]=rotV(dx,dy,-(e.rot||0)); return 1/Math.sqrt((lx/e.rx)**2+(ly/e.ry)**2); }
function segDist(px,py,ax,ay,bx,by){ const vx=bx-ax, vy=by-ay, L2=vx*vx+vy*vy||1; const t=clamp(((px-ax)*vx+(py-ay)*vy)/L2,0,1); return Math.hypot(px-ax-vx*t, py-ay-vy*t); }
// signed distance from a point to the nearest fairway edge (negative = on the fairway)
function fairEdge(fw,x,y){ let best=1e9; for(const f of fw){ for(let i=0;i<f.pts.length-1;i++){ const d=segDist(x,y,f.pts[i][0],f.pts[i][1],f.pts[i+1][0],f.pts[i+1][1])-f.w/2; if(d<best) best=d; } } return best; }
function routeLen(R){ let L=0; for(let i=1;i<R.length;i++) L+=Math.hypot(R[i][0]-R[i-1][0],R[i][1]-R[i-1][1]); return L; }
function approachDir(R){ const a=R[R.length-2], b=R[R.length-1], dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy)||1; return [dx/L,dy/L]; }
function addHaz(S,z,kind){ if(kind==='waste') S.sand.push({...z,kind:'waste'}); else if(kind==='bunker'||kind==='pot') S.sand.push({...z,kind}); else S.water.push(z); }
// shrink a hazard until it clears fairways, green, tee and other hazards
function fitHaz(S, e, kind, margin=25){
  const Gz={...S.green, rx:S.green.rx*1.3+16, ry:S.green.ry*1.3+16, seed:1};
  for(let sc=1; sc>=0.45; sc-=0.06){
    const z={...e, rx:e.rx*sc, ry:e.ry*sc, seed:(S._sd=(S._sd||900)+1)}, pts=blobPts(z), G2=blobPts(Gz);
    let ok=pts.every(q=>fairEdge(S.fairway,q[0],q[1])>=margin && !pip(G2,q[0],q[1]) && Math.hypot(q[0]-S.tee[0],q[1]-S.tee[1])>=170);
    if(ok && [...S.water,...S.sand].some(o=>blobHit(o,z,kind==='water'?40:16))) ok=false;
    if(ok){ addHaz(S,z,kind); return true; }
  }
  return false;
}
function addGreenside(S, r, n, kind='bunker', allowFront=false){
  const G=S.green, a=approachDir(S.route), front=Math.atan2(-a[1],-a[0]), used=[];
  for(let k=0;k<n;k++){
    for(let t=0;t<30;t++){
      const ang=r()*Math.PI*2;
      if(!allowFront && Math.abs(angDiff(ang,front))<0.8) continue;
      if(used.some(u=>Math.abs(angDiff(ang,u))<0.9)) continue;
      const ux=Math.cos(ang), uy=Math.sin(ang), R=ellR(G,ux,uy), pot=kind==='pot';
      const rx=pot?20+r()*4:44+r()*20, ry=pot?rx*(0.85+r()*0.2):26+r()*10, off=R*1.1+ry*1.05+8;
      const b={x:G.x+ux*off, y:G.y+uy*off, rx, ry, rot:ang+Math.PI/2, kind};
      if(S.sand.some(o=>ellOverlap(o,b,10)) || S.water.some(o=>ellOverlap(o,b,16))) continue;
      used.push(ang); S.sand.push(b); break;
    }
  }
}
const teeStrip=(x)=>({w:190, pts:[[x,-40],[x,-150]]});
function treeCluster(S, r, cx, cy, n, spread){ for(let i=0;i<n*6 && S.trees.filter(t=>t.cl===cx).length<n;i++){ const t={x:cx+(r()*2-1)*spread, y:cy+(r()*2-1)*spread, r:22+r()*9, cl:cx}; if(fairEdge(S.fairway,t.x,t.y)<t.r+10) continue; if(!S.trees.some(o=>Math.hypot(o.x-t.x,o.y-t.y)<o.r+t.r-6)) S.trees.push(t); } }

const ARCH = {
  island(r,d,c){
    const L=Yd(135+r()*35), gx=500+(r()*2-1)*50, gy=-L;
    const G={x:gx,y:gy,rx:92+r()*14,ry:76+r()*10,rot:(r()*2-1)*0.3};
    const W={x:gx,y:gy+8,rx:G.rx+105,ry:G.ry+100,rot:G.rot*0.5,base:true};
    const drop={x:500+(r()*2-1)*30, y:W.y+W.ry*1.18+48};
    return {par:3, tee:[500,0], green:G, water:[W], sand:[], trees:[], drop,
      fairway:[teeStrip(500), {w:120, pts:[[drop.x,drop.y-16],[drop.x,drop.y+34]]}], route:[[500,0],[gx,gy]]};
  },
  redan(r,d,c){
    const L=Yd(178+r()*28), gx=500, gy=-L, rot=0.72+r()*0.12;
    const G={x:gx,y:gy,rx:158+r()*14,ry:58+r()*8,rot}, ax=Math.cos(rot), ay=Math.sin(rot), nfx=-ay, nfy=ax;
    const S={par:3, tee:[500,0], green:G, water:[], trees:[], route:[[500,0],[gx,gy]], tilt:[-ax,-ay,26+d*22],
      sand:[{x:gx+nfx*(G.ry+44)-ax*30, y:gy+nfy*(G.ry+44)-ay*30, rx:G.rx*0.62, ry:28, rot, kind:'bunker'},
            {x:gx-nfx*(G.ry+40)+ax*30, y:gy-nfy*(G.ry+40)+ay*30, rx:44, ry:22, rot, kind:'bunker'}]};
    const fe=[gx+ax*G.rx*0.8, gy+ay*G.rx*0.8];
    S.fairway=[teeStrip(500), {w:100, pts:[[fe[0]+10,fe[1]+130],[fe[0],fe[1]+30]]}];
    return S;
  },
  biarritz(r,d,c){
    const L=Yd(195+r()*28), gx=500+(r()*2-1)*40, gy=-L;
    const G={x:gx,y:gy,rx:70+r()*8,ry:185+r()*15,rot:(r()*2-1)*0.08};
    return {par:3, tee:[500,0], green:G, water:[], trees:[], route:[[500,0],[gx,gy]],
      sand:[{x:gx-G.rx*1.1-40, y:gy+10, rx:30, ry:110, rot:G.rot}, {x:gx+G.rx*1.1+40, y:gy-10, rx:30, ry:110, rot:G.rot}],
      fairway:[teeStrip(500), {w:100, pts:[[gx,gy+G.ry*1.1+140],[gx,gy+G.ry*1.1+20]]}],
      steps:[{nx:0,ny:-1,c:-50,peak:-135},{nx:0,ny:-1,c:48,peak:135}]};
  },
  ringed(r,d,c){
    const L=Yd(128+r()*30), gx=500+(r()*2-1)*60, gy=-L;
    const G={x:gx,y:gy,rx:70+r()*10,ry:60+r()*8,rot:(r()*2-1)*0.3}, S={par:3, tee:[500,0], green:G, water:[], sand:[], trees:[], route:[[500,0],[gx,gy]], fairway:[teeStrip(500)]};
    const n=5+Math.round(d), off=r()*6.28;
    for(let k=0;k<n;k++){ const a=off+k/n*Math.PI*2+(r()*2-1)*0.12, ux=Math.cos(a), uy=Math.sin(a), R=ellR(G,ux,uy), rr=19+r()*4;
      S.sand.push({x:gx+ux*(R*1.12+rr*1.2+6), y:gy+uy*(R*1.12+rr*1.2+6), rx:rr, ry:rr*(0.88+r()*0.15), rot:r()*3, kind:'pot'}); }
    if(r()<0.45) S.steps=[{nx:0,ny:-1,c:(r()*2-1)*8,peak:120}];
    return S;
  },
  eden(r,d,c){
    const L=Yd(150+r()*30), G={x:500+(r()*2-1)*50, y:-L, rx:122+r()*10, ry:80+r()*8, rot:(r()*2-1)*0.12};
    const S={par:3, tee:[500,0], green:G, water:[], trees:[], route:[[500,0],[G.x,G.y]], tilt:[0,1,24+d*20],
      sand:[{x:G.x+40, y:G.y+G.ry*1.12+34, rx:42, ry:24, rot:0, kind:'pot'}, {x:G.x-G.rx*1.1-36, y:G.y+14, rx:32, ry:62, rot:0.15}],
      fairway:[teeStrip(500), {w:100, pts:[[G.x-70,G.y+G.ry+150],[G.x-55,G.y+G.ry+20]]}]};
    addHaz(S,{x:G.x+(r()*2-1)*40, y:G.y-G.ry*1.2-125, rx:330, ry:58, rot:(r()*2-1)*0.08}, c.hazard);
    return S;
  },
  long3(r,d,c){
    const L=Yd(205+r()*28), G={x:500+(r()*2-1)*40, y:-L, rx:146+r()*12, ry:106+r()*10, rot:(r()*2-1)*0.12};
    return {par:3, tee:[500,0], green:G, water:[], trees:[], route:[[500,0],[G.x,G.y]],
      sand:[{x:G.x-G.rx*0.95, y:G.y+G.ry*0.95+42, rx:42, ry:26, rot:-0.5}, {x:G.x+G.rx*0.95, y:G.y+G.ry*0.95+42, rx:42, ry:26, rot:0.5}],
      fairway:[teeStrip(500), {w:120, pts:[[G.x,G.y+G.ry+150],[G.x,G.y+G.ry+14]]}],
      steps:[{nx:0,ny:-1,c:(r()*2-1)*18,peak:(r()<.5?1:-1)*130}]};
  },
  dogleg(r,d,c,road){
    const fw=c.fw, x0=270+r()*40, leg1=Yd(250+r()*20), th=0.85+r()*0.4, cx=x0, cy=-leg1, dx=Math.sin(th), dy=-Math.cos(th);
    const leg2=Math.min(Yd(125+r()*35), (780-cx)/dx), gx=cx+dx*leg2, gy=cy+dy*leg2;
    const G=road?{x:gx,y:gy,rx:138,ry:62,rot:th-1.25}:{x:gx,y:gy,rx:108+r()*18,ry:84+r()*12,rot:(r()*2-1)*0.3};
    const S={par:4, tee:[x0,0], green:G, water:[], sand:[], trees:[], route:[[x0,0],[cx,cy],[gx,gy]],
      fairway:[{w:fw, pts:[[x0,-Yd(28)],[x0,cy+Yd(70)],[cx,cy-Yd(10)],[cx+dx*Yd(48),cy+dy*Yd(48)-Yd(5)],[gx-dx*G.ry*0.9,gy-dy*G.ry*0.9]]}]};
    treeCluster(S, r, cx+fw/2+(road?115:100), cy+Yd(60), road?9:5, road?62:55);
    S.sand.push({x:cx-fw/2-14, y:cy-Yd(6), rx:40, ry:70, rot:0});
    if(road){
      const a=approachDir(S.route), lft=[a[1],-a[0]], Rl=ellR(G,lft[0],lft[1])*1.12+34;
      S.sand.push({x:gx-a[0]*18+lft[0]*Rl, y:gy-a[1]*18+lft[1]*Rl, rx:28, ry:26, rot:0, kind:'pot'});
      S.sand.push({x:gx+a[0]*(ellR(G,a[0],a[1])*1.1+26), y:gy+a[1]*(ellR(G,a[0],a[1])*1.1+26), rx:110, ry:16, rot:Math.atan2(a[1],a[0])+Math.PI/2});
    } else addGreenside(S, r, 2);
    return S;
  },
  road(r,d,c){ return ARCH.dogleg(r,d,c,true); },
  cape(r,d,c){
    const fw=c.fw, x0=290+r()*30, gx=x0+330+r()*40, gy=-Yd(378+r()*22);
    const G={x:gx,y:gy,rx:104,ry:84,rot:(r()*2-1)*0.2};
    const S={par:4, tee:[x0,0], green:G, water:[], sand:[], trees:[], route:[[x0,0],[x0,-Yd(200)],[x0+150,-Yd(330)],[gx,gy]],
      fairway:[{w:fw, pts:[[x0,-Yd(28)],[x0,-Yd(175)],[x0+25,-Yd(268)],[x0+150,-Yd(330)],[gx-120,gy+60]]}]};
    if(!fitHaz(S,{x:x0+fw/2+250, y:-Yd(212), rx:195, ry:175, rot:0.25}, c.hazard, 16)) return null;
    addGreenside(S, r, 2);
    return S;
  },
  split(r,d,c){
    const fw=c.fw, gx=610+r()*50, gy=-Yd(365+r()*25), G={x:gx,y:gy,rx:104,ry:80,rot:(r()*2-1)*0.2};
    const S={par:4, tee:[500,0], green:G, water:[], sand:[], trees:[], route:[[500,0],[660,-Yd(160)],[gx,gy]],
      fairway:[{w:fw*0.9, pts:[[460,-Yd(28)],[330,-Yd(140)],[290,-Yd(235)],[380,-Yd(320)],[gx-115,gy+G.ry+60]]},
               {w:Math.max(80,fw*0.48), pts:[[545,-Yd(40)],[680,-Yd(150)],[715,-Yd(250)],[gx+15,gy+G.ry+50]]}]};
    if(!fitHaz(S,{x:505, y:-Yd(205), rx:100, ry:250, rot:0.08}, c.hazard, 18)) return null;
    addGreenside(S, r, 2);
    return S;
  },
  leven(r,d,c){
    const fw=c.fw, gx=500+(r()*2-1)*60, gy=-Yd(392+r()*28), G={x:gx,y:gy,rx:100,ry:80,rot:(r()*2-1)*0.2};
    const S={par:4, tee:[500,0], green:G, water:[], sand:[], trees:[], route:[[500,0],[500,-Yd(240)],[gx,gy]],
      fairway:[{w:fw, pts:[[500,-Yd(28)],[485,-Yd(190)],[505,-Yd(300)],[gx,gy+G.ry+60]]}]};
    addHaz(S,{x:500, y:-Yd(228), rx:Math.max(330,fw*1.4), ry:30, rot:(r()<.5?-1:1)*0.33, cross:true}, c.hazard);
    addGreenside(S, r, 2);
    return S;
  },
  bottle(r,d,c){
    const fw=c.fw, gx=500+(r()*2-1)*50, gy=-Yd(385+r()*35), G={x:gx,y:gy,rx:100,ry:80,rot:(r()*2-1)*0.25}, nw=Math.max(72,fw*0.36);
    const S={par:4, tee:[500,0], green:G, water:[], trees:[], route:[[500,0],[gx,gy]],
      fairway:[{w:fw*1.05, pts:[[500,-Yd(28)],[500,-Yd(214)]]},{w:nw, pts:[[500,-Yd(212)],[503,-Yd(292)]]},{w:fw*0.9, pts:[[503,-Yd(290)],[gx,gy+G.ry+50]]}],
      sand:[{x:500-nw/2-44, y:-Yd(252), rx:38, ry:52, rot:0, inFair:true}, {x:503+nw/2+44, y:-Yd(252), rx:38, ry:52, rot:0, inFair:true}]};
    addGreenside(S, r, 2);
    return S;
  },
  drivable(r,d,c){
    const fw=c.fw, L=Yd(285+r()*25), gx=560+r()*30, gy=-L, rot=0.42+r()*0.1;
    const G={x:gx,y:gy,rx:135+r()*10,ry:50+r()*6,rot}, ax=Math.cos(rot), ay=Math.sin(rot), nfx=-ay, nfy=ax;
    return {par:4, tee:[500,0], green:G, water:[], trees:[], route:[[500,0],[gx,gy]],
      fairway:[{w:fw*0.95, pts:[[500,-Yd(28)],[455,-Yd(150)],[415,-Yd(222)]]}],
      sand:[{x:gx+nfx*(G.ry*1.1+34), y:gy+nfy*(G.ry*1.1+34), rx:G.rx*0.6, ry:26, rot, kind:'bunker'},
            {x:gx+ax*(G.rx*1.1+28), y:gy+ay*(G.rx*1.1+28), rx:21, ry:19, rot:0, kind:'pot'},
            {x:gx-nfx*(G.ry*1.1+30), y:gy-nfy*(G.ry*1.1+30), rx:52, ry:20, rot, kind:'bunker'},
            {x:gx-ax*(G.rx*1.1+26), y:gy-ay*(G.rx*1.1+26), rx:20, ry:19, rot:0, kind:'pot'}]};
  },
  peninsula(r,d,c){
    const fw=c.fw, gx=520+(r()*2-1)*50, gy=-Yd(380+r()*25), G={x:gx,y:gy,rx:100,ry:80,rot:(r()*2-1)*0.2};
    return {par:4, tee:[500,0], green:G, sand:[], trees:[], route:[[500,0],[gx,gy]],
      fairway:[{w:fw, pts:[[500,-Yd(28)],[490,-Yd(200)],[505,-Yd(300)]]},{w:Math.max(80,fw*0.5), pts:[[505,-Yd(298)],[gx,gy+G.ry*0.5]]}],
      water:[{x:gx+(r()<.5?-1:1)*30, y:gy-25, rx:G.rx+185, ry:G.ry+140, rot:0, base:true}]};
  },
  hell(r,d,c){
    const fw=c.fw*1.05, L=Yd(505+r()*35), gx=500+(r()*2-1)*60, gy=-L, G={x:gx,y:gy,rx:110,ry:85,rot:(r()*2-1)*0.25};
    const S={par:5, tee:[500,0], green:G, water:[], trees:[], route:[[500,0],[470,-Yd(220)],[525,-Yd(340)],[gx,gy]],
      fairway:[{w:fw, pts:[[500,-Yd(28)],[470,-Yd(220)],[525,-Yd(340)],[515,-Yd(430)],[gx,gy+G.ry+40]]}], sand:[]};
    const ny=-Yd(262), nx=482;
    S.sand.push({x:nx-28,y:ny,rx:18,ry:17,rot:0,kind:'pot',inFair:true},{x:nx+14,y:ny-30,rx:18,ry:16,rot:0,kind:'pot',inFair:true},{x:nx+40,y:ny+14,rx:17,ry:16,rot:0,kind:'pot',inFair:true});
    const hy=gy+Yd(100), hx=516-fw*0.1;
    S.sand.push({x:hx, y:hy, rx:fw*0.5+16, ry:54, rot:(r()*2-1)*0.06, kind:'bunker', inFair:true});
    addGreenside(S, r, 2);
    return S;
  },
  reachable(r,d,c){
    const fw=c.fw, x0=740+r()*30, leg1=Yd(262+r()*18), th=0.26+r()*0.12, cx=x0, cy=-leg1, dx=-Math.sin(th), dy=-Math.cos(th);
    const rem=Yd(240+r()*20), gx=cx+dx*rem, gy=cy+dy*rem, G={x:gx,y:gy,rx:112,ry:78,rot:th*0.5};
    const back=G.ry*1.15+50, ckx=gx-dx*back, cky=gy-dy*back;
    const S={par:5, tee:[x0,0], green:G, water:[], sand:[], trees:[], route:[[x0,0],[cx,cy],[gx,gy]],
      fairway:[{w:fw, pts:[[x0,-Yd(28)],[x0,cy+Yd(60)],[cx,cy-Yd(14)],[cx+dx*Yd(110),cy+dy*Yd(110)],[ckx-dx*Yd(32),cky-dy*Yd(32)]]}]};
    addHaz(S,{x:ckx, y:cky, rx:250, ry:30, rot:Math.atan2(dy,dx)+Math.PI/2, cross:true}, c.hazard);
    treeCluster(S, r, cx-fw/2-90, cy+Yd(55), 6, 60);
    addGreenside(S, r, 2);
    return S;
  },
  sahara(r,d,c){
    const fw=c.fw*1.05, L=Yd(500+r()*35), gx=500+(r()*2-1)*60, gy=-L, G={x:gx,y:gy,rx:108,ry:84,rot:(r()*2-1)*0.25};
    const S={par:5, tee:[500,0], green:G, water:[], trees:[], route:[[500,0],[470,-Yd(320)],[gx,gy]], open:[{x:488,y:-Yd(255),w:fw}],
      fairway:[teeStrip(500), {w:fw, pts:[[500,-Yd(215)],[470,-Yd(320)],[530,-Yd(420)],[gx,gy+G.ry+40]]}],
      sand:[{x:500+(r()*2-1)*30, y:-Yd(150), rx:380, ry:92+r()*16, rot:(r()*2-1)*0.06, kind:'waste', cross:true}]};
    fitHaz(S,{x:470-fw/2-130, y:-Yd(360), rx:120, ry:160, rot:0.1}, 'waste', 22);
    fitHaz(S,{x:530+fw/2+130, y:-Yd(420), rx:120, ry:150, rot:-0.1}, 'waste', 22);
    addGreenside(S, r, 2);
    return S;
  },
  long(r,d,c){
    const fw=c.fw*1.3, L=Yd(515+r()*35), gx=500+(r()*2-1)*60, gy=-L, G={x:gx,y:gy,rx:110,ry:86,rot:(r()*2-1)*0.25};
    const S={par:5, tee:[500,0], green:G, water:[], trees:[], route:[[500,0],[520,-Yd(230)],[480,-Yd(380)],[gx,gy]], open:[{x:520,y:-Yd(240),w:fw}],
      fairway:[{w:fw, pts:[[500,-Yd(28)],[520,-Yd(230)],[480,-Yd(380)],[gx,gy+G.ry+40]]}],
      sand:[{x:494, y:-Yd(312), rx:38, ry:58, rot:0.1, kind:'bunker', inFair:true}, {x:548, y:-Yd(290), rx:18, ry:17, rot:0, kind:'pot', inFair:true}]};
    addGreenside(S, r, 2);
    return S;
  },
};

function finalizeSpec(S, seed, r, diff, name, opts, arch){
  const mir=!S.noMirror && r()<0.5, X=x=>mir?1000-x:x, Rt=a=>mir?-(a||0):(a||0);
  const P=p=>[X(p[0]),p[1]], E=e=>({...e, x:X(e.x), rot:Rt(e.rot)});
  S.green=E(S.green); S.sand=S.sand.map(E); S.water=S.water.map(E);
  S.fairway=S.fairway.map(f=>({w:f.w, pts:f.pts.map(P)}));
  S.tee=P(S.tee); S.route=S.route.map(P); S.trees=(S.trees||[]).map(t=>({x:X(t.x), y:t.y, r:t.r}));
  if(S.drop) S.drop={x:X(S.drop.x), y:S.drop.y};
  if(S.tilt) S.tilt=[mir?-S.tilt[0]:S.tilt[0], S.tilt[1], S.tilt[2]];
  if(S.steps) S.steps=S.steps.map(st=>({...st, nx:mir?-st.nx:st.nx}));
  if(S.open) S.open=S.open.map(o=>({...o, x:X(o.x)}));
  let minY=S.green.y-Math.max(S.green.rx,S.green.ry)*1.3;
  for(const e of [...S.sand,...S.water]) minY=Math.min(minY, e.y-Math.max(e.rx,e.ry)*1.2);
  for(const f of S.fairway) for(const p of f.pts) minY=Math.min(minY, p[1]-f.w/2);
  for(const t of S.trees) minY=Math.min(minY, t.y-t.r);
  const dy=230-minY, sh=y=>y+dy;
  const H=Math.round(sh(S.tee[1])+200);
  return {name, par:S.par, w:1000, H, seed, arch, diff, treeMul:opts.trees||1,
    tee:{x:S.tee[0], y:sh(S.tee[1])},
    green:{...S.green, y:sh(S.green.y), seed:seed+1},
    fairway:S.fairway.map(f=>({w:f.w, pts:f.pts.map(p=>[p[0],sh(p[1])])})),
    sand:S.sand.map((b,i)=>({...b, y:sh(b.y), kind:b.kind||'bunker', seed:b.seed??seed+10+i})),
    water:S.water.map((w,i)=>({...w, y:sh(w.y), seed:w.seed??seed+50+i})),
    fixedTrees:S.trees.map(t=>({...t, y:sh(t.y)})),
    drop:S.drop?{x:S.drop.x, y:sh(S.drop.y)}:null,
    route:S.route.map(p=>[p[0],sh(p[1])]),
    open:(S.open||[]).map(o=>({...o, y:sh(o.y)})),
    tilt:S.tilt||null, steps:S.steps||[]};
}
function makePins(h){
  const G=h.green, a=approachDir(h.route), ax=a[0], ay=a[1], lx=ay, ly=-ax, Ra=ellR(G,ax,ay), Rl=ellR(G,lx,ly), out=[];
  const C=[[0,0],[-.5,0],[.5,0],[-.4,.48],[-.4,-.48],[.42,.48],[.42,-.48],[0,.58],[0,-.58]];
  const inner={x:G.x,y:G.y,rx:G.rx*0.72,ry:G.ry*0.72,rot:G.rot||0};
  for(const [u,v] of C){
    const x=G.x+ax*u*Ra+lx*v*Rl, y=G.y+ay*u*Ra+ly*v*Rl;
    if(!inE(inner,x,y)) continue;
    if(((h.slope&&h.slope.steps)||[]).some(st=>Math.abs((x-st.gx)*st.nx+(y-st.gy)*st.ny-st.c)<26)) continue;
    const fb=u<-.25?'Front':u>.25?'Back':'', lr=v>.25?'left':v<-.25?'right':'';
    const nm=fb&&lr?`${fb}-${lr}`:fb?fb:lr?lr[0].toUpperCase()+lr.slice(1):'Middle';
    out.push({x,y,name:nm,off:u*Ra});
  }
  if(!out.length) out.push({x:G.x,y:G.y,name:'Middle',off:0});
  return out;
}
function setPin(h,p){ h.cup={x:p.x,y:p.y}; h.pinName=p.name; h.yards=Math.round(h.baseYards+p.off*YPP); }
function postHole(h, r){
  h.sand.forEach(b=>{ b.kind=b.kind||'bunker'; });
  if(!h.slope) h.slope=makeSlope(r, h.green, h.diff, {tilt:h.tilt, steps:h.steps});
  h.pins=makePins(h);
  const R=h.route.slice(); R[R.length-1]=[h.green.x,h.green.y]; h.route=R;
  h.baseYards=routeLen(R)*YPP;
  setPin(h, h.pins[0]);
  return h;
}
function pip(pts,x,y){ let c=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){ const xi=pts[i][0], yi=pts[i][1], xj=pts[j][0], yj=pts[j][1]; if(((yi>y)!==(yj>y)) && (x<(xj-xi)*(y-yi)/(yj-yi)+xi)) c=!c; } return c; }
// exact checks on the drawn blob shapes
function blobHit(a,b,gap){ const A=blobPts({...a, rx:a.rx+gap/2, ry:a.ry+gap/2}), B=blobPts({...b, rx:b.rx+gap/2, ry:b.ry+gap/2});
  return A.some(q=>pip(B,q[0],q[1])) || B.some(q=>pip(A,q[0],q[1])); }
function holeProblems(h){
  const P=[], G=h.green, tee=h.tee, fe=(x,y)=>fairEdge(h.fairway,x,y);
  if(G.x<120||G.x>880) P.push('green bounds');
  const haz=[...h.sand.map(b=>({...b,t:'s'})), ...h.water.filter(w=>!w.base).map(w=>({...w,t:'w'}))];
  for(const z of haz){
    if(z.x<20||z.x>980) P.push('haz bounds');
    if(blobHit(z,G,2)) P.push('haz on green '+z.t+z.kind);
    const pts=blobPts(z);
    if(pts.some(q=>Math.hypot(q[0]-tee.x,q[1]-tee.y)<130)) P.push('haz near tee');
    if(!z.cross && !z.inFair){
      if(z.t==='w' ? pts.some(q=>fe(q[0],q[1])<8) : fe(z.x,z.y)<0) P.push('haz on fairway '+z.t+(z.kind||''));
    }
  }
  for(let i=0;i<haz.length;i++) for(let j=i+1;j<haz.length;j++){ const a=haz[i], b=haz[j];
    const gap=(a.t==='w'&&b.t==='w')?40:(a.t==='w'||b.t==='w')?16:(a.kind==='pot'||b.kind==='pot')?4:6;
    if(blobHit(a,b,gap)) P.push('overlap '+a.t+(a.kind||'')+'/'+b.t+(b.kind||'')); }
  for(const t of h.fixedTrees||[]){ if(!t.lone && fe(t.x,t.y)<t.r+6) P.push('tree on fairway'); if(Math.hypot(t.x-G.x,t.y-G.y)<Math.max(G.rx,G.ry)*1.3+t.r) P.push('tree on green'); }
  if(h.drop){ if(fe(h.drop.x,h.drop.y)>0) P.push('drop off fairway'); if(h.water.some(w=>pip(blobPts({...w,rx:w.rx+30,ry:w.ry+30}),h.drop.x,h.drop.y))) P.push('drop in water'); }
  if(h.pins.length<3) P.push('few pins');
  return P;
}
function addLone(h, r, perm){
  if(!h.open || !h.open.length || r()>0.45) return;
  const o=h.open[(r()*h.open.length)|0], t={x:o.x+(r()*2-1)*o.w*0.12, y:o.y+(r()*2-1)*30, r:30, lone:true};
  if(fairEdge(h.fairway,t.x,t.y)>-20) return;
  if([...h.sand,...h.water].some(z=>ellOverlap(z,{x:t.x,y:t.y,rx:t.r+10,ry:t.r+10,rot:0},10))) return;
  if(!perm()) return;
  h.fixedTrees=(h.fixedTrees||[]).concat([t]);
}
function buildArchHole(arch, seed, par, diff, name, wet, opts, perm){
  const classic=(w)=>{ const h=postHole(genHole(seed, par, diff, name, w, opts), mulberry32(seed+7)); addLone(h, mulberry32(seed+11), perm); return h; };
  if(arch==='classic') return classic(wet);
  if(arch==='carry') return classic(1);
  for(let k=0;k<12;k++){
    const sd=seed+k*7919, r=mulberry32(sd), c={fw:270-diff*120, hazard:opts.waste?'waste':'water'};
    const S=ARCH[arch](r,diff,c); if(!S) continue;
    const h=postHole(finalizeSpec(S, sd, r, diff, name, opts, arch), r);
    if(holeProblems(h).length) continue;
    addLone(h, r, perm);
    return h;
  }
  return classic(wet);
}

const HOLE_NAMES=['Pecan Grove','Live Oak','Cattle Gap','Mesquite','Windmill','Prairie Run','Brazos Bend','Sandhill','Heron Point','Saltgrass','Dune Ridge','Lighthouse','Seawall','Pelican','Longhorn','Big Sky','Ranch Gate','Capitol','Old Mill','Cypress','Bluebonnet','Red River','Iron Horse','Canyon','Loblolly','Big Thicket','Caprock','Sotol','Guadalupe','Llano','Frio','Pedernales','Chisos','Terlingua','Rio Grande','Hackberry'];
function genCourse(seed, pars, diff, wet=0, opts={}){
  const r=mulberry32(seed), names=[...(opts.names||HOLE_NAMES)].sort(()=>r()-.5), pool=opts.pool, order={}, used={3:0,4:0,5:0};
  // a leading '!' marks an event's signature hole, which is always used
  if(pool) for(const p of [3,4,5]){ const L=pool[p]||['classic'], must=L.filter(a=>a[0]==='!').map(a=>a.slice(1)); order[p]=must.concat(L.filter(a=>a[0]!=='!').sort(()=>r()-.5)); }
  let prev=null, lones=0; const perm=()=>{ if(lones>=2) return false; lones++; return true; };
  return pars.map((par,i)=>{
    let arch='classic';
    if(pool){ const L=order[par]; arch=L[used[par]%L.length]; if(arch===prev && L.length>1){ used[par]++; arch=L[used[par]%L.length]; } used[par]++; }
    prev=arch;
    const h=buildArchHole(arch, seed+i*97, par, diff, names[i], wet, opts, perm); h.theme=opts.theme||null; h.surround=opts.surround||'forest'; if(opts.twist) Object.assign(h, opts.twist); if(h.crown) crownGreen(h);
    if(opts.links) h.sand.forEach(b=>{ if(b.kind==='bunker' && !b.inFair && Math.max(b.rx,b.ry)<80){ const q=Math.max(18,Math.min(b.rx,b.ry)*0.8); b.kind='pot'; b.rx=q; b.ry=q*0.9; } });
    return h;
  });
}
const WILLOW_ROUTES=[[[500,1880],[505,300]],[[500,1090],[520,310]],[[260,2290],[330,1450],[720,950],[685,330]]];
WILLOW_HOLES.forEach((h,i)=>{ h.diff=0.15; h.treeMul=1; h.arch='handmade'; h.surround='forest'; h.route=WILLOW_ROUTES[i]; h.slope=makeSlope(mulberry32(h.seed+999), h.green, 0.15); postHole(h, mulberry32(h.seed)); });
