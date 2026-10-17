/* Fairway Tour · Shared helpers and game constants: terrain, clubs, gear, seasons, palettes */
'use strict';
const $ = s => document.querySelector(s);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const angDiff = (a,b) => ((a-b+Math.PI*3)%(Math.PI*2))-Math.PI;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ---------- Constants ---------- */
const YPP = 0.22;            // yards per world unit
// fastest a dead-center ball can drop: a putt that would have stopped about 12 ft past (chips get 70%)
const CAPTURE_V = 70;
const CUP_R = 7.5, BALL_R = 6, MAX_STROKES = 10;
const ROUGH=0, FAIR=1, GREEN=2, SAND=3, WATER=4, POT=5, WASTE=6, OOB=-1;
const isSand=t=>t===SAND||t===POT||t===WASTE;
const TER = {
  [ROUGH]:{name:'Rough',  fric:420, lie:0.78, keep:0.55, spread:2.6, note:'less power'},
  [FAIR]: {name:'Fairway',fric:170, lie:1,    keep:1,    spread:1.1, note:'full power'},
  [GREEN]:{name:'Green',  fric:125, lie:1,    keep:0.85, spread:0.3, note:'putt it'},
  [SAND]: {name:'Bunker', fric:950, lie:0.55, keep:0.08, spread:4,   note:'wedge out'},
  [POT]:  {name:'Pot bunker', fric:1100, lie:0.34, keep:0.05, spread:5, note:'deep, wedge out'},
  [WASTE]:{name:'Waste area', fric:560, lie:0.82, keep:0.35, spread:2.2, note:'firm sand, playable'},
};
const CLUBS = [
  {id:'driver', name:'Driver', carry:1000, T:1.8,  h:80, keep:0.42},
  {id:'iron',   name:'Iron',   carry:700,  T:1.5,  h:70, keep:0.30},
  {id:'wedge',  name:'Wedge',  carry:360,  T:1.35, h:90, keep:0.12},
  {id:'putter', name:'Putter', putt:true, v:360},
];
const TIERS = ['Stock','Bronze','Silver','Gold','Pro'];
const UPGRADES = {
  driver:{prices:[1200,5000,16000,45000], desc:'+4% distance, less wind drift, and a gentler overswing per tier'},
  iron:  {prices:[1000,4000,13000,38000], desc:'+3% distance, tighter accuracy, and a gentler overswing per tier'},
  wedge: {prices:[800,3200,10000,30000],  desc:'+3% distance, cleaner bunker shots, and a gentler overswing per tier'},
  putter:{prices:[600,2500,8000,24000],   desc:'Truer roll per tier. Putts come off at the speed you hit them.'},
};
const BALLS = [
  {id:'std',   name:'Tour Standard', price:0,    desc:'Reliable all-rounder.'},
  {id:'grip',  name:'Grip Spin',     price:2500, desc:'Bites on landing. Stops about 25% sooner.', keep:0.75},
  {id:'dist',  name:'Distance Pro',  price:6000, desc:'+3% carry on every club, a little more roll.', carry:1.03, keep:1.1},
  {id:'duck',  name:'Lucky Duck',    price:9000, desc:'Once per tournament, a ball in the water costs no penalty.'},
];
const COLORS = [
  {id:'white', name:'Classic',   price:0,    c1:'#ffffff', c2:'#cfd4cc'},
  {id:'optic', name:'Optic',     price:200,  c1:'#f4ff6a', c2:'#b9c22a'},
  {id:'pink',  name:'Hot Pink',  price:200,  c1:'#ff8fc8', c2:'#d1478e'},
  {id:'sky',   name:'Sky',       price:200,  c1:'#9fe0ff', c2:'#4ea4d4'},
  {id:'tang',  name:'Tangerine', price:350,  c1:'#ffb36b', c2:'#e0702a'},
  {id:'pearl', name:'Black Pearl',price:600, c1:'#5d6670', c2:'#1d2228'},
  {id:'gold',  name:'Gold',      price:2500, c1:'#ffe58a', c2:'#c79a1d'},
];
const LOOK = {
  skins:['#f6d3b8','#e8b48f','#c98f63','#a46a43','#7a4a2c','#4f2f1d'],
  shirts:[{id:'white',name:'White',c:'#f4f5ef'},{id:'navy',name:'Navy',c:'#1f3a6b'},{id:'red',name:'Red',c:'#c8352b'},{id:'green',name:'Green',c:'#2f7d4a'},{id:'yellow',name:'Yellow',c:'#f3c437'},{id:'sky',name:'Sky',c:'#6fb7e6'},{id:'pink',name:'Pink',c:'#ef8fb8'},{id:'black',name:'Black',c:'#23272b'}],
  pants:[{id:'khaki',name:'Khaki',c:'#c9b58a'},{id:'navy',name:'Navy',c:'#24324f'},{id:'white',name:'White',c:'#eceee6'},{id:'charcoal',name:'Charcoal',c:'#3d4247'},{id:'olive',name:'Olive',c:'#6b7445'}],
  hats:[{id:'cap',name:'Cap'},{id:'visor',name:'Visor'},{id:'bucket',name:'Bucket'},{id:'none',name:'No hat'}],
};
const SEASONS = [
  {id:'spring', name:'Spring', color:'#3f5fb5', blurb:'Soft ground and spring showers. The ball stops quickly and greens run a little slow.', roll:0.75, fric:{[FAIR]:1.15,[GREEN]:1.12,[ROUGH]:1.05}, carry:1, wind:1, rival:0, weather:'rain'},
  {id:'summer', name:'Summer', color:'#b97c0c', blurb:'Firm, fast fairways and quick greens. The air is calm, so the ball runs out a long way.', roll:1.3, fric:{[FAIR]:0.82,[GREEN]:0.9,[ROUGH]:0.95}, carry:1.02, wind:0.6, rival:-0.03, weather:'sun'},
  {id:'fall',   name:'Fall',   color:'#a3461f', blurb:'Gusty wind that shifts between shots, and leaves in the rough make it play heavier.', roll:1, fric:{}, carry:1, wind:1.35, gusty:true, roughLie:0.7, rival:0.06, weather:'leaves'},
  {id:'winter', name:'Winter', color:'#3f6c8a', blurb:'Cold air carries shorter. Frosty greens are extra slippery, so slopes take more break.', roll:1.15, fric:{[FAIR]:0.9,[GREEN]:0.78}, carry:0.95, wind:1.1, rival:0.08, weather:'snow'},
];
const SEASON_COL = {
  spring:{},
  summer:{outside:'#26402a', rough:'#4b7b35', cut:'#5d8c40', fair:'#77a94c', tee:'#80b257', green:'#87c25b', green2:'#a9d878', sand:'#efdfab', water:'#2a78ad', water2:'#4ea6d6', trees:['#2f5a26','#36632a','#2a5124']},
  fall:  {outside:'#2c3a24', rough:'#5b6f34', cut:'#6a7d3c', fair:'#7f9a4a', tee:'#86a052', green:'#7cb25a', green2:'#9bcb76', trees:['#b8502a','#d0802e','#8f3a22','#c9a23a','#4f6a2c']},
  winter:{outside:'#2a3a33', rough:'#6e846f', cut:'#7a917a', fair:'#89a383', tee:'#91ab8b', green:'#85ac7e', green2:'#a8c8a1', sand:'#e6ddc4', sandEdge:'#bfb391', water:'#3c6d8c', water2:'#6a9ab6', bank:'#e6f2f6', trees:['#1f3f2e','#27483a','#1b3829']},
};
const COL = {
  outside:'#1f3f27', rough:'#3b7536', cut:'#4f8a41', fair:'#66a64b', tee:'#72b156',
  green:'#78c159', green2:'#9ad776', sand:'#e8d8a4', sandEdge:'#c3ab72', waste:'#e6d8ae',
  water:'#2c70a4', water2:'#4a9acb', bank:'#b9e0ee',
  trees:['#285226','#2d5c2b','#23492a'], flag:'#f3c437'
};
