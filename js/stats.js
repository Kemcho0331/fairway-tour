/* Fairway Tour · Career stats: tracking every live hole and the Stats view in the Career tab */
'use strict';
function S2(){ const s=save.stats; s.h=s.h||{holes:0,rel:0,byPar:{3:[0,0],4:[0,0],5:[0,0]},dist:[0,0,0,0,0],fwT:0,fwH:0,gir:0,putts:0,three:0,scrT:0,scrOK:0,sandT:0,sandOK:0,driveN:0,driveSum:0}; s.hist=s.hist||[]; return s.h; }
// one finished hole in a live event
function statsHole(par, score, rel){
  const h=S2(); h.holes++; h.rel+=rel; const bp=h.byPar[par]||(h.byPar[par]=[0,0]); bp[0]++; bp[1]+=score;
  h.dist[rel<=-2?0:rel===-1?1:rel===0?2:rel===1?3:4]++;
  if(par>3){ h.fwT++; if(HS.fw) h.fwH++; }
  if(HS.gir) h.gir++; else { h.scrT++; if(rel<=0) h.scrOK++; }
  h.putts+=HS.putts; if(HS.putts>=3) h.three++;
  if(HS.sand){ h.sandT++; if(rel<=0) h.sandOK++; }
}
function statsDrive(yds){ const h=S2(); h.driveN++; h.driveSum+=yds; }
function statsEvent(rel, holes, label){ S2(); const s=save.stats; s.hist.push({rel, holes, label, y:career().year, t:career().tier}); if(s.hist.length>30) s.hist.shift(); }
const pct=(a,b)=>b?Math.round(a/b*100)+'%':'-';
// scoring trend: strokes vs par per hole for the last 30 events
function trendSVG(hist){
  if(hist.length<2) return '<div class="field">Play a couple of events to see your scoring trend.</div>';
  const W=320, H=120, P=24, vals=hist.map(e=>e.rel/e.holes), lo=Math.min(-0.6,...vals), hi=Math.max(0.6,...vals);
  const x=i=>P+i*(W-P-8)/(hist.length-1), y=v=>8+(v-lo)/(hi-lo)*(H-26);
  const pts=vals.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const dots=vals.map((v,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4" class="tdot"><title>Year ${hist[i].y}, ${TOUR[hist[i].t].name}: ${hist[i].label}, ${fmtPar(hist[i].rel)} over ${hist[i].holes} holes</title></circle><circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="11" class="thit"><title>Year ${hist[i].y}, ${TOUR[hist[i].t].name}: ${hist[i].label}, ${fmtPar(hist[i].rel)} over ${hist[i].holes} holes</title></circle>`).join('');
  return `<svg class="trend" viewBox="0 0 ${W} ${H}" role="img" aria-label="Strokes versus par per hole over your last ${hist.length} events">
    <line x1="${P}" x2="${W-8}" y1="${y(0)}" y2="${y(0)}" class="tzero"/><text x="${P-6}" y="${y(0)+4}" class="tlab" text-anchor="end">E</text>
    <text x="${P-6}" y="${y(lo)+4}" class="tlab" text-anchor="end">${fmtPar(Math.round(lo*10)/10)}</text><text x="${P-6}" y="${y(hi)+4}" class="tlab" text-anchor="end">+${Math.round(hi*10)/10}</text>
    <polyline points="${pts}" class="tline"/>${dots}
    <text x="${P}" y="${H-2}" class="tlab">Older</text><text x="${W-8}" y="${H-2}" class="tlab" text-anchor="end">Latest</text></svg>
    <small class="tnote">Lower is better. Each dot is one event, scored as strokes over or under par per hole. Tap a dot for details.</small>`;
}
function distHTML(d){
  const names=['Eagle or better','Birdie','Par','Bogey','Double or worse'], tot=d.reduce((a,b)=>a+b,0)||1, mx=Math.max(...d,1);
  return `<div class="dist">${d.map((n,i)=>`<div class="drow" title="${names[i]}: ${n} (${Math.round(n/tot*100)}%)"><span>${names[i]}</span><i style="width:${Math.max(n?3:0,n/mx*100)}%"></i><b>${n}</b><small>${Math.round(n/tot*100)}%</small></div>`).join('')}</div>`;
}
function statsHTML(){
  const h=S2(), s=save.stats, f=(l,v,sub)=>`<div><span class="lbl">${l}</span><b>${v}</b>${sub?`<small>${sub}</small>`:''}</div>`;
  if(!h.holes) return '<div class="field">Stats start counting from your next tour event. Practice rounds and the range do not count.</div>';
  const avg=(p)=>{ const b=h.byPar[p]; return b&&b[0]?(b[1]/b[0]).toFixed(2):'-'; };
  return `<div class="facts facts4">
      ${f('Per hole',fmtPar(Math.round(h.rel/h.holes*100)/100),`${h.holes} holes`)}${f('Fairways',pct(h.fwH,h.fwT),`${h.fwH} of ${h.fwT}`)}${f('Greens',pct(h.gir,h.holes),'in regulation')}${f('Putts',(h.putts/h.holes).toFixed(2),'per hole')}
      ${f('Scrambling',pct(h.scrOK,h.scrT),'par after a missed green')}${f('Sand saves',pct(h.sandOK,h.sandT),`${h.sandOK} of ${h.sandT}`)}${f('3-putts',pct(h.three,h.holes),`${h.three} total`)}${f('Drive avg',h.driveN?Math.round(h.driveSum/h.driveN)+' yds':'-',`longest ${Math.round(s.maxDrive||0)}`)}
    </div>
    <h3 class="sec">Scoring average by par</h3>
    <div class="facts">${f('Par 3s',avg(3))}${f('Par 4s',avg(4))}${f('Par 5s',avg(5))}</div>
    <h3 class="sec">Scoring trend</h3>${trendSVG(s.hist||[])}
    <h3 class="sec">Every hole you have played</h3>${distHTML(h.dist)}
    <div class="career" style="border:0;padding:0">Longest putt made ${Math.round(s.maxPutt||0)} ft · ${s.chipins||0} chip-ins · ${s.hio} hole${s.hio===1?'':'s'} in one · best event ${s.best===null?'-':fmtPar(s.best)}</div>`;
}
function careerViewHTML(){
  const v=save.careerView||'career', b=(k,l)=>`<button class="tchip sm" type="button" data-cv="${k}" aria-pressed="${v===k}">${l}</button>`;
  return `<div class="chips">${b('career','Career')}${b('stats','Stats')}</div>${v==='stats'?statsHTML():careerTabHTML()}`;
}
