import {deleteBrowserJournal, isLocalEditor, saveBrowserJournal} from './browser-store.js';

const lines = value => String(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);

function browserItem(item, fields) {
  const story = String(fields.story || '').trim();
  return {
    ...(item || {}),
    slug: item?.slug || `journal-${crypto.randomUUID()}`,
    title: String(fields.title || '').trim(),
    date: fields.date,
    location: String(fields.location || '').trim(),
    tags: item?.tags || ['攝影日誌'],
    summary: String(fields.summary || '').trim() || story.slice(0, 100),
    cover: item?.cover || '',
    photos: item?.photos || [],
    camera: String(fields.camera || '').trim(),
    lens: String(fields.lens || '').trim(),
    settings: item?.settings || {focalLength:'', aperture:'', shutter:'', iso:''},
    story: lines(story),
    whatILearned: lines(fields.learned),
    nextTime: lines(fields.next),
    relatedLessons: item?.relatedLessons || [],
    isSample: fields.kind === 'plan',
    browserLocal: true
  };
}

export function journalForm(main, item, open) {
  const host = main.querySelector(item ? '.article-header' : '.page-intro');
  if (!host) return;
  const local = isLocalEditor();
  host.insertAdjacentHTML('afterend', `<details class="editor" ${open?'open':''}><summary>${item?'上傳照片／編輯或刪除日誌':'＋ 寫日誌與上傳照片'}</summary>
    <p class="storage-note">${local ? '儲存後會更新專案檔案。' : '公開網站會將內容保存在目前瀏覽器；換裝置或清除網站資料後不會同步。'}</p>
    <form>
    <label>標題<input name="title" required maxlength="120"></label>
    <label>日期<input type="date" name="date" required></label>
    <label>今天拍的照片（選填，可多選，最多 6 張）<input type="file" name="journalPhotos" multiple accept="image/jpeg,image/png,image/webp"></label>
    <p>新照片會加入這篇日誌；沒有封面時，第一張會成為代表作品。原有照片會保留。</p>
    <div class="photo-gallery" data-preview></div>
    <label>紀錄類型<select name="kind"><option value="actual">我的觀察或實拍紀錄</option><option value="plan">示範或練習計畫</option></select></label>
    <label>今天看到了什麼？拍到了什麼？<textarea name="story" required maxlength="12000"></textarea></label>
    ${local ? `<details><summary>選用 AI 潤飾</summary><p>按下產生建議，會透過本機 Codex 將正文送交 AI。可以比較兩版後再決定。</p><button type="button" data-polish>產生潤飾建議</button><p data-draft style="white-space:pre-wrap" aria-live="polite"></p><button type="button" data-use hidden>採用建議</button> <button type="button" data-original hidden>還原原文</button></details>` : '<small>AI 潤飾是選用功能，需要在專案本機預覽中使用；這裡可直接保存原文。</small>'}
    <label>列表摘要（選填）<input name="summary"></label>
    <label>地點（選填）<input name="location"></label><label>相機或手機（選填）<input name="camera"></label><label>鏡頭（選填）<input name="lens"></label>
    <label>學到什麼（選填）<textarea name="learned"></textarea></label><label>下次想試什麼（選填）<textarea name="next"></textarea></label>
    <button class="button">儲存目前正文</button><output aria-live="polite"></output></form></details>`);
  const form = host.nextElementSibling.querySelector('form');
  const fields = form.elements;
  for (const key of ['title','date','summary','location','camera','lens']) fields[key].value = item?.[key] || '';
  fields.date.value ||= new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
  fields.story.value = (item?.story || []).join('\n');
  fields.learned.value = (item?.whatILearned || []).join('\n');
  fields.next.value = (item?.nextTime || []).join('\n');
  fields.kind.value = item?.isSample ? 'plan' : 'actual';
  const status = form.querySelector('output');
  fields.journalPhotos.onchange=()=>{
    const preview=form.querySelector('[data-preview]');preview.replaceChildren();
    for(const file of fields.journalPhotos.files){
      const image=new Image();const url=URL.createObjectURL(file);image.src=url;image.alt=file.name;image.style.maxWidth='100%';image.onload=image.onerror=()=>URL.revokeObjectURL(url);preview.append(image);
    }
  };

  async function post(action, data) {
    const response = await fetch('editor/'+action+'?'+new URLSearchParams({slug:item?.slug||''}), {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)
    });
    if (!response.ok) throw Error(await response.text());
    return response.json();
  }

  if (local) {
    const polish=form.querySelector('[data-polish]'), draft=form.querySelector('[data-draft]'), use=form.querySelector('[data-use]'), restore=form.querySelector('[data-original]');
    let original='';
    polish.onclick=async()=>{
      original=fields.story.value; polish.disabled=true; use.hidden=true; restore.hidden=true; draft.textContent='正在整理文字…';
      try { const result=await post('polish',{story:original}); draft.textContent=result.draft; use.hidden=false; }
      catch(err) { draft.textContent=err.message; } finally { polish.disabled=false; }
    };
    use.onclick=()=>{ if(fields.story.value!==original&&!confirm('目前正文已有修改，仍要套用建議嗎？'))return; original=fields.story.value; fields.story.value=draft.textContent; restore.hidden=false; use.hidden=true; };
    restore.onclick=()=>{ fields.story.value=original; restore.hidden=true; use.hidden=false; };
  }

  form.onsubmit=async event=>{
    event.preventDefault();
    const values=Object.fromEntries(new FormData(form));
    const button=form.querySelector('.button');
    button.disabled=true;
    try {
      const files=[...fields.journalPhotos.files];
      if(files.length>6)throw Error('每次最多加入六張照片。');
      values.newPhotos=[];
      for(const file of files){
        if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('請選 JPG、PNG 或 WebP。');
        const bitmap=await createImageBitmap(file),scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
        values.newPhotos.push(canvas.toDataURL('image/jpeg',0.75));
      }
      delete values.journalPhotos;
      if (local) {
        const result=await post('journal',values);
        location.href='index.html?view=article&type=journal&slug='+encodeURIComponent(result.slug);
      } else {
        const saved=browserItem(item,values);
        saved.photos=[...saved.photos,...values.newPhotos.map(src=>({src,alt:saved.title+'的拍攝作品'}))];
        saved.cover ||= values.newPhotos[0] || '';
        saveBrowserJournal(saved);
        location.href='index.html?view=article&type=journal&slug='+encodeURIComponent(saved.slug);
      }
    } catch(err) {
      status.textContent='未儲存：'+err.message;
      button.disabled=false;
    }
  };

  if (item) {
    const remove=document.createElement('button');
    remove.type='button'; remove.className='button secondary'; remove.textContent='刪除這篇日誌';
    host.nextElementSibling.append(remove);
    remove.onclick=async()=>{
      if(!confirm('確定從目前網站移除「'+item.title+'」？')) return;
      try {
        if (local) await post('journal-remove',{});
        else deleteBrowserJournal(item.slug);
        location.href='index.html?view=journals';
      } catch(err) { status.textContent='未刪除：'+err.message; }
    };
  }
}
