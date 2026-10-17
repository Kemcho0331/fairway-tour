/* Fairway Tour · Scenery past the out-of-bounds stakes for every Texas setting */
'use strict';
/* ---------- Surroundings past the out-of-bounds line ----------
   Drawn once per hole at low detail: longer rough, then woods that thicken the farther out you look.
   Each course gets its own setting (pines, coast, hill country, desert, azaleas). */
const SMX=2000, SMY=800, SS=0.4;
function shade(hex, k){ const n=parseInt(hex.slice(1),16); let r=n>>16, g=(n>>8)&255, b=n&255; const f=v=>Math.round(clamp(k<0?v*(1+k):v+(255-v)*k,0,255)); return '#'+((1<<24)|(f(r)<<16)|(f(g)<<8)|f(b)).toString(16).slice(1); }
// a soft, wavy band around the hole so the edges of each zone never read as a box
function wobblyRect(g,h,e,amp,ph){
  const pts=[], W=h.w+2*e, H=h.H+2*e, step=40, n=(sv)=>amp*(Math.sin(sv*0.009+ph)*0.6+Math.sin(sv*0.023+ph*2.3)*0.4);
  let sv=0;
  for(let x=-e;x<h.w+e;x+=step,sv+=step) pts.push([x, -e-n(sv)]);
  for(let y=-e;y<h.H+e;y+=step,sv+=step) pts.push([h.w+e+n(sv), y]);
  for(let x=h.w+e;x>-e;x-=step,sv+=step) pts.push([x, h.H+e+n(sv)]);
  for(let y=h.H+e;y>-e;y-=step,sv+=step) pts.push([-e-n(sv), y]);
  closedPath(g,pts);
}
function ring(g,h,inf,color,soft){ const ph=(h.seed%97)*0.37+inf*0.01; g.fillStyle=color; for(let k=0;k<5;k++){ const e=inf+soft*(1-k/5); g.globalAlpha=k===4?1:0.2; wobblyRect(g,h,e,Math.min(70,soft*0.6+inf*0.12),ph); g.fill(); } g.globalAlpha=1; }
function lowTree(g,x,y,R,col,r,pine){
  g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x+R*.35,y+R*.45,R,R*.82,0.3,0,7); g.fill();
  g.fillStyle=col;
  if(pine){ g.beginPath(); for(let k=0;k<16;k++){ const a=k/16*Math.PI*2, d=k%2?R*.55:R; g.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d); } g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.07)'; g.beginPath(); g.arc(x-R*.2,y-R*.2,R*.35,0,7); g.fill(); return; }
  g.beginPath(); g.arc(x,y,R*.8,0,7); g.fill();
  for(let k=0;k<3;k++){ const a=r()*6.28; g.beginPath(); g.arc(x+Math.cos(a)*R*.4,y+Math.sin(a)*R*.4,R*.55,0,7); g.fill(); }
  g.fillStyle='rgba(255,255,255,.09)'; g.beginPath(); g.arc(x-R*.3,y-R*.3,R*.4,0,7); g.fill();
}
function buildSurround(h){
  const W=h.w+SMX*2, HH=h.H+SMY*2, c=document.createElement('canvas'); c.width=Math.ceil(W*SS); c.height=Math.ceil(HH*SS);
  const g=c.getContext('2d'); g.setTransform(SS,0,0,SS,SMX*SS,SMY*SS);
  const r=mulberry32(h.seed*13+5), C=pal(h), SID=season().col||season().id, kind=h.surround||'forest';
  const dOut=(x,y)=>{ const dx=Math.max(0,-x,x-h.w), dy=Math.max(0,-y,y-h.H); return Math.hypot(dx,dy); };
  const area=(fn,step)=>{ for(let y=-SMY; y<h.H+SMY; y+=step) for(let x=-SMX; x<h.w+SMX; x+=step){ const jx=x+r()*step, jy=y+r()*step, d=dOut(jx,jy); if(d>0) fn(jx,jy,d); } };
  let outer;
  if(NAT_SUR[kind]) outer=NAT_SUR[kind]({g,h,r,C,area,dOut,W,HH,SID});
  else if(kind==='links'){
    outer=C.water||'#2c70a4';
    g.fillStyle=outer; g.fillRect(-SMX,-SMY,W,HH);
    g.strokeStyle='rgba(255,255,255,.2)'; g.lineWidth=3; g.lineCap='round';
    area((x,y,d)=>{ if(d>620 && r()<0.5){ g.beginPath(); g.arc(x,y,20+r()*30,-2.4,-1.4); g.stroke(); } }, 70);
    ring(g,h,580,'#e9dcb0',70);
    ring(g,h,470,'#b8b073',90);
    area((x,y,d)=>{ if(d>60 && d<480 && r()<0.18){ const R=40+r()*70, gr=g.createRadialGradient(x-R*.3,y-R*.3,0,x,y,R); gr.addColorStop(0,'rgba(255,245,200,.22)'); gr.addColorStop(1,'rgba(70,60,30,.18)'); g.fillStyle=gr; g.beginPath(); g.ellipse(x,y,R,R*.7,r()*3,0,7); g.fill(); } }, 70);
    area((x,y,d)=>{ if(d>30 && d<500){ g.strokeStyle=r()<.5?'#8d8a52':'#b3ab6a'; g.lineWidth=2; g.beginPath(); for(let k=0;k<5;k++){ const a=-Math.PI/2+(r()*2-1)*0.9; g.moveTo(x,y); g.lineTo(x+Math.cos(a)*11,y+Math.sin(a)*11); } g.stroke(); } }, 24);
    ring(g,h,60,C.rough,50);
  } else if(kind==='bayou'){
    outer='#35594a';
    g.fillStyle=outer; g.fillRect(-SMX,-SMY,W,HH);
    area((x,y,d)=>{ g.fillStyle=r()<.5?'rgba(120,150,80,.25)':'rgba(20,40,30,.25)'; g.fillRect(x,y,6,3); }, 20);
    ring(g,h,230,'#56743f',90);
    ring(g,h,90,C.rough,60);
    area((x,y,d)=>{ if(d>240 && r()<0.22){ g.fillStyle='#5f8c45'; g.beginPath(); g.arc(x,y,6+r()*6,0.4,Math.PI*2-0.2); g.lineTo(x,y); g.fill(); if(r()<.2){ g.fillStyle='#f2eef0'; g.beginPath(); g.arc(x+3,y-3,2.5,0,7); g.fill(); } } }, 46);
    area((x,y,d)=>{ const p=clamp((d-70)/300,0,1)*0.55; if(r()<p){ const t={x,y,r:20+r()*14}; g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x+6,y+8,t.r,t.r*.75,0.3,0,7); g.fill(); drawCypress(g,t,r,C); } }, 44);
  } else if(kind==='plains'){
    outer='#c8b26a';
    g.fillStyle=outer; g.fillRect(-SMX,-SMY,W,HH);
    g.strokeStyle='rgba(150,120,60,.22)'; g.lineWidth=6;
    for(let x=-SMX-HH; x<h.w+SMX; x+=34){ g.beginPath(); g.moveTo(x,-SMY); g.lineTo(x+HH*0.35,h.H+SMY); g.stroke(); }
    ring(g,h,170,'#a9a560',70);
    ring(g,h,70,C.rough,50);
    g.strokeStyle='rgba(90,70,40,.6)'; g.lineWidth=2; wobblyRect(g,h,200,10,1.3); g.stroke();
    g.fillStyle='#5b4630'; area((x,y,d)=>{ if(Math.abs(d-200)<14) { g.beginPath(); g.arc(x,y,3,0,7); g.fill(); } }, 60);
    for(let i=0;i<5;i++){ const x=-SMX*0.6+r()*(W*0.9), y=-SMY*0.6+r()*(HH*0.9); if(dOut(x,y)<320) continue;
      g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x+10,y+12,10,5,0.4,0,7); g.fill(); g.strokeStyle='#6d6a66'; g.lineWidth=4; g.beginPath(); g.moveTo(x,y); g.lineTo(x+8,y+10); g.stroke();
      g.strokeStyle='#dcd8cf'; g.lineWidth=3; const a0=r()*Math.PI; for(let k=0;k<6;k++){ const a=a0+k/6*Math.PI*2; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*22,y+Math.sin(a)*22); g.stroke(); } }
    area((x,y,d)=>{ if(d>260 && r()<0.035) lowTree(g,x,y,16+r()*10,C.trees[(r()*C.trees.length)|0],r); }, 50);
  } else if(kind==='coast'){
    outer=C.water;
    g.fillStyle=outer; g.fillRect(-SMX,-SMY,W,HH);
    g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=3; g.lineCap='round';
    area((x,y,d)=>{ if(d>420 && r()<0.5){ g.beginPath(); g.arc(x,y,20+r()*30,-2.4,-1.4); g.stroke(); } }, 70);
    ring(g,h,380,'#e9dcb0',60);
    area((x,y,d)=>{ if(d>230 && d<380 && r()<0.6){ g.fillStyle='rgba(170,140,90,.25)'; g.fillRect(x,y,26,3); } }, 40);
    ring(g,h,240,'#b5ae76',70);
    area((x,y,d)=>{ if(d>90 && d<260){ g.strokeStyle=r()<.5?'#8d8a52':'#a6a066'; g.lineWidth=2; g.beginPath(); for(let k=0;k<5;k++){ const a=-Math.PI/2+(r()*2-1)*0.8; g.moveTo(x,y); g.lineTo(x+Math.cos(a)*10,y+Math.sin(a)*10); } g.stroke(); } }, 26);
    ring(g,h,100,C.rough,60);
    area((x,y,d)=>{ if(d>40 && d<200 && r()<0.06) lowTree(g,x,y,14+r()*10,'#55703a',r); }, 60);
  } else if(kind==='desert'){
    outer=shade(C.rough,-0.07);
    g.fillStyle=outer; g.fillRect(-SMX,-SMY,W,HH);
    ring(g,h,120,C.rough,90);
    area((x,y,d)=>{ g.fillStyle=r()<.5?'rgba(110,75,40,.18)':'rgba(245,225,185,.16)'; g.fillRect(x,y,5,5); }, 22);
    for(let i=0;i<40;i++){ const x=-SMX+r()*W, y=-SMY+r()*HH;
      if(dOut(x,y)<520) continue; const m={x,y,rx:180+r()*220,ry:120+r()*160,rot:r()*3,seed:(r()*1e6)|0};
      const sh={...m,x:m.x+40,y:m.y+50}; closedPath(g,blobPts(sh)); g.fillStyle='rgba(60,30,15,.35)'; g.fill();
      closedPath(g,blobPts(m)); g.fillStyle='#a9643c'; g.fill(); closedPath(g,blobPts({...m,rx:m.rx*0.82,ry:m.ry*0.82})); g.fillStyle='#bd7d50'; g.fill(); }
    area((x,y,d)=>{ if(d<40) return; const k=r();
      if(k<0.18){ const R=5+r()*10; g.fillStyle='rgba(60,40,20,.28)'; g.beginPath(); g.ellipse(x+3,y+4,R,R*.8,0,0,7); g.fill(); g.fillStyle=r()<.5?'#9c8a72':'#b3a184'; g.beginPath(); g.ellipse(x,y,R,R*.78,r()*3,0,7); g.fill(); }
      else if(k<0.34){ g.strokeStyle=r()<.5?'#7f8a4c':'#97955a'; g.lineWidth=2; g.beginPath(); for(let q=0;q<10;q++){ const a=q/10*Math.PI*2; g.moveTo(x,y); g.lineTo(x+Math.cos(a)*10,y+Math.sin(a)*10); } g.stroke(); }
      else if(k<0.40) drawMesquite(g,{x,y,r:16+r()*10},r,C); }, 48);
  } else {
    const pine=kind==='pines', hill=kind==='hill';
    const cols=pine?['#1e3b25','#234528','#19331f']:hill?['#4d6a34','#567540','#435f2e']:C.trees;
    outer=shade(cols[0], -0.25);
    g.fillStyle=outer; g.fillRect(-SMX,-SMY,W,HH);
    ring(g,h,320,shade(C.rough,-0.3),120);
    ring(g,h,170,shade(C.rough,-0.14),90);
    ring(g,h,70,C.rough,60);
    area((x,y,d)=>{ g.fillStyle=r()<.5?'rgba(10,30,12,.3)':'rgba(170,200,120,.12)'; g.fillRect(x,y,5,5); }, 30);
    area((x,y,d)=>{ if(d>420) return; const rad=60+r()*150, gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0, r()<.5?'rgba(22,58,24,.22)':'rgba(120,170,85,.15)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-rad,y-rad,rad*2,rad*2); }, 150);
    if(SID==='spring') area((x,y,d)=>{ if(d<260 && r()<0.35){ g.fillStyle=r()<.75?'#5d79d6':'#f2f4f8'; for(let k=0;k<4;k++){ g.beginPath(); g.arc(x+(r()*2-1)*6,y+(r()*2-1)*6,2,0,7); g.fill(); } } }, 30);
    if(hill) area((x,y,d)=>{ if(d>50 && d<700 && r()<0.06){ const m={x,y,rx:22+r()*40,ry:14+r()*24,rot:r()*3,seed:(r()*1e6)|0}; closedPath(g,blobPts({...m,x:x+5,y:y+6})); g.fillStyle='rgba(30,30,20,.3)'; g.fill(); closedPath(g,blobPts(m)); g.fillStyle='#cfc8b3'; g.fill(); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(x-m.rx*.4,y-m.ry*.3,m.rx*.6,3); } }, 60);
    if(kind==='azalea') area((x,y,d)=>{ if(d>70 && d<340 && r()<0.16){ const col=['#e05a9a','#f08cbc','#f4f0f2','#c93a7a'][(r()*4)|0]; for(let q=0;q<3+((r()*3)|0);q++){ const bx=x+(r()*2-1)*22, by=y+(r()*2-1)*22, R=8+r()*8; g.fillStyle='rgba(0,0,0,.22)'; g.beginPath(); g.arc(bx+3,by+4,R,0,7); g.fill(); g.fillStyle=col; g.beginPath(); g.arc(bx,by,R,0,7); g.fill(); } } }, 40);
    area((x,y,d)=>{ const p=clamp((d-(pine?50:80))/240,0,1); if(r()<p*0.95) lowTree(g,x,y,(pine?19:22)+r()*15+Math.min(10,d/80),cols[(r()*cols.length)|0],r,pine); }, pine?33:40);
  }
  if(SID==='winter'){ area((x,y,d)=>{ if(r()<0.5){ const rad=30+r()*70, gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,'rgba(242,247,250,.45)'); gr.addColorStop(1,'rgba(242,247,250,0)'); g.fillStyle=gr; g.fillRect(x-rad,y-rad,rad*2,rad*2); } }, 160); }
  h.surOuter=outer;
  return c;
}
function buildVisual(h){
  const [c,g]=mk(h.w,h.H), r=mulberry32(h.seed), C=pal(h), SID=season().col||season().id, DES=isDesert(h);
  g.fillStyle=C.rough; g.fillRect(0,0,h.w,h.H);
  for(let i=0;i<Math.round(h.H/30);i++){ const x=r()*h.w, y=r()*h.H, rad=60+r()*150; const gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0, DES ? (r()<.5?'rgba(150,100,50,.22)':'rgba(236,210,160,.22)') : (r()<.5?'rgba(22,58,24,.22)':'rgba(120,170,85,.15)')); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-rad,y-rad,rad*2,rad*2); }
  const n=Math.floor(h.w*h.H/28);
  for(let i=0;i<n;i++){ g.fillStyle=DES ? (r()<.5?'rgba(110,75,40,.35)':'rgba(245,225,185,.3)') : (r()<.5?'rgba(16,44,18,.32)':'rgba(150,196,104,.2)'); g.fillRect(r()*h.w,r()*h.H,1.6,1.6); }
  seasonGround(g,h,r,SID);
  h.waterPts.forEach((p,i)=>{ if(h.water[i].base) drawWater(g,p,h.water[i],r,C); });
  g.lineCap=g.lineJoin='round'; g.strokeStyle=C.cut; g.fillStyle=C.cut;
  for(const f of h.fairway){ g.lineWidth=f.w+26; openPath(g,f.pts); g.stroke(); }
  closedPath(g, blobPts({...h.green, rx:h.green.rx+32, ry:h.green.ry+32})); g.fill();
  rrect(g,h.tee.x-64,h.tee.y-44,128,88,16); g.fill();
  const [fc,fg]=mk(h.w,h.H);
  fg.lineCap=fg.lineJoin='round'; fg.strokeStyle=C.fair; fg.fillStyle=C.fair;
  for(const f of h.fairway){ fg.lineWidth=f.w; openPath(fg,f.pts); fg.stroke(); }
  closedPath(fg,h.fringePts); fg.fill();
  fg.fillStyle=C.tee; rrect(fg,h.tee.x-55,h.tee.y-35,110,70,10); fg.fill();
  fg.globalCompositeOperation='source-atop'; fg.fillStyle='rgba(255,255,255,.075)';
  for(let y=0;y<h.H;y+=64) fg.fillRect(0,y,h.w,32);
  g.drawImage(fc,0,0,h.w,h.H);
  [[-38,-22],[38,-22]].forEach(([dx,dy])=>{ g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.arc(h.tee.x+dx+2,h.tee.y+dy+2,6,0,7); g.fill(); g.fillStyle=C.flag; g.beginPath(); g.arc(h.tee.x+dx,h.tee.y+dy,6,0,7); g.fill(); });
  const [gc,gg]=mk(h.w,h.H); const G=h.green;
  closedPath(gg,h.greenPts);
  const rg=gg.createRadialGradient(G.x-G.rx*.3,G.y-G.ry*.35,10,G.x,G.y,Math.max(G.rx,G.ry)*1.25);
  rg.addColorStop(0,C.green2); rg.addColorStop(1,C.green); gg.fillStyle=rg; gg.fill();
  gg.globalCompositeOperation='source-atop'; gg.fillStyle='rgba(255,255,255,.07)';
  gg.save(); gg.translate(G.x,G.y); gg.rotate(0.7); for(let x=-420;x<420;x+=34) gg.fillRect(x,-420,17,840); gg.restore();
  g.drawImage(gc,0,0,h.w,h.H);
  if(h.slope){
    g.save(); closedPath(g,h.greenPts); g.clip();
    for(const st of h.slope.steps||[]){ const px=st.gx+st.nx*st.c, py=st.gy+st.ny*st.c, tx=-st.ny, ty=st.nx, hi=st.H>0?1:-1;
      g.fillStyle='rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(px-tx*500,py-ty*500); g.lineTo(px+tx*500,py+ty*500); g.lineTo(px+tx*500+st.nx*hi*500,py+ty*500+st.ny*hi*500); g.lineTo(px-tx*500+st.nx*hi*500,py-ty*500+st.ny*hi*500); g.closePath(); g.fill();
      g.strokeStyle='rgba(20,50,20,.18)'; g.lineWidth=st.w*2.2; g.beginPath(); g.moveTo(px-tx*500,py-ty*500); g.lineTo(px+tx*500,py+ty*500); g.stroke(); }
    const R=Math.max(G.rx,G.ry)+20;
    for(let yy=G.y-R, row=0; yy<=G.y+R; yy+=30, row++) for(let xx=G.x-R+(row&1?15:0); xx<=G.x+R; xx+=30){
      const sv=slopeAtS(h.slope,xx,yy), m=Math.hypot(sv.ax,sv.ay); if(m<6) continue;
      const ux=sv.ax/m, uy=sv.ay/m, L=Math.min(9,3.5+m*0.075);
      g.strokeStyle=`rgba(255,255,255,${Math.min(0.5,0.14+m/170)})`; g.lineWidth=1.7; g.lineCap='round'; g.lineJoin='round';
      g.beginPath(); g.moveTo(xx-ux*L-uy*L*0.75, yy-uy*L+ux*L*0.75); g.lineTo(xx+ux*L*0.5, yy+uy*L*0.5); g.lineTo(xx-ux*L+uy*L*0.75, yy-uy*L-ux*L*0.75); g.stroke();
    }
    g.restore();
  }
  const sandBy=k=>h.sandPts.forEach((p,i)=>{ const b=h.sand[i]; if((b.kind||'bunker')!==k) return; if(k==='waste') drawWaste(g,p,b,r,C); else if(k==='pot') drawPot(g,p,b,r,C); else drawBunker(g,p,b,r,C); });
  sandBy('waste'); sandBy('bunker'); sandBy('pot');
  h.waterPts.forEach((p,i)=>{ if(!h.water[i].base) drawWater(g,p,h.water[i],r,C); });
  if(h.drop) drawDrop(g,h.drop);
  seasonTop(g,h,r,SID);
  if(DES) desertScrub(g,h,r);
  roughDetail(g,h,r);
  const stake=(x,y)=>{ g.fillStyle='rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x+5,y+3,6,2.6,0.4,0,7); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(x,y,4.2,0,7); g.fill(); g.strokeStyle='rgba(0,0,0,.25)'; g.lineWidth=1; g.stroke(); };
  for(let y=60;y<h.H;y+=150){ stake(10,y); stake(h.w-10,y); }
  for(let x=60;x<h.w;x+=150){ stake(x,10); stake(x,h.H-10); }
  h.trees.forEach(t=>{
    if(NAT_TREE[h.theme]){ NAT_TREE[h.theme](g,t,r,C); return; }
    if(DES){ drawMesquite(g,t,r,C); return; }
    if(h.theme==='bayou'){ drawCypress(g,t,r,C); return; }
    g.fillStyle='rgba(6,22,8,.3)'; g.beginPath(); g.ellipse(t.x+t.r*.4,t.y+t.r*.5,t.r*1.05,t.r*.85,0.3,0,7); g.fill();
    g.fillStyle=C.trees[(r()*C.trees.length)|0];
    for(let k=0;k<6;k++){ const a=k/6*Math.PI*2+r(); g.beginPath(); g.arc(t.x+Math.cos(a)*t.r*.42,t.y+Math.sin(a)*t.r*.42,t.r*.56,0,7); g.fill(); }
    g.beginPath(); g.arc(t.x,t.y,t.r*.78,0,7); g.fill();
    g.fillStyle='rgba(150,205,110,.22)'; g.beginPath(); g.arc(t.x-t.r*.28,t.y-t.r*.32,t.r*.45,0,7); g.fill();
    g.fillStyle='rgba(190,230,150,.18)'; g.beginPath(); g.arc(t.x-t.r*.36,t.y-t.r*.4,t.r*.2,0,7); g.fill();
    if(SID==='winter'){ g.fillStyle='rgba(244,249,252,.62)'; g.beginPath(); g.ellipse(t.x-t.r*.2,t.y-t.r*.3,t.r*.5,t.r*.3,-0.3,0,7); g.fill(); }
  });
  return c;
}
