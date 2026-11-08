const key='light-frame-courses-v1';
export function courseState(){return JSON.parse(localStorage.getItem(key)||'{"lessons":[],"works":[],"deleted":[]}');}
function save(state){try{localStorage.setItem(key,JSON.stringify(state));}catch{throw Error('瀏覽器儲存空間不足，請縮小照片後重試。');}}
export function mergedLessons(base){const s=courseState();return [...base,...s.lessons].filter(l=>!s.deleted.includes(l.slug));}
export function addLesson(fields,base){
  const title=String(fields.title||'').trim(),note=String(fields.note||'').trim(),url=String(fields.url||'').trim();
  if(!title||note.length<8)throw Error('請填標題與至少八個字的閱讀重點。');
  if(url&&!['http:','https:'].includes(new URL(url).protocol))throw Error('請使用 HTTP 或 HTTPS 網址。');
  if(base.some(l=>l.title===title||url&&l.sources?.some(s=>s.url===url)))throw Error('已有同名或相同來源的教學。');
  const state=courseState(),slug='reading-'+crypto.randomUUID(),date=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
  const action='固定主體與拍攝位置，先拍一張基準照，再依閱讀重點只改變一個條件拍第二張。';
  const observation='並排比較兩張照片，記下改變的條件、可見差異，以及是否符合預期。';
  state.lessons.push({slug,title,updatedAt:date,order:Math.max(0,...base.map(l=>l.order))+1,stage:'閱讀實作',level:'初學',tags:['閱讀筆記'],summary:note.slice(0,120),cover:'',goal:'用對照照片驗證閱讀重點。',sections:[{heading:'我的閱讀重點（尚待實拍驗證）',paragraphs:[note]},{heading:'現場操作',paragraphs:[action]},{heading:'觀察重點與常見錯誤',paragraphs:[observation,'避免同時改變多個條件；環境改變時也要記錄。']}],practice:[action,observation,'上傳代表照片與心得，留下這次練習紀錄。'],sources:[{title,url,author:fields.author||'作者未註明',accessedAt:date,rawPath:''}],relatedJournals:[],isSample:false});
  save(state);return {slug};
}
export function saveWork(work){const state=courseState();state.works.push(work);save(state);}
export function removeLesson(slug){const state=courseState();state.deleted.push(slug);save(state);}
