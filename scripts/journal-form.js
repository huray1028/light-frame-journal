export function journalForm(main,item,open) {
  const host=main.querySelector(item?'.article-header':'.page-intro');
  host.insertAdjacentHTML('afterend',`<details class="editor" ${open?'open':''}><summary>${item?'編輯或刪除日誌':'＋ 寫日誌'}</summary><form>
    <label>標題<input name="title" required maxlength="120"></label>
    <label>日期<input type="date" name="date" required></label>
    <label>紀錄類型<select name="kind"><option value="actual">我的觀察或實拍紀錄</option><option value="plan">示範或練習計畫</option></select></label>
    <label>今天看到了什麼？拍到了什麼？<textarea name="story" required maxlength="12000"></textarea></label>
    <details><summary>選用 AI 潤飾</summary><p>按下產生建議，會透過本機 Codex 將正文送交 AI。可以比較兩版後再決定。</p><button type="button" data-polish>產生潤飾建議</button><p data-draft style="white-space:pre-wrap" aria-live="polite"></p><button type="button" data-use hidden>採用建議</button> <button type="button" data-original hidden>還原原文</button></details>
    <label>列表摘要（選填）<input name="summary"></label>
    <label>地點（選填）<input name="location"></label><label>相機或手機（選填）<input name="camera"></label><label>鏡頭（選填）<input name="lens"></label>
    <label>學到什麼（選填）<textarea name="learned"></textarea></label><label>下次想試什麼（選填）<textarea name="next"></textarea></label>
    <button class="button">儲存目前正文</button><output aria-live="polite"></output></form></details>`);
  const form=host.nextElementSibling.querySelector('form'), fields=form.elements;
  for(const key of ['title','date','summary','location','camera','lens']) fields[key].value=item?.[key]||'';
  fields.date.value ||= new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
  fields.story.value=item?.story.join('\n')||'';
  fields.learned.value=item?.whatILearned.join('\n')||'';
  fields.next.value=item?.nextTime.join('\n')||'';
  fields.kind.value=item?.isSample?'plan':'actual';
  const status=form.querySelector('output'), polish=form.querySelector('[data-polish]'), draft=form.querySelector('[data-draft]'), use=form.querySelector('[data-use]'), restore=form.querySelector('[data-original]');
  let original='';
  async function post(action,data) {
    const r=await fetch('editor/'+action+'?'+new URLSearchParams({slug:item?.slug||''}),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    if(!r.ok) throw Error(await r.text());
    return r.json();
  }
  polish.onclick=async()=>{
    original=fields.story.value;polish.disabled=true;use.hidden=true;restore.hidden=true;draft.textContent='正在整理文字…';
    try{const result=await post('polish',{story:original});draft.textContent=result.draft;use.hidden=false;}
    catch(err){draft.textContent=err.message;}finally{polish.disabled=false;}
  };
  use.onclick=()=>{if(fields.story.value!==original && !confirm('目前正文已有修改，仍要套用建議嗎？'))return;original=fields.story.value;fields.story.value=draft.textContent;restore.hidden=false;use.hidden=true;};
  restore.onclick=()=>{fields.story.value=original;restore.hidden=true;use.hidden=false;};
  form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('.button');button.disabled=true;
    try{const result=await post('journal',Object.fromEntries(new FormData(form)));location.href='index.html?view=article&type=journal&slug='+encodeURIComponent(result.slug);}
    catch(err){status.textContent=err.message;button.disabled=false;}
  };
  if(item){const remove=document.createElement('button');remove.type='button';remove.className='button secondary';remove.textContent='刪除這篇日誌';form.after(remove);
    remove.onclick=async()=>{if(!confirm('確定從網站移除「'+item.title+'」？'))return;
      try{await post('journal-remove',{});location.href='index.html?view=journals';}catch(err){status.textContent=err.message;}
    };
  }
}
