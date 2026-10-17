/* Fairway Tour · National course looks: palettes, trees, rough detail, and surroundings */
'use strict';
/* ---------- National course looks ---------- */
Object.assign(THEME_COL, {
  mountain: {outside:'#3d4a3e', rough:'#3f7a3a', cut:'#4f8d43', fair:'#5fae4a', tee:'#68b552', green:'#6fc257', green2:'#94d877', water:'#3a7fa8', water2:'#69abd0', trees:['#1f3a2a','#24412d','#1a3325']},
  cliffs:   {outside:'#1f5f8a', rough:'#6f9248', cut:'#7a9e50', fair:'#78ad4f', tee:'#80b456', water:'#24688f', water2:'#4a92c0', trees:['#2c4a2c','#33532f']},
  resort:   {outside:'#c9a774', rough:'#d4b483', cut:'#5ea548', fair:'#58b04a', tee:'#62b852', green:'#6cc456', green2:'#92dc74', waste:'#ead7a8', water:'#2f8fb0', water2:'#5fbad6', trees:['#6d8a3a','#7d9a44']},
  florida:  {outside:'#3f8f8a', rough:'#4f9a40', cut:'#5aa948', fair:'#6abd4f', tee:'#72c257', water:'#2a8f92', water2:'#5cc2bb', bank:'#c9e9d9', trees:['#3f7a2e','#4a8a35']},
  sandhills:{outside:'#cdb98c', rough:'#a8a065', cut:'#7da352', fair:'#70a84c', tee:'#78b052', waste:'#c9965c', trees:['#3d5a2c','#46663a']},
  heartland:{outside:'#2f4f2a', rough:'#2f6a2e', cut:'#3f7f3a', fair:'#5aa046', tee:'#64a84e', trees:['#24502a','#2a5a2e','#1f4625']},
  eastlinks:{outside:'#2a5e7e', rough:'#b6a565', cut:'#8aa35a', fair:'#80ad55', tee:'#88b45c', green:'#86bf60', green2:'#a8d580', sand:'#efe3bb', water:'#2a5e7e', water2:'#4f86a6', trees:['#556b38','#617840']},
});
const shadowAt=(g,t,k=1)=>{ g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(t.x+t.r*.4*k,t.y+t.r*.5*k,t.r,t.r*.8,0.3,0,7); g.fill(); };
// Rocky Mountain fir: layered star
function drawFir(g,t,r,C){ shadowAt(g,t,1.2);
  [[1,C.trees[0]],[0.7,C.trees[1]||C.trees[0]],[0.4,shade(C.trees[0],0.12)]].forEach(([k,col])=>{ g.fillStyle=col; g.beginPath(); const n=10, R=t.r*k, ph=r();
    for(let i=0;i<n*2;i++){ const a=i/(n*2)*Math.PI*2+ph, d=i%2?R*.55:R; g.lineTo(t.x+Math.cos(a)*d,t.y+Math.sin(a)*d); } g.closePath(); g.fill(); }); }
// Monterey cypress: flat, windswept, leaning one way
function drawCypressM(g,t,r,C){ shadowAt(g,t);
  const lean=-0.6; g.fillStyle=C.trees[(r()*C.trees.length)|0];
  for(let k=0;k<6;k++){ const d=(k/5-0.3)*t.r*1.3, x=t.x+Math.cos(lean)*d+(r()*2-1)*4, y=t.y+Math.sin(lean)*d+(r()*2-1)*6; g.beginPath(); g.ellipse(x,y,t.r*.55,t.r*.32,lean,0,7); g.fill(); }
  g.fillStyle='rgba(180,210,140,.16)'; g.beginPath(); g.ellipse(t.x-4,t.y-4,t.r*.5,t.r*.22,lean,0,7); g.fill(); }
// saguaro seen from above: ribbed crown, arms, long shadow
function drawSaguaro(g,t,r,C){
  const R=Math.max(7,t.r*.36); g.fillStyle='rgba(60,35,15,.3)'; g.beginPath(); g.ellipse(t.x+R*2.2,t.y+R*1.6,R*2.6,R*.7,0.55,0,7); g.fill();
  const arms=1+((r()*3)|0);
  for(let i=0;i<arms;i++){ const a=r()*Math.PI*2, d=R*1.7; g.strokeStyle='#3f6b33'; g.lineWidth=R*.9; g.lineCap='round'; g.beginPath(); g.moveTo(t.x,t.y); g.lineTo(t.x+Math.cos(a)*d,t.y+Math.sin(a)*d); g.stroke();
    g.fillStyle='#4f8040'; g.beginPath(); g.arc(t.x+Math.cos(a)*d,t.y+Math.sin(a)*d,R*.55,0,7); g.fill(); }
  g.fillStyle='#4a7a3c'; g.beginPath(); g.arc(t.x,t.y,R,0,7); g.fill();
  g.strokeStyle='rgba(200,230,170,.45)'; g.lineWidth=1; for(let k=0;k<8;k++){ const a=k/8*Math.PI*2; g.beginPath(); g.moveTo(t.x,t.y); g.lineTo(t.x+Math.cos(a)*R,t.y+Math.sin(a)*R); g.stroke(); } }
// palm: fronds radiating from a brown crown
function drawPalm(g,t,r,C){
  g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.arc(t.x+t.r*.5,t.y+t.r*.6,t.r*.85,0,7); g.fill();
  const n=8+((r()*3)|0), ph=r()*6;
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+ph+(r()*2-1)*0.15, L=t.r*(0.9+r()*0.25), ex=t.x+Math.cos(a)*L, ey=t.y+Math.sin(a)*L, nx=-Math.sin(a)*t.r*.22, ny=Math.cos(a)*t.r*.22;
    g.fillStyle=i%2?C.trees[0]:(C.trees[1]||C.trees[0]); g.beginPath(); g.moveTo(t.x,t.y); g.quadraticCurveTo((t.x+ex)/2+nx,(t.y+ey)/2+ny,ex,ey); g.quadraticCurveTo((t.x+ex)/2-nx*0.3,(t.y+ey)/2-ny*0.3,t.x,t.y); g.fill(); }
  g.fillStyle='#7a5a32'; g.beginPath(); g.arc(t.x,t.y,t.r*.16,0,7); g.fill(); }
// longleaf pine: open tufts of needles
function drawLongleaf(g,t,r,C){ shadowAt(g,t);
  g.fillStyle=C.trees[0]; g.globalAlpha=0.55; g.beginPath(); g.arc(t.x,t.y,t.r*.72,0,7); g.fill(); g.globalAlpha=1;
  for(let k=0;k<6;k++){ const a=r()*Math.PI*2, d=r()*t.r*.55, x=t.x+Math.cos(a)*d, y=t.y+Math.sin(a)*d; g.strokeStyle=C.trees[(r()*C.trees.length)|0]; g.lineWidth=2; g.lineCap='round'; g.beginPath();
    for(let q=0;q<12;q++){ const b=q/12*Math.PI*2; g.moveTo(x,y); g.lineTo(x+Math.cos(b)*t.r*.42,y+Math.sin(b)*t.r*.42); } g.stroke(); }
  g.fillStyle='rgba(120,80,40,.6)'; g.beginPath(); g.arc(t.x,t.y,2.5,0,7); g.fill(); }
const NAT_TREE = {mountain:drawFir, cliffs:drawCypressM, resort:drawSaguaro, florida:drawPalm, sandhills:drawLongleaf};
// extra texture in the rough so each place reads differently up close
function roughDetail(g,h,r){
  const th=h.theme, tuft=(x,y,L,n,col,w)=>{ g.strokeStyle=col; g.lineWidth=w; g.lineCap='round'; g.beginPath(); for(let k=0;k<n;k++){ const a=-Math.PI/2+(r()*2-1)*0.9; g.moveTo(x,y); g.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L); } g.stroke(); };
  for(let i=0;i<h.H/5;i++){ const x=r()*h.w, y=r()*h.H; if(terrainAt(x,y)!==ROUGH) continue;
    if(th==='eastlinks') tuft(x,y,8+r()*7,6,r()<.5?'#d8c88a':'#9c8a4c',1.6);
    else if(th==='sandhills'){ if(r()<.55) tuft(x,y,7+r()*5,8,'#8a8a4a',1.4); else { g.fillStyle='rgba(190,120,60,.45)'; g.fillRect(x,y,5+r()*7,1.6); } }
    else if(th==='heartland'){ if(r()<.6){ g.fillStyle='rgba(10,40,12,.4)'; g.fillRect(x,y,2,5); } }
    else if(th==='mountain'){ if(r()<.08){ const R=3+r()*6; g.fillStyle='#8a8f94'; g.beginPath(); g.ellipse(x,y,R,R*.8,r()*3,0,7); g.fill(); } else if(r()<.3) { g.fillStyle=r()<.5?'#e7d24a':'#c95aa0'; g.beginPath(); g.arc(x,y,1.6,0,7); g.fill(); } }
    else if(th==='florida'){ if(r()<.25) tuft(x,y,6,7,'#3c7a30',1.4); }
    else if(th==='cliffs'){ if(r()<.3){ g.fillStyle=r()<.6?'#a6b852':'#d2569a'; g.beginPath(); g.arc(x,y,2,0,7); g.fill(); } } }
}
// a crowned green sheds the ball toward its edges
function crownGreen(h){ const G=h.green, s=h.slope; s.mx=G.x; s.my=G.y; s.sig=0.55*Math.min(G.rx,G.ry); s.A=(16+h.diff*16)*s.sig/0.607; s.tx*=0.4; s.ty*=0.4; s.steps=[]; }
const NAT_SUR = {
  mountain({g,h,r,C,area,dOut,W,HH}){
    const outer='#6c7177'; g.fillStyle=outer; g.fillRect(-SMX,-SMY,W,HH);
    area((x,y,d)=>{ g.fillStyle=r()<.5?'rgba(40,40,45,.2)':'rgba(220,220,225,.14)'; g.fillRect(x,y,6,6); }, 24);
    for(let i=0;i<34;i++){ const x=-SMX+r()*W, y=-SMY+r()*HH; if(dOut(x,y)<640) continue; const m={x,y,rx:200+r()*260,ry:150+r()*200,rot:r()*3,seed:(r()*1e6)|0};
      closedPath(g,blobPts({...m,x:x+50,y:y+60})); g.fillStyle='rgba(20,20,25,.3)'; g.fill(); closedPath(g,blobPts(m)); g.fillStyle='#868b91'; g.fill();
      closedPath(g,blobPts({...m,rx:m.rx*.48,ry:m.ry*.42,seed:m.seed+1})); g.fillStyle='#f2f5f7'; g.fill(); }
    ring(g,h,560,'#2b4030',140); ring(g,h,70,C.rough,60);
    area((x,y,d)=>{ if(d>40 && d<600 && r()<0.03){ g.fillStyle=r()<.5?'#e7d24a':'#c95aa0'; g.beginPath(); g.arc(x,y,2,0,7); g.fill(); } }, 12);
    area((x,y,d)=>{ const p=clamp((d-50)/220,0,1)*(d<620?0.95:0.15); if(r()<p) drawFir(g,{x,y,r:18+r()*14},r,C); }, 34);
    return outer; },
  cliffs({g,h,r,C,area,dOut}){
    const outer=C.water; g.fillStyle=outer; g.fillRect(-SMX,-SMY,h.w+SMX*2,h.H+SMY*2);
    g.strokeStyle='rgba(255,255,255,.2)'; g.lineWidth=3; g.lineCap='round';
    area((x,y,d)=>{ if(d>330 && r()<0.5){ g.beginPath(); g.arc(x,y,20+r()*30,-2.4,-1.4); g.stroke(); } }, 70);
    ring(g,h,300,'#e9f3f5',18);
    area((x,y,d)=>{ if(d>250 && d<330 && r()<0.5){ const R=10+r()*22; g.fillStyle=r()<.5?'#5b4e42':'#6e6052'; g.beginPath(); g.ellipse(x,y,R,R*.7,r()*3,0,7); g.fill(); } }, 22);
    ring(g,h,265,'#6e5f50',22); ring(g,h,240,'#8a7a62',20); ring(g,h,215,'#7d9a52',50);
    area((x,y,d)=>{ if(d>70 && d<220 && r()<0.4){ g.fillStyle=r()<.7?'rgba(160,180,80,.45)':'rgba(210,86,154,.6)'; g.beginPath(); g.arc(x,y,3+r()*3,0,7); g.fill(); } }, 16);
    ring(g,h,70,C.rough,50);
    area((x,y,d)=>{ if(d>40 && d<210 && r()<0.08) drawCypressM(g,{x,y,r:22+r()*14},r,C); }, 50);
    return outer; },
  resort({g,h,r,C,area,dOut,W,HH}){
    const outer='#d4b07a'; g.fillStyle=outer; g.fillRect(-SMX,-SMY,W,HH);
    area((x,y,d)=>{ g.fillStyle=r()<.5?'rgba(150,100,50,.16)':'rgba(250,235,200,.16)'; g.fillRect(x,y,5,5); }, 20);
    for(let i=0;i<26;i++){ const x=-SMX+r()*W, y=-SMY+r()*HH; if(dOut(x,y)<620) continue; const m={x,y,rx:190+r()*240,ry:130+r()*170,rot:r()*3,seed:(r()*1e6)|0};
      closedPath(g,blobPts({...m,x:x+40,y:y+50})); g.fillStyle='rgba(70,35,30,.3)'; g.fill(); closedPath(g,blobPts(m)); g.fillStyle='#9a5e52'; g.fill(); closedPath(g,blobPts({...m,rx:m.rx*.8,ry:m.ry*.8})); g.fillStyle='#ad7062'; g.fill(); }
    ring(g,h,110,C.rough,80);
    area((x,y,d)=>{ if(d<40) return; const k=r();
      if(k<0.07) drawSaguaro(g,{x,y,r:20+r()*10},r,C);
      else if(k<0.16){ const R=5+r()*9; g.fillStyle='rgba(60,40,20,.28)'; g.beginPath(); g.ellipse(x+3,y+4,R,R*.8,0,0,7); g.fill(); g.fillStyle=r()<.5?'#b8875e':'#c99a6e'; g.beginPath(); g.ellipse(x,y,R,R*.78,r()*3,0,7); g.fill(); }
      else if(k<0.22){ g.fillStyle='#93a84e'; for(let q=0;q<6;q++){ g.beginPath(); g.arc(x+(r()*2-1)*12,y+(r()*2-1)*12,4,0,7); g.fill(); } } }, 46);
    return outer; },
  florida({g,h,r,C,area}){
    const outer=C.water; g.fillStyle=outer; g.fillRect(-SMX,-SMY,h.w+SMX*2,h.H+SMY*2);
    area((x,y,d)=>{ if(d>330 && r()<0.08){ g.fillStyle='#4f9a52'; g.beginPath(); g.arc(x,y,5+r()*5,0.4,Math.PI*2-0.3); g.lineTo(x,y); g.fill(); } }, 40);
    area((x,y,d)=>{ if(d>360 && d<520 && r()<0.012){ g.fillStyle='#3d4a2c'; g.beginPath(); g.ellipse(x,y,26,6,r()*3,0,7); g.fill(); } }, 60);
    ring(g,h,310,'#e6dcc0',22); ring(g,h,285,'#5f9a4a',60);
    area((x,y,d)=>{ if(d>290 && d<330 && r()<0.05){ g.fillStyle='#f6f6f2'; g.beginPath(); g.arc(x,y,3,0,7); g.fill(); } }, 30);
    ring(g,h,70,C.rough,60);
    area((x,y,d)=>{ const p=clamp((d-60)/160,0,1)*(d<280?0.4:0); if(r()<p) drawPalm(g,{x,y,r:20+r()*10},r,C); }, 44);
    return outer; },
  sandhills({g,h,r,C,area,W,HH}){
    const outer='#d6c497'; g.fillStyle=outer; g.fillRect(-SMX,-SMY,W,HH);
    area((x,y,d)=>{ if(r()<0.5){ g.fillStyle='rgba(190,120,60,.35)'; g.fillRect(x,y,8+r()*10,2); } else if(r()<0.4){ g.strokeStyle='#8a8a4a'; g.lineWidth=1.5; g.beginPath(); for(let q=0;q<8;q++){ const a=-Math.PI/2+(r()*2-1)*0.9; g.moveTo(x,y); g.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9); } g.stroke(); } }, 18);
    ring(g,h,80,C.rough,60);
    area((x,y,d)=>{ const p=clamp((d-60)/200,0,1)*0.6; if(r()<p) drawLongleaf(g,{x,y,r:26+r()*12},r,C); }, 48);
    return outer; },
  heartland({g,h,r,C,area,dOut,W,HH}){
    const outer='#9aa64e'; g.fillStyle=outer; g.fillRect(-SMX,-SMY,W,HH);
    const cols=['#c9b45a','#8fa548','#6f9440','#d2c070','#a3b356'];
    for(let y=-SMY; y<h.H+SMY; y+=260) for(let x=-SMX; x<h.w+SMX; x+=320){ const col=cols[(r()*cols.length)|0]; g.fillStyle=col; g.fillRect(x+6,y+6,308,248);
      g.strokeStyle='rgba(60,50,20,.18)'; g.lineWidth=3; const vert=r()<.5; for(let q=12;q<(vert?308:248);q+=14){ g.beginPath(); if(vert){ g.moveTo(x+6+q,y+6); g.lineTo(x+6+q,y+254); } else { g.moveTo(x+6,y+6+q); g.lineTo(x+314,y+6+q); } g.stroke(); } }
    for(let i=0;i<3;i++){ const x=-SMX*0.7+r()*W*0.9, y=-SMY*0.7+r()*HH*0.9; if(dOut(x,y)<420) continue;
      g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+8,y+8,60,40); g.fillStyle='#a33a2a'; g.fillRect(x,y,60,40); g.fillStyle='#7a2a1e'; g.fillRect(x,y+18,60,4);
      g.fillStyle='#c9c9c4'; g.beginPath(); g.arc(x+76,y+20,14,0,7); g.fill(); g.fillStyle='#9a9a94'; g.beginPath(); g.arc(x+76,y+20,6,0,7); g.fill(); }
    ring(g,h,300,'#2c5a2a',60); ring(g,h,70,C.rough,60);
    area((x,y,d)=>{ const p=clamp((d-50)/150,0,1)*(d<300?0.95:0); if(r()<p) lowTree(g,x,y,24+r()*14,C.trees[(r()*C.trees.length)|0],r); }, 40);
    return outer; },
  eastlinks({g,h,r,C,area,dOut,W,HH}){
    const outer=C.water; g.fillStyle=outer; g.fillRect(-SMX,-SMY,W,HH);
    g.strokeStyle='rgba(255,255,255,.2)'; g.lineWidth=3; g.lineCap='round';
    area((x,y,d)=>{ if(d>600 && r()<0.5){ g.beginPath(); g.arc(x,y,20+r()*30,-2.4,-1.4); g.stroke(); } }, 70);
    ring(g,h,560,'#efe3bb',70); ring(g,h,460,'#c4b26c',90);
    area((x,y,d)=>{ if(d>30 && d<480){ g.strokeStyle=r()<.5?'#d8c88a':'#9c8a4c'; g.lineWidth=2; g.beginPath(); for(let k=0;k<6;k++){ const a=-Math.PI/2+(r()*2-1)*0.9; g.moveTo(x,y); g.lineTo(x+Math.cos(a)*13,y+Math.sin(a)*13); } g.stroke(); } }, 22);
    for(let i=0;i<4;i++){ const x=-SMX*0.6+r()*W*0.8, y=-SMY*0.6+r()*HH*0.8, d=dOut(x,y); if(d<160||d>440) continue;
      g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+6,y+8,46,34); g.fillStyle='#7d838a'; g.fillRect(x,y,46,34); g.fillStyle='#646a70'; g.fillRect(x,y+15,46,4); }
    { let wx=0, wy=0; for(let i=0;i<40;i++){ wx=-SMX*0.5+r()*W*0.7; wy=-SMY*0.5+r()*HH*0.7; const d=dOut(wx,wy); if(d>200&&d<420) break; }
      g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.arc(wx+8,wy+10,20,0,7); g.fill(); g.fillStyle='#8a8f94'; g.beginPath(); g.arc(wx,wy,20,0,7); g.fill();
      g.strokeStyle='#e6e0d2'; g.lineWidth=7; const a0=0.4; for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2; g.beginPath(); g.moveTo(wx,wy); g.lineTo(wx+Math.cos(a)*52,wy+Math.sin(a)*52); g.stroke(); } }
    ring(g,h,60,C.rough,50);
    return outer; },
};

function pal(h){ const base={...COL, ...SEASON_COL[season().col||season().id]}, hh=h||hole, th=hh&&hh.theme; return th==='desert'||th==='resort' ? {...base, ...DESERT_COL, ...(THEME_COL[th]||{})} : th&&THEME_COL[th] ? {...base, ...THEME_COL[th]} : base; }
function fricOf(t){ const T=TER[t]||TER[FAIR]; return T.fric*((season().fric||{})[t]||1)*(t===ROUGH&&isDesert(hole)?0.8:1)*(t===ROUGH&&hole&&hole.roughFric||1); }
function rec(id){ return save.events[id] || (save.events[id]={played:0,wins:0,bestFinish:null,bestScore:null}); }
