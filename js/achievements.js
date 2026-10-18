/* Fairway Tour · Achievements: badges earned across the whole career */
'use strict';
const st = () => save.stats;
const hasT = k => !!save.trophies[k];
const trophyYears = k => (save.trophies[k]||{}).years||[];
const TEXAS_SETS = ['parkland','pines','coast','hill','desert','links','bayou','plains','azalea'];
const NAT_SETS = ['mountain','cliffs','resort','florida','sandhills','heartland','eastlinks'];
const ACH_CATS = ['Shots','Rounds','Career','Rivals','Gear','Travel'];
// [id, category, name, how to earn it, test]
const ACH = [
  ['birdie','Shots','First Birdie','Make a birdie.', ()=>st().birdies>=1],
  ['eagle','Shots','Eagle Eye','Make an eagle.', ()=>(st().eagles||0)>=1],
  ['ace','Shots','Ace','Make a hole in one.', ()=>st().hio>=1],
  ['albatross','Shots','Albatross','Finish a hole three under par.', ()=>(st().albatross||0)>=1],
  ['chipin','Shots','Chip In','Hole out from off the green.', ()=>(st().chipins||0)>=1],
  ['bomb','Shots','Long Distance','Hole a putt from 40 feet or more.', ()=>(st().maxPutt||0)>=40],
  ['drive300','Shots','300 Club','Hit a 300-yard drive.', ()=>(st().maxDrive||0)>=300],
  ['drive330','Shots','Big Stick','Hit a 330-yard drive.', ()=>(st().maxDrive||0)>=330],
  ['sandsave','Shots','Sand Save','Make par or better after landing in a bunker.', ()=>(st().sandSaves||0)>=1],
  ['hattrick','Shots','Hat Trick','Make three birdies in a row.', ()=>(st().streakBest||0)>=3],
  ['timber','Shots','Timber!','Hit a tree.', ()=>(st().trees||0)>=1],
  ['splash','Shots','Splash','Find the water.', ()=>(st().splashes||0)>=1],
  ['duck','Shots','Lucky Duck','Let the Lucky Duck save you from a penalty.', ()=>(st().ducks||0)>=1],
  ['snowman','Shots','Snowman','Make an 8 or worse on a hole. It happens to everyone.', ()=>(st().snowmen||0)>=1],
  ['under5','Rounds','Going Low','Finish an event 5 under par or better.', ()=>st().best!==null && st().best<=-5],
  ['under10','Rounds','Lights Out','Finish an event 10 under par or better.', ()=>st().best!==null && st().best<=-10],
  ['clean','Rounds','Clean Card','Finish an event of 6 or more holes without a bogey.', ()=>(st().cleanCards||0)>=1],
  ['dry','Rounds','Dry Land','Finish a 9-hole event without a penalty stroke.', ()=>(st().dryNines||0)>=1],
  ['wire','Rounds','Wire to Wire','Win after leading or sharing the lead after every hole.', ()=>(st().wires||0)>=1],
  ['comeback','Rounds','Comeback','Win after trailing by 3 or more.', ()=>(st().comebacks||0)>=1],
  ['cut','Rounds','Made the Cut','Make the cut in a major.', ()=>(st().cutsMade||0)>=1],
  ['credit','Rounds','On Credit','Enter an event you could not afford yet.', ()=>(st().credits||0)>=1],
  ['win1','Career','First Win','Win an event outright.', ()=>st().wins>=1],
  ['win5','Career',"Winner's Circle",'Win 5 events.', ()=>st().wins>=5],
  ['win25','Career','Closer','Win 25 events.', ()=>st().wins>=25],
  ['top5','Career','Contender','Finish top 5 ten times.', ()=>(st().top5||0)>=10],
  ['mini','Career','Moving Up','Earn a Mini-Tour card.', ()=>hasT('promo:1')],
  ['chal','Career','Challenger','Earn a Challenger Tour card.', ()=>hasT('promo:2')],
  ['pro','Career','Tour Card','Earn a Pro Tour card.', ()=>hasT('promo:3')],
  ['qschool','Career','Back Door','Win a Q-School.', ()=>hasT('qschool')],
  ['finale','Career','Season Finale','Win a Tour Championship.', ()=>[0,1,2,3,4].some(t=>hasT('champ:'+t))],
  ['major','Career','Major Winner','Win a major.', ()=>(st().majors||0)>=1],
  ['texslam','Career','Texas Slam','Win the Texas Masters and the Lone Star Championship in the same year.', ()=>trophyYears('major:masters').some(y=>trophyYears('major:lonestar').includes(y))],
  ['texchamp','Career','Texas Champion','Win Pro Tour Player of the Year.', ()=>!!save.texasChamp],
  ['national','Career','Coast to Coast','Reach the National Tour.', ()=>hasT('promo:4')],
  ['keepcard','Career','Keeping Your Card','Finish a National season in the top 10.', ()=>(st().cardsKept||0)>=1],
  ['amslam','Career','American Slam','Win all three National majors in your career.', ()=>['natamerican','natopen','natatlantic'].every(k=>hasT('major:'+k))],
  ['npoy','Career','Best in the Country','Win National Player of the Year.', ()=>(st().npoy||0)>=1],
  ['millionaire','Career','Millionaire','Earn $1,000,000 in prize money.', ()=>st().earnings>=1000000],
  ['hof','Career','Immortal','Get inducted into the Hall of Fame.', ()=>!!save.hofIn],
  ['lesson','Gear','First Lesson','Pass a Shot School drill.', ()=>(st().drills||0)>=1],
  ['ninefold','Gear','Nine-Shot','Pass the Nine-Shot Exam.', ()=>!!shotState('exam').unlocked],
  ['shotmaker','Gear','Shot Maker','Master the low, high, draw, and fade.', ()=>['low','high','draw','fade'].every(k=>masteryOf(k)>=2)],
  ['ngplus','Career','Second Wind','Start a New Game+.', ()=>(save.ngp||0)>=1],
  ['nemesis','Rivals',"It's Personal",'Gain a nemesis.', ()=>!!save.nem || (save.nemPast||[]).length>0 || (save.nemDormant||[]).length>0],
  ['settle','Rivals','Rivalry Settled','Settle a rivalry.', ()=>(save.nemPast||[]).length>=1],
  ['settle3','Rivals','Grudge Collector','Settle three rivalries.', ()=>(save.nemPast||[]).length>=3],
  ['oldfriends','Rivals','Old Friends','Meet an old rival again on the National Tour.', ()=>(st().reunions||0)>=1],
  ['sponsored','Gear','Sponsored','Complete any sponsor goal set.', ()=>(st().setsDone||0)>=1],
  ['legendary','Gear','Legendary','Complete a Legendary sponsor set.', ()=>(st().legends||0)>=1],
  ['ambassador','Gear','Brand Ambassador','Earn every piece of one sponsor\'s gear.', ()=>SPONSORS.some(s=>spState(s.id).set>=4)],
  ['signature','Gear','Signature Model','Put a signature club in your bag.', ()=>Object.values(save.bag||{}).some(Boolean)],
  ['maxclub','Gear','Pro Model','Upgrade a club to Pro in the shop.', ()=>Object.values(save.gear).some(t=>t>=4)],
  ['probag','Gear','Pro Bag','Upgrade all four clubs to Pro in the shop.', ()=>Object.values(save.gear).every(t=>t>=4)],
  ['rainbow','Gear','Rainbow','Own 10 ball colors.', ()=>save.colorsOwned.length>=10],
  ['texas','Travel','All of Texas','Play every Texas setting, from the Panhandle to the bayou.', ()=>TEXAS_SETS.every(k=>(st().sets||{})[k])],
  ['america','Travel','Seen It All','Play every National Tour setting.', ()=>NAT_SETS.every(k=>(st().sets||{})[k])],
  ['seasons','Travel','Four Seasons','Win an event in spring, summer, fall, and winter.', ()=>['spring','summer','fall','winter'].every(k=>(st().seasonWins||{})[k])],
];
const achDone = id => !!(save.ach||{})[id];
let achQueue=[], achShowing=false, achNew=[];
// checks every badge; quiet=true credits old saves without popups, listOnly saves them for the results sheet
function checkAch(quiet, listOnly){
  save.ach=save.ach||{};
  let any=false;
  for(const [id,,name,,test] of ACH){ if(save.ach[id]) continue; let ok=false; try{ ok=test(); }catch(e){}
    if(ok){ save.ach[id]={year:career().year}; any=true; if(!quiet){ if(!listOnly) achQueue.push(name); achNew.push(id); } } }
  if(any) persist();
  if(!achShowing && achQueue.length) showAchPop();
}
function showAchPop(){
  let el=$('#achpop'); if(!el){ el=document.createElement('div'); el.id='achpop'; el.className='achpop'; el.setAttribute('role','status'); $('#app').appendChild(el); }
  const name=achQueue.shift(); if(!name){ achShowing=false; el.classList.remove('show'); return; }
  achShowing=true; el.innerHTML=`<span>Achievement unlocked</span><b>${esc(name)}</b>`; el.classList.add('show'); Sound.coin();
  setTimeout(()=>{ el.classList.remove('show'); setTimeout(showAchPop, 350); }, 2600);
}
// badges earned during this event, for the results sheet
function achResultsHTML(){
  if(!achNew.length) return ''; const list=achNew.map(id=>ACH.find(a=>a[0]===id)).filter(Boolean); achNew=[];
  return `<div class="achnew"><span class="kicker">Achievements unlocked</span>${list.map(a=>`<div><b>${esc(a[2])}</b><small>${esc(a[3])}</small></div>`).join('')}</div>`;
}
function achHTML(){
  const done=ACH.filter(a=>achDone(a[0])).length;
  return `<div class="achtop"><b>${done}</b><span>of ${ACH.length} earned</span><div class="hofbar"><i style="width:${done/ACH.length*100}%"></i></div></div>`
    + ACH_CATS.map(cat=>`<div class="achcat">${cat}</div><div class="achgrid">${ACH.filter(a=>a[1]===cat).map(([id,,name,how])=>{ const d=achDone(id);
      return `<div class="ach ${d?'':'off'}"><b>${d?'★ ':''}${esc(name)}</b><small>${esc(how)}${d?` · Year ${save.ach[id].year}`:''}</small></div>`; }).join('')}</div>`).join('');
}
