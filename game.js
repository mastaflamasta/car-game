'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);
const workstations=[{x:-39,y:14,label:'lewym stanowisku'},{x:39,y:14,label:'prawym stanowisku'},{x:-38,y:69,label:'stanowisku z laptopem'}];
const cabinSeats=[...workstations,{x:40,y:58,label:'przedniej części kanapy'},{x:40,y:79,label:'tylnej części kanapy'}];
const seatInteractionZones=[
  {left:-54,right:-13,top:8,bottom:39},{left:13,right:54,top:8,bottom:39},{left:-54,right:-13,top:61,bottom:94},
  {left:13,right:54,top:45,bottom:68},{left:13,right:54,top:69,bottom:94}
];
const driverInteractionZone={left:-50,right:-8,top:-61,bottom:-34},passengerInteractionZone={left:14,right:54,top:-58,bottom:-30},exitDoorInteractionZone={left:-16,right:16,top:73,bottom:91};
const family=[
  {name:'Mama',pickupName:'Mamę',role:'Projektuje przy komputerze',color:'#d88860',hair:'#9a5239',hairStyle:'bob',glasses:true,x:-39,y:14,station:0,seated:true,aboard:true,closeness:0},
  {name:'Tata',pickupName:'Tatę',role:'Pracuje przy komputerze',color:'#679b91',hair:'#423c36',hairStyle:'short',x:39,y:14,station:1,seated:true,aboard:true,closeness:0},
  {name:'Nela',pickupName:'Nelę',role:'Tworzy na laptopie',color:'#c4ad66',hair:'#b97838',hairStyle:'long',x:-38,y:69,station:2,seated:true,aboard:true,closeness:0},
  {name:'Tosia',pickupName:'Tosię',role:'Czeka na rodzinę',color:'#c98b75',hair:'#b34e2e',hairStyle:'bob',glasses:true,x:0,y:0,station:null,seated:false,aboard:false,pickup:{x:410,y:-50},closeness:0},
  {name:'Łucja',pickupName:'Łucję',role:'Czeka na rodzinę',color:'#8aa5b2',hair:'#51352e',hairStyle:'short',glasses:true,x:0,y:0,station:null,seated:false,aboard:false,pickup:{x:760,y:-230},closeness:0},
  {name:'Kasia',pickupName:'Kasię',role:'Spaceruje po mieście',color:'#8e768f',hair:'#6b4b3a',hairStyle:'long',glasses:true,x:0,y:0,station:null,seated:false,aboard:false,boardable:false,pickup:{x:-50,y:300},closeness:0}
];
// Each crop is measured relative to its original photograph.
const familyPhotos=[
  {label:'Mama · Dagmara',src:'images/mama-dagmara.jpg',pixel:'images/mama-dagmara-pixel.png',pixelCrop:[.12,.02,.76,.89],crop:[.05,.025,.88,.81]},
  {label:'Tata · Andrzej',src:'images/tata-andrzej.jpg',pixel:'images/tata-andrzej-pixel.png',pixelCrop:[.13,.01,.74,.86],crop:[.025,.015,.92,.875]},
  {label:'Córka · Nela',src:'images/corka-nela.jpg',pixel:'images/corka-nela-pixel.png',pixelCrop:[.08,.01,.84,.98],crop:[.04,.015,.92,.875]},
  {label:'Córka · Tosia',srcs:['images/corka-tosia.jpg','images/corka-tosia.png'],pixel:'images/corka-tosia-pixel.png',pixelCrop:[.08,.01,.84,.98],crop:[0,.03,1,.91]},
  {label:'Córka · Łucja',srcs:['images/corka-łucja.jpg','images/corka-łucja.png','images/corka-lucja.jpg','images/corka-lucja.png'],pixel:'images/corka-łucja-pixel.png',pixelCrop:[.1,.01,.8,.93],crop:[0,.04,1,.875]},
  {label:'Koleżanka · Kasia',src:'images/kolazanka-kasia.jpg',pixel:'images/kolazanka-kasia-pixel.png',pixelCrop:[.05,.01,.9,.96],crop:[0,0,1,1]}
];
let characterStyle='photo';
try{characterStyle=window.localStorage?.getItem('roadfamily-character-style')==='pixel'?'pixel':'photo'}catch{}
function loadFamilyPhotos(){
  familyPhotos.forEach((photo,i)=>{
    const img=new Image();
    img.onload=()=>{
      const [x,y,w,h]=photo.crop;
      const face=document.createElement('canvas');face.width=96;face.height=112;
      const c=face.getContext('2d');
      c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
      c.beginPath();c.ellipse(48,56,48,56,0,0,Math.PI*2);c.clip();
      c.drawImage(img,x*img.naturalWidth,y*img.naturalHeight,w*img.naturalWidth,h*img.naturalHeight,0,0,96,112);
      family[i].face=face;buildFamily();
    };
    // The original pixel face stays available if a photo cannot load.
    const sources=photo.srcs||[photo.src];let sourceIndex=0;
    img.onerror=()=>{sourceIndex++;if(sourceIndex<sources.length)img.src=sources[sourceIndex];else console.warn('Nie udało się wczytać portretu:',sources.join(', '))};
    img.src=sources[sourceIndex];
    const pixel=new Image();pixel.onload=()=>{family[i].pixel=pixel;buildFamily()};pixel.onerror=()=>console.warn('Nie udało się wczytać grafiki pixel art:',photo.pixel);pixel.src=photo.pixel;
  });
}
let selected=0,mode='interior',zoom=2.2,roof=0,paused=false,time=0,distance=0,toastTimer=5,walked=false,taken=false;
let money=0,lastMoneyShown=-1,bond=0,lastBondShown=-1;
const coinParticles=[],heartParticles=[];
let characterDialogTimer=0;
const pickupDialogMessages=['Dzięki!','Co tak długo?','Wreszcie! Ile można czekać?','Dobrze, że jest wolne miejsce!','Następnym razem wyślijcie SMS-a!','Jedziemy, zanim zmienię zdanie!'];
const kasiaDialogMessages=['Nie chcę!','Nie teraz!','Mam dziś inne plany!','Nie wsiadam bez playlisty na poziomie!','Ten van nie pasuje do mojego outfitu!','Moja intuicja mówi: jeszcze nie.'];
const car={x:350,y:650,angle:0,speed:32,autoX:350};
const keys=new Set();
const touchKeys=new Set();
const touchHint=(mobile,keyboard)=>window.matchMedia('(max-width:820px)').matches?mobile:keyboard;
const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
const characterArt=p=>characterStyle==='pixel'&&p.pixel?p.pixel:p.face;
const characterPortraitArt=p=>characterStyle==='pixel'&&p.pixel?p.pixel:p.face;
function drawPixelHead(p,x,y){
  const skin='#e2b88d',line='#40352f',light='#f0c69a';
  if(p.hairStyle==='long'){rect(x-7,y-11,14,14,p.hair);rect(x-8,y-8,3,13,p.hair);rect(x+5,y-8,3,13,p.hair)}
  else if(p.hairStyle==='bob'){rect(x-7,y-11,14,12,p.hair);rect(x-7,y-7,3,10,p.hair);rect(x+5,y-7,3,10,p.hair)}
  else rect(x-6,y-11,12,7,p.hair);
  rect(x-5,y-8,10,9,skin);rect(x-4,y-8,8,2,p.hair);rect(x-5,y-7,2,3,p.hair);
  if(p.glasses){rect(x-5,y-5,4,1,line);rect(x-5,y-2,4,1,line);rect(x-5,y-5,1,4,line);rect(x-2,y-5,1,4,line);rect(x+1,y-5,4,1,line);rect(x+1,y-2,4,1,line);rect(x+1,y-5,1,4,line);rect(x+4,y-5,1,4,line);rect(x-1,y-4,2,1,line)}
  else{rect(x-3,y-4,1,1,line);rect(x+2,y-4,1,1,line)}
  rect(x-1,y-1,3,1,p.name==='Tata'?'#8f644f':'#b85e5a');rect(x-4,y-7,2,1,light);
}
function person(p,x,y,dir=0,walking=false){
  const step=walking?Math.sin(time*15)*2:0;
  rect(x-5,y+7,4,5+step,'#303e39');rect(x+1,y+7,4,5-step,'#303e39');
  rect(x-7,y,14,9,p.color);rect(x-9,y+1,3,6,'#e2b88d');rect(x+6,y+1,3,6,'#e2b88d');
  const art=characterArt(p);
  if(art){
    ctx.save();ctx.imageSmoothingEnabled=characterStyle!=='pixel';if(characterStyle!=='pixel')ctx.imageSmoothingQuality='high';
    ctx.drawImage(art,Math.round(x-9),Math.round(y-17),18,21);ctx.restore();
    return;
  }
  drawPixelHead(p,x,y);
}
function buildFamily(){
  const aboard=family.map((p,i)=>({p,i})).filter(({p})=>p.aboard);
  $('family').innerHTML=aboard.map(({p,i})=>`<button class="person ${i===selected?'active':''}" data-person="${i}" aria-pressed="${i===selected}"><canvas class="portrait ${characterStyle==='photo'&&p.face?'photo-portrait':'pixel-portrait'}" width="96" height="112" id="portrait-${i}" aria-hidden="true"></canvas><span class="person-info"><strong>${familyPhotos[i].label}</strong><small>${p.passenger?'Pasażer · obsługuje radio':p.seated?'Siedzi przy '+cabinSeats[p.station].label:(mode==='driving'&&i===selected?'Prowadzi samochód':'Spaceruje po wnętrzu')}</small></span><span class="shortcut">${i+1}</span></button>`).join('');
  aboard.forEach(({p,i})=>{const c=$('portrait-'+i).getContext('2d');c.fillStyle='#34402d';c.fillRect(0,0,24,28);c.fillStyle=p.color;c.fillRect(5,16,14,12);c.fillStyle=p.hair;c.fillRect(6,4,12,13);c.fillStyle='#e2b88d';c.fillRect(7,9,10,9);c.fillStyle='#35352f';c.fillRect(9,12,2,2);c.fillRect(14,12,2,2)});
  aboard.forEach(({p,i})=>{const c=$('portrait-'+i).getContext('2d'),art=characterPortraitArt(p);if(art){c.clearRect(0,0,96,112);c.imageSmoothingEnabled=characterStyle!=='pixel';if(characterStyle==='pixel'){const ratio=Math.min(96/art.naturalWidth,112/art.naturalHeight),w=art.naturalWidth*ratio,h=art.naturalHeight*ratio;c.drawImage(art,(96-w)/2,(112-h)/2,w,h)}else c.drawImage(art,0,0,96,112)}else{const fallback=document.createElement('canvas');fallback.width=24;fallback.height=28;fallback.getContext('2d').drawImage(c.canvas,0,0,24,28,0,0,24,28);c.clearRect(0,0,96,112);c.imageSmoothingEnabled=false;c.drawImage(fallback,0,0,96,112)}});
  document.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>selectPerson(+b.dataset.person));
  if($('aboard-count'))$('aboard-count').textContent=String(aboard.length+1).padStart(2,'0')+' / 06';
}
function toast(s){$('toast').textContent=s;toastTimer=4}
function showCharacterDialog(p,messages){
  const index=family.indexOf(p),message=messages[Math.floor(Math.random()*messages.length)];
  $('character-dialog-image').src=familyPhotos[index].pixel;$('character-dialog-image').alt='Pikselowy portret: '+p.name;
  $('character-dialog-name').textContent=p.name;$('character-dialog-message').textContent=message;$('character-dialog').hidden=false;characterDialogTimer=3.6;
}
function updateCharacterDialog(dt){if(characterDialogTimer<=0)return;characterDialogTimer=Math.max(0,characterDialogTimer-dt);if(characterDialogTimer===0)$('character-dialog').hidden=true}
function atPassengerSeat(){return mode==='interior'&&!!family[selected].passenger}
function insideInteractionZone(p,zone){return p.x>=zone.left&&p.x<=zone.right&&p.y>=zone.top&&p.y<=zone.bottom}
function atDriverPlace(p){return insideInteractionZone(p,driverInteractionZone)}
function atPassengerPlace(p){return insideInteractionZone(p,passengerInteractionZone)}
function atExitDoor(p){return insideInteractionZone(p,exitDoorInteractionZone)}
function aboardFamilyCount(){return family.filter(member=>member.aboard).length}
function nearestWorkstation(p){let best=null;cabinSeats.forEach((seat,index)=>{if(!insideInteractionZone(p,seatInteractionZones[index]))return;const distance=Math.hypot(p.x-seat.x,p.y-seat.y);if(!best||distance<best.distance)best={seat,index,distance}});return best}
function workstationOccupant(index,p){return family.find(other=>other!==p&&other.seated&&!other.passenger&&other.station===index)}
function passengerOccupant(p){return family.find(other=>other!==p&&other.passenger)}
function touchingFamilyMember(p){
  if(!p||p.seated||p.passenger)return null;
  return family.filter(other=>other!==p&&other.aboard)
    .map(other=>({other,distance:Math.hypot(p.x-other.x,p.y-other.y)}))
    .filter(candidate=>candidate.distance<=31).sort((a,b)=>a.distance-b.distance)[0]?.other||null;
}
function hugFamily(p,other){
  bond++;other.closeness=Math.min(100,(other.closeness||0)+20);
  heartParticles.push({x:(p.x+other.x)/2,y:(p.y+other.y)/2-13,age:0,life:1.15,drift:(Math.random()-.5)*3});toast(p.name+' i '+other.name+' przytulają się ♥');
}
function streetPeopleByDistance(){return family.filter(p=>!p.aboard&&p.pickup).map(p=>({p,distance:Math.hypot(car.x-p.pickup.x,car.y-p.pickup.y)})).sort((a,b)=>a.distance-b.distance)}
function nearestWaitingFamily(){return streetPeopleByDistance().find(({p})=>p.boardable!==false)}
function waitingFamilyNearCar(){const nearest=streetPeopleByDistance()[0];return nearest&&nearest.distance<82?nearest.p:null}
function standingSpotForSeat(index){
  const seat=cabinSeats[index]||cabinSeats[0];
  const candidates=index>=3?[{x:16,y:Math.min(78,seat.y)},{x:14,y:46},{x:0,y:82}]:[{x:seat.x<0?-17:17,y:Math.min(84,seat.y+13)},{x:0,y:38}];
  return candidates.find(point=>canWalk(point.x,point.y))||{x:0,y:38};
}
function interactionUnavailable(){
  const p=family[selected];if(mode==='driving'||p.passenger||p.seated)return false;
  if(atExitDoor(p))return aboardFamilyCount()<=1;
  if(atPassengerPlace(p)){const occupant=passengerOccupant(p);return !!(occupant&&!touchingFamilyMember(p))}
  const target=nearestWorkstation(p);return !!(target&&workstationOccupant(target.index,p)&&!touchingFamilyMember(p));
}
function interactionLabel(){
  const p=family[selected];
  if(mode==='driving'){const waiting=waitingFamilyNearCar();return waiting?'Zabierz '+(waiting.pickupName||waiting.name):'Wróć do wnętrza'}if(p.passenger)return'Wstań z fotela';if(p.seated)return'Wstań';
  if(atExitDoor(p))return aboardFamilyCount()>1?'Wysiądź':'Nie możesz wysiąść';
  if(atPassengerPlace(p)){const occupant=passengerOccupant(p);return occupant?(touchingFamilyMember(p)?'Przytul':'Fotel zajęty'):'Usiądź przy radiu'}
  if(atDriverPlace(p))return'Przejmij kierownicę';
  const target=nearestWorkstation(p),occupant=target&&workstationOccupant(target.index,p);if(target&&!occupant)return'Usiądź';
  if(touchingFamilyMember(p))return'Przytul';
  return target?'Miejsce zajęte':'Interakcja';
}
function selectPerson(i){if(!family[i]?.aboard)return;if(mode==='driving'){toast(touchHint('Najpierw dotknij „Wróć do wnętrza”.','Najpierw wróć do wnętrza klawiszem E.'));return}window.resetTouchControls?.();selected=i;buildFamily();toast(family[i].name+touchHint(' · Dotknij „Wstań”, potem użyj joysticka.',' · E — wstań / usiądź, WASD — spacer'))}
function familyMemberAtCabinPoint(x,y){
  return family.map((p,i)=>({p,i,distance:Math.hypot(x-p.x,y-(p.y-3))}))
    .filter(({p})=>p.aboard&&Math.abs(x-p.x)<=12&&y>=p.y-21&&y<=p.y+15)
    .sort((a,b)=>a.distance-b.distance)[0]?.i??-1;
}
function selectPersonFromCanvas(event){
  if(mode!=='interior')return;
  const box=canvas.getBoundingClientRect(),fitScale=Math.max(box.width/canvas.width,box.height/canvas.height),drawnWidth=canvas.width*fitScale,drawnHeight=canvas.height*fitScale;
  const screenX=(event.clientX-box.left-(box.width-drawnWidth)/2)/fitScale,screenY=(event.clientY-box.top-(box.height-drawnHeight)/2)/fitScale;
  const scale=zoom*(1-roof*.82);if(scale<=0)return;
  const rotatedX=(screenX-320)/scale,rotatedY=(screenY-210)/scale,cos=Math.cos(car.angle),sin=Math.sin(car.angle);
  const index=familyMemberAtCabinPoint(rotatedX*cos+rotatedY*sin,-rotatedX*sin+rotatedY*cos);
  if(index>=0&&index!==selected)selectPerson(index);
}
canvas.addEventListener('click',selectPersonFromCanvas);
canvas.addEventListener('pointerup',selectPersonFromCanvas);
function togglePause(){paused=!paused;keys.clear();window.resetTouchControls?.();$('pause-overlay').hidden=!paused;$('pause').innerHTML=paused?'▶ <span>Wznów</span>':'Ⅱ <span>Pauza</span>';window.updateTouchControls?.()}
$('pause').onclick=togglePause;
function interact(){
  if(paused)return;
  window.resetTouchControls?.();
  const p=family[selected];
  if(mode==='driving'){
    const waiting=waitingFamilyNearCar();
    if(waiting){if(waiting.boardable===false){showCharacterDialog(waiting,kasiaDialogMessages);return}const freeSeat=cabinSeats.findIndex((seat,index)=>!workstationOccupant(index,waiting));waiting.aboard=true;waiting.seated=freeSeat>=0;waiting.station=freeSeat>=0?freeSeat:null;if(freeSeat>=0){waiting.x=cabinSeats[freeSeat].x;waiting.y=cabinSeats[freeSeat].y}else{waiting.x=0;waiting.y=38}buildFamily();showCharacterDialog(waiting,pickupDialogMessages);return}
    mode='interior';p.x=-12;p.y=-53;p.seated=false;p.station=null;car.autoX=Math.round(car.x/350)*350;car.speed=32;buildFamily();toast('Kierowca znów prowadzi. Wróć do dowolnego wolnego miejsca.');return
  }
  if(p.passenger){p.passenger=false;p.seated=false;p.station=null;p.x=17;p.y=-34;buildFamily();toast('Wstajesz z fotela pasażera. Radio gra dalej.');return}
  if(p.seated){const standing=standingSpotForSeat(p.station);p.seated=false;p.station=null;p.x=standing.x;p.y=standing.y;walked=true;buildFamily();toast('Możesz usiąść przy dowolnym wolnym miejscu.');return}
  if(atExitDoor(p)){
    if(aboardFamilyCount()<=1){toast('Ostatnia osoba nie może opuścić samochodu.');return}
    p.aboard=false;p.seated=false;p.passenger=false;p.station=null;p.pickup={x:car.x-Math.sin(car.angle)*125,y:car.y+Math.cos(car.angle)*125};
    selected=family.findIndex(member=>member.aboard);buildFamily();toast(p.name+' wysiada i czeka przy drodze.');return;
  }
  if(atPassengerPlace(p)){
    const occupant=passengerOccupant(p);
    if(occupant){const closePerson=touchingFamilyMember(p);if(closePerson){hugFamily(p,closePerson);return}toast('Fotel pasażera jest zajęty.');return}
    p.passenger=true;p.seated=true;p.station=null;p.x=36;p.y=-44;buildFamily();toast(touchHint('Radio: dotknij przycisku ♫.','Radio: R — włącz / wyłącz · [ / ] — zmień utwór · E — wstań'));return;
  }
  if(atDriverPlace(p)){mode='driving';taken=true;buildFamily();toast(p.name+touchHint(' prowadzi · ↑ gaz · ↓ hamulec · ← → skręt',' prowadzi · W/S — gaz i hamulec · A/D — skręt · E — wnętrze'));return}
  const target=nearestWorkstation(p),occupant=target&&workstationOccupant(target.index,p);
  if(target&&!occupant){p.seated=true;p.station=target.index;p.x=target.seat.x;p.y=target.seat.y;buildFamily();toast(p.name+' siada przy '+target.seat.label+'.');return}
  const closePerson=touchingFamilyMember(p);
  if(closePerson){hugFamily(p,closePerson);return}
  if(occupant){toast('To miejsce zajmuje '+occupant.name+'.');return}
  toast('Podejdź do kierowcy lub do swojego stanowiska.');
}
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','e','p','1','2','3','4','5'].includes(k))e.preventDefault();if(!e.repeat){if(k==='e')interact();if(k==='p')togglePause();if(['1','2','3','4','5'].includes(k))selectPerson(+k-1)}keys.add(k)});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();window.resetTouchControls?.()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();window.resetTouchControls?.()}});
const down=(...k)=>k.some(v=>keys.has(v)||touchKeys.has(v));
function hash(x,y){return Math.abs(Math.sin(x*127.1+y*311.7)*43758.5453)%1}
function tree(x,y){rect(x+2,y+3,5,12,'#516047');rect(x-9,y-8,20,19,'#374e3a');rect(x-12,y-4,25,10,'#405d41');rect(x-7,y-10,14,10,'#57754b');rect(x-5,y-9,7,3,'#7d9259')}
function world(){
  rect(-2500,-2500,5000,5000,'#728366');
  const minX=Math.floor((car.x-450)/350),maxX=Math.ceil((car.x+450)/350),minY=Math.floor((car.y-350)/350),maxY=Math.ceil((car.y+350)/350);
  for(let i=minX;i<=maxX;i++)for(let j=minY;j<=maxY;j++){
    const x=i*350,y=j*350;
    rect(x-56,y-56,112,350,'#abb09a');rect(x-49,y-56,98,350,'#455653');rect(x-56,y-56,350,112,'#abb09a');rect(x-56,y-49,350,98,'#455653');
    for(let n=0;n<7;n++){rect(x-2,y+62+n*35,3,17,'#9eab8e');rect(x+62+n*35,y-2,17,3,'#9eab8e')}
    rect(x+55,y+55,238,238,'#899279');rect(x+63,y+63,222,222,'#728366');
    const col=['#b9997a','#818f85','#a6a78c','#8e9a87'][Math.floor(hash(i,j)*4)];
    rect(x+90,y+94,165,142,'#53634f');rect(x+79,y+77,166,142,'#5c6c61');rect(x+79,y+73,166,136,col);rect(x+86,y+80,152,122,'#7b8879');
    rect(x+94,y+89,136,104,col);rect(x+101,y+96,120,3,'#c0bd9b');
    for(let n=0;n<4;n++){rect(x+100+n*31,y+112,17,21,'#546a65');rect(x+102+n*31,y+114,12,7,'#abc2ae');rect(x+100+n*31,y+158,17,21,'#546a65');rect(x+102+n*31,y+160,12,7,'#abc2ae')}
    rect(x+154,y+187,23,22,'#4b6056');rect(x+158,y+189,15,20,'#d0b481');
    tree(x+66,y+250);tree(x+265,y+84);tree(x+247,y+261);
    rect(x+35,y+67,3,20,'#344a41');rect(x+31,y+65,10,5,'#d5c9a0');
    // Parked cars and slow traffic.
    vehicle(x+34,y+146,0,'#b78b65',false);vehicle(x+168,y-30,Math.PI/2,'#aeb79c',false);
    const ty=y+80+((time*24+hash(i,j)*220)%230);vehicle(x-24,ty,Math.PI,'#709a95',false);
    // Zebra crossings.
    for(let n=0;n<5;n++){rect(x+59,y-36+n*16,15,8,'#b7bca2');rect(x-36+n*16,y+59,8,15,'#b7bca2')}
  }
  family.forEach(p=>{if(p.aboard||!p.pickup)return;const {x,y}=p.pickup;ctx.save();ctx.globalAlpha=.28;ctx.fillStyle='#d1e997';ctx.beginPath();ctx.arc(x,y,24+Math.sin(time*3)*3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;person(p,x,y);ctx.fillStyle='#101816';ctx.fillRect(x-24,y-31,48,11);ctx.fillStyle='#edf0cf';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(p.name.toUpperCase(),x,y-23);ctx.textAlign='start';ctx.restore()})
}
function vehicle(x,y,a,color,large){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a);const w=large?136:18,h=large?216:34;rect(-w/2+3,-h/2+4,w,h,'#34493c');rect(-w/2,-h/2,w,h,color);rect(-w/2+3,-h/2+3,w-6,h-6,color);rect(-w/2+4,-h/2+6,w-8,large?18:8,'#436366');rect(-w/2+4,h/2-12,w-8,7,'#526b63');rect(-w/2-2,-h/2+8,3,9,'#29372e');rect(w/2-1,-h/2+8,3,9,'#29372e');rect(-w/2-2,h/2-14,3,9,'#29372e');rect(w/2-1,h/2-14,3,9,'#29372e');if(large){rect(-55,-135,110,31,'#34493c');rect(-52,-132,104,27,color);rect(-47,-129,94,20,'#d1c093');rect(-44,-126,88,3,'#e3d5aa');rect(-2,-126,4,17,'#b5a77f');rect(-36,-132,15,5,'#f5dc9c');rect(21,-132,15,5,'#f5dc9c');rect(-46,-136,92,4,'#526357');rect(-20,-25,40,65,'#c6c5a3');rect(-16,-21,32,3,'#dcd9b5');rect(-12,-4,24,28,'#a8b39b');rect(-8,0,16,20,'#bec7a6')}else{rect(-w/2+3,-h/2,5,3,'#f5dc9c');rect(w/2-8,-h/2,5,3,'#f5dc9c')}ctx.restore()}
function hitsVehicle(px,py,x,y,angle){const dx=px-x,dy=py-y,cos=Math.cos(angle),sin=Math.sin(angle),localX=dx*cos+dy*sin,localY=-dx*sin+dy*cos;return Math.abs(localX)<20&&Math.abs(localY)<28}
function worldObstacleAt(px,py){
  const baseI=Math.floor(px/350),baseJ=Math.floor(py/350);
  for(let i=baseI-1;i<=baseI+1;i++)for(let j=baseJ-1;j<=baseJ+1;j++){
    const x=i*350,y=j*350;
    if(px>x+69&&px<x+265&&py>y+63&&py<y+249)return'building';
    for(const [treeX,treeY] of [[x+66,y+250],[x+265,y+84],[x+247,y+261]])if(Math.hypot(px-treeX,py-treeY)<25)return'tree';
    if(hitsVehicle(px,py,x+34,y+146,0)||hitsVehicle(px,py,x+168,y-30,Math.PI/2))return'vehicle';
    const trafficY=y+80+((time*24+hash(i,j)*220)%230);if(hitsVehicle(px,py,x-24,trafficY,Math.PI))return'vehicle';
  }
  return null;
}
function desk(x,y,laptop){rect(x-17,y-13,34,25,'#453f36');rect(x-17,y-15,34,24,'#b49970');rect(x-16,y-14,32,2,'#d6be8d');rect(x-11,y-11,22,14,'#303f3b');rect(x-9,y-9,18,10,'#87b8a4');rect(x-7,y-7,9,1,'#dbedbc');rect(x-7,y-4,13,1,'#bdd7a0');rect(x-9,y+4,19,4,laptop?'#758b7a':'#5c6c61');rect(x+13,y-8,3,6,'#ede0b4')}
function interior(){
  ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.angle);
  // The detailed cabin becomes a van slightly larger than the city's cars.
  const vehicleScale=1-roof*.82;
  ctx.scale(vehicleScale,vehicleScale);
  rect(-68,-102,140,216,'#31473c');rect(-68,-108,136,216,'#c5c2a0');rect(-62,-102,124,204,'#4f6151');rect(-55,-96,110,192,'#bdad85');
  for(let x=-53;x<54;x+=11)rect(x,-30,1,124,'#b09d77');
  rect(-55,-96,110,31,'#536e66');rect(-50,-91,45,20,'#92afa0');rect(5,-91,45,20,'#92afa0');rect(-49,-90,43,3,'#c8d4b1');rect(8,-90,40,3,'#c8d4b1');
  rect(-55,-65,110,7,'#475b4f');rect(-52,-57,30,25,'#697762');rect(23,-57,27,25,'#697762');rect(-46,-55,18,21,'#8d9a7d');rect(28,-55,17,21,'#8d9a7d');
  const radio=gameAudio.radioState?.()||{on:false};
  rect(12,-73,35,12,'#293e35');rect(15,-71,21,7,radio.on?'#bdd68c':'#647561');rect(39,-70,5,5,'#d4c394');
  if(radio.on)for(let n=0;n<5;n++)rect(17+n*3,-65-Math.round((Math.sin(time*5+n)+1)*2),2,2,'#405a36');
  person({color:'#9da384',hair:'#414436',name:'Kierowca'},-37,-48);rect(-44,-67,17,5,'#35483e');rect(-45,-69,4,9,'#35483e');rect(-31,-69,4,9,'#35483e');
  rect(-55,-27,37,4,'#7a785a');rect(18,-27,37,4,'#7a785a');
  // Long windows, trim and warm wooden floor.
  for(const side of [-1,1]){for(const y of [-12,43]){rect(side===-1?-64:56,y,8,40,'#354e49');rect(side===-1?-62:57,y+3,5,33,'#93b8a7');rect(side===-1?-62:57,y+3,5,3,'#d2dfbc')}}
  desk(-38,-4,false);desk(38,-4,false);desk(-38,51,true);
  workstations.forEach(seat=>{rect(seat.x-12,seat.y-3,24,25,'#555f4d');rect(seat.x-10,seat.y,20,17,'#7c8970')});
  rect(27,48,28,47,'#829376');rect(25,51,4,40,'#9fac86');rect(53,51,4,40,'#9fac86');rect(31,54,20,2,'#a8b28c');rect(31,68,20,2,'#a8b28c');rect(31,86,20,2,'#a8b28c');
  rect(34,35,10,12,'#a28761');rect(32,29,14,10,'#526b42');rect(36,25,6,14,'#75904d');rect(31,30,5,4,'#90a85d');
  // Rear door at the bottom edge of the vehicle.
  rect(-16,80,32,17,'#756b56');rect(-14,81,28,15,'#a89572');rect(-12,83,24,11,'#b9a47b');rect(8,88,2,2,'#e0d1a4');rect(-16,78,32,3,'#4f6151');
  seatedFamilyInDrawOrder().forEach(p=>person(p,p.x,p.y));
  // Family carpet and loose laptop cable.
  rect(-14,31,29,47,'#8b7458');rect(-12,33,25,43,'#b99b70');for(let y=35;y<74;y+=6)rect(-10,y,21,2,'#cbb389');
  family.forEach((p,i)=>{if(p.aboard&&!p.seated)person(p,p.x,p.y,0,i===selected&&down('w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'))});
  family.filter(member=>member.aboard).forEach(member=>{const barX=member.x-9,barY=member.y-20;rect(barX,barY,18,3,'#513845');const pinkWidth=Math.round(18*(member.closeness||0)/100);if(pinkWidth>0)rect(barX,barY,pinkWidth,3,'#f29aad')});
  const p=family[selected];if(p.aboard)rect(p.x-9,p.y-23,18,2,'#d8ee9b');
  if(!p.seated&&atExitDoor(p)){rect(-7,81,14,10,'#243b2f');ctx.fillStyle='#e3f0b1';ctx.font='9px monospace';ctx.fillText('E',-3,89)}
  else if(!p.seated&&(atPassengerPlace(p)||atDriverPlace(p))){const px=atPassengerPlace(p)?30:-28;rect(px-7,-82,14,10,'#243b2f');ctx.fillStyle='#e3f0b1';ctx.font='9px monospace';ctx.fillText('E',px-3,-74)}
  drawCoinParticles();
  drawHeartParticles();
  ctx.globalAlpha=roof;vehicle(0,0,0,'#e0d1a4',true);ctx.globalAlpha=1;
  ctx.restore();
}
function canWalk(x,y){if(x<-48||x>48||y<-54||y>89)return false;const obstacles=[[-56,-21,-23,10],[23,-21,56,10],[-56,35,-23,65],[27,52,56,90]];return !obstacles.some(([a,b,c,d])=>x>a-5&&x<c+5&&y>b-8&&y<d+8)}
function seatedFamilyInDrawOrder(){return family.filter(p=>p.aboard&&p.seated).sort((a,b)=>a.y-b.y)}
function activeWorkers(){return family.filter(p=>p.aboard&&p.seated&&!p.passenger&&Number.isInteger(p.station)&&p.station<workstations.length)}
function workMultiplier(p){return .5+Math.max(0,Math.min(100,p.closeness||0))/100}
function updateCloseness(dt){family.forEach(p=>p.closeness=Math.max(0,(p.closeness||0)-dt*.5))}
function updateEconomy(dt){
  const workers=activeWorkers();money+=workers.reduce((sum,p)=>sum+2*workMultiplier(p),0)*dt;
  family.forEach(p=>{
    if(!workers.includes(p)){p.coinTimer=.2;return}
    p.coinTimer=(p.coinTimer??.15)-dt;
    if(p.coinTimer<=0){const seat=cabinSeats[p.station];coinParticles.push({x:seat.x+(Math.random()-.5)*8,y:seat.y-18,age:0,life:.85,drift:(Math.random()-.5)*7});p.coinTimer=(.48+Math.random()*.25)/workMultiplier(p)}
  });
  for(let i=coinParticles.length-1;i>=0;i--){const coin=coinParticles[i];coin.age+=dt;coin.y-=13*dt;coin.x+=coin.drift*dt;if(coin.age>=coin.life)coinParticles.splice(i,1)}
  const shown=Math.floor(money);if(shown!==lastMoneyShown){$('money-value').textContent=shown.toLocaleString('pl-PL');lastMoneyShown=shown}
  for(let i=heartParticles.length-1;i>=0;i--){const heart=heartParticles[i];heart.age+=dt;heart.y-=11*dt;heart.x+=heart.drift*dt;if(heart.age>=heart.life)heartParticles.splice(i,1)}
  if(bond!==lastBondShown){$('bond-value').textContent=bond.toLocaleString('pl-PL');lastBondShown=bond}
}
function drawCoinParticles(){
  coinParticles.forEach(coin=>{const alpha=Math.max(0,1-coin.age/coin.life);ctx.globalAlpha=alpha;const pulse=coin.age<.12?1+coin.age*4:1;ctx.fillStyle='#9d7927';ctx.beginPath();ctx.arc(coin.x,coin.y,4*pulse,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f4dc76';ctx.beginPath();ctx.arc(coin.x,coin.y-1,2.7*pulse,0,Math.PI*2);ctx.fill();ctx.fillStyle='#7a5b1d';ctx.font='bold 5px monospace';ctx.textAlign='center';ctx.fillText('$',coin.x,coin.y+1.5);ctx.textAlign='start';ctx.globalAlpha=1})
}
function drawHeartParticles(){
  heartParticles.forEach(heart=>{const alpha=Math.max(0,1-heart.age/heart.life),pulse=heart.age<.16?.8+heart.age*2.5:1;ctx.save();ctx.globalAlpha=alpha;ctx.translate(Math.round(heart.x),Math.round(heart.y));ctx.scale(pulse,pulse);rect(-5,-3,4,4,'#f29aad');rect(1,-3,4,4,'#f29aad');rect(-6,-1,12,4,'#f29aad');rect(-4,3,8,2,'#f29aad');rect(-2,5,4,2,'#f29aad');ctx.restore()})
}
function update(dt){
  window.updateTouchControls?.();
  window.updateRadioControls?.();
  updateCharacterDialog(dt);if(paused)return;time+=dt;toastTimer-=dt;updateEconomy(dt);updateCloseness(dt);
  const p=family[selected];if(mode==='interior'){
    // Autopilot follows the northbound avenue while everyone works.
    car.angle+=(0-car.angle)*Math.min(1,dt*4);car.x+=(car.autoX-car.x)*Math.min(1,dt*2);car.y-=23*dt;car.speed=32;
    if(!p.seated){let dx=(down('d','arrowright')?1:0)-(down('a','arrowleft')?1:0),dy=(down('s','arrowdown')?1:0)-(down('w','arrowup')?1:0);const l=Math.hypot(dx,dy)||1;dx=dx/l*47*dt;dy=dy/l*47*dt;if(canWalk(p.x+dx,p.y))p.x+=dx;if(canWalk(p.x,p.y+dy))p.y+=dy}
  }else{
    const gas=down('w','arrowup'),brake=down('s','arrowdown',' ');car.speed+=(brake?-85:gas?48:-10)*dt;car.speed=Math.max(-22,Math.min(100,car.speed));if(Math.abs(car.speed)<.5)car.speed=0;
    car.angle+=((down('d','arrowright')?1:0)-(down('a','arrowleft')?1:0))*dt*1.9*(car.speed/70);
    const nx=car.x+Math.sin(car.angle)*car.speed*dt*.95,ny=car.y-Math.cos(car.angle)*car.speed*dt*.95;
    const obstacle=worldObstacleAt(nx,ny);
    if(obstacle){car.speed=-car.speed*.22;toast(obstacle==='tree'?'Uwaga na drzewo!':obstacle==='vehicle'?'Uwaga na inne auto!':'Ostrożnie! Budynki nie ustąpią pierwszeństwa.')}else{car.x=nx;car.y=ny}
  }
  distance+=Math.abs(car.speed)*dt/3600;zoom+=((mode==='interior'?1.77:.88)-zoom)*Math.min(1,dt*3);roof+=((mode==='driving'?1:0)-roof)*Math.min(1,dt*4);
  $('speed').textContent=Math.round(Math.abs(car.speed));$('distance').textContent=distance.toFixed(1);$('view-label').textContent=mode==='interior'?'WNĘTRZE SAMOCHODU':'MIASTO · ZA KIEROWNICĄ';
  $('driver-name').textContent=mode==='driving'?p.name:'Kierowca';$('driver-status').textContent=mode==='driving'?'Za kierownicą · sterujesz':'Za kierownicą · autopilot';
  const waitingNearby=mode==='driving'?waitingFamilyNearCar():null;
  $('status').textContent=waitingNearby?(waitingNearby.boardable===false?waitingNearby.name+' jest przy drodze.':waitingNearby.name+' czeka przy drodze — zatrzymaj się i zabierz ją.'):mode==='driving'?p.name+' prowadzi. Szukaj Tosi i Łucji przy drodze.':p.passenger?p.name+' przy radiu. Kierowca prowadzi.':p.seated?'Kierowca prowadzi. Rodzina pracuje.':p.name+' spaceruje. Kierowca prowadzi.';
  $('move-label').textContent=mode==='driving'?'Gaz / hamulec / skręt':'Poruszanie';$('control-mode').textContent=mode==='driving'?'Nowa perspektywa. Ten sam dom.':'W środku jest całkiem przytulnie.';
  $('step-one').classList.toggle('done',walked);$('step-two').classList.toggle('done',p.y<-42||taken);$('step-three').classList.toggle('done',family.filter(member=>member.boardable!==false).every(member=>member.aboard));
  if(toastTimer<=0){const target=nearestWorkstation(p);$('toast').textContent=waitingNearby?'E  zabierz '+(waitingNearby.pickupName||waitingNearby.name):mode==='driving'?'W / S  gaz i hamulec     A / D  skręt     E  wróć do wnętrza':p.seated?'E  wstań od miejsca     1–5  wybierz osobę':atDriverPlace(p)?'E  przejmij kierownicę':target?(workstationOccupant(target.index,p)?'To miejsce jest zajęte':'E  usiądź przy wolnym miejscu'):'WASD  spaceruj     Podejdź do kierowcy z przodu ↑'}
  if(toastTimer<=0&&touchHint(true,false))$('toast').textContent=mode==='driving'?'Joystick: ↑ gaz · ↓ hamulec · ← → skręt':p.seated?'Dotknij „Wstań”. Osobę wybierzesz na jej karcie.':atDriverPlace(p)?'Dotknij „Przejmij kierownicę”.':'Joystick: spacer · Podejdź do kierowcy z przodu ↑';
  if(toastTimer<=0&&atPassengerSeat())$('toast').textContent=touchHint('Steruj radiem przyciskami na ekranie.','R — radio wł. / wył. · [ / ] — utwór · E — wstań');
  else if(toastTimer<=0&&mode==='interior'&&!p.seated&&atPassengerPlace(p))$('toast').textContent=touchHint('Dotknij „Usiądź przy radiu”.','E — usiądź na fotelu pasażera i obsługuj radio');
  if(toastTimer<=0&&touchHint(true,false))$('toast').textContent='';
}
function draw(){ctx.clearRect(0,0,640,420);ctx.save();ctx.translate(320,210);ctx.scale(zoom,zoom);ctx.translate(-car.x,-car.y);world();interior();ctx.restore();
  // Pixel corner markers and quiet scene caption.
  rect(13,13,19,2,'#d8e1b7');rect(13,13,2,19,'#d8e1b7');rect(608,13,19,2,'#d8e1b7');rect(625,13,2,19,'#d8e1b7');
  ctx.fillStyle='#edf0cf';ctx.font='9px monospace';ctx.fillText(mode==='driving'?'RODZINNA PODRÓŻ / WIDOK MIASTA':'MOBILNY DOM / '+family[selected].name.toUpperCase(),24,36);
  drawPickupIndicator();
}
function pickupTargetVisible(target){
  if(!target)return false;const x=320+(target.p.pickup.x-car.x)*zoom,y=210+(target.p.pickup.y-car.y)*zoom;
  return x>18&&x<622&&y>18&&y<402;
}
function drawPickupIndicator(){
  if(mode!=='driving')return;const target=nearestWaitingFamily();if(!target||pickupTargetVisible(target))return;
  const dx=target.p.pickup.x-car.x,dy=target.p.pickup.y-car.y,length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length;
  const reach=Math.min(288/(Math.abs(ux)||.001),178/(Math.abs(uy)||.001));const x=320+ux*reach,y=210+uy*reach;
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(uy,ux));ctx.fillStyle='#d1e997';ctx.beginPath();ctx.moveTo(23,0);ctx.lineTo(15,-5);ctx.lineTo(15,5);ctx.closePath();ctx.fill();ctx.restore();
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#101816e8';ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d1e997';ctx.lineWidth=2;ctx.stroke();
  const art=characterArt(target.p);ctx.save();ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.clip();if(art){ctx.imageSmoothingEnabled=characterStyle!=='pixel';ctx.drawImage(art,-11,-13,22,26)}else{ctx.fillStyle=target.p.color;ctx.fillRect(-11,-11,22,22);ctx.fillStyle='#f0f0df';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText(target.p.name[0],0,3)}ctx.restore();ctx.restore();
  const label=target.p.name+' '+Math.round(target.distance)+' m';ctx.font='7px monospace';const width=Math.ceil(ctx.measureText(label).width)+8;ctx.fillStyle='#101816d9';ctx.fillRect(x-width/2,y+16,width,11);ctx.fillStyle='#edf0cf';ctx.textAlign='center';ctx.fillText(label,x,y+24);ctx.textAlign='start';
}
function setCharacterStyle(style){
  characterStyle=style==='pixel'?'pixel':'photo';
  try{window.localStorage?.setItem('roadfamily-character-style',characterStyle)}catch{}
  document.querySelectorAll('input[name="character-style"]').forEach(input=>input.checked=input.value===characterStyle);
  buildFamily();
}
window.setCharacterStyle=setCharacterStyle;
const settingsModal=$('settings-modal'),settingsToggle=$('settings-toggle'),settingsClose=$('settings-close');let settingsWasPaused=false;
function openSettings(){settingsWasPaused=paused;if(!paused)togglePause();settingsModal.hidden=false;document.querySelector(`input[name="character-style"][value="${characterStyle}"]`)?.focus()}
function closeSettings(){settingsModal.hidden=true;if(!settingsWasPaused&&paused)togglePause();settingsToggle.focus?.()}
settingsToggle.onclick=openSettings;settingsClose.onclick=closeSettings;
settingsModal.addEventListener('click',event=>{if(event.target===settingsModal)closeSettings()});
document.querySelectorAll('input[name="character-style"]').forEach(input=>input.addEventListener('change',()=>{if(input.checked)setCharacterStyle(input.value)}));
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&!settingsModal.hidden){event.preventDefault();closeSettings()}});
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;update(dt);gameAudio.update(dt,{mode,speed:car.speed,paused,seats:family.filter(p=>p.aboard).map(p=>p.seated&&!p.passenger&&Number.isInteger(p.station)&&p.station<workstations.length)});draw();requestAnimationFrame(frame)}
setCharacterStyle(characterStyle);loadFamilyPhotos();requestAnimationFrame(frame);
