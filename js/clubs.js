/* Fairway Tour · Effective club stats from upgrades, signature clubs, balls, and course twists */
'use strict';
/* ---------- Effective club stats (upgrades + ball) ---------- */
function ballDef(){ return BALLS.find(b=>b.id===save.ball)||BALLS[0]; }
function colorDef(){ return COLORS.find(c=>c.id===save.color)||COLORS[0]; }
function eff(i){
  const c=CLUBS[i], sig=sigClub(c.id), m=sig?sig.mod:{}, t=sig?sig.tier:(save.gear[c.id]||0), b=ballDef(), e={...c, tier:t, sig};
  if(c.putt){ e.capture=CAPTURE_V; e.speedErr=0.045*(1-0.2*(m.speedTier!=null?m.speedTier:t)); e.brk=m.brk||1; e.pull=0; e.spread=1; e.wind=1; e.hook=1; e.total=rollDist(c.v, fricOf(GREEN)); return e; }
  e.carry=c.carry*(1+(c.id==='driver'?0.04:0.03)*t)*(b.carry||1)*season().carry*(m.carry||1)*((hole&&hole.carryMul)||1);
  e.keep=c.keep*(b.keep||1)*season().roll*((hole&&hole.rollMul)||1);
  e.spread=(1-(c.id==='iron'?0.15:c.id==='wedge'?0.1:0.05)*t)*(m.spread||1);
  e.wind=1-(c.id==='driver'?0.1:0.03)*t;
  e.hook=(1-0.1*t)*(m.hook||1);
  e.sand=c.id==='wedge'?(m.sand||Math.min(0.99,0.85+0.035*t)):0.55;
  e.rough=m.rough||0;
  e.total=e.carry+rollDist(e.carry/c.T*e.keep, fricOf(FAIR));
  return e;
}
