/* Fairway Tour · Boot: start the game */
'use strict';
/* ---------- Boot ---------- */
window.addEventListener('resize',()=>{ resize(); if(hole && state==='menu') snapCamera(); });
resize();
EV=currentEvent(); HOLES=EV.holes; field=[{name:'You',you:true}]; playerScores=[];
startHole(0);
if(save.carried) delete save.caddie;
if(save.caddie){ const refund=save.caddie>=2?115000:25000; save.cash+=refund; delete save.caddie; persist(); setTimeout(()=>toast(`Caddies are gone. ${money(refund)} refunded to your bank.`,3600),600); }
Sound.setSeason(season().id);
renderSound();
checkAch(true);
if(save.pendingCeremony) showCeremony(); else showHub();
if(save.carried){ delete save.carried; persist(); setTimeout(()=>toast('New career on the Amateur tour. Your golfer came with you.',3400),400); }
requestAnimationFrame(frame);
