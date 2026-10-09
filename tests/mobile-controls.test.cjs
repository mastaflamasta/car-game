const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Run the real input handlers with two independent captured pointers.
const context=new Proxy({},{get:(object,key)=>object[key]||(object[key]=()=>{})});
const elements=new Map(),windowEvents=new Map(),documentEvents=new Map();
function element(id){
  if(elements.has(id))return elements.get(id);
  const listeners=new Map(),captures=new Set(),classes=new Set();
  const node={style:{},textContent:'',innerHTML:'',disabled:false,
    classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle(){}},
    addEventListener:(event,handler)=>listeners.set(event,handler),
    fire(event,props={}){listeners.get(event)?.({button:0,preventDefault(){},...props})},
    setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),
    releasePointerCapture(id){captures.delete(id);this.fire('lostpointercapture',{pointerId:id})},
    getBoundingClientRect:()=>({left:0,top:0,width:116,height:116}),
    getContext:()=>context,setAttribute(){},append(){},querySelector:()=>element('overlay-hint')};
  elements.set(id,node);return node;
}
const sandbox={console,document:{hidden:false,getElementById:element,
  createElement:()=>element('created-'+elements.size),querySelector:()=>element('game-panel'),
  querySelectorAll:()=>[],addEventListener:(event,handler)=>documentEvents.set(event,handler)},
  window:{matchMedia:()=>({matches:true}),addEventListener:(event,handler)=>windowEvents.set(event,handler)},
  Image:class{},HTMLInputElement:class{},performance:{now:()=>0},requestAnimationFrame(){},gameAudio:{update(){},radioState:()=>({on:false})}};
vm.createContext(sandbox);
for(const file of ['game.js','mobile.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),sandbox);
const run=code=>vm.runInContext(code,sandbox);
const stick=element('joystick');
const pointer=(pointerId,clientX,clientY)=>({pointerId,clientX,clientY});

element('touch-interact').onclick();
run('update(.016)');
assert.equal(run('family[0].seated'),false);
stick.fire('pointerdown',pointer(1,90,58));
const startX=run('family[0].x');run('update(.1)');
assert(run('family[0].x')>startX,'Joystick moves a standing person');
stick.fire('pointerdown',pointer(2,26,58));
assert.equal(run("touchKeys.has('d')"),true,'Second finger cannot steal the joystick');
stick.fire('pointercancel',pointer(1,90,58));
assert.equal(run('touchKeys.size'),0,'Cancelled touch stops movement');

run('family[0].y=-50;update(.016)');
assert.equal(element('touch-interact').textContent,'Przejmij kierownicę');
element('touch-interact').onclick();run('update(.016)');
assert.equal(run('mode'),'driving');
assert.equal(element('touch-interact').textContent,'Wróć do wnętrza');
stick.fire('pointerdown',pointer(3,90,26));
const driveSpeed=run('car.speed'),driveAngle=run('car.angle');run('update(.1)');
assert(run('car.speed')>driveSpeed,'Pushing the joystick up accelerates the car');
assert(run('car.angle')>driveAngle,'Pushing the joystick right turns the moving car');
stick.fire('pointerup',pointer(3,90,26));
assert.equal(run('touchKeys.size'),0);
stick.fire('pointerdown',pointer(4,58,90));const speedBeforeBrake=run('car.speed');run('update(.1)');
assert(run('car.speed')<speedBeforeBrake,'Pulling the joystick down brakes the car');stick.fire('pointerup',pointer(4,58,90));

stick.fire('pointerdown',pointer(5,58,26));
element('touch-pause').onclick();
assert.equal(run('paused'),true);assert.equal(run('touchKeys.size'),0);
assert.equal(element('touch-pause').textContent,'▶');
stick.fire('pointerdown',pointer(6,58,26));
assert.equal(run('touchKeys.size'),0,'Joystick is inactive while paused');
element('touch-pause').onclick();
stick.fire('pointerdown',pointer(7,58,26));
windowEvents.get('resize')();assert.equal(run('touchKeys.size'),0);
stick.fire('pointerdown',pointer(8,58,26));
sandbox.document.hidden=true;documentEvents.get('visibilitychange')();
assert.equal(run('touchKeys.size'),0);
sandbox.document.hidden=false;
element('touch-interact').onclick();run('update(.016)');
assert.equal(run('mode'),'interior');
stick.fire('pointerdown',pointer(9,58,26));run('selectPerson(2)');
assert.equal(run('selected'),2);assert.equal(run('touchKeys.size'),0);
run("keys.add('a')");stick.fire('pointerdown',pointer(10,90,58));
stick.fire('pointerup',pointer(10,90,58));
assert.equal(run("down('a')"),true,'Touch release preserves physical keyboard input');
windowEvents.get('blur')();assert.equal(run('keys.size+touchKeys.size'),0);
run("mode='interior';paused=false;selected=0;family[0].seated=false;family[0].station=null;family[0].x=39;family[0].y=28");
assert.equal(run('interactionUnavailable()'),true,'An occupied workstation cannot be used');
run('interact()');assert.equal(run('family[0].seated'),false,'Interaction leaves the person standing at an occupied workstation');
run('family[2].seated=false;family[2].station=null;family[0].x=-38;family[0].y=82;interact()');
assert.equal(run('family[0].seated'),true,'A person can use somebody else\'s free workstation');
assert.equal(run('family[0].station'),2,'The newly occupied workstation is remembered');
run("family.slice(0,3).forEach((p,i)=>{p.aboard=true;p.seated=true;p.passenger=false;p.station=i;p.x=cabinSeats[i].x;p.y=cabinSeats[i].y});family[3].aboard=false;family[3].seated=false;family[3].station=null;family[4].aboard=false;family[4].seated=false;family[4].station=null;mode='driving';selected=0;car.x=410;car.y=-50");
assert.equal(run('interactionLabel()'),'Zabierz Tosię');
assert.equal(run('pickupTargetVisible(nearestWaitingFamily())'),true,'The navigation indicator hides when the waiting person is already on screen');
run('car.y=650');assert.equal(run('pickupTargetVisible(nearestWaitingFamily())'),false,'The navigation indicator appears for an off-screen person');run('car.y=-50');
run('interact()');assert.equal(run('family[3].aboard'),true,'Tosia can be picked up from the map');
assert.equal(run('family[3].station'),3,'The first picked-up child uses the first couch seat');
run('car.x=760;car.y=-230;interact()');assert.equal(run('family[4].aboard'),true,'Łucja can be picked up from the map');
assert.equal(run('family[4].station'),4,'The second picked-up child uses the second couch seat');
run("mode='interior';selected=4;interact()");assert.equal(run('family[4].seated'),false,'A person can stand up from the rear couch seat');
assert.equal(run('canWalk(family[4].x,family[4].y)'),true,'The couch exit point is inside the walkable aisle');
const couchExitY=run('family[4].y');run("touchKeys.add('w');update(.1);touchKeys.clear()");
assert(run('family[4].y')<couchExitY,'A person can move immediately after leaving the couch');
run("paused=false;family.forEach(p=>{p.seated=false;p.passenger=false;p.station=null});coinParticles.length=0");
const moneyWithoutWorkers=run('money');run('update(1)');assert.equal(run('money'),moneyWithoutWorkers,'Money does not increase when nobody is working');
run("family[0].seated=true;family[0].station=0;family[0].x=cabinSeats[0].x;family[0].y=cabinSeats[0].y;update(.25)");
assert.equal(run('money'),moneyWithoutWorkers+.5,'One occupied computer earns money at the configured rate');
assert(run('coinParticles.length')>0,'Working at a computer emits a coin animation');
run("family[0].face={kind:'photo'};family[0].pixel={kind:'pixel'};setCharacterStyle('pixel')");
assert.equal(run("characterArt(family[0]).kind"),'pixel','Pixel-art mode selects the transparent pixel asset');
run("setCharacterStyle('photo')");assert.equal(run("characterArt(family[0]).kind"),'photo','Photo mode restores the photographic asset');
console.log('OK: walking, acceleration, braking, steering, interaction, pause, pickups, seating and keyboard.');
