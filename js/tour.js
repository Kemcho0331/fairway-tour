/* Fairway Tour · The tour: tiers, settings, schedules, events, standings, and points */
'use strict';
/* ---------- The tour: four tiers, eight events each, a Tour Championship and a Q-School ---------- */
const PTS=[500,300,190,135,110,100,90,80,70,60,50,40,35,30,25,20];
const SHARES=[1,.58,.38,.27,.2,.15,.11,.08,.06,.05,.04,.035,.03,.025,.02,.015];
const SETTINGS = {
  parkland:{surround:'forest', wind:14, pool:{3:['eden','long3','ringed','redan'],4:['dogleg','classic','bottle','drivable','road'],5:['long','classic','reachable']}},
  azalea:  {surround:'azalea', wind:14, pool:{3:['redan','eden','biarritz'],4:['dogleg','cape','drivable','road','leven','bottle'],5:['reachable','long']}},
  pines:   {surround:'pines', wind:12, trees:1.8, pool:{3:['ringed','redan','eden'],4:['road','dogleg','bottle','classic'],5:['long','reachable']}},
  coast:   {surround:'coast', wind:20, wet:.25, pool:{3:['carry','eden','island'],4:['cape','split','peninsula','leven'],5:['reachable','hell']}},
  hill:    {surround:'hill', wind:16, pool:{3:['biarritz','long3','redan'],4:['drivable','dogleg','leven','classic'],5:['hell','long']}},
  desert:  {surround:'desert', theme:'desert', wind:20, wet:-.45, sand:2, trees:.45, waste:true, pool:{3:['redan','ringed','long3'],4:['split','drivable','dogleg','bottle'],5:['sahara','long']}},
  links:   {surround:'links', theme:'links', wind:22, wet:-.3, trees:.06, links:true, pool:{3:['ringed','redan','eden','biarritz'],4:['leven','bottle','drivable','classic'],5:['hell','long']}},
  bayou:   {surround:'bayou', theme:'bayou', wind:12, wet:.35, trees:1.2, pool:{3:['carry','eden','island'],4:['cape','split','peninsula','leven','dogleg'],5:['reachable','hell']}},
  mountain: {surround:'mountain', names:['Aspen Grove','Timberline','Elk Meadow','Granite Ridge','Columbine','Blue Spruce','Switchback','Summit','Snowmelt','Bighorn','Continental'], theme:'mountain', wind:14, trees:1.5, twist:{carryMul:1.08}, pool:{3:['long3','redan','biarritz','carry'],4:['dogleg','drivable','leven','classic'],5:['long','reachable','hell']}},
  cliffs:   {surround:'cliffs', names:['Sea Lion','Cypress Point','Kelp Bed','Tide Pool','Fog Bank','Otter Cove','Lighthouse','Surf Line','Seal Rock','Headland','Big Sur'], theme:'cliffs', wind:22, wet:.3, trees:.5, twist:{seaWind:true}, pool:{3:['carry','island','eden'],4:['cape','peninsula','split','leven'],5:['reachable','hell']}},
  resort:   {surround:'resort', names:['Saguaro','Javelina','Roadrunner','Palo Verde','Coyote Wash','Sun Devil','Cholla','Red Rock','Arroyo','Mirage','Camelback'], theme:'resort', wind:16, wet:-.2, sand:1, trees:.5, waste:true, twist:{roughLie:0.6, roughName:'Desert · rocky, much less power'}, pool:{3:['redan','ringed','long3','carry'],4:['split','drivable','dogleg','bottle'],5:['sahara','long']}},
  florida:  {surround:'florida', names:['Gator Hole','Mangrove','Pelican','Sawgrass Bend','Heron','Cypress Dome','Spoonbill','Hammock','Cabbage Palm','Manatee','Osprey'], theme:'florida', wind:14, wet:.5, trees:.8, twist:{rollMul:0.8}, pool:{3:['island','carry','eden'],4:['cape','peninsula','split','leven'],5:['reachable','hell']}},
  sandhills:{surround:'sandhills', names:['Longleaf','Wiregrass','Pine Straw','Sand Ridge','Cardinal','Tar Heel','Dogwood','Old Carolina','Pinecone','Hollow','Turpentine'], theme:'sandhills', wind:12, trees:1, waste:true, sand:1, twist:{crown:true}, pool:{3:['ringed','redan','eden'],4:['road','dogleg','bottle','classic'],5:['long','reachable','sahara']}},
  heartland:{surround:'heartland', names:['Old Oak','Cornfield','Red Barn','Prairie','Buckeye','Maple Row','Silo','Creek Bend','Fencepost','Harvest','Main Street'], theme:'heartland', wind:14, trees:1.7, twist:{roughLie:0.65, roughFric:1.3, roughName:'Deep rough · much less power'}, pool:{3:['eden','long3','ringed','redan'],4:['dogleg','classic','bottle','road'],5:['long','classic','reachable']}},
  eastlinks:{surround:'eastlinks', names:['Windmill','Dune Ridge','Bayberry','Beach Plum','Fescue','Montauk','Atlantic','Shingle','Sandpiper','Peconic','Widows Walk'], theme:'eastlinks', wind:22, wet:-.3, trees:.06, links:true, twist:{roughLie:0.55, roughName:'Fescue · thick, much less power'}, pool:{3:['ringed','redan','eden','biarritz'],4:['leven','bottle','drivable','classic'],5:['hell','long']}},
  plains:  {surround:'plains', theme:'plains', wind:26, trees:.25, pool:{3:['long3','eden','redan'],4:['classic','drivable','dogleg','bottle'],5:['long','hell']}},
};
const TAGS = {
  links:'Links golf. Firm and treeless, with pot bunkers and wind off the water.',
  bayou:'Bayou golf. Cypress, swamp, and water around every corner.',
  plains:'Panhandle wind. Keep the ball low.',
  desert:'Desert target golf. Miss the fairway and you play off rocks and scrub.',
};
const PAR_SETS={3:[4,3,5],4:[4,3,5,4],5:[4,4,3,5,4],6:[4,5,3,4,3,5],7:[4,5,3,4,4,3,5],9:[4,3,5,4,4,3,5,4,4]};
const r2=(lo,hi,u)=>lo+(hi-lo)*u;
const TOUR = [
  { name:'Amateur', boost:-.3, diff:[.1,.35], fee:[0,0], win:[400,900], q:300,
    roster:[['Cody Whitfield',.62],['Bryce Tran',.55],['Mateo Garza',.48],['Luke Odom',.42],['Tanner Boyd',.36],['Eli Sandoval',.30],['Jake Pruitt',.24]],
    events:[['willow','Willow Creek Open','parkland',3],['bluebonnet','Bluebonnet Classic','parkland',4],['pecan','Pecan Valley Amateur','parkland',3],['conroe','Lake Conroe Open','pines',4],
            ['galvam','Galveston Links Amateur','links',4],['brazos','Brazos River Invitational','parkland',4],['cedarpark','Cedar Park Classic','hill',4],['stateam','Texas State Amateur','parkland',4,{tag:'The biggest amateur event in Texas.'}]],
    champ:['amchamp','Amateur Tour Championship','azalea',4,1800] },
  { name:'Mini-Tour', boost:-.02, diff:[.3,.55], fee:[250,900], win:[1500,4500], q:1500,
    roster:[['Duke Hollis',.66],['Marco Vega',.6],['Tommy Reyes',.54],['Ace Lindqvist',.48],['Colt Ramirez',.42],['Sam Okafor',.36],['Hank Bishop',.3],['Wade Tibbs',.26],['Devin Cho',.22]],
    events:[['piney','Piney Woods Classic','pines',4],['gulf','Gulf Coast Invitational','coast',5,{sig:'island'}],['caddo','Caddo Lake Open','bayou',4],['waco','Waco Shootout','parkland',5],
            ['corpus','Corpus Christi Classic','coast',5],['lubbock','Lubbock Plains Open','plains',5],['nacog','Nacogdoches Pines','pines',5],['sanmarcos','San Marcos River Classic','hill',5]],
    champ:['minichamp','Mini-Tour Championship','azalea',5,8000] },
  { name:'Challenger Tour', boost:.18, diff:[.5,.75], fee:[1200,3500], win:[7000,16000], q:4000,
    roster:[['Jin-ho Park',.7],['Rory Callahan',.64],['Nate Brandt',.58],['Luis Ortega',.52],['Beau Langford',.46],['Ricky Salinas',.42],['Trey McAllister',.38],['Omar Haddad',.34],['Kyle Benning',.3],['Gus Moreno',.26]],
    events:[['hill','Hill Country Open','hill',6],['bigbend','Big Bend Desert Classic','desert',6],['padre','Padre Island Links','links',6],['amarillo','Amarillo Wind Classic','plains',6],
            ['thicket','Big Thicket Invitational','bayou',6],['elpaso','El Paso Desert Open','desert',6],['fredericksburg','Fredericksburg Classic','hill',6],['houston','Houston Challenger','parkland',6]],
    champ:['chalchamp','Challenger Tour Championship','azalea',6,30000] },
  { name:'Pro Tour', boost:.4, diff:[.65,.95], fee:[5000,12000], win:[30000,60000], q:0,
    roster:[['Dalton Pierce',.63],['Javier Castillo',.59],['Reid Hollister',.56],['Shane Kowalski',.53],['Malik Freeman',.50],['Brent Okoro',.47],['Cole Hartley',.44],['Andre Villarreal',.4],['Ty Beckett',.36],['Sung-min Lee',.32],['Clay Whitaker',.28]],
    events:[['dallas','Dallas Classic','parkland',6],['masters','Texas Masters','azalea',9,{major:true,tag:'A major. Azaleas, slick greens, and the toughest field of the spring.'}],['bayoucity','Bayou City Classic','bayou',7],['galvbay','Galveston Bay Championship','coast',7,{sig:'island'}],
            ['austin','Austin Open','hill',7],['transpecos','Trans-Pecos Open','desert',7],['panhandle','Panhandle Open','plains',7],['lonestar','Lone Star Championship','parkland',9,{major:true,tag:'A major. The biggest stage in Texas golf.'}]],
    champ:['prochamp','Pro Tour Championship','azalea',9,120000] },
  { name:'National Tour', national:true, boost:0, diff:[.75,1], fee:[15000,30000], win:[80000,150000], q:0, roster:[],
    events:[['natsand','Sandhills Classic','sandhills',9,{region:'Pinehurst, North Carolina',tag:'Carolina sandhills. Pine straw and wiregrass. Crowned greens shed the ball toward the edges.'}],
            ['natamerican','American Championship','heartland',9,{major:true,region:'Columbus, Ohio',tag:'A major. Tree-lined Midwest parkland. The rough is deep and heavy, so miss the fairway and you lose real distance.'}],
            ['natrocky','Rocky Mountain Open','mountain',9,{region:'Castle Rock, Colorado',tag:'Mountain golf. Thin air: every club carries 8% farther.'}],
            ['natopen','The National Open','cliffs',9,{major:true,region:'Monterey, California',tag:'A major. Cliffside holes over the Pacific. The sea wind blows no matter the season.'}],
            ['natlakes','Great Lakes Classic','heartland',9,{region:'Chicago, Illinois',tag:'Old Midwest parkland. Big oaks and heavy rough.'}],
            ['natatlantic','Atlantic Championship','eastlinks',9,{major:true,region:'Southampton, New York',tag:'A major. Wind off the Atlantic and tall fescue that grabs the club.'}],
            ['natsaguaro','Saguaro Desert Classic','resort',9,{region:'Scottsdale, Arizona',tag:'Desert resort golf. Green ribbons through cactus and rock, and missing them is brutal.'}],
            ['natglades','Everglades Invitational','florida',9,{region:'Naples, Florida',tag:'Florida golf. Water on nearly every hole, and soft humid turf stops the ball fast.'}]],
    champ:['natchamp','National Championship','cliffs',9,300000,{region:'Carmel, California',tag:'The finale. Clifftop golf over the Pacific, where the sea wind never rests.'}] },
];
function idSeed(id){ let h=2166136261; for(const ch of id){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return (h>>>0)%900000+1000; }
function makeEvent(t, k, def, kind){
  const T=TOUR[t], [id,name,set,n,x]=def, o=(x&&typeof x==='object'?x:def[5])||{}, S=SETTINGS[set], u=kind==='season'?k/7:1;
  const diff=kind==='q'?TOUR[Math.min(3,t+1)].diff[0]+0.05:r2(T.diff[0],T.diff[1],u), seed=idSeed(id);
  const base=PAR_SETS[n], rot=seed%n, pars=base.slice(rot).concat(base.slice(0,rot));
  const win=kind==='champ'?def[4]:kind==='q'?Math.round(TOUR[t].win[1]*0.5/50)*50:Math.round(r2(T.win[0],T.win[1],u)*(o.major?1.5:1)/50)*50;
  const fee=kind==='champ'?0:kind==='q'?T.q:Math.round(r2(T.fee[0],T.fee[1],u)*(o.major?1.4:1)/50)*50;
  const rosterT=kind==='q'?Math.min(3,t+1):t, roster=TOUR[rosterT].roster;
  const e={id, name, tier:t, k, kind, set, pars, par:pars.reduce((a,b)=>a+b,0), diff, boost:TOUR[rosterT].boost+(kind==='q'?0.06:0),
    windMax:Math.round(S.wind*(0.85+Math.min(t,3)*0.1)), fee, rounds:o.major&&t>=3?2:1, major:!!o.major, mult:(o.major||kind==='champ')?2:1,
    tagline:o.tag||TAGS[set]||'', region:o.region||'', roster, payouts:SHARES.map(sh=>Math.round(win*sh/50)*50)};
  let cache=null;
  Object.defineProperty(e,'holes',{get(){
    if(cache) return cache;
    if(id==='willow') return (cache=WILLOW_HOLES);
    const pool={...S.pool}; if(o.sig) pool[3]=['!'+o.sig, ...pool[3].filter(a=>a!==o.sig)];
    return (cache=genCourse(seed, pars, diff, S.wet||0, {...S, pool}));
  }});
  return e;
}
TOUR.forEach((T,t)=>{
  T.events=T.events.map((d,k)=>makeEvent(t,k,d,'season'));
  T.champEv=makeEvent(t,8,T.champ,'champ');
  if(t<3) T.qEv=makeEvent(t,9,[`q${t}`,`${TOUR[t+1].name} Q-School`,'parkland',t===0?4:t===1?5:6,{tag:`Win it outright and you join the ${TOUR[t+1].name}. Anything less and you replay the year.`}],'q');
});
const ME='__you';
function career(){ return save.career; }
function tierDef(){ return TOUR[career().tier]; }
function seasonIdx(){ const c=career(); return c.phase==='season' ? Math.min(3,Math.floor(c.k/2)) : 3; }
function currentEvent(){ const c=career(), T=tierDef(); return c.phase==='season'?T.events[c.k] : c.phase==='champ'?T.champEv : T.qEv; }
function tableRows(){
  const c=career(), n=nem(), names=[ME, ...tierRoster(c.tier).map(r=>r[0])];
  return names.map(k=>({n:k, name:k===ME?playerName():k, you:k===ME, nem:!!(n&&k===n.name), pts:Math.round(c.pts[k]||0), wins:c.wins[k]||0}))
    .sort((a,b)=>b.pts-a.pts || b.wins-a.wins || (b.you?1:0)-(a.you?1:0));
}
function myRank(){ return tableRows().findIndex(r=>r.you)+1; }
// points shared evenly across ties, like real tours
function awardPoints(totals, mult){
  const idx=totals.map((t,i)=>i).sort((a,b)=>totals[a]-totals[b]), pts=totals.map(()=>0); let i=0;
  while(i<idx.length){ let j=i; while(j+1<idx.length && totals[idx[j+1]]===totals[idx[i]]) j++; let s=0; for(let k=i;k<=j;k++) s+=PTS[k]||30; s/=j-i+1; for(let k=i;k<=j;k++) pts[idx[k]]=s*mult; i=j+1; }
  return pts;
}
