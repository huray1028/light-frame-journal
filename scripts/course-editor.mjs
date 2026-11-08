import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
function save(path, value) {
  const temp = path + '.' + randomUUID() + '.tmp';
  writeFileSync(temp, JSON.stringify(value,null,2) + '\n');
  renameSync(temp,path);
}
const date = () => new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
const clean = (s,limit) => String(s || '').trim().slice(0,limit);
const tasks = [
  [/光圈|景深|aperture|depth of field/i,'光圈','固定機位、焦距與對焦點，分別以兩種光圈拍同一主體。','比較主體前後哪些細節仍清楚。'],
  [/快門|動態|手震|shutter/i,'快門','在相同機位拍攝同一個動作，改變快門時間並維持相近的畫面亮度。','比較移動邊緣的拖影和靜止背景的清晰度。'],
  [/色溫|白平衡|white balance/i,'白平衡','固定光源與曝光，只更換兩種白平衡設定。','比較白色物體的色偏及整體冷暖感。'],
  [/構圖|留白|背景|composition/i,'構圖','固定主體與光線，分別採用原本的取景和依閱讀重點調整的取景。','比較視線最先停留的位置與背景干擾。'],
  [/光線|側光|逆光|順光|lighting/i,'光線','保持相同主體和構圖，改變光線方向再拍第二張。','比較陰影邊界、質感及主體輪廓。']
];
function createLesson(fields, lessons) {
  const title=clean(fields.title,120), note=clean(fields.note,1000), url=clean(fields.url,2000);
  if (!title || note.length<8) throw Error('請填文章名稱及至少八個字的閱讀重點。');
  if (url && !/^https?:$/.test(new URL(url).protocol)) throw Error('來源網址需使用 HTTP 或 HTTPS。');
  if (lessons.some(l=>!l.archived && (l.title===title || (url && l.sources.some(s=>s.url===url))))) throw Error('已有相同標題或來源的教學。');
  const topic=tasks.find(([pattern])=>pattern.test(title+' '+note));
  const [,tag,action,observe]=topic || [null,'閱讀練習','先拍一張基準照。依閱讀重點挑一項可以改變的設定，再拍第二張，記下改動。','並排兩張照片，找出一處可見差異，寫下是否符合原先預期。'];
  const slug='reading-'+randomUUID(), day=date(), rawPath='raw/sources/'+day+'-'+slug+'.md';
  const author=clean(fields.author,100) || '作者未註明';
  mkdirSync('raw/sources',{recursive:true});
  writeFileSync(rawPath,'# '+title+'\n\n來源：'+(url || '個人閱讀筆記')+'\n\n作者：'+author+'\n\n加入日期：'+day+'\n\n## 使用者轉述\n\n'+note+'\n\n## 衍生教程\n\n'+slug+'\n');
  lessons.push({slug,title,updatedAt:day,order:Math.max(0,...lessons.map(l=>l.order))+1,stage:'閱讀實作',level:'初學',tags:[tag],summary:note.slice(0,120),goal:'用對照照片檢驗自己的閱讀筆記。',cover:'',
    sections:[{heading:'我的閱讀重點',paragraphs:[note]},{heading:'現場操作',paragraphs:[action]},{heading:'觀察與常見錯誤',paragraphs:[observe,'一次只改一項條件；若環境也變了，請在觀察中註明。']}],
    practice:[action,observe,'挑一張代表照片上傳，記下這次改變的條件與觀察。'],sources:[{title,url,author,rawPath,accessedAt:day}],relatedJournals:[],isSample:false});
  save('content/lessons.json',lessons);
  return {slug};
}

export async function editCourse(req,res,port) {
  const host=req.headers.host;
  if (!['localhost:'+port,'127.0.0.1:'+port].includes(host) || req.headers.origin!=='http://'+host) {res.writeHead(403).end();return;}
  try {
    const parts=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024){res.writeHead(413).end();return;}parts.push(chunk);}
    const data=Buffer.concat(parts), route=new URL(req.url,'http://localhost'), lessons=read('content/lessons.json');
    let result={};
    if(route.pathname==='/editor/polish'){
      result=await polish(JSON.parse(data).story);
    }else if(['/editor/journal','/editor/journal-remove'].includes(route.pathname)){
      result=editJournal(route.pathname,route.searchParams.get('slug'),JSON.parse(data));
    }else if(route.pathname==='/editor/article'){
      result=createLesson(JSON.parse(data),lessons);
    }else{
      const lesson=lessons.find(l=>l.slug===route.searchParams.get('slug')&&!l.archived);
      if(!lesson)throw Error('課程不存在或已移除。');
      if(route.pathname==='/editor/delete'){
        lesson.archived=true;
        save('content/lessons.json',lessons);
      }else if(route.pathname==='/editor/photo'){
        if(req.headers['content-type']!=='image/jpeg'||data.length<4||data.readUInt16BE(0)!==0xffd8||data.readUInt16BE(data.length-2)!==0xffd9)throw Error('無法讀取 JPEG 圖片。');
        mkdirSync('assets/images/practice',{recursive:true});
        const src='assets/images/practice/'+randomUUID()+'.jpg', works=read('content/practice-work.json');
        writeFileSync(src,data);
        works.push({slug:lesson.slug,src,note:clean(route.searchParams.get('note'),500),date:date()});
        save('content/practice-work.json',works);
      }else throw Error('未知操作');
    }
    res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(result));
  }catch(err){res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'}).end(err.message);}
}
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function polish(story) {
  if(typeof story!=='string'||!story.trim()||story.length>12000) throw Error('請輸入 1 至 12000 字的正文。');
  const dir=await mkdtemp(join(tmpdir(),'journal-polish-')), out=join(dir,'draft.txt');
  try {
    await new Promise((ok,fail)=>{
      const child=execFile('codex',['exec','--ephemeral','--skip-git-repo-check','--sandbox','read-only','-o',out,'-'],{cwd:dir,timeout:120000,windowsHide:true},err=>err?fail(Error('未取得 AI 建議，請確認本機 Codex 登入與連線。原文仍可儲存。')):ok());
      child.stdin.on('error',()=>{});
      child.stdin.end('只潤飾下方攝影日誌為自然繁體中文，保留口吻與事實，不推測或新增觀察、設定、地點。不使用工具。只輸出正文。\n'+story);
    });
    const draft=(await readFile(out,'utf8')).trim();
    if(!draft)throw Error('沒有取得建議。');
    return {draft};
  } finally {await rm(dir,{recursive:true,force:true});}
}

function editJournal(path, slug, fields) {
  const items=read('content/journals.json'), old=items.find(j=>j.slug===slug&&!j.archived);
  if(slug&&!old)throw Error('這篇日誌已不存在。');
  if(path.endsWith('-remove')){
    if(!old)throw Error('請選擇日誌。');
    old.archived=true;
  }else{
    const title=String(fields.title||'').trim(), story=String(fields.story||'');
    if(!title||title.length>120||!story.trim()||story.length>12000||!/^\d{4}-\d{2}-\d{2}$/.test(fields.date))throw Error('請確認標題、日期及正文。');
    const item=old||{slug:'journal-'+randomUUID(),tags:[],cover:'',photos:[],relatedLessons:[],settings:{}};
    const photos=fields.newPhotos||[];
    if(!Array.isArray(photos)||photos.length>6)throw Error('每次最多六張照片。');
    const buffers=photos.map(src=>{
      if(typeof src!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(src))throw Error('照片格式無效。');
      const buffer=Buffer.from(src.split(',')[1],'base64');
      if(buffer.length<4||buffer.readUInt16BE(0)!==0xffd8||buffer.readUInt16BE(buffer.length-2)!==0xffd9)throw Error('無效的 JPEG 照片。');
      return buffer;
    });
    if(fields.keptPhotos!==undefined){
      const allowed=new Set([item.cover,...item.photos.map(p=>typeof p==='string'?p:p.src)]);
      if(!Array.isArray(fields.keptPhotos)||fields.keptPhotos.some(p=>!allowed.has(p.src)))throw Error('照片不屬於這篇日誌。');
      item.photos=fields.keptPhotos.map(p=>({src:p.src,alt:String(p.alt||'').slice(0,300)}));
    }
    for(const [index,buffer] of buffers.entries()){
      const folder='assets/images/journals/'+item.slug;mkdirSync(folder,{recursive:true});
      const src=folder+'/'+randomUUID()+'.jpg';writeFileSync(src,buffer);
      item.photos.push({src,alt:String(fields.newPhotoAlts?.[index]||title+'的拍攝作品').slice(0,300)});item.cover ||= src;
    }
    if(fields.keptPhotos!==undefined)item.cover=item.photos[fields.coverIndex]?.src||item.photos[0]?.src||'';
    Object.assign(item,{title,story:story.split(/\r?\n/),date:fields.date,isSample:fields.kind==='plan',summary:fields.summary||story.trim().slice(0,100),location:fields.location||'',camera:fields.camera||'',lens:fields.lens||'',whatILearned:(fields.learned||'').split('\n').filter(Boolean),nextTime:(fields.next||'').split('\n').filter(Boolean)});
    if(!old)items.unshift(item);
    slug=item.slug;
  }
  save('content/journals.json',items);
  return {slug};
}
