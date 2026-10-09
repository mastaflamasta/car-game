const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const elements=new Map(),windowEvents=new Map(),documentEvents=new Map(),oscillators=[];
const canvasContext=new Proxy({},{get:(o,k)=>o[k]||(o[k]=()=>{})});
function element(id){
  if(!elements.has(id))elements.set(id,{textContent:'',style:{},innerHTML:'',disabled:false,
    classList:{toggle(){},remove(){}},setAttribute(){},append(){},addEventListener(){},
    hasPointerCapture:()=>false,getContext:()=>canvasContext,querySelector:()=>element('hint')});
  return elements.get(id);
}
function param(){return {value:0,setValueAtTime(v,t){assert(Number.isFinite(v)&&Number.isFinite(t))},linearRampToValueAtTime(v,t){assert(Number.isFinite(v)&&Number.isFinite(t))},exponentialRampToValueAtTime(v,t){assert(v>0&&Number.isFinite(t))},setTargetAtTime(){},cancelScheduledValues(){}}}
function node(){return {connect(){},disconnect(){},gain:param(),frequency:param(),Q:param(),start(){},stop(){}}}
let audioContext;
class AudioContext{
  constructor(){audioContext=this;this.currentTime=0;this.sampleRate=8000;this.state='running';this.destination={}}
  createGain(){return node()}
  createOscillator(){const n=node();n.start=t=>{n.started=t??0};n.stop=t=>{n.stopped=t};oscillators.push(n);return n}
  createBufferSource(){return node()}
  createBiquadFilter(){return node()}
  createDynamicsCompressor(){return {connect(){},threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()}}
  createBuffer(c,length){return {getChannelData:()=>new Float32Array(length)}}
}
const sandbox={console,localStorage:{getItem:()=>null,setItem(){}},Image:class{},HTMLInputElement:class{},
  performance:{now:()=>0},requestAnimationFrame(){},
  window:{AudioContext,matchMedia:()=>({matches:true}),addEventListener(event,handler){if(!windowEvents.has(event))windowEvents.set(event,[]);windowEvents.get(event).push(handler)}},
  document:{hidden:false,getElementById:element,createElement:()=>element('new'+elements.size),querySelector:()=>element('panel'),querySelectorAll:()=>[],
    addEventListener(event,handler){if(!documentEvents.has(event))documentEvents.set(event,[]);documentEvents.get(event).push(handler)}}};
vm.createContext(sandbox);
const run=code=>vm.runInContext(code,sandbox);
for(const file of ['audio.js','game.js','mobile.js','radio.js'])run(fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
assert.equal(element('radio-power').disabled,true);
run("operateRadio('power')");assert.equal(run('gameAudio.radioState().on'),false,'Radio cannot be controlled from a workstation');
run('interact();keys.add("w");');
for(let i=0;i<50;i++)run('update(.04)');
run('keys.clear();keys.add("d")');for(let i=0;i<20;i++)run('update(.04)');run('keys.clear()');
assert(run('family[0].x>12&&family[0].y<-35'),'Passenger seat is reachable using normal walking and collisions');
run('interact();update(.016)');
assert.equal(run('atPassengerSeat()'),true);assert.equal(run('mode'),'interior');
assert.equal(element('radio-power').disabled,false);
assert.equal(element('touch-interact').textContent,'Wstań z fotela');
element('radio-power').onclick();assert.equal(run('gameAudio.radioState().on'),true);
const state={mode:'interior',speed:32,paused:false,seats:[false,true,true]};sandbox.audioState=state;
run('gameAudio.update(.016,audioState)');
const voices=oscillators.filter(n=>n.started>0);assert(voices.length>=4,'Music schedules melody, bass and harmony');
element('radio-next').onclick();assert.equal(run('gameAudio.radioState().index'),1);
assert(voices.every(n=>n.stopped<=audioContext.currentTime+.04),'Track change stops queued old notes');
run('gameAudio.update(.016,audioState)');
element('radio-next').onclick();element('radio-next').onclick();assert.equal(run('gameAudio.radioState().index'),0);
element('radio-prev').onclick();assert.equal(run('gameAudio.radioState().index'),2);
for(let i=0;i<200;i++){audioContext.currentTime+=.1;run('gameAudio.update(.1,audioState)')}
assert(oscillators.length>50,'Music continues across repeated loops');
const latest=oscillators.at(-1);state.paused=true;run('gameAudio.update(.016,audioState)');
assert(latest.stopped<=audioContext.currentTime+.04,'Pause cancels music');
state.paused=false;run('gameAudio.update(.016,audioState)');
element('audio-toggle').onclick();assert.equal(run('gameAudio.radioState().muted'),true);
element('audio-toggle').onclick();run('gameAudio.update(.016,audioState)');
sandbox.document.hidden=true;for(const handler of documentEvents.get('visibilitychange'))handler();
assert(oscillators.at(-1).stopped<=audioContext.currentTime+.04,'Hidden page cancels music');
sandbox.document.hidden=false;
run('selectPerson(1);interact();family[1].x=30;family[1].y=-45;interact()');
assert.equal(run('family[1].passenger'),undefined,'Occupied passenger seat rejects a second occupant');
run('selectPerson(0);interact();update(.016)');
assert.equal(run('gameAudio.radioState().on'),true,'Leaving passenger seat keeps radio on');
assert.equal(element('radio-power').disabled,true);
run("operateRadio('power')");assert.equal(run('gameAudio.radioState().on'),true,'Remote radio operation is blocked');
run('family[0].x=30;family[0].y=-45;interact();update(.016)');element('radio-power').onclick();
assert.equal(run('gameAudio.radioState().on'),false);
console.log('OK: reachable seat, occupancy, passenger-only controls, three tracks, looping, note cancellation, pause, mute, hidden page and power.');
