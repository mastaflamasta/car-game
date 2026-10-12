'use strict';
(() => {
  const byId=id=>document.getElementById(id);
  const settingsDialog=document.querySelector('#settings-modal .settings-dialog');
  const poolSection=document.createElement('section');
  poolSection.className='character-pool-section';
  poolSection.innerHTML='<div class="character-pool-heading"><div><span>POSTACI Z SERWERA</span><small>Dodaj zapisaną postać do bieżącej gry.</small></div><button id="new-character" type="button">+ Nowa postać</button></div><div id="character-pool" class="character-pool" aria-live="polite"><p>Wczytywanie puli…</p></div>';
  settingsDialog?.append(poolSection);

  const modal=byId('character-modal'),form=byId('character-form'),photoInput=byId('character-photo'),source=byId('crop-source'),cropStage=document.querySelector('.crop-stage');
  const preview=byId('character-preview'),previewContext=preview.getContext('2d'),status=byId('character-form-status');
  let cropper=null,objectUrl='',characters=[];

  function setStatus(message,isError=false){status.textContent=message;status.style.color=isError?'#f09b91':'#f0c982'}
  function canvasBlob(canvas,type,quality){return new Promise(resolve=>canvas.toBlob(resolve,type,quality))}
  function croppedPortrait(width=192,height=224){
    const crop=cropper.getCroppedCanvas({width,height,imageSmoothingEnabled:true,imageSmoothingQuality:'high'}),portrait=document.createElement('canvas');portrait.width=width;portrait.height=height;
    const context=portrait.getContext('2d');context.beginPath();context.ellipse(width/2,height/2,width/2,height/2,0,0,Math.PI*2);context.clip();context.drawImage(crop,0,0,width,height);return portrait;
  }
  async function uploadPhoto(file){
    if(file.size<=1_500_000)return file;
    const maximumSide=1600,scale=Math.min(1,maximumSide/Math.max(source.naturalWidth,source.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(source.naturalWidth*scale));canvas.height=Math.max(1,Math.round(source.naturalHeight*scale));
    const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(source,0,0,canvas.width,canvas.height);
    let blob=await canvasBlob(canvas,'image/jpeg',.86);
    if(blob?.size>1_900_000)blob=await canvasBlob(canvas,'image/jpeg',.7);
    if(!blob||blob.size>2_000_000)throw new Error('Zdjęcie jest zbyt duże do wysłania. Wybierz mniejszy plik.');
    return new File([blob],(file.name.replace(/\.[^.]+$/,'')||'photo')+'.jpg',{type:'image/jpeg'});
  }
  function updatePreview(){
    previewContext.fillStyle='#26352b';previewContext.fillRect(0,0,96,140);
    previewContext.imageSmoothingEnabled=false;
    previewContext.fillStyle='#303e39';previewContext.fillRect(28,116,16,20);previewContext.fillRect(52,116,16,20);
    previewContext.fillStyle=byId('character-color').value;previewContext.fillRect(20,88,56,36);
    previewContext.fillStyle='#e2b88d';previewContext.fillRect(12,92,12,24);previewContext.fillRect(72,92,12,24);
    if(cropper){
      const face=croppedPortrait(96,112);
      previewContext.imageSmoothingEnabled=true;previewContext.imageSmoothingQuality='high';previewContext.drawImage(face,12,20,72,84);
    }else{
      previewContext.fillStyle='#49382f';previewContext.fillRect(24,20,48,52);previewContext.fillStyle='#e2b88d';previewContext.fillRect(28,48,40,36);
    }
    byId('character-preview-name').textContent=byId('character-name').value.trim()||'Nowa postać';
  }

  function closeCreator(){modal.hidden=true;cropper?.destroy();cropper=null;if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl='';form.reset();byId('character-color').value='#6f9f91';source.removeAttribute('src');source.hidden=true;cropStage.classList.add('empty');setStatus('');updatePreview();if(!byId('settings-modal').hidden)poolSection.querySelector('#new-character')?.focus();else byId('game')?.focus()}
  function openCreator(){
    modal.hidden=false;setStatus(window.Cropper?'Wybierz zdjęcie, a potem ustaw kadr głowy.':'Nie udało się wczytać biblioteki kadrowania.',!window.Cropper);
    byId('character-name').focus();updatePreview();
  }

  photoInput.addEventListener('change',()=>{
    const file=photoInput.files?.[0];if(!file)return;
    if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(file);cropper?.destroy();source.hidden=false;cropStage.classList.remove('empty');
    source.onload=()=>{
      if(!window.Cropper)return;
      cropper=new Cropper(source,{aspectRatio:6/7,viewMode:1,dragMode:'move',autoCropArea:.75,background:false,responsive:true,crop:updatePreview,ready:updatePreview});
    };
    source.src=objectUrl;
  });
  byId('character-name').addEventListener('input',updatePreview);
  byId('character-color').addEventListener('input',updatePreview);
  byId('character-close').onclick=closeCreator;
  modal.addEventListener('click',event=>{if(event.target===modal)closeCreator()});
  poolSection.querySelector('#new-character').onclick=openCreator;

  function poolCard(character){
    const article=document.createElement('article');article.className='pool-character';
    const image=document.createElement('img');image.src=character.portraitUrl;image.alt='Portret: '+character.name;
    const details=document.createElement('div'),name=document.createElement('strong'),created=document.createElement('small'),button=document.createElement('button');
    name.textContent=character.name;created.textContent='Ubranie: '+character.color;details.append(name,created);
    button.type='button';button.textContent='Dodaj do gry';button.onclick=()=>{if(window.addServerCharacter(character)){button.disabled=true;button.textContent='W grze'}};
    article.append(image,details,button);return article;
  }
  function renderPool(){
    const pool=poolSection.querySelector('#character-pool');pool.replaceChildren();
    if(!characters.length){const empty=document.createElement('p');empty.textContent='Pula jest pusta. Utwórz pierwszą postać.';pool.append(empty);return}
    characters.forEach(character=>pool.append(poolCard(character)));
  }
  async function loadPool(){
    try{const response=await fetch('api/characters.php',{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);characters=(await response.json()).characters||[];renderPool()}
    catch(error){poolSection.querySelector('#character-pool').innerHTML='<p>Nie udało się połączyć z API PHP. Uruchom grę przez serwer PHP.</p>';console.warn(error)}
  }

  form.addEventListener('submit',async event=>{
    event.preventDefault();const file=photoInput.files?.[0];
    if(!file||!cropper){setStatus('Wybierz zdjęcie i ustaw kadr głowy.',true);return}
    const submit=form.querySelector('[type=submit]');submit.disabled=true;setStatus('Zapisywanie postaci…');
    try{
      const name=byId('character-name').value.trim();
      if(!name||name.length>12)throw new Error('Imię musi mieć od 1 do 12 znaków.');
      const portraitCanvas=croppedPortrait();
      const portrait=await new Promise(resolve=>portraitCanvas.toBlob(resolve,'image/png'));
      if(!portrait)throw new Error('Nie udało się przygotować portretu.');
      const preparedPhoto=await uploadPhoto(file);
      const data=new FormData();data.append('name',name);data.append('color',byId('character-color').value);data.append('crop',JSON.stringify(cropper.getData(true)));data.append('photo',preparedPhoto,preparedPhoto.name);data.append('portrait',portrait,'portrait.png');
      const response=await fetch('api/characters.php',{method:'POST',body:data}),payload=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(payload.error||'Serwer odrzucił zapis.');
      characters.push(payload.character);renderPool();closeCreator();
    }catch(error){setStatus(error.message||'Nie udało się zapisać postaci.',true)}finally{submit.disabled=false}
  });

  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden){event.preventDefault();event.stopImmediatePropagation();closeCreator()}},true);
  updatePreview();loadPool();
})();
