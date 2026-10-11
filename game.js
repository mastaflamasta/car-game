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
const sideExitInteractionZone={left:46,right:55,top:-55,bottom:-31};
const schoolSeats=[
  {x:-37,y:5,label:'lewej ławce w pierwszym rzędzie'},{x:0,y:5,label:'środkowej ławce w pierwszym rzędzie'},{x:37,y:5,label:'prawej ławce w pierwszym rzędzie'},
  {x:-37,y:55,label:'lewej ławce w drugim rzędzie'},{x:0,y:55,label:'środkowej ławce w drugim rzędzie'},{x:37,y:55,label:'prawej ławce w drugim rzędzie'}
];
const schoolSeatZones=schoolSeats.map(seat=>({left:seat.x-17,right:seat.x+17,top:seat.y+13,bottom:seat.y+28}));
const schoolDoorZone={left:-15,right:15,top:-91,bottom:-68},teacherZone={left:-50,right:-19,top:-72,bottom:-53},boardZone={left:11,right:53,top:-25,bottom:-11};
const family=[
  {name:'Mama',pickupName:'Mamę',role:'Odpoczywa na kanapie',color:'#d88860',hair:'#9a5239',hairStyle:'bob',glasses:true,x:40,y:58,station:3,seated:true,aboard:true,closeness:0},
  {name:'Tata',pickupName:'Tatę',role:'Odpoczywa na kanapie',color:'#679b91',hair:'#423c36',hairStyle:'short',x:40,y:79,station:4,seated:true,aboard:true,closeness:0},
  {name:'Nela',pickupName:'Nelę',role:'Tworzy na laptopie',color:'#c4ad66',hair:'#b97838',hairStyle:'long',x:-38,y:69,station:2,seated:true,aboard:true,closeness:0},
  {name:'Tosia',pickupName:'Tosię',role:'Czeka na rodzinę',color:'#c98b75',hair:'#b34e2e',hairStyle:'bob',glasses:true,x:0,y:0,station:null,seated:false,aboard:false,pickup:{x:410,y:-50},closeness:0},
  {name:'Łucja',pickupName:'Łucję',role:'Czeka na rodzinę',color:'#8aa5b2',hair:'#51352e',hairStyle:'short',glasses:true,x:0,y:0,station:null,seated:false,aboard:false,pickup:{x:760,y:-230},closeness:0},
  {name:'Kasia',pickupName:'Kasię',role:'Spaceruje po mieście',color:'#8e768f',hair:'#6b4b3a',hairStyle:'long',glasses:true,x:0,y:0,station:null,seated:false,aboard:false,boardable:false,pickup:{x:-50,y:300},closeness:0}
];
family.forEach(member=>{member.room=member.aboard?'car':'outside';member.joined=member.aboard;member.schoolSeat=null;member.teacher=false;member.sleeping=false;member.speech=null;member.driving=false});
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
const coinParticles=[],heartParticles=[],sleepParticles=[];
let weather='clear',weatherTimer=45+Math.random()*55,nextCommentIn=16+Math.random()*18,nextSleepIn=32+Math.random()*45,collisionCooldown=0,collisionCount=0;
const drivenBy=new Set(),hugCounts={};
let characterDialogTimer=0;
const pickupDialogMessages=['Dzięki!','Co tak długo?','Wreszcie! Ile można czekać?','Dobrze, że jest wolne miejsce!','Następnym razem wyślijcie SMS-a!','Jedziemy, zanim zmienię zdanie!'];
const kasiaDialogMessages=['Nie chcę!','Nie teraz!','Mam dziś inne plany!','Nie wsiadam bez playlisty na poziomie!'];
let kasiaPickupAttempts=0;
const achievementDefinitions={
  kasia:{title:'Kasia przyjęta do rodziny (Spotify)',description:'Cztery odmowy, jedna dobra playlista i rodzinny plan Spotify jest kompletny.'},
  daughters:{title:'Dzieci pracują, rodzice chillują',description:'Trzy córki przy komputerach. Rodzice mogą wreszcie przejść na tryb relaks.'},
  liberianGirl:{title:'Król Popu odnaleziony!',description:'Hee-hee! Liberian Girl trafiła do rodzinnego radia. Michael byłby dumny z tej trasy.'},
  allAboard:{title:'Rodzina w komplecie',description:'Wszyscy są na pokładzie. Teraz pozostaje tylko ustalić, dokąd właściwie jedziemy.'},
  parentsWork:{title:'Rodzice jednak pracują',description:'Mama i Tata przy komputerach. Pogłoski o wiecznych wakacjach zostały zdementowane.'},
  remote2000:{title:'Praca zdalna, widok lokalny',description:'2000 monet zarobionych w drodze. Biuro z takim widokiem trudno przebić.'},
  allDrivers:{title:'Kto prowadzi ten dom?',description:'Każdy członek rodziny przejął kierownicę. Odpowiedź nadal pozostaje niejasna.'},
  scratches:{title:'To tylko rysa',description:'Pięć spotkań z przeszkodami. Lakier nabiera rodzinnego charakteru.'},
  favoriteChild:{title:'Ulubione dziecko',description:'Dwadzieścia przytuleń dla jednego dziecka. Pozostali zaczynają coś podejrzewać.'},
  speedyPickup:{title:'Wsiadaj, nie zwalniam!',description:'Maksymalna prędkość, szybki odbiór i pasażer na pokładzie. Rozkład jazdy zatwierdziłby tylko kierowca rajdowy.'}
};
const unlockedAchievements={};
let visibleAchievement=null,achievementHideTimer=0;const pendingAchievements=[];
const car={x:350,y:650,angle:0,speed:32,autoX:350,parked:false};
const activityComments={
  0:['Ten projekt sam się nie skończy.','Czy ktoś widział moją kawę?','Jeszcze tylko jedna poprawka…','Internet dziś współpracuje. Podejrzane.'],
  1:['To na pewno było w specyfikacji?','Kto znowu zmienił hasło?','Jeszcze jeden commit i odpoczywam.','Działa. Lepiej niczego nie dotykać.'],
  2:['Laptop ma dziś więcej energii ode mnie.','Czy to już przerwa na przekąskę?','Zrobię to szybciej niż dorośli.','Potrzebuję lepszego Wi-Fi!'],
  couch:['Daleko jeszcze?','Kto ma coś do jedzenia?','Mogę wybrać następną piosenkę?','To miejsce jest całkiem wygodne.'],
  passenger:['Ta piosenka zostaje!','Mam kontrolę nad radiem!','Kto zrobił tę playlistę?','Głośniej czy rodzinnie?'],
  walking:['Gdzie ja odłożyłam telefon?','Tu zawsze było tak ciasno?','Chyba potrzebuję chwili ruchu.']
};
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
function drawSleepMask(x,y){
  rect(x-9,y-7,18,2,'#17151d');
  rect(x-7,y-8,14,3,'#17151d');rect(x-7,y-5,6,3,'#17151d');rect(x+1,y-5,6,3,'#17151d');
  rect(x-5,y-7,4,2,'#302b3a');rect(x+1,y-7,4,2,'#302b3a');
  rect(x-5,y-5,3,1,'#272330');rect(x+2,y-5,3,1,'#272330');
}
function person(p,x,y,dir=0,walking=false){
  const step=walking?Math.sin(time*15)*2:0;
  rect(x-5,y+7,4,5+step,'#303e39');rect(x+1,y+7,4,5-step,'#303e39');
  rect(x-7,y,14,9,p.color);rect(x-9,y+1,3,6,'#e2b88d');rect(x+6,y+1,3,6,'#e2b88d');
  const art=characterArt(p);
  if(art){
    ctx.save();ctx.imageSmoothingEnabled=characterStyle!=='pixel';if(characterStyle!=='pixel')ctx.imageSmoothingQuality='high';
    ctx.drawImage(art,Math.round(x-9),Math.round(y-17),18,21);ctx.restore();
    if(p.sleeping)drawSleepMask(x,y);
    return;
  }
  drawPixelHead(p,x,y);
  if(p.sleeping)drawSleepMask(x,y);
}
function familyStatus(p,i){
  if(p.room==='outside')return mode==='outside'&&i===selected?'Spaceruje po mieście':'Na zewnątrz';
  if(p.room==='school')return p.teacher?'Nauczyciel przy stoliku':p.seated&&Number.isInteger(p.schoolSeat)?'Siedzi przy '+schoolSeats[p.schoolSeat].label:'W szkolnej przyczepce';
  if(p.driving)return'Prowadzi samochód';
  if(p.passenger)return'Pasażer · obsługuje radio';
  if(p.sleeping)return'Śpi przy komputerze';
  if(p.seated&&Number.isInteger(p.station))return'Siedzi przy '+cabinSeats[p.station].label;
  return'Spaceruje po wnętrzu';
}
function buildFamily(){
  const aboard=family.map((p,i)=>({p,i})).filter(({p})=>p.aboard);
  const displayed=family.map((p,i)=>({p,i})).filter(({p})=>p.joined);
  const familyList=$('family');
  familyList.setAttribute('data-family-count',String(displayed.length));
  familyList.innerHTML=displayed.map(({p,i})=>`<button class="person ${i===selected?'active':''}" data-person="${i}" aria-pressed="${i===selected}"><canvas class="portrait ${characterStyle==='photo'&&p.face?'photo-portrait':'pixel-portrait'}" width="96" height="112" id="portrait-${i}" aria-hidden="true"></canvas><span class="person-info"><strong>${familyPhotos[i].label}</strong><small>${familyStatus(p,i)}</small></span><span class="shortcut">${i+1}</span></button>`).join('');
  displayed.forEach(({p,i})=>{const c=$('portrait-'+i).getContext('2d');c.fillStyle='#34402d';c.fillRect(0,0,24,28);c.fillStyle=p.color;c.fillRect(5,16,14,12);c.fillStyle=p.hair;c.fillRect(6,4,12,13);c.fillStyle='#e2b88d';c.fillRect(7,9,10,9);c.fillStyle='#35352f';c.fillRect(9,12,2,2);c.fillRect(14,12,2,2)});
  displayed.forEach(({p,i})=>{const c=$('portrait-'+i).getContext('2d'),art=characterPortraitArt(p);if(art){c.clearRect(0,0,96,112);c.imageSmoothingEnabled=characterStyle!=='pixel';if(characterStyle==='pixel'){const ratio=Math.min(96/art.naturalWidth,112/art.naturalHeight),w=art.naturalWidth*ratio,h=art.naturalHeight*ratio;c.drawImage(art,(96-w)/2,(112-h)/2,w,h)}else c.drawImage(art,0,0,96,112)}else{const fallback=document.createElement('canvas');fallback.width=24;fallback.height=28;fallback.getContext('2d').drawImage(c.canvas,0,0,24,28,0,0,24,28);c.clearRect(0,0,96,112);c.imageSmoothingEnabled=false;c.drawImage(fallback,0,0,96,112)}});
  document.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>selectPerson(+b.dataset.person));
  if($('aboard-count'))$('aboard-count').textContent=String(aboard.length).padStart(2,'0')+' / 06';
}
function toast(s){$('toast').textContent=s;toastTimer=4}
function showCharacterDialog(p,messages,upset=false){
  const index=family.indexOf(p),message=messages[Math.floor(Math.random()*messages.length)];
  const portrait=upset?familyPhotos[index].pixel.replace(/\.png$/,'-naburmuszona.png'):familyPhotos[index].pixel;
  $('character-dialog-image').src=portrait;$('character-dialog-image').alt='Pikselowy portret: '+p.name+(upset?' — naburmuszona':'');
  $('character-dialog-name').textContent=p.name;$('character-dialog-message').textContent=message;$('character-dialog').hidden=false;characterDialogTimer=3.6;
}
function updateCharacterDialog(dt){if(characterDialogTimer<=0)return;characterDialogTimer=Math.max(0,characterDialogTimer-dt);if(characterDialogTimer===0)$('character-dialog').hidden=true}
function presentAchievement(id){const card=$('achievement-card'),achievement=achievementDefinitions[id];window.clearTimeout(achievementHideTimer);visibleAchievement=id;card.classList.remove('closing');$('achievement-title').textContent=achievement.title;$('achievement-description').textContent=achievement.description;card.hidden=false;gameAudio.achievement?.();achievementHideTimer=window.setTimeout(hideAchievement,5000)}
function buildAchievementCollection(){const ids=Object.keys(unlockedAchievements);$('achievement-list').innerHTML=ids.length?ids.map(id=>{const achievement=achievementDefinitions[id];return`<article class="achievement-list-item"><span aria-hidden="true">★</span><div><strong>${achievement.title}</strong><p>${achievement.description}</p></div></article>`}).join(''):'<p class="achievement-empty">Nie zdobyto jeszcze żadnych achievementów.</p>'}
function unlockAchievement(id){if(unlockedAchievements[id]||!achievementDefinitions[id])return;unlockedAchievements[id]=true;$('achievement-value').textContent=Object.keys(unlockedAchievements).length+'/'+Object.keys(achievementDefinitions).length;buildAchievementCollection();if(visibleAchievement)pendingAchievements.push(id);else presentAchievement(id)}
function hideAchievement(){
  if(!visibleAchievement)return;const card=$('achievement-card');visibleAchievement=null;card.classList.add('closing');window.clearTimeout(achievementHideTimer);achievementHideTimer=window.setTimeout(()=>{card.hidden=true;card.classList.remove('closing');const next=pendingAchievements.shift();if(next)presentAchievement(next)},300);
}
document.addEventListener('pointerdown',()=>hideAchievement());
function checkWorkAchievements(){
  const daughters=['Nela','Tosia','Łucja'];const workers=activeWorkers();
  if(daughters.every(name=>workers.some(worker=>worker.name===name)))unlockAchievement('daughters');
  const parentsWorking=['Mama','Tata'].every(name=>workers.some(worker=>worker.name===name)),childrenWorking=daughters.some(name=>workers.some(worker=>worker.name===name));
  if(parentsWorking&&!childrenWorking)unlockAchievement('parentsWork');
}
function checkRadioAchievement(){const radio=gameAudio.radioState?.();if(radio?.id==='liberian-girl'&&radio.playing)unlockAchievement('liberianGirl')}
function checkProgressAchievements(){if(family.every(member=>member.aboard))unlockAchievement('allAboard');if(money>=2000)unlockAchievement('remote2000');if(drivenBy.size===family.length)unlockAchievement('allDrivers');if(collisionCount>=5)unlockAchievement('scratches')}
function atPassengerSeat(){return mode==='interior'&&!!family[selected].passenger}
function insideInteractionZone(p,zone){return p.x>=zone.left&&p.x<=zone.right&&p.y>=zone.top&&p.y<=zone.bottom}
function atDriverPlace(p){return insideInteractionZone(p,driverInteractionZone)}
function atPassengerPlace(p){return insideInteractionZone(p,passengerInteractionZone)}
function atExitDoor(p){return insideInteractionZone(p,exitDoorInteractionZone)}
function atSideExit(p){return insideInteractionZone(p,sideExitInteractionZone)}
function atSchoolDoor(p){return insideInteractionZone(p,schoolDoorZone)}
function atTeacherPlace(p){return insideInteractionZone(p,teacherZone)}
function atSchoolBoard(p){return insideInteractionZone(p,boardZone)}
function nearestSchoolSeat(p){let best=null;schoolSeats.forEach((seat,index)=>{if(!insideInteractionZone(p,schoolSeatZones[index]))return;const distance=Math.hypot(p.x-seat.x,p.y-seat.y);if(!best||distance<best.distance)best={seat,index,distance}});return best}
function schoolSeatOccupant(index,p){return family.find(other=>other!==p&&other.room==='school'&&other.seated&&other.schoolSeat===index)}
function teacherOccupant(p){return family.find(other=>other!==p&&other.room==='school'&&other.teacher)}
function aboardFamilyCount(){return family.filter(member=>member.aboard).length}
function nearestWorkstation(p){let best=null;cabinSeats.forEach((seat,index)=>{if(!insideInteractionZone(p,seatInteractionZones[index]))return;const distance=Math.hypot(p.x-seat.x,p.y-seat.y);if(!best||distance<best.distance)best={seat,index,distance}});return best}
function workstationOccupant(index,p){return family.find(other=>other!==p&&other.seated&&!other.passenger&&other.station===index)}
function passengerOccupant(p){return family.find(other=>other!==p&&other.passenger)}
function outsidePersonNearCar(p){return !!p?.pickup&&Math.hypot(p.pickup.x-car.x,p.pickup.y-car.y)<72}
function touchingFamilyMember(p){
  if(!p||p.seated||p.passenger)return null;
  return family.filter(other=>other!==p&&other.aboard&&other.room===p.room)
    .map(other=>({other,distance:Math.hypot(p.x-other.x,p.y-other.y)}))
    .filter(candidate=>candidate.distance<=31).sort((a,b)=>a.distance-b.distance)[0]?.other||null;
}
function hugFamily(p,other){
  bond++;other.closeness=Math.min(100,(other.closeness||0)+20);
  if(['Nela','Tosia','Łucja'].includes(other.name)){hugCounts[other.name]=(hugCounts[other.name]||0)+1;if(hugCounts[other.name]>=20)unlockAchievement('favoriteChild')}
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
  const p=family[selected];if(mode==='driving'||mode==='outside'||p.passenger||p.seated)return false;
  if(mode==='school'){
    const seat=nearestSchoolSeat(p);return !!(seat&&schoolSeatOccupant(seat.index,p)&&!touchingFamilyMember(p));
  }
  if(atSideExit(p))return false;
  if(atPassengerPlace(p)){const occupant=passengerOccupant(p);return !!(occupant&&!touchingFamilyMember(p))}
  const target=nearestWorkstation(p);return !!(target&&workstationOccupant(target.index,p)&&!touchingFamilyMember(p));
}
function interactionLabel(){
  const p=family[selected];
  if(mode==='driving'){const waiting=waitingFamilyNearCar();return waiting?'Zabierz '+(waiting.pickupName||waiting.name):'Wróć do wnętrza'}
  if(mode==='outside')return outsidePersonNearCar(p)?'Wejdź do samochodu':'Podejdź do samochodu';
  if(p.driving)return'Wstań zza kierownicy';
  if(p.passenger)return'Wstań z fotela';if(p.seated)return'Wstań';
  if(mode==='school'){
    if(atSchoolDoor(p))return'Wróć do samochodu';if(atSchoolBoard(p))return'Użyj tablicy';
    if(atTeacherPlace(p))return teacherOccupant(p)?'Miejsce zajęte':'Zostań nauczycielem';
    const seat=nearestSchoolSeat(p);return seat?(schoolSeatOccupant(seat.index,p)?'Ławka zajęta':'Usiądź przy ławce'):'Interakcja';
  }
  if(atExitDoor(p))return'Wejdź do szkoły';
  if(atSideExit(p))return'Wyjdź z samochodu';
  if(atPassengerPlace(p)){const occupant=passengerOccupant(p),close=touchingFamilyMember(p);return occupant?(close?.sleeping?'Obudź':close?'Przytul':'Fotel zajęty'):'Usiądź przy radiu'}
  if(atDriverPlace(p))return'Przejmij kierownicę';
  const target=nearestWorkstation(p),occupant=target&&workstationOccupant(target.index,p);if(target&&!occupant)return'Usiądź';
  const close=touchingFamilyMember(p);if(close)return close.sleeping?'Obudź':'Przytul';
  return target?'Miejsce zajęte':'Interakcja';
}
function selectPerson(i){if(!family[i]?.joined)return;window.resetTouchControls?.();selected=i;mode=family[i].room==='outside'?'outside':family[i].room==='school'?'school':family[i].driving?'driving':'interior';buildFamily();toast(family[i].name+(mode==='outside'?touchHint(' · Joystick — spacer po mieście',' · WASD — spacer po mieście'):mode==='driving'?touchHint(' prowadzi · osobne pedały · kierownica ← →',' prowadzi · W/S — gaz i hamulec · A/D — skręt'):touchHint(' · Dotknij „Wstań”, potem użyj joysticka.',' · E — interakcja, WASD — spacer')))}
function familyMemberAtCabinPoint(x,y){
  return family.map((p,i)=>({p,i,distance:Math.hypot(x-p.x,y-(p.y-3))}))
    .filter(({p})=>p.aboard&&p.room==='car'&&Math.abs(x-p.x)<=12&&y>=p.y-21&&y<=p.y+15)
    .sort((a,b)=>a.distance-b.distance)[0]?.i??-1;
}
function selectPersonFromCanvas(event){
  if(mode!=='interior')return;
  const box=canvas.getBoundingClientRect(),fitScale=Math.max(box.width/canvas.width,box.height/canvas.height),drawnWidth=canvas.width*fitScale,drawnHeight=canvas.height*fitScale;
  const screenX=(event.clientX-box.left-(box.width-drawnWidth)/2)/fitScale,screenY=(event.clientY-box.top-(box.height-drawnHeight)/2)/fitScale;
  const scale=zoom*(1-roof*.82);if(scale<=0)return;
  const localX=(screenX-320)/scale,localY=(screenY-210)/scale;
  const index=familyMemberAtCabinPoint(localX,localY);
  if(index>=0&&index!==selected)selectPerson(index);
}
canvas.addEventListener('click',selectPersonFromCanvas);
canvas.addEventListener('pointerup',selectPersonFromCanvas);
const boardEditor=$('board-editor'),schoolBoard=$('school-board'),boardCtx=schoolBoard.getContext('2d');
const boardCloseButton=document.createElement('button');boardCloseButton.id='close-school-board';boardCloseButton.type='button';boardCloseButton.textContent='Zapisz i zamknij';boardCloseButton.setAttribute('aria-label','Zapisz tablicę i wróć do klasy');boardEditor.querySelector('.board-heading').append(boardCloseButton);
let boardTool='chalk',boardDrawing=false,boardTextPoint={x:40,y:55},boardLoaded=false;
function blankSchoolBoard(){boardCtx.fillStyle='#183b31';boardCtx.fillRect(0,0,schoolBoard.width,schoolBoard.height)}
function loadSchoolBoard(){
  if(boardLoaded)return;boardLoaded=true;blankSchoolBoard();let saved='';try{saved=window.localStorage?.getItem('roadfamily-school-board')||''}catch{}
  if(saved){const image=new Image();image.onload=()=>boardCtx.drawImage(image,0,0);image.src=saved}
}
function setBoardTool(tool){boardTool=tool;$('chalk-tool').classList.toggle('active',tool==='chalk');$('sponge-tool').classList.toggle('active',tool==='sponge');$('chalk-tool').setAttribute('aria-pressed',String(tool==='chalk'));$('sponge-tool').setAttribute('aria-pressed',String(tool==='sponge'))}
function boardPoint(event){const box=schoolBoard.getBoundingClientRect();return{x:(event.clientX-box.left)*schoolBoard.width/box.width,y:(event.clientY-box.top)*schoolBoard.height/box.height}}
function drawBoardStroke(from,to){boardCtx.strokeStyle=boardTool==='chalk'?'#f4f0d8':'#183b31';boardCtx.lineWidth=boardTool==='chalk'?4:24;boardCtx.lineCap='round';boardCtx.lineJoin='round';boardCtx.beginPath();boardCtx.moveTo(from.x,from.y);boardCtx.lineTo(to.x,to.y);boardCtx.stroke()}
function openBoardEditor(){loadSchoolBoard();boardEditor.hidden=false;keys.clear();window.resetTouchControls?.();setBoardTool('chalk');schoolBoard.focus?.()}
function closeBoardEditor(){if(boardEditor.hidden)return;try{window.localStorage?.setItem('roadfamily-school-board',schoolBoard.toDataURL('image/png'))}catch{}boardEditor.hidden=true;$('board-text').value='';canvas.focus?.();toast('Zapisano zawartość tablicy.')}
$('chalk-tool').onclick=()=>setBoardTool('chalk');$('sponge-tool').onclick=()=>setBoardTool('sponge');
boardCloseButton.onclick=closeBoardEditor;
$('write-board-text').onclick=()=>{const text=$('board-text').value.trim();if(!text)return;boardCtx.fillStyle='#f4f0d8';boardCtx.font='24px monospace';boardCtx.textBaseline='top';boardCtx.fillText(text,boardTextPoint.x,boardTextPoint.y,schoolBoard.width-boardTextPoint.x-8);$('board-text').value=''};
$('board-text').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();$('write-board-text').click()}});
schoolBoard.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();boardDrawing=true;schoolBoard.setPointerCapture?.(event.pointerId);boardTextPoint=boardPoint(event);drawBoardStroke(boardTextPoint,boardTextPoint)});
schoolBoard.addEventListener('pointermove',event=>{if(!boardDrawing)return;const next=boardPoint(event);drawBoardStroke(boardTextPoint,next);boardTextPoint=next});
for(const type of ['pointerup','pointercancel','lostpointercapture'])schoolBoard.addEventListener(type,()=>{boardDrawing=false});
function togglePause(){paused=!paused;keys.clear();window.resetTouchControls?.();$('pause-overlay').hidden=!paused;$('pause').innerHTML=paused?'▶ <span>Wznów</span>':'Ⅱ <span>Pauza</span>';window.updateTouchControls?.()}
$('pause').onclick=togglePause;
function interact(){
  if(paused)return;
  window.resetTouchControls?.();
  const p=family[selected];
  if(mode==='outside'){
    if(!outsidePersonNearCar(p)){toast('Podejdź bliżej zaparkowanego samochodu.');return}
    p.aboard=true;p.joined=true;p.room='car';p.seated=false;p.passenger=false;p.station=null;p.x=46;p.y=-40;mode='interior';buildFamily();toast(p.name+' wraca do samochodu. Auto pozostaje zaparkowane.');return
  }
  if(mode==='driving'){
    const waiting=waitingFamilyNearCar();
    if(waiting){
      const speedyPickup=Math.abs(car.speed)>=99;
      if(waiting.boardable===false){kasiaPickupAttempts++;if(kasiaPickupAttempts<5){showCharacterDialog(waiting,[kasiaDialogMessages[kasiaPickupAttempts-1]],true);return}waiting.boardable=true}
      const freeSeat=cabinSeats.findIndex((seat,index)=>!workstationOccupant(index,waiting));waiting.aboard=true;waiting.joined=true;waiting.room='car';waiting.seated=freeSeat>=0;waiting.station=freeSeat>=0?freeSeat:null;if(freeSeat>=0){waiting.x=cabinSeats[freeSeat].x;waiting.y=cabinSeats[freeSeat].y}else{waiting.x=0;waiting.y=38}buildFamily();showCharacterDialog(waiting,waiting.name==='Kasia'?['No dobrze, przekonaliście mnie!']:pickupDialogMessages);if(waiting.name==='Kasia')unlockAchievement('kasia');if(speedyPickup)unlockAchievement('speedyPickup');return}
    mode='interior';p.driving=false;p.room='car';p.x=-12;p.y=-53;p.seated=false;p.station=null;car.autoX=Math.round(car.x/350)*350;car.speed=0;car.parked=true;buildFamily();toast(p.name+' odchodzi od kierownicy. Samochód jest zatrzymany.');return
  }
  if(mode==='school'){
    if(p.seated){const wasTeacher=p.teacher;p.seated=false;p.teacher=false;p.schoolSeat=null;p.x=wasTeacher?-8:0;p.y=wasTeacher?-42:30;buildFamily();toast(wasTeacher?'Wstajesz obok biurka nauczyciela.':'Wstajesz i możesz spacerować po klasie.');return}
    if(atSchoolDoor(p)){p.room='car';p.x=0;p.y=70;mode='interior';buildFamily();toast('Wracasz do samochodu.');return}
    if(atSchoolBoard(p)){openBoardEditor();return}
    if(atTeacherPlace(p)){
      const occupant=teacherOccupant(p);if(occupant){toast('Miejsce nauczyciela zajmuje '+occupant.name+'.');return}
      p.teacher=true;p.seated=true;p.schoolSeat=null;p.x=-34;p.y=-55;buildFamily();toast(p.name+' zostaje nauczycielem.');return
    }
    const schoolTarget=nearestSchoolSeat(p),schoolOccupant=schoolTarget&&schoolSeatOccupant(schoolTarget.index,p);
    if(schoolTarget&&!schoolOccupant){p.seated=true;p.teacher=false;p.schoolSeat=schoolTarget.index;p.x=schoolTarget.seat.x;p.y=schoolTarget.seat.y;buildFamily();toast(p.name+' siada przy ławce.');return}
    const schoolFriend=touchingFamilyMember(p);if(schoolFriend){hugFamily(p,schoolFriend);return}
    if(schoolOccupant){toast('Tę ławkę zajmuje '+schoolOccupant.name+'.');return}
    toast('Podejdź do ławki, stolika nauczyciela, tablicy albo drzwi.');return
  }
  if(p.driving){p.driving=false;p.x=-12;p.y=-53;car.speed=0;car.parked=true;buildFamily();toast(p.name+' odchodzi od kierownicy. Samochód jest zatrzymany.');return}
  if(p.passenger){p.passenger=false;p.seated=false;p.station=null;p.x=17;p.y=-34;buildFamily();toast('Wstajesz z fotela pasażera. Radio gra dalej.');return}
  if(p.seated){const standing=standingSpotForSeat(p.station);p.seated=false;p.station=null;p.x=standing.x;p.y=standing.y;walked=true;buildFamily();toast('Możesz usiąść przy dowolnym wolnym miejscu.');return}
  if(atExitDoor(p)){
    p.room='school';p.seated=false;p.passenger=false;p.station=null;p.schoolSeat=null;p.teacher=false;p.x=0;p.y=-66;mode='school';buildFamily();toast('Wchodzisz do szkolnej przyczepki.');return;
  }
  if(atSideExit(p)){exitCarAtSideDoor();return}
  if(atPassengerPlace(p)){
    const occupant=passengerOccupant(p);
    if(occupant){const closePerson=touchingFamilyMember(p);if(closePerson?.sleeping){wakePerson(closePerson);return}if(closePerson){hugFamily(p,closePerson);return}toast('Fotel pasażera jest zajęty.');return}
    p.passenger=true;p.seated=true;p.station=null;p.x=36;p.y=-44;buildFamily();toast(touchHint('Radio: dotknij przycisku ♫.','Radio: R — włącz / wyłącz · [ / ] — zmień utwór · E — wstań'));return;
  }
  if(atDriverPlace(p)){const currentDriver=family.find(member=>member.driving);if(currentDriver&&currentDriver!==p){toast('Za kierownicą siedzi '+currentDriver.name+'.');return}p.driving=true;p.x=-37;p.y=-48;mode='driving';taken=true;car.parked=false;drivenBy.add(p.name);checkProgressAchievements();buildFamily();toast(p.name+touchHint(' prowadzi · osobne pedały · kierownica ← →',' prowadzi · W/S — gaz i hamulec · A/D — skręt · E — wnętrze'));return}
  const target=nearestWorkstation(p),occupant=target&&workstationOccupant(target.index,p);
  if(target&&!occupant){p.seated=true;p.station=target.index;p.x=target.seat.x;p.y=target.seat.y;buildFamily();toast(p.name+' siada przy '+target.seat.label+'.');return}
  const closePerson=touchingFamilyMember(p);
  if(closePerson?.sleeping){wakePerson(closePerson);return}
  if(closePerson){hugFamily(p,closePerson);return}
  if(occupant){toast('To miejsce zajmuje '+occupant.name+'.');return}
  toast('Podejdź do kierowcy lub do swojego stanowiska.');
}
function exitCarAtSideDoor(){
  if(mode!=='interior')return false;const p=family[selected];if(p.seated||p.passenger||!atSideExit(p))return false;
  const doorOffset={x:28,y:0},cos=Math.cos(car.angle),sin=Math.sin(car.angle);p.aboard=false;p.room='outside';p.station=null;p.sleeping=false;p.pickup={x:car.x+doorOffset.x*cos-doorOffset.y*sin,y:car.y+doorOffset.x*sin+doorOffset.y*cos};
  family.forEach(member=>member.driving=false);selected=family.indexOf(p);mode='outside';car.parked=true;car.speed=0;toast(p.name+' wysiada z samochodu. Możesz spacerować po mieście i wrócić do zaparkowanego auta.');
  buildFamily();return true;
}
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','e','p','1','2','3','4','5','6'].includes(k))e.preventDefault();if(!e.repeat){if(k==='e')interact();if(k==='p')togglePause();if(['1','2','3','4','5','6'].includes(k))selectPerson(+k-1)}keys.add(k)});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();window.resetTouchControls?.()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();window.resetTouchControls?.()}});
const down=(...k)=>k.some(v=>keys.has(v)||touchKeys.has(v));
function hash(x,y){return Math.abs(Math.sin(x*127.1+y*311.7)*43758.5453)%1}
function tree(x,y){rect(x+2,y+3,5,12,'#516047');rect(x-9,y-8,20,19,'#374e3a');rect(x-12,y-4,25,10,'#405d41');rect(x-7,y-10,14,10,'#57754b');rect(x-5,y-9,7,3,'#7d9259')}
function shopLandmark(x,y){rect(x+92,y+92,126,94,'#d2b579');rect(x+98,y+99,114,22,'#8f4f45');for(let n=0;n<6;n++)rect(x+99+n*19,y+121,10,19,n%2?'#f1dfad':'#b85d50');rect(x+112,y+148,36,38,'#52706a');rect(x+164,y+143,35,43,'#78988d');ctx.fillStyle='#fff1bd';ctx.font='bold 10px monospace';ctx.fillText('SKLEP',x+132,y+114)}
function gasStationLandmark(x,y){rect(x+92,y+92,130,86,'#d1d0b2');rect(x+98,y+99,118,15,'#b85e4f');rect(x+108,y+124,54,42,'#536c67');rect(x+176,y+124,26,32,'#667b70');rect(x+181,y+129,16,14,'#e8d38f');rect(x+183,y+157,4,18,'#313d37');ctx.fillStyle='#fff3c5';ctx.font='bold 9px monospace';ctx.fillText('STACJA',x+128,y+110)}
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
    const landmarkCode=((i%6)+6)%6+((j%6)+6)%6*6;if(landmarkCode===7)shopLandmark(x,y);else if(landmarkCode===28)gasStationLandmark(x,y);
    rect(x+154,y+187,23,22,'#4b6056');rect(x+158,y+189,15,20,'#d0b481');
    tree(x+66,y+250);tree(x+265,y+84);tree(x+247,y+261);
    rect(x+35,y+67,3,20,'#344a41');rect(x+31,y+65,10,5,'#d5c9a0');
    // Parked cars and slow traffic.
    vehicle(x+34,y+146,0,'#b78b65',false);vehicle(x+168,y-30,Math.PI/2,'#aeb79c',false);
    const ty=y+80+((time*24+hash(i,j)*220)%230);vehicle(x-24,ty,Math.PI,'#709a95',false);
    // Zebra crossings.
    for(let n=0;n<5;n++){rect(x+59,y-36+n*16,15,8,'#b7bca2');rect(x-36+n*16,y+59,8,15,'#b7bca2')}
  }
  family.forEach((p,index)=>{if(p.aboard||!p.pickup)return;const {x,y}=p.pickup;ctx.save();if(!(index===selected&&mode==='outside')){ctx.globalAlpha=.28;ctx.fillStyle='#d1e997';ctx.beginPath();ctx.arc(x,y,24+Math.sin(time*3)*3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}person(p,x,y,0,index===selected&&mode==='outside'&&down('w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'));ctx.fillStyle='#101816';ctx.fillRect(x-24,y-31,48,11);ctx.fillStyle='#edf0cf';ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(p.name.toUpperCase(),x,y-23);ctx.textAlign='start';ctx.restore()})
}
function vehicle(x,y,a,color,large){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a);const w=large?136:18,h=large?216:34;rect(-w/2+3,-h/2+4,w,h,'#34493c');rect(-w/2,-h/2,w,h,color);rect(-w/2+3,-h/2+3,w-6,h-6,color);rect(-w/2+4,-h/2+6,w-8,large?18:8,'#436366');rect(-w/2+4,h/2-12,w-8,7,'#526b63');rect(-w/2-2,-h/2+8,3,9,'#29372e');rect(w/2-1,-h/2+8,3,9,'#29372e');rect(-w/2-2,h/2-14,3,9,'#29372e');rect(w/2-1,h/2-14,3,9,'#29372e');if(large){rect(-55,-135,110,31,'#34493c');rect(-52,-132,104,27,color);rect(-47,-129,94,20,'#d1c093');rect(-44,-126,88,3,'#e3d5aa');rect(-2,-126,4,17,'#b5a77f');rect(-36,-132,15,5,'#f5dc9c');rect(21,-132,15,5,'#f5dc9c');rect(-46,-136,92,4,'#526357');rect(-20,-25,40,65,'#c6c5a3');rect(-16,-21,32,3,'#dcd9b5');rect(-12,-4,24,28,'#a8b39b');rect(-8,0,16,20,'#bec7a6')}else{rect(-w/2+3,-h/2,5,3,'#f5dc9c');rect(w/2-8,-h/2,5,3,'#f5dc9c')}ctx.restore()}
function hitsVehicle(px,py,x,y,angle){const dx=px-x,dy=py-y,cos=Math.cos(angle),sin=Math.sin(angle),localX=dx*cos+dy*sin,localY=-dx*sin+dy*cos;return Math.abs(localX)<20&&Math.abs(localY)<28}
function hitsPlayerCar(px,py){const dx=px-car.x,dy=py-car.y,cos=Math.cos(car.angle),sin=Math.sin(car.angle),localX=dx*cos+dy*sin,localY=-dx*sin+dy*cos;return Math.abs(localX)<20&&Math.abs(localY)<31}
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
function interior(compact=false){
  ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.angle);
  // The detailed cabin becomes a van slightly larger than the city's cars.
  const vehicleScale=compact?.18:1-roof*.82;
  ctx.scale(vehicleScale,vehicleScale);
  rect(-68,-102,140,216,'#31473c');rect(-68,-108,136,216,'#c5c2a0');rect(-62,-102,124,204,'#4f6151');rect(-55,-96,110,192,'#bdad85');
  for(let x=-53;x<54;x+=11)rect(x,-30,1,124,'#b09d77');
  rect(-55,-96,110,31,'#536e66');rect(-50,-91,45,20,'#92afa0');rect(5,-91,45,20,'#92afa0');rect(-49,-90,43,3,'#c8d4b1');rect(8,-90,40,3,'#c8d4b1');
  rect(-55,-65,110,7,'#475b4f');rect(-52,-57,30,25,'#697762');rect(23,-57,27,25,'#697762');rect(-46,-55,18,21,'#8d9a7d');rect(28,-55,17,21,'#8d9a7d');
  const radio=gameAudio.radioState?.()||{on:false};
  rect(12,-73,35,12,'#293e35');rect(15,-71,21,7,radio.on?'#bdd68c':'#647561');rect(39,-70,5,5,'#d4c394');
  if(radio.on)for(let n=0;n<5;n++)rect(17+n*3,-65-Math.round((Math.sin(time*5+n)+1)*2),2,2,'#405a36');
  const driver=family.find(member=>member.driving);if(driver)person(driver,-37,-48);rect(-44,-67,17,5,'#35483e');rect(-45,-69,4,9,'#35483e');rect(-31,-69,4,9,'#35483e');
  rect(-55,-27,37,4,'#7a785a');rect(18,-27,37,4,'#7a785a');
  // Long windows, trim and warm wooden floor.
  for(const side of [-1,1]){for(const y of [-12,43]){rect(side===-1?-64:56,y,8,40,'#354e49');rect(side===-1?-62:57,y+3,5,33,'#93b8a7');rect(side===-1?-62:57,y+3,5,3,'#d2dfbc')}}
  // Side door beside the passenger seat; it replaces this section of the right wall.
  rect(52,-61,12,36,'#4f6151');rect(54,-59,9,32,'#a89572');rect(56,-56,5,17,'#78968a');rect(55,-36,3,3,'#e0d1a4');
  desk(-38,-4,false);desk(38,-4,false);desk(-38,51,true);
  workstations.forEach(seat=>{rect(seat.x-12,seat.y-3,24,25,'#555f4d');rect(seat.x-10,seat.y,20,17,'#7c8970')});
  rect(27,48,28,47,'#829376');rect(25,51,4,40,'#9fac86');rect(53,51,4,40,'#9fac86');rect(31,54,20,2,'#a8b28c');rect(31,68,20,2,'#a8b28c');rect(31,86,20,2,'#a8b28c');
  rect(34,35,10,12,'#a28761');rect(32,29,14,10,'#526b42');rect(36,25,6,14,'#75904d');rect(31,30,5,4,'#90a85d');
  // Rear door at the bottom edge of the vehicle.
  rect(-16,80,32,17,'#756b56');rect(-14,81,28,15,'#a89572');rect(-12,83,24,11,'#b9a47b');rect(8,88,2,2,'#e0d1a4');rect(-16,78,32,3,'#4f6151');
  seatedFamilyInDrawOrder().forEach(p=>person(p,p.x,p.y+(p.sleeping?3:0)));
  // Family carpet and loose laptop cable.
  rect(-14,31,29,47,'#8b7458');rect(-12,33,25,43,'#b99b70');for(let y=35;y<74;y+=6)rect(-10,y,21,2,'#cbb389');
  family.forEach((p,i)=>{if(p.aboard&&p.room==='car'&&!p.seated&&!p.driving)person(p,p.x,p.y,0,i===selected&&down('w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'))});
  family.filter(member=>member.aboard&&member.room==='car').forEach(drawSpeechBubble);
  family.filter(member=>member.aboard&&member.room==='car').forEach(member=>{const barX=member.x-9,barY=member.y-20;rect(barX,barY,18,3,'#513845');const pinkWidth=Math.round(18*(member.closeness||0)/100);if(pinkWidth>0)rect(barX,barY,pinkWidth,3,'#f29aad')});
  const p=family[selected];if(p.aboard&&p.room==='car')rect(p.x-9,p.y-23,18,2,'#d8ee9b');
  if(!p.seated&&atExitDoor(p)){rect(-7,81,14,10,'#243b2f');ctx.fillStyle='#e3f0b1';ctx.font='9px monospace';ctx.fillText('E',-3,89)}
  else if(!p.seated&&atSideExit(p)){rect(47,-52,10,14,'#243b2f');ctx.fillStyle='#e3f0b1';ctx.font='9px monospace';ctx.fillText('E',49,-42)}
  else if(!p.seated&&(atPassengerPlace(p)||atDriverPlace(p))){const px=atPassengerPlace(p)?30:-28;rect(px-7,-82,14,10,'#243b2f');ctx.fillStyle='#e3f0b1';ctx.font='9px monospace';ctx.fillText('E',px-3,-74)}
  drawCoinParticles();
  drawSleepParticles();
  drawHeartParticles();
  ctx.globalAlpha=roof;vehicle(0,0,0,'#e0d1a4',true);ctx.globalAlpha=1;
  ctx.restore();
}
function schoolDesk(x,y){rect(x-15,y-12,30,18,'#72583e');rect(x-14,y-11,28,4,'#b18b5d');rect(x-12,y+6,3,13,'#4b493e');rect(x+9,y+6,3,13,'#4b493e');rect(x-10,y+18,20,4,'#58634f')}
function teacherDesk(){rect(-51,-50,34,5,'#bc9564');rect(-49,-46,30,14,'#7c6042');rect(-47,-43,26,8,'#8d704c');rect(-48,-32,4,8,'#514c3e');rect(-24,-32,4,8,'#514c3e')}
function schoolRoom(){
  ctx.save();ctx.translate(320,210);ctx.scale(2.15,2.15);
  rect(-68,-100,136,200,'#31473c');rect(-64,-96,128,192,'#c1b58e');rect(-59,-91,118,182,'#a99066');
  for(let x=-56;x<58;x+=9)rect(x,-88,1,176,'#bca77c');
  // Door back to the car, teacher's desk and one chalkboard.
  rect(-16,-96,32,25,'#756b56');rect(-14,-94,28,22,'#a89572');rect(8,-84,2,2,'#eee0b8');rect(-16,-72,32,3,'#4f6151');
  rect(14,-68,42,34,'#604832');rect(17,-65,36,25,'#183b31');rect(20,-62,30,2,'#f4f0d8');rect(19,-39,9,3,'#d8d0af');
  const teacher=family.find(member=>member.aboard&&member.room==='school'&&member.teacher);if(teacher)person(teacher,teacher.x,teacher.y);
  teacherDesk();
  schoolSeats.forEach(seat=>schoolDesk(seat.x,seat.y));
  family.filter(member=>member.aboard&&member.room==='school'&&member.seated&&!member.teacher).sort((a,b)=>a.y-b.y).forEach(member=>person(member,member.x,member.y));
  family.forEach((member,i)=>{if(member.aboard&&member.room==='school'&&!member.seated)person(member,member.x,member.y,0,i===selected&&down('w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'))});
  const p=family[selected];if(p.room==='school')rect(p.x-9,p.y-23,18,2,'#d8ee9b');
  if(!p.seated){let prompt=null;if(atSchoolDoor(p))prompt={x:0,y:-82};else if(atSchoolBoard(p))prompt={x:35,y:-74};else if(atTeacherPlace(p))prompt={x:-34,y:-68};else{const target=nearestSchoolSeat(p);if(target)prompt={x:target.seat.x,y:target.seat.y-25}}if(prompt){rect(prompt.x-7,prompt.y-5,14,10,'#243b2f');ctx.fillStyle='#e3f0b1';ctx.font='9px monospace';ctx.fillText('E',prompt.x-3,prompt.y+3)}}
  ctx.restore();
}
function canWalkSchool(x,y){if(x<-54||x>54||y<-85||y>84)return false;const obstacles=[[-51,-50,-17,-24],[12,-72,57,-26],...schoolSeats.map(seat=>[seat.x-15,seat.y-12,seat.x+15,seat.y+12])];return !obstacles.some(([a,b,c,d])=>x>a-3&&x<c+3&&y>b-3&&y<d+3)}
function canWalk(x,y){if(x<-48||x>48||y<-54||y>89)return false;const obstacles=[[-56,-21,-23,10],[23,-21,56,10],[-56,35,-23,65],[27,52,56,90]];return !obstacles.some(([a,b,c,d])=>x>a-5&&x<c+5&&y>b-8&&y<d+8)}
function seatedFamilyInDrawOrder(){return family.filter(p=>p.aboard&&p.room==='car'&&p.seated).sort((a,b)=>a.y-b.y)}
function activeWorkers(){return family.filter(p=>p.aboard&&p.seated&&!p.sleeping&&!p.passenger&&Number.isInteger(p.station)&&p.station<workstations.length)}
function wakePerson(personToWake){personToWake.sleeping=false;personToWake.speech={text:'Już nie śpię! Chyba.',timer:3.5};nextSleepIn=Math.max(nextSleepIn,30);buildFamily();toast(personToWake.name+' budzi się i wraca do pracy.')}
function updateSleepEvents(dt){
  nextSleepIn-=dt;if(nextSleepIn>0)return;const candidates=activeWorkers();nextSleepIn=45+Math.random()*55;if(!candidates.length)return;const sleeper=candidates[Math.floor(Math.random()*candidates.length)];sleeper.sleeping=true;sleeper.speech={text:'Zzz… jeszcze jeden arkusz…',timer:4};buildFamily()
}
function polishMinutes(value){const minutes=Math.max(0,Math.floor(value));if(minutes===1)return'1 minutę';const lastTwo=minutes%100,last=minutes%10;return minutes+' '+(last>=2&&last<=4&&(lastTwo<12||lastTwo>14)?'minuty':'minut')}
function clockTime(date){return String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0')}
function dynamicActivityComments(now=new Date()){
  const weekdayComments=['Czyżby dzisiaj była niedziela?','Czyżby dzisiaj był poniedziałek?','Czyżby dzisiaj był wtorek?','Czyżby dzisiaj była środa?','Czyżby dzisiaj był czwartek?','Czyżby dzisiaj był piątek?','Czyżby dzisiaj była sobota?'],nextHour=new Date(now);nextHour.setHours(now.getHours()+1,0,0,0);
  const comments=[
    'Czy wiesz, że grasz już '+polishMinutes(time/60)+'?',
    weekdayComments[now.getDay()],
    'Na liczniku mamy już '+Math.floor(money).toLocaleString('pl-PL')+' monet. Kto to wszystko wyda?',
    'W samochodzie jest teraz '+aboardFamilyCount()+' z '+family.length+' osób. Robi się rodzinnie.',
    'Ta podróż ma już '+distance.toFixed(1).replace('.',',')+' km. Daleko jeszcze?',
    weather==='rain'?'Pada już nawet w naszych rozmowach.':'Ani jednej chmurki. Podejrzanie spokojnie.'
  ];
  if(now.getHours()<8)comments.push('Czy nie za wcześnie na granie? Jeszcze nie ma '+clockTime(nextHour)+'.');
  if(now.getHours()>=21)comments.push('Czy nie za późno na granie? Jest już '+clockTime(now)+'.');
  return comments;
}
function commentOptions(person){const contextual=person.passenger?activityComments.passenger:Number.isInteger(person.station)&&person.station<3?activityComments[person.station]:Number.isInteger(person.station)?activityComments.couch:activityComments.walking;return[...contextual,...dynamicActivityComments()]}
function updateActivityComments(dt){
  family.forEach(person=>{if(person.speech){person.speech.timer-=dt;if(person.speech.timer<=0)person.speech=null}});nextCommentIn-=dt;if(nextCommentIn>0||mode!=='interior')return;nextCommentIn=22+Math.random()*28;const candidates=family.filter(person=>person.aboard&&person.room==='car'&&!person.sleeping);if(!candidates.length)return;const speaker=candidates[Math.floor(Math.random()*candidates.length)],options=commentOptions(speaker);speaker.speech={text:options[Math.floor(Math.random()*options.length)],timer:4.8}
}
function updateWeather(dt){weatherTimer-=dt;if(weatherTimer>0)return;if(weather==='clear'){weather='rain';weatherTimer=22+Math.random()*26;toast('Zaczyna padać. Krople bębnią o dach.')}else{weather='clear';weatherTimer=55+Math.random()*75;toast('Deszcz ustaje. Droga znowu jest spokojna.')}}
function wrapSpeechText(text,maxCharacters=22){const words=text.trim().split(/\s+/),lines=[];let line='';for(const word of words){const candidate=line?line+' '+word:word;if(candidate.length<=maxCharacters||!line)line=candidate;else{lines.push(line);line=word}}if(line)lines.push(line);return lines}
function wrapSpeechTextToWidth(text,maxWidth){const words=text.trim().split(/\s+/),lines=[];let line='';for(const word of words){const candidate=line?line+' '+word:word;if(!line||ctx.measureText(candidate).width<=maxWidth)line=candidate;else{lines.push(line);line=word}}if(line)lines.push(line);return lines}
function drawSpeechBubble(person){if(!person.speech)return;ctx.save();ctx.font='6px monospace';const lines=wrapSpeechTextToWidth(person.speech.text,70),lineHeight=8,width=Math.max(32,...lines.map(line=>ctx.measureText(line).width+10)),height=7+lines.length*lineHeight,x=Math.max(-56,Math.min(56-width,person.x-width/2)),y=Math.max(-96,person.y-height-20);ctx.fillStyle='#101816ed';ctx.fillRect(x,y,width,height);ctx.fillStyle='#d1e997';ctx.fillRect(x,y,width,1);ctx.fillStyle='#f5f3df';ctx.textAlign='center';lines.forEach((line,index)=>ctx.fillText(line,x+width/2,y+9+index*lineHeight));const tailX=Math.max(x+5,Math.min(x+width-5,person.x)),tailBottom=y+height,tailTip=Math.min(person.y-15,tailBottom+7);ctx.fillStyle='#101816ed';ctx.beginPath();ctx.moveTo(tailX-3,tailBottom);ctx.lineTo(tailX+3,tailBottom);ctx.lineTo(person.x,tailTip);ctx.fill();ctx.restore()}
function workMultiplier(p){return .5+Math.max(0,Math.min(100,p.closeness||0))/100}
function updateCloseness(dt){family.forEach(p=>p.closeness=Math.max(0,(p.closeness||0)-dt*.5))}
function updateEconomy(dt){
  const workers=activeWorkers();money+=workers.reduce((sum,p)=>sum+2*workMultiplier(p),0)*dt;
  checkWorkAchievements();
  family.forEach(p=>{
    if(!workers.includes(p)){p.coinTimer=.2;return}
    p.coinTimer=(p.coinTimer??.15)-dt;
    if(p.coinTimer<=0){const seat=cabinSeats[p.station];coinParticles.push({x:seat.x+(Math.random()-.5)*8,y:seat.y-18,age:0,life:.85,drift:(Math.random()-.5)*7});p.coinTimer=(.48+Math.random()*.25)/workMultiplier(p)}
  });
  for(let i=coinParticles.length-1;i>=0;i--){const coin=coinParticles[i];coin.age+=dt;coin.y-=13*dt;coin.x+=coin.drift*dt;if(coin.age>=coin.life)coinParticles.splice(i,1)}
  family.forEach(p=>{if(!p.sleeping){p.sleepParticleTimer=0;return}p.sleepParticleTimer=(p.sleepParticleTimer||0)-dt;if(p.sleepParticleTimer<=0){sleepParticles.push({x:p.x+7+(Math.random()-.5)*5,y:p.y-17,age:0,life:1.5,drift:3+Math.random()*4,size:Math.random()<.45?5:7});p.sleepParticleTimer=.42+Math.random()*.28}});
  for(let i=sleepParticles.length-1;i>=0;i--){const particle=sleepParticles[i];particle.age+=dt;particle.y-=10*dt;particle.x+=particle.drift*dt;if(particle.age>=particle.life)sleepParticles.splice(i,1)}
  const shown=Math.floor(money);if(shown!==lastMoneyShown){$('money-value').textContent=shown.toLocaleString('pl-PL');lastMoneyShown=shown}
  for(let i=heartParticles.length-1;i>=0;i--){const heart=heartParticles[i];heart.age+=dt;heart.y-=11*dt;heart.x+=heart.drift*dt;if(heart.age>=heart.life)heartParticles.splice(i,1)}
  if(bond!==lastBondShown){$('bond-value').textContent=bond.toLocaleString('pl-PL');lastBondShown=bond}
}
function drawCoinParticles(){
  coinParticles.forEach(coin=>{const alpha=Math.max(0,1-coin.age/coin.life);ctx.globalAlpha=alpha;const pulse=coin.age<.12?1+coin.age*4:1;ctx.fillStyle='#9d7927';ctx.beginPath();ctx.arc(coin.x,coin.y,4*pulse,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f4dc76';ctx.beginPath();ctx.arc(coin.x,coin.y-1,2.7*pulse,0,Math.PI*2);ctx.fill();ctx.fillStyle='#7a5b1d';ctx.font='bold 5px monospace';ctx.textAlign='center';ctx.fillText('$',coin.x,coin.y+1.5);ctx.textAlign='start';ctx.globalAlpha=1})
}
function drawSleepParticles(){sleepParticles.forEach(particle=>{const alpha=Math.max(0,1-particle.age/particle.life);ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#edf0cf';ctx.font='bold '+particle.size+'px monospace';ctx.fillText('Z',particle.x,particle.y);ctx.restore()})}
function drawHeartParticles(){
  heartParticles.forEach(heart=>{const alpha=Math.max(0,1-heart.age/heart.life),pulse=heart.age<.16?.8+heart.age*2.5:1;ctx.save();ctx.globalAlpha=alpha;ctx.translate(Math.round(heart.x),Math.round(heart.y));ctx.scale(pulse,pulse);rect(-5,-3,4,4,'#f29aad');rect(1,-3,4,4,'#f29aad');rect(-6,-1,12,4,'#f29aad');rect(-4,3,8,2,'#f29aad');rect(-2,5,4,2,'#f29aad');ctx.restore()})
}
function update(dt){
  window.updateTouchControls?.();
  window.updateRadioControls?.();
  checkRadioAchievement();
  updateCharacterDialog(dt);if(paused)return;time+=dt;toastTimer-=dt;collisionCooldown=Math.max(0,collisionCooldown-dt);updateEconomy(dt);updateCloseness(dt);updateWeather(dt);updateSleepEvents(dt);updateActivityComments(dt);checkProgressAchievements();
  const p=family[selected];if(mode==='outside'){
    car.speed=0;car.parked=true;let dx=(down('d','arrowright')?1:0)-(down('a','arrowleft')?1:0),dy=(down('s','arrowdown')?1:0)-(down('w','arrowup')?1:0),length=Math.hypot(dx,dy)||1;dx=dx/length*55*dt;dy=dy/length*55*dt;const nx=p.pickup.x+dx,ny=p.pickup.y+dy;if(!worldObstacleAt(nx,ny)&&!hitsPlayerCar(nx,ny)){p.pickup.x=nx;p.pickup.y=ny}
  }else if(mode!=='driving'){
    const driver=family.find(member=>member.driving);
    if(driver&&!car.parked){const speed=23,nx=car.x+Math.sin(car.angle)*speed*dt,ny=car.y-Math.cos(car.angle)*speed*dt;if(!worldObstacleAt(nx,ny)){car.x=nx;car.y=ny;car.speed=32}else car.speed=0}else car.speed=0;
    if(!p.seated){let dx=(down('d','arrowright')?1:0)-(down('a','arrowleft')?1:0),dy=(down('s','arrowdown')?1:0)-(down('w','arrowup')?1:0);const l=Math.hypot(dx,dy)||1;dx=dx/l*47*dt;dy=dy/l*47*dt;const walk=mode==='school'?canWalkSchool:canWalk;if(walk(p.x+dx,p.y))p.x+=dx;if(walk(p.x,p.y+dy))p.y+=dy}
  }else{
    const gas=down('w','arrowup'),brake=down('s','arrowdown',' ');car.speed+=(brake?-85:gas?48:-10)*dt;car.speed=Math.max(-22,Math.min(100,car.speed));if(Math.abs(car.speed)<.5)car.speed=0;
    car.angle+=((down('d','arrowright')?1:0)-(down('a','arrowleft')?1:0))*dt*1.9*(car.speed/70);
    const nx=car.x+Math.sin(car.angle)*car.speed*dt*.95,ny=car.y-Math.cos(car.angle)*car.speed*dt*.95;
    const obstacle=worldObstacleAt(nx,ny);
    if(obstacle){car.speed=-car.speed*.22;if(collisionCooldown<=0){collisionCount++;collisionCooldown=1;checkProgressAchievements()}toast(obstacle==='tree'?'Uwaga na drzewo!':obstacle==='vehicle'?'Uwaga na inne auto!':'Ostrożnie! Budynki nie ustąpią pierwszeństwa.')}else{car.x=nx;car.y=ny}
  }
  distance+=Math.abs(car.speed)*dt/3600;const targetZoom=mode==='interior'?1.77:mode==='outside'?1.45:.88;zoom+=(targetZoom-zoom)*Math.min(1,dt*3);roof+=((mode==='driving'||mode==='outside'?1:0)-roof)*Math.min(1,dt*4);
  $('speed').textContent=Math.round(Math.abs(car.speed));$('distance').textContent=distance.toFixed(1);$('view-label').textContent=mode==='interior'?'WNĘTRZE SAMOCHODU':mode==='school'?'PRZYCZEPKA · SZKOŁA':mode==='outside'?'MIASTO · PIESZO':'MIASTO · ZA KIEROWNICĄ';
  const currentDriver=family.find(member=>member.driving);$('driver-name').textContent=currentDriver?.name||'Brak kierowcy';$('driver-status').textContent=mode==='driving'?'Za kierownicą · sterujesz':currentDriver?'Za kierownicą · prowadzi':'Samochód stoi';
  const waitingNearby=mode==='driving'?waitingFamilyNearCar():null;
  $('status').textContent=mode==='outside'?p.name+' spaceruje po mieście. Samochód czeka na parkingu.':waitingNearby?(waitingNearby.boardable===false?waitingNearby.name+' jest przy drodze.':waitingNearby.name+' czeka przy drodze — zatrzymaj się i zabierz ją.'):mode==='driving'?p.name+' prowadzi. Szukaj osób przy drodze.':mode==='school'?(p.teacher?p.name+' prowadzi lekcję.':p.seated?p.name+' siedzi przy ławce.':p.name+' jest w szkolnej przyczepce.'):p.passenger?p.name+' przy radiu. Kierowca prowadzi.':p.seated?(p.sleeping?p.name+' zasnął przy komputerze.':'Kierowca prowadzi. Rodzina pracuje.'):p.name+' spaceruje. Kierowca prowadzi.';
  $('move-label').textContent=mode==='driving'?'Gaz / hamulec / skręt':'Poruszanie';$('control-mode').textContent=mode==='driving'?'Nowa perspektywa. Ten sam dom.':mode==='school'?'Mobilna klasa jest gotowa do lekcji.':'W środku jest całkiem przytulnie.';
  $('step-one').classList.toggle('done',walked);$('step-two').classList.toggle('done',p.y<-42||taken);$('step-three').classList.toggle('done',family.filter(member=>member.boardable!==false).every(member=>member.aboard));
  if(toastTimer<=0){const target=mode==='interior'?nearestWorkstation(p):null,schoolTarget=mode==='school'?nearestSchoolSeat(p):null;$('toast').textContent=mode==='outside'?(outsidePersonNearCar(p)?'E  wejdź do samochodu':'WASD  spaceruj · podążaj za wskaźnikiem auta'):waitingNearby?'E  zabierz '+(waitingNearby.pickupName||waitingNearby.name):mode==='driving'?'W / S  gaz i hamulec     A / D  skręt     E  wróć do wnętrza':mode==='school'?(p.seated?'E  wstań':atSchoolDoor(p)?'E  wróć do samochodu':atSchoolBoard(p)?'E  użyj tablicy':atTeacherPlace(p)?'E  zostań nauczycielem':schoolTarget?'E  usiądź przy ławce':'WASD  spaceruj po klasie'):p.seated?'E  wstań od miejsca     1–6  wybierz osobę':atExitDoor(p)?'E  wejdź do szkoły':atSideExit(p)?'E  wyjdź z samochodu':atDriverPlace(p)?'E  przejmij kierownicę':target?(workstationOccupant(target.index,p)?'To miejsce jest zajęte':'E  usiądź przy wolnym miejscu'):'WASD  spaceruj     Podejdź do kierowcy z przodu ↑'}
  if(toastTimer<=0&&touchHint(true,false))$('toast').textContent=mode==='driving'?'Joystick: ↑ gaz · ↓ hamulec · ← → skręt':p.seated?'Dotknij „Wstań”. Osobę wybierzesz na jej karcie.':atDriverPlace(p)?'Dotknij „Przejmij kierownicę”.':'Joystick: spacer · Podejdź do kierowcy z przodu ↑';
  if(toastTimer<=0&&atPassengerSeat())$('toast').textContent=touchHint('Steruj radiem przyciskami na ekranie.','R — radio wł. / wył. · [ / ] — utwór · E — wstań');
  else if(toastTimer<=0&&mode==='interior'&&!p.seated&&atPassengerPlace(p))$('toast').textContent=touchHint('Dotknij „Usiądź przy radiu”.','E — usiądź na fotelu pasażera i obsługuj radio');
  if(toastTimer<=0&&touchHint(true,false))$('toast').textContent='';
}
function draw(){ctx.clearRect(0,0,640,420);if(mode==='school')schoolRoom();else if(mode==='outside'){const p=family[selected];ctx.save();ctx.translate(320,210);ctx.scale(zoom,zoom);ctx.translate(-p.pickup.x,-p.pickup.y);world();interior(true);ctx.restore()}else{ctx.save();ctx.translate(320,210);ctx.scale(zoom,zoom);if(mode==='interior')ctx.rotate(-car.angle);ctx.translate(-car.x,-car.y);world();interior();ctx.restore()}
  if(weather==='rain'&&(mode==='driving'||mode==='outside'))drawRain();
  // Pixel corner markers and quiet scene caption.
  rect(13,13,19,2,'#d8e1b7');rect(13,13,2,19,'#d8e1b7');rect(608,13,19,2,'#d8e1b7');rect(625,13,2,19,'#d8e1b7');
  ctx.fillStyle='#edf0cf';ctx.font='9px monospace';ctx.fillText(mode==='driving'?'RODZINNA PODRÓŻ / WIDOK MIASTA':mode==='outside'?'SPACER PO MIEŚCIE / '+family[selected].name.toUpperCase():mode==='school'?'MOBILNA SZKOŁA / '+family[selected].name.toUpperCase():'MOBILNY DOM / '+family[selected].name.toUpperCase(),24,36);
  drawPickupIndicator();
  drawCarIndicator();
}
function drawRain(){ctx.save();ctx.globalAlpha=.72;for(let i=0;i<64;i++){const x=(hash(i,17)*700+time*38)%680-20,y=(hash(i,31)*470+time*(150+hash(i,5)*90))%460-20,len=4+Math.floor(hash(i,8)*7);rect(x,y,1,len,'#b7d8dc');if(i%9===0){rect(x-2,y+len+2,5,1,'#d9eef0')}}ctx.restore()}
function drawCarIndicator(){
  if(mode!=='outside')return;const p=family[selected],screenX=320+(car.x-p.pickup.x)*zoom,screenY=210+(car.y-p.pickup.y)*zoom,bounds=pickupVisibleBounds();if(screenX+55*zoom>=bounds.left&&screenX-55*zoom<=bounds.right&&screenY+75*zoom>=bounds.top&&screenY-75*zoom<=bounds.bottom)return;
  const safe=pickupIndicatorBounds(34),dx=screenX-320,dy=screenY-210,scales=[];if(dx<0)scales.push((safe.left-320)/dx);if(dx>0)scales.push((safe.right-320)/dx);if(dy<0)scales.push((safe.top-210)/dy);if(dy>0)scales.push((safe.bottom-210)/dy);const scale=Math.min(...scales.filter(value=>value>=0),1),x=320+dx*scale,y=210+dy*scale,angle=Math.atan2(dy,dx);
  ctx.save();ctx.translate(x,y);ctx.save();ctx.rotate(angle);ctx.fillStyle='#f4dc76';ctx.beginPath();ctx.moveTo(31,0);ctx.lineTo(17,-7);ctx.lineTo(17,7);ctx.closePath();ctx.fill();ctx.restore();ctx.fillStyle='#101816e8';ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f4dc76';ctx.lineWidth=3;ctx.stroke();ctx.rotate(car.angle);rect(-8,-11,16,22,'#e0d1a4');rect(-5,-7,10,6,'#54716c');rect(-10,-7,3,5,'#29372e');rect(7,-7,3,5,'#29372e');rect(-10,4,3,5,'#29372e');rect(7,4,3,5,'#29372e');ctx.restore()
}
const pickupIndicatorCloseDistance=82,pickupIndicatorPortraitDistance=340;
function pickupTargetVisible(target){
  if(!target)return false;const bounds=pickupVisibleBounds(),x=320+(target.p.pickup.x-car.x)*zoom,y=210+(target.p.pickup.y-car.y)*zoom,halfWidth=12*zoom,topHeight=31*zoom,bottomHeight=15*zoom;
  return x+halfWidth>=bounds.left&&x-halfWidth<=bounds.right&&y+bottomHeight>=bounds.top&&y-topHeight<=bounds.bottom;
}
function pickupIndicatorStage(target){if(!target||target.distance<pickupIndicatorCloseDistance||pickupTargetVisible(target))return null;return target.distance<pickupIndicatorPortraitDistance?'portrait':'arrow'}
function pickupVisibleBounds(){
  const box=canvas.getBoundingClientRect(),displayAspect=box.width/Math.max(1,box.height),sourceAspect=canvas.width/canvas.height;
  let left=0,right=canvas.width,top=0,bottom=canvas.height,visibleWidth=canvas.width,visibleHeight=canvas.height;
  if(displayAspect<sourceAspect){visibleWidth=canvas.height*displayAspect;left=(canvas.width-visibleWidth)/2;right=left+visibleWidth}
  else if(displayAspect>sourceAspect){visibleHeight=canvas.width/displayAspect;top=(canvas.height-visibleHeight)/2;bottom=top+visibleHeight}
  return{left,right,top,bottom,visibleHeight,boxHeight:box.height};
}
function pickupIndicatorBounds(margin){
  const visible=pickupVisibleBounds();let {left,right,top,bottom}=visible;
  if(window.matchMedia('(max-width:820px)').matches){const logicalPerCssY=visible.visibleHeight/Math.max(1,visible.boxHeight);top+=Math.min(90,108*logicalPerCssY);bottom-=Math.min(82,142*logicalPerCssY)}
  return{left:left+margin,right:right-margin,top:top+margin,bottom:bottom-margin};
}
function pickupIndicatorPoint(target,margin){
  const screenX=320+(target.p.pickup.x-car.x)*zoom,screenY=210+(target.p.pickup.y-car.y)*zoom,dx=screenX-320,dy=screenY-210,bounds=pickupIndicatorBounds(margin);
  let scale=1;if(screenX<bounds.left||screenX>bounds.right||screenY<bounds.top||screenY>bounds.bottom){const scales=[];if(dx<0)scales.push((bounds.left-320)/dx);if(dx>0)scales.push((bounds.right-320)/dx);if(dy<0)scales.push((bounds.top-210)/dy);if(dy>0)scales.push((bounds.bottom-210)/dy);scale=Math.min(...scales.filter(value=>value>=0),1)}
  return{x:320+dx*scale,y:210+dy*scale,angle:Math.atan2(dy,dx)};
}
function drawPickupArrow(target){
  const point=pickupIndicatorPoint(target,24);ctx.save();ctx.translate(point.x,point.y);ctx.rotate(point.angle);ctx.fillStyle=target.p.color;ctx.strokeStyle='#101816';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-7,-8);ctx.lineTo(-3,0);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
function drawPickupPortrait(target){
  const point=pickupIndicatorPoint(target,32),art=target.p.face||target.p.pixel;ctx.save();ctx.translate(point.x,point.y);ctx.save();ctx.rotate(point.angle);ctx.fillStyle=target.p.color;ctx.strokeStyle='#101816';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(30,0);ctx.lineTo(14,-7);ctx.lineTo(14,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();ctx.fillStyle='#101816e8';ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.fill();ctx.strokeStyle=target.p.color;ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.clip();
  if(art){ctx.imageSmoothingEnabled=art===target.p.face;ctx.drawImage(art,-13,-15,26,30)}else{ctx.fillStyle=target.p.color;ctx.fillRect(-13,-13,26,26);ctx.fillStyle='#f0f0df';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(target.p.name[0],0,4)}ctx.restore();
}
function drawPickupIndicator(){
  if(mode!=='driving')return;
  streetPeopleByDistance().slice().reverse().forEach(target=>{const stage=pickupIndicatorStage(target);if(stage==='arrow')drawPickupArrow(target);else if(stage==='portrait')drawPickupPortrait(target)});
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
const achievementsModal=$('achievements-modal'),achievementsToggle=$('achievement-counter'),achievementsClose=$('achievements-close');let achievementsWasPaused=false;
function openAchievements(){achievementsWasPaused=paused;if(!paused)togglePause();buildAchievementCollection();achievementsModal.hidden=false;achievementsClose.focus?.()}
function closeAchievements(){achievementsModal.hidden=true;if(!achievementsWasPaused&&paused)togglePause();achievementsToggle.focus?.()}
achievementsToggle.onclick=openAchievements;achievementsClose.onclick=closeAchievements;
achievementsModal.addEventListener('click',event=>{if(event.target===achievementsModal)closeAchievements()});
document.querySelectorAll('input[name="character-style"]').forEach(input=>input.addEventListener('change',()=>{if(input.checked)setCharacterStyle(input.value)}));
window.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(!boardEditor.hidden){event.preventDefault();closeBoardEditor();return}if(!achievementsModal.hidden){event.preventDefault();closeAchievements();return}if(!settingsModal.hidden){event.preventDefault();closeSettings()}});
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;update(dt);gameAudio.update(dt,{mode,speed:car.speed,paused,raining:weather==='rain',seats:family.filter(p=>p.aboard).map(p=>p.seated&&!p.sleeping&&!p.passenger&&Number.isInteger(p.station)&&p.station<workstations.length)});draw();requestAnimationFrame(frame)}
$('achievement-value').textContent='0/'+Object.keys(achievementDefinitions).length;setCharacterStyle(characterStyle);loadFamilyPhotos();requestAnimationFrame(frame);
