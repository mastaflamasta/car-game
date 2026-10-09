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
const stick=element('joystick'),brake=element('touch-brake');
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
assert.equal(brake.disabled,false);
stick.fire('pointerdown',pointer(3,90,26));
brake.fire('pointerdown',pointer(4,0,0));
const speed=run('car.speed');run('update(.1)');
assert(run('car.speed')<speed,'Brake overrides gas while steering with another finger');
stick.fire('pointerup',pointer(3,90,26));
assert.equal(run("touchKeys.has(' ')"),true,'Releasing joystick leaves held brake active');
brake.fire('lostpointercapture',pointer(4,0,0));
assert.equal(run('touchKeys.size'),0);

stick.fire('pointerdown',pointer(5,58,26));
element('touch-pause').onclick();
assert.equal(run('paused'),true);assert.equal(run('touchKeys.size'),0);
assert.equal(element('touch-pause').textContent,'▶ Wznów');
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
assert.equal(run('mode'),'interior');assert.equal(brake.disabled,true);
stick.fire('pointerdown',pointer(9,58,26));run('selectPerson(2)');
assert.equal(run('selected'),2);assert.equal(run('touchKeys.size'),0);
run("keys.add('a')");stick.fire('pointerdown',pointer(10,90,58));
stick.fire('pointerup',pointer(10,90,58));
assert.equal(run("down('a')"),true,'Touch release preserves physical keyboard input');
windowEvents.get('blur')();assert.equal(run('keys.size+touchKeys.size'),0);
console.log('OK: movement, interaction, two fingers, brake priority, cancellation, pause, resize, visibility, selection and keyboard.');
