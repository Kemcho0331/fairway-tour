/* Fairway Tour · Hole building: terrain map, trees, and the painted course */
'use strict';
/* ---------- Shape helpers ---------- */
function blobPts(b){ const r=mulberry32(b.seed||7); const ph=[r()*6.283,r()*6.283,r()*6.283]; const n=40, pts=[]; const c=Math.cos(b.rot||0), s=Math.sin(b.rot||0);
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; const k=1+0.08*Math.sin(a*2+ph[0])+0.06*Math.sin(a*3+ph[1])+0.04*Math.sin(a*5+ph[2]); const x=Math.cos(a)*b.rx*k, y=Math.sin(a)*b.ry*k; pts.push([b.x+x*c-y*s, b.y+x*s+y*c]); }
  return pts; }
function closedPath(g,pts){ const n=pts.length; const mid=i=>[(pts[i][0]+pts[(i+1)%n][0])/2,(pts[i][1]+pts[(i+1)%n][1])/2]; g.beginPath(); const s=mid(n-1); g.moveTo(s[0],s[1]); for(let i=0;i<n;i++){ const e=mid(i); g.quadraticCurveTo(pts[i][0],pts[i][1],e[0],e[1]); } g.closePath(); }
function openPath(g,pts){ g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length-1;i++){ g.quadraticCurveTo(pts[i][0],pts[i][1],(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2); } const l=pts[pts.length-1]; g.lineTo(l[0],l[1]); }
function rrect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }

/* ---------- Hole building ---------- */
const MAPS = 0.5, VIS = 1.4;
let hole=null, vis=null;
function buildHole(h){
  if(hole && hole!==h){ hole.vis=null; hole.sur=null; hole.map=null; hole.built=false; }
  hole=h;
  if(!h.built || h.builtSeason!==season().id){
    h.builtSeason=season().id;
    h.greenPts=blobPts(h.green);
    h.fringePts=blobPts({...h.green, rx:h.green.rx+18, ry:h.green.ry+18});
    h.sandPts=h.sand.map(blobPts); h.waterPts=h.water.map(blobPts);
    buildTypeMap(h); placeTrees(h); h.vis=buildVisual(h); h.sur=buildSurround(h); h.built=true;
  }
  vis=h.vis;
}
function buildTypeMap(h){
  const mw=Math.ceil(h.w*MAPS), mh=Math.ceil(h.H*MAPS);
  const c=document.createElement('canvas'); c.width=mw; c.height=mh;
  const g=c.getContext('2d',{willReadFrequently:true});
  const map=new Uint8Array(mw*mh);
  const bw=[], nw=[]; h.water.forEach((w,i)=>(w.base?bw:nw).push(h.waterPts[i]));
  const sk=k=>h.sand.map((b,i)=>[b,h.sandPts[i]]).filter(([b])=>(b.kind||'bunker')===k).map(([,q])=>q);
  const fill=ps=>ps.length?g=>ps.forEach(q=>{ closedPath(g,q); g.fill(); }):null;
  const layers=[
    [WATER, fill(bw)],
    [ROUGH, bw.length?g=>{ g.lineCap=g.lineJoin='round'; for(const f of h.fairway){ g.lineWidth=f.w+26; openPath(g,f.pts); g.stroke(); } closedPath(g, blobPts({...h.green, rx:h.green.rx+32, ry:h.green.ry+32})); g.fill(); g.fillRect(h.tee.x-64,h.tee.y-44,128,88); }:null],
    [FAIR, g=>{ g.lineCap=g.lineJoin='round'; for(const f of h.fairway){ g.lineWidth=f.w; openPath(g,f.pts); g.stroke(); } closedPath(g,h.fringePts); g.fill(); g.fillRect(h.tee.x-55,h.tee.y-35,110,70); }],
    [GREEN, g=>{ closedPath(g,h.greenPts); g.fill(); }],
    [WASTE, fill(sk('waste'))], [SAND, fill(sk('bunker'))], [POT, fill(sk('pot'))],
    [WATER, fill(nw)],
  ].filter(l=>l[1]);
  for(const [type,fn] of layers){
    g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,mw,mh); g.setTransform(MAPS,0,0,MAPS,0,0);
    g.fillStyle='#fff'; g.strokeStyle='#fff'; fn(g);
    const d=g.getImageData(0,0,mw,mh).data;
    for(let j=0,k=3;j<map.length;j++,k+=4) if(d[k]>127) map[j]=type;
  }
  h.map=map; h.mw=mw; h.mh=mh;
}
function terrainAt(x,y){ const h=hole; if(x<0||y<0||x>=h.w||y>=h.H) return OOB; return h.map[((y*MAPS)|0)*h.mw + ((x*MAPS)|0)]; }
function placeTrees(h){
  const df=h.diff||0, r=mulberry32(h.seed*7+1), trees=(h.fixedTrees||[]).map(t=>({...t})), target=Math.round(h.H/42*(h.treeMul||1)*(0.8+df*0.9)), clear=16-df*8; let tries=0;
  while(trees.length<target && tries<3500){
    tries++;
    const t={x:30+r()*(h.w-60), y:30+r()*(h.H-60), r:17+r()*16};
    if(dist(t,h.tee)<170 || dist(t,h.green)<210) continue;
    let ok=terrainAt(t.x,t.y)===ROUGH;
    for(let k=0;k<10&&ok;k++){ const a=k/10*Math.PI*2; if(terrainAt(t.x+Math.cos(a)*(t.r+clear), t.y+Math.sin(a)*(t.r+clear))!==ROUGH) ok=false; }
    if(!ok || trees.some(o=>dist(o,t)<o.r+t.r-4)) continue;
    trees.push(t);
  }
  h.trees=trees;
}
function mk(w,h){ const c=document.createElement('canvas'); c.width=Math.ceil(w*VIS); c.height=Math.ceil(h*VIS); const g=c.getContext('2d'); g.setTransform(VIS,0,0,VIS,0,0); return [c,g]; }
// season dressing under the fairways (flowers, dry patches, snow) and on top (leaves, frost)
function seasonGround(g,h,r,SID){
  if(SID==='spring'){
    for(let i=0;i<h.H/4;i++){ const x=r()*h.w, y=r()*h.H, col=r()<.72?'#5d79d6':(r()<.5?'#f2f4f8':'#e48fb7'); g.fillStyle=col;
      for(let k=0;k<4;k++){ g.beginPath(); g.arc(x+(r()*2-1)*6, y+(r()*2-1)*6, 1.7, 0, 7); g.fill(); } }
  } else if(SID==='summer'){
    for(let i=0;i<h.H/35;i++){ const x=r()*h.w, y=r()*h.H, rad=40+r()*90, gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,'rgba(200,172,92,.32)'); gr.addColorStop(1,'rgba(200,172,92,0)'); g.fillStyle=gr; g.fillRect(x-rad,y-rad,rad*2,rad*2); }
  } else if(SID==='winter'){
    for(let i=0;i<h.H/18;i++){ const x=r()*h.w, y=r()*h.H, rad=30+r()*80, gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,'rgba(242,247,250,.42)'); gr.addColorStop(1,'rgba(242,247,250,0)'); g.fillStyle=gr; g.fillRect(x-rad,y-rad,rad*2,rad*2); }
  }
}
function seasonTop(g,h,r,SID){
  if(SID==='fall'){
    const cols=['#c4622d','#d88a2c','#a8432a','#d9b13e','#8a5a2b'];
    for(let i=0;i<h.H*0.9;i++){ const x=r()*h.w, y=r()*h.H, t=terrainAt(x,y), rot=r()*6.28, ci=(r()*cols.length)|0;
      if(t===WATER||t===GREEN||isSand(t)||(t===FAIR&&r()<0.85)||(isDesert(h)&&r()<0.75)) continue;
      g.save(); g.translate(x,y); g.rotate(rot); g.globalAlpha=0.85; g.fillStyle=cols[ci]; g.beginPath(); g.ellipse(0,0,3.4,1.8,0,0,7); g.fill(); g.restore(); }
  } else if(SID==='winter'){
    g.fillStyle='rgba(255,255,255,.32)';
    for(let i=0;i<h.w*h.H/80;i++) g.fillRect(r()*h.w, r()*h.H, 1.4, 1.4);
  }
}
function drawBunker(g,p,b,r,C){
  const m=Math.max(b.rx,b.ry)*1.3;
  g.save(); closedPath(g,p); g.fillStyle=C.sand; g.fill(); g.clip();
  for(let k=0;k<Math.min(900,m*m/14);k++){ g.fillStyle=r()<.5?'rgba(150,120,60,.28)':'rgba(255,255,240,.5)'; g.fillRect(b.x+(r()*2-1)*m, b.y+(r()*2-1)*m, 1.5,1.5); }
  closedPath(g,p); g.lineWidth=12; g.strokeStyle='rgba(140,110,50,.3)'; g.stroke(); g.restore();
  closedPath(g,p); g.lineWidth=2.5; g.strokeStyle=C.sandEdge; g.stroke();
}
// pot bunker: stacked-sod lip, deep shadow inside
function drawPot(g,p,b,r,C){
  for(let k=3;k>=1;k--){ closedPath(g, blobPts({...b, rx:b.rx+k*3.2, ry:b.ry+k*3.2})); g.fillStyle=k%2?'#4c5c31':'#68793f'; g.fill(); }
  const m=Math.max(b.rx,b.ry);
  g.save(); closedPath(g,p); g.fillStyle=C.sand; g.fill(); g.clip();
  for(let k=0;k<160;k++){ g.fillStyle=r()<.5?'rgba(150,120,60,.3)':'rgba(255,255,240,.45)'; g.fillRect(b.x+(r()*2-1)*m*1.2, b.y+(r()*2-1)*m*1.2, 1.4,1.4); }
  const gr=g.createRadialGradient(b.x+m*.18,b.y+m*.22,1,b.x,b.y,m*1.2); gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(0.5,'rgba(70,45,10,.14)'); gr.addColorStop(1,'rgba(40,25,5,.6)');
  g.fillStyle=gr; g.fillRect(b.x-m*1.4,b.y-m*1.4,m*2.8,m*2.8); g.restore();
}
// waste area: pale firm sand, scrub tufts, soft edge
function drawWaste(g,p,b,r,C){
  const m=Math.max(b.rx,b.ry)*1.25;
  g.save(); closedPath(g,p); g.fillStyle=C.waste||'#e6d8ae'; g.fill(); g.clip();
  for(let k=0;k<m*m/60;k++){ g.fillStyle=r()<.5?'rgba(150,120,70,.25)':'rgba(255,250,235,.45)'; g.fillRect(b.x+(r()*2-1)*m, b.y+(r()*2-1)*m, 1.6,1.6); }
  for(let k=0;k<m*m/900;k++){ const x=b.x+(r()*2-1)*m, y=b.y+(r()*2-1)*m, sz=2+r()*3.5; g.fillStyle=r()<.5?'#6f7a3e':'#8a8248'; for(let q=0;q<4;q++){ g.beginPath(); g.arc(x+(r()*2-1)*sz, y+(r()*2-1)*sz, sz*0.55,0,7); g.fill(); } }
  g.restore();
  closedPath(g,p); g.lineWidth=7; g.strokeStyle='rgba(230,216,174,.55)'; g.stroke();
}
function drawWater(g,p,b,r,C){
  const m=Math.max(b.rx,b.ry);
  g.save(); closedPath(g,p); const wg=g.createLinearGradient(b.x-m,b.y-m,b.x+m,b.y+m); wg.addColorStop(0,C.water2); wg.addColorStop(1,C.water); g.fillStyle=wg; g.fill(); g.clip();
  g.strokeStyle='rgba(255,255,255,.2)'; g.lineWidth=2; g.lineCap='round';
  for(let k=0;k<18;k++){ const x=b.x+(r()*2-1)*m*.8, y=b.y+(r()*2-1)*m*.8, rad=12+r()*22, a=-Math.PI*0.75+r()*0.4; g.beginPath(); g.arc(x,y,rad,a,a+0.9); g.stroke(); }
  closedPath(g,p); g.lineWidth=16; g.strokeStyle='rgba(8,36,64,.25)'; g.stroke(); g.restore();
  closedPath(g,p); g.lineWidth=4; g.strokeStyle=C.bank; g.stroke();
}
function drawDrop(g,d){
  g.save(); g.setLineDash([6,5]); g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=2.5; g.beginPath(); g.arc(d.x,d.y,24,0,7); g.stroke(); g.setLineDash([]);
  g.fillStyle='rgba(255,255,255,.95)'; g.font='700 13px "Barlow Condensed","Arial Narrow",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('DROP',d.x,d.y); g.restore();
}
// Big Bend dressing: sotol and lechuguilla rosettes, ocotillo, and boulders on the desert floor
function desertScrub(g,h,r){
  for(let i=0;i<h.H/7;i++){
    const x=r()*h.w, y=r()*h.H, kind=r(); if(terrainAt(x,y)!==ROUGH) continue;
    if(kind<0.45){ const n=9+((r()*6)|0), L=6+r()*7; g.strokeStyle=r()<.5?'#7f8a4c':'#97955a'; g.lineWidth=1.6; g.lineCap='round';
      g.beginPath(); for(let k=0;k<n;k++){ const a=k/n*Math.PI*2+r()*0.3; g.moveTo(x,y); g.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L); } g.stroke(); }
    else if(kind<0.6){ g.strokeStyle='#5d4a33'; g.lineWidth=1.4; g.lineCap='round'; g.beginPath(); for(let k=0;k<6;k++){ const a=r()*Math.PI*2, L=12+r()*12; g.moveTo(x,y); g.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L); } g.stroke();
      g.fillStyle='#c4472c'; for(let k=0;k<3;k++){ g.beginPath(); g.arc(x+(r()*2-1)*12,y+(r()*2-1)*12,1.6,0,7); g.fill(); } }
    else if(kind<0.82){ const R=4+r()*7; g.fillStyle='rgba(60,40,20,.28)'; g.beginPath(); g.ellipse(x+2,y+2.5,R,R*0.8,0,0,7); g.fill();
      g.fillStyle=r()<.5?'#9c8a72':'#b3a184'; g.beginPath(); g.ellipse(x,y,R,R*0.78,r()*3,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.18)'; g.beginPath(); g.arc(x-R*.3,y-R*.3,R*.4,0,7); g.fill(); }
    else { g.fillStyle='rgba(120,110,70,.5)'; for(let k=0;k<5;k++){ g.beginPath(); g.arc(x+(r()*2-1)*7,y+(r()*2-1)*7,2.4,0,7); g.fill(); } }
  }
}
function drawMesquite(g,t,r,C){
  g.fillStyle='rgba(50,30,10,.28)'; g.beginPath(); g.ellipse(t.x+t.r*.4,t.y+t.r*.5,t.r,t.r*.8,0.3,0,7); g.fill();
  g.strokeStyle='#4a3727'; g.lineWidth=2; g.lineCap='round'; g.beginPath(); for(let k=0;k<5;k++){ const a=k/5*Math.PI*2+r(); g.moveTo(t.x,t.y); g.lineTo(t.x+Math.cos(a)*t.r*.8,t.y+Math.sin(a)*t.r*.8); } g.stroke();
  for(let k=0;k<9;k++){ const a=r()*Math.PI*2, d=r()*t.r*.7; g.fillStyle=C.trees[(r()*C.trees.length)|0]; g.globalAlpha=0.85; g.beginPath(); g.arc(t.x+Math.cos(a)*d,t.y+Math.sin(a)*d,t.r*(0.28+r()*0.18),0,7); g.fill(); }
  g.globalAlpha=1;
}
