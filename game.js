'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);
const family=[{name:'Mama',role:'Projektuje przy komputerze',color:'#d88860',hair:'#724135',x:-39,y:14,seat:{x:-39,y:14},seated:true},{name:'Tata',role:'Pracuje przy komputerze',color:'#679b91',hair:'#423c36',x:39,y:14,seat:{x:39,y:14},seated:true},{name:'Córka',role:'Tworzy na laptopie',color:'#c4ad66',hair:'#593d30',x:-38,y:69,seat:{x:-38,y:69},seated:true}];
// Each crop is measured relative to its original photograph.
const familyPhotos=[
  {label:'Mama · Dagmara',src:'images/mama-dagmara.jpg',crop:[.05,.025,.88,.81]},
  {label:'Tata · Andrzej',src:'images/tata-andrzej.jpg',crop:[.025,.015,.92,.875]},
  {label:'Córka · Nela',src:'images/corka-nela.jpg',crop:[.04,.015,.92,.875]}
];
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
    img.onerror=()=>console.warn('Nie udało się wczytać portretu:',photo.src);
    img.src=photo.src;
  });
}
let selected=0,mode='interior',zoom=2.2,roof=0,paused=false,time=0,distance=0,toastTimer=5,walked=false,taken=false;
const car={x:350,y:650,angle:0,speed:32,autoX:350};
const keys=new Set();
const touchKeys=new Set();
const touchHint=(mobile,keyboard)=>window.matchMedia('(max-width:740px), (any-pointer:coarse)').matches?mobile:keyboard;
const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
function person(p,x,y,dir=0,walking=false){
  const step=walking?Math.sin(time*15)*2:0;
  rect(x-5,y+7,4,5+step,'#303e39');rect(x+1,y+7,4,5-step,'#303e39');
  rect(x-7,y,14,9,p.color);rect(x-9,y+1,3,6,'#e2b88d');rect(x+6,y+1,3,6,'#e2b88d');
  if(p.face){
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(p.face,Math.round(x-9),Math.round(y-17),18,21);ctx.restore();
    return;
  }
  rect(x-6,y-10,12,11,p.hair);rect(x-5,y-6,10,7,'#e2b88d');rect(x-6,y-10,12,4,p.hair);
  if(p.name==='Córka'){rect(x-7,y-8,3,12,p.hair);rect(x+5,y-8,3,12,p.hair)}
  rect(x-3,y-3,2,2,'#35352f');rect(x+2,y-3,2,2,'#35352f');
}
function buildFamily(){
  $('family').innerHTML=family.map((p,i)=>`<button class="person ${i===selected?'active':''}" data-person="${i}" aria-pressed="${i===selected}"><canvas class="portrait ${p.face?'photo-portrait':''}" width="96" height="112" id="portrait-${i}" aria-hidden="true"></canvas><span class="person-info"><strong>${familyPhotos[i].label}</strong><small>${p.seated?p.role:(mode==='driving'&&i===selected?'Prowadzi samochód':'Spaceruje po wnętrzu')}</small></span><span class="shortcut">${i+1}</span></button>`).join('');
  family.forEach((p,i)=>{const c=$('portrait-'+i).getContext('2d');c.fillStyle='#34402d';c.fillRect(0,0,24,28);c.fillStyle=p.color;c.fillRect(5,16,14,12);c.fillStyle=p.hair;c.fillRect(6,4,12,13);c.fillStyle='#e2b88d';c.fillRect(7,9,10,9);c.fillStyle='#35352f';c.fillRect(9,12,2,2);c.fillRect(14,12,2,2)});
  family.forEach((p,i)=>{const c=$('portrait-'+i).getContext('2d');if(p.face){c.clearRect(0,0,96,112);c.drawImage(p.face,0,0)}else{const fallback=document.createElement('canvas');fallback.width=24;fallback.height=28;fallback.getContext('2d').drawImage(c.canvas,0,0,24,28,0,0,24,28);c.clearRect(0,0,96,112);c.imageSmoothingEnabled=false;c.drawImage(fallback,0,0,96,112)}});
  document.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>selectPerson(+b.dataset.person));
}
function toast(s){$('toast').textContent=s;toastTimer=4}
function selectPerson(i){if(mode==='driving'){toast(touchHint('Najpierw dotknij „Wróć do wnętrza”.','Najpierw wróć do wnętrza klawiszem E.'));return}window.resetTouchControls?.();selected=i;buildFamily();toast(family[i].name+touchHint(' · Dotknij „Wstań”, potem użyj joysticka.',' · E — wstań / usiądź, WASD — spacer'))}
function togglePause(){paused=!paused;keys.clear();window.resetTouchControls?.();$('pause-overlay').hidden=!paused;$('pause').innerHTML=paused?'▶ <span>Wznów</span>':'Ⅱ <span>Pauza</span>';window.updateTouchControls?.()}
$('pause').onclick=togglePause;
function interact(){
  if(paused)return;
  window.resetTouchControls?.();
  const p=family[selected];
  if(mode==='driving'){mode='interior';p.x=-12;p.y=-53;car.autoX=Math.round(car.x/350)*350;car.speed=32;buildFamily();toast('Kierowca znów prowadzi. Wróć do swojego stanowiska.');return}
  if(p.seated){p.seated=false;p.x=p.seat.x<0?-17:17;p.y=p.seat.y+13;walked=true;buildFamily();toast('Podejdź do kierowcy z przodu samochodu.');return}
  if(p.y<-42){mode='driving';taken=true;buildFamily();toast(p.name+touchHint(' prowadzi · Joystick: gaz, hamulec i skręt · „Wróć” — wnętrze',' prowadzi · W/S — gaz i hamulec · A/D — skręt · E — wnętrze'));return}
  if(Math.hypot(p.x-p.seat.x,p.y-p.seat.y)<33){p.seated=true;p.x=p.seat.x;p.y=p.seat.y;buildFamily();toast(p.name+' wraca do '+(selected===2?'laptopa.':'komputera.'));return}
  toast('Podejdź do kierowcy lub do swojego stanowiska.');
}
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','e','p','1','2','3'].includes(k))e.preventDefault();if(!e.repeat){if(k==='e')interact();if(k==='p')togglePause();if(['1','2','3'].includes(k))selectPerson(+k-1)}keys.add(k)});
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
}
function vehicle(x,y,a,color,large){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a);const w=large?136:18,h=large?216:34;rect(-w/2+3,-h/2+4,w,h,'#34493c');rect(-w/2,-h/2,w,h,color);rect(-w/2+3,-h/2+3,w-6,h-6,color);rect(-w/2+4,-h/2+6,w-8,large?18:8,'#436366');rect(-w/2+4,h/2-12,w-8,7,'#526b63');rect(-w/2-2,-h/2+8,3,9,'#29372e');rect(w/2-1,-h/2+8,3,9,'#29372e');rect(-w/2-2,h/2-14,3,9,'#29372e');rect(w/2-1,h/2-14,3,9,'#29372e');rect(-w/2+3,-h/2,5,3,'#f5dc9c');rect(w/2-8,-h/2,5,3,'#f5dc9c');if(large){rect(-20,-25,40,65,'#c6c5a3');rect(-16,-21,32,3,'#dcd9b5');rect(-12,-4,24,28,'#a8b39b');rect(-8,0,16,20,'#bec7a6')}ctx.restore()}
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
  person({color:'#9da384',hair:'#414436',name:'Kierowca'},-37,-48);rect(-44,-67,17,5,'#35483e');rect(-45,-69,4,9,'#35483e');rect(-31,-69,4,9,'#35483e');
  rect(-55,-27,37,4,'#7a785a');rect(18,-27,37,4,'#7a785a');
  // Long windows, trim and warm wooden floor.
  for(const side of [-1,1]){for(const y of [-12,43]){rect(side===-1?-64:56,y,8,40,'#354e49');rect(side===-1?-62:57,y+3,5,33,'#93b8a7');rect(side===-1?-62:57,y+3,5,3,'#d2dfbc')}}
  desk(-38,-4,false);desk(38,-4,false);desk(-38,51,true);
  family.forEach((p,i)=>{rect(p.seat.x-12,p.seat.y-3,24,25,'#555f4d');rect(p.seat.x-10,p.seat.y,20,17,'#7c8970');if(p.seated)person(p,p.x,p.y)});
  rect(29,54,24,36,'#829376');rect(27,57,4,29,'#9fac86');rect(51,57,4,29,'#9fac86');rect(31,62,18,2,'#a8b28c');rect(31,78,18,2,'#a8b28c');
  rect(34,35,10,12,'#a28761');rect(32,29,14,10,'#526b42');rect(36,25,6,14,'#75904d');rect(31,30,5,4,'#90a85d');
  // Family carpet and loose laptop cable.
  rect(-14,31,29,47,'#8b7458');rect(-12,33,25,43,'#b99b70');for(let y=35;y<74;y+=6)rect(-10,y,21,2,'#cbb389');
  family.forEach((p,i)=>{if(!p.seated){if(i===selected){rect(p.x-9,p.y+12,18,2,'#d8ee9b')}person(p,p.x,p.y,0,i===selected&&down('w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'))}});
  const p=family[selected];if(p.seated){rect(p.x-9,p.y+14,18,2,'#d8ee9b')}
  if(!p.seated&&p.y<-42){rect(-7,-73,14,13,'#243b2f');ctx.fillStyle='#e3f0b1';ctx.font='9px monospace';ctx.fillText('E',-3,-63)}
  ctx.globalAlpha=roof;vehicle(0,0,0,'#e0d1a4',true);ctx.globalAlpha=1;
  ctx.restore();
}
function canWalk(x,y){if(x<-48||x>48||y<-54||y>89)return false;const obstacles=[[-56,-21,-23,10],[23,-21,56,10],[-56,35,-23,65],[27,52,56,90]];return !obstacles.some(([a,b,c,d])=>x>a-5&&x<c+5&&y>b-8&&y<d+8)}
function update(dt){
  window.updateTouchControls?.();
  if(paused)return;time+=dt;toastTimer-=dt;
  const p=family[selected];if(mode==='interior'){
    // Autopilot follows the northbound avenue while everyone works.
    car.angle+=(0-car.angle)*Math.min(1,dt*4);car.x+=(car.autoX-car.x)*Math.min(1,dt*2);car.y-=23*dt;car.speed=32;
    if(!p.seated){let dx=(down('d','arrowright')?1:0)-(down('a','arrowleft')?1:0),dy=(down('s','arrowdown')?1:0)-(down('w','arrowup')?1:0);const l=Math.hypot(dx,dy)||1;dx=dx/l*47*dt;dy=dy/l*47*dt;if(canWalk(p.x+dx,p.y))p.x+=dx;if(canWalk(p.x,p.y+dy))p.y+=dy}
  }else{
    const gas=down('w','arrowup'),brake=down('s','arrowdown',' ');car.speed+=(brake?-85:gas?48:-10)*dt;car.speed=Math.max(-22,Math.min(100,car.speed));if(Math.abs(car.speed)<.5)car.speed=0;
    car.angle+=((down('d','arrowright')?1:0)-(down('a','arrowleft')?1:0))*dt*1.9*(car.speed/70);
    const nx=car.x+Math.sin(car.angle)*car.speed*dt*.95,ny=car.y-Math.cos(car.angle)*car.speed*dt*.95;
    const bx=((nx%350)+350)%350,by=((ny%350)+350)%350;
    if(bx>62&&bx<288&&by>62&&by<288){car.speed=-car.speed*.22;toast('Ostrożnie! Budynki nie ustąpią pierwszeństwa.')}else{car.x=nx;car.y=ny}
  }
  distance+=Math.abs(car.speed)*dt/3600;zoom+=((mode==='interior'?1.77:.88)-zoom)*Math.min(1,dt*3);roof+=((mode==='driving'?1:0)-roof)*Math.min(1,dt*4);
  $('speed').textContent=Math.round(Math.abs(car.speed));$('distance').textContent=distance.toFixed(1);$('view-label').textContent=mode==='interior'?'WNĘTRZE SAMOCHODU':'MIASTO · ZA KIEROWNICĄ';
  $('driver-name').textContent=mode==='driving'?p.name:'Kierowca';$('driver-status').textContent=mode==='driving'?'Za kierownicą · sterujesz':'Za kierownicą · autopilot';
  $('status').textContent=mode==='driving'?p.name+' prowadzi. Miasto jest Wasze.':p.seated?'Kierowca prowadzi. Rodzina pracuje.':p.name+' spaceruje. Kierowca prowadzi.';
  $('move-label').textContent=mode==='driving'?'Gaz / hamulec / skręt':'Poruszanie';$('control-mode').textContent=mode==='driving'?'Nowa perspektywa. Ten sam dom.':'W środku jest całkiem przytulnie.';
  $('step-one').classList.toggle('done',walked);$('step-two').classList.toggle('done',p.y<-42||taken);$('step-three').classList.toggle('done',taken);
  if(toastTimer<=0){$('toast').textContent=mode==='driving'?'W / S  gaz i hamulec     A / D  skręt     E  wróć do wnętrza':p.seated?'E  wstań od '+(selected===2?'laptopa':'komputera')+'     1 / 2 / 3  wybierz osobę':p.y<-42?'E  przejmij kierownicę':Math.hypot(p.x-p.seat.x,p.y-p.seat.y)<33?'E  usiądź przy swoim stanowisku':'WASD  spaceruj     Podejdź do kierowcy z przodu ↑'}
  if(toastTimer<=0&&touchHint(true,false))$('toast').textContent=mode==='driving'?'Joystick: ↑ gaz · ↓ hamulec · ← → skręt':p.seated?'Dotknij „Wstań”. Osobę wybierzesz na jej karcie.':p.y<-42?'Dotknij „Przejmij kierownicę”.':'Joystick: spacer · Podejdź do kierowcy z przodu ↑';
}
function draw(){ctx.clearRect(0,0,640,420);ctx.save();ctx.translate(320,210);ctx.scale(zoom,zoom);ctx.translate(-car.x,-car.y);world();interior();ctx.restore();
  // Pixel corner markers and quiet scene caption.
  rect(13,13,19,2,'#d8e1b7');rect(13,13,2,19,'#d8e1b7');rect(608,13,19,2,'#d8e1b7');rect(625,13,2,19,'#d8e1b7');
  ctx.fillStyle='#edf0cf';ctx.font='9px monospace';ctx.fillText(mode==='driving'?'RODZINNA PODRÓŻ / WIDOK MIASTA':'MOBILNY DOM / '+family[selected].name.toUpperCase(),24,36);
}
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;update(dt);gameAudio.update(dt,{mode,speed:car.speed,paused,seats:family.map(p=>p.seated)});draw();requestAnimationFrame(frame)}
buildFamily();loadFamilyPhotos();requestAnimationFrame(frame);
