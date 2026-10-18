/* Fairway Tour · New Game+: start over on the Amateur tour with your look and cosmetics */
'use strict';
const NGP_STEP = 0.03, NGP_MAX = 3;
const COSMETIC_KINDS = ['color','shirt','hat','pants','watch'];
const ngpLevel = () => Math.min(NGP_MAX, save.ngp||0);
const canNewGamePlus = () => !!save.texasChamp;
function ngpHTML(){
  const lvl=save.ngp||0, past=save.legacy||[];
  const pastList=past.map(p=>`<div class="item"><div class="item-main"><span class="item-name">Career ${p.n}${p.ngp?` <span class="tier t3">NG+${p.ngp}</span>`:''}</span><span class="item-desc">${p.years} years · ${p.wins} wins · ${p.majors} majors · ${money(p.earnings)} · ${p.trophies} trophies${p.texas?' · Texas Champion':''}${p.national?' · National Tour':''}${p.hof?' · Hall of Fame':''}</span></div></div>`).join('');
  const intro=lvl?`<div class="field">New Game+ ${lvl}: rivals on every tour are ${Math.round(ngpLevel()*NGP_STEP*100)} points sharper than a first career.</div>`:'';
  const card=canNewGamePlus()
    ? `<div class="invite"><span class="kicker">New Game+${lvl?` ${lvl+1}`:''}</span><b>Start over, sharper</b><span>Back to the Amateur tour with your name, your look, every ball color and sponsor outfit you own, and all your achievements. Money, club upgrades, special balls, signature clubs, sponsor progress, rivals, trophies, and the National Tour start fresh. Rivals on every tour get sharper${lvl>=NGP_MAX?'. This is the top New Game+ level, so rivals stay at their sharpest.':' with each New Game+.'} This career is saved to your past careers below.</span>
        <div class="row"><button class="btn primary" type="button" data-act="ngp">Start New Game+</button></div></div>`
    : `<div class="field">Win Pro Tour Player of the Year to become Texas Champion and unlock New Game+.</div>`;
  return intro+card+(pastList?`<h3 class="sec">Past careers</h3><div>${pastList}</div>`:'');
}
let ngpArmed=false;
function ngpTap(btn){
  if(!ngpArmed){ ngpArmed=true; btn.textContent='Tap again to start over'; setTimeout(()=>{ ngpArmed=false; if(btn.isConnected) btn.textContent='Start New Game+'; },4000); return; }
  startNewGamePlus();
}
function startNewGamePlus(){
  const s=save.stats, c=career();
  const summary={n:(save.legacy||[]).length+1, ngp:save.ngp||0, years:c.year, wins:s.wins, majors:s.majors||0, earnings:s.earnings, trophies:Object.keys(save.trophies).length, texas:!!save.texasChamp, national:!!save.nat, hof:!!save.hofIn};
  const keepItems=(save.items||[]).filter(id=>ITEMS[id] && COSMETIC_KINDS.includes(ITEMS[id].kind));
  const ownedColor=save.colorsOwned.includes(save.color)?save.color:'white';
  const keep={muted:save.muted, golfer:{...save.golfer}, ach:save.ach||{}, colorsOwned:save.colorsOwned.slice(), color:ownedColor, items:keepItems,
    legacy:(save.legacy||[]).concat([summary]), ngp:(save.ngp||0)+1, hofList:save.hofList||[], exclSort:save.exclSort};
  const fresh=defaultSave(); Object.assign(fresh, keep);
  Object.keys(save).forEach(k=>delete save[k]); Object.assign(save, fresh);
  persist(); location.reload();
}
