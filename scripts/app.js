const main = document.querySelector('#main-content');
const nav = document.querySelector('#site-nav');
const navToggle = document.querySelector('.nav-toggle');

navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

const formatDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '日期未記錄';
  const [year, month, day] = value.split('-');
  return `${year}.${month}.${day}`;
};

const articleUrl = (type, slug) => `index.html?view=article&type=${encodeURIComponent(type)}&slug=${encodeURIComponent(slug)}`;
const tagsHtml = tags => `<ul class="tag-list">${(tags || []).map(tag => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>`;
const sortByDate = (items, key) => [...items].sort((a, b) => String(b[key]).localeCompare(String(a[key])));
const sortLessons = lessons => [...lessons].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

function safeWebUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function safeAssetPath(value) {
  const path = String(value || '').trim().replace(/\\/g, '/');
  if (!path || path.startsWith('/') || path.startsWith('//') || path.includes('..') || /^[a-z]+:/i.test(path)) return '';
  return path;
}

function visualHtml(item, type, className = 'card-visual') {
  const cover = safeAssetPath(item.cover);
  const label = type === 'journal' ? `${item.title}的代表照片` : `${item.title}的教學封面`;
  if (cover) return `<div class="${className} has-image"><img src="${escapeHtml(cover)}" alt="${escapeHtml(label)}" loading="lazy"></div>`;
  return `<div class="${className}" role="img" aria-label="尚無照片，使用抽象光影漸層代替"></div>`;
}

function card(item, type, list = false) {
  const date = type === 'journal' ? item.date : item.updatedAt;
  const kind = type === 'journal' ? '攝影日誌' : `${item.level || '攝影'}教學`;
  return `<a class="card" href="${articleUrl(type, item.slug)}">
    ${visualHtml(item, type)}
    <div>
      <div class="card-meta"><span>${kind}</span><span>·</span><time datetime="${escapeHtml(date)}">${formatDate(date)}</time>${item.isSample ? '<span class="badge">示範內容</span>' : ''}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      ${list ? tagsHtml(item.tags) : ''}
    </div>
    <span class="arrow" aria-hidden="true">${type === 'journal' ? '閱讀日誌' : '開始學習'} →</span>
  </a>`;
}

function lessonStep(item, index, total) {
  return `<a class="lesson-step" href="${articleUrl('lesson', item.slug)}">
    <span class="lesson-number">${String(index + 1).padStart(2, '0')}</span>
    <span class="lesson-copy"><small>${escapeHtml(item.stage || '攝影基礎')} · ${escapeHtml(item.level || '初學')}</small><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.goal)}</span></span>
    <span class="lesson-state">第 ${index + 1}／${total} 課 →</span>
  </a>`;
}

function setCurrent(view) {
  const current = view === 'article' ? null : view;
  document.querySelectorAll('[data-view]').forEach(link => {
    if (link.dataset.view === current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function homeView(journals, lessons) {
  const latestJournals = sortByDate(journals, 'date').slice(0, 3);
  const orderedLessons = sortLessons(lessons);
  return `<div class="page">
    <section class="hero journal-hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow">Personal Photography Journal</p>
        <h1 id="hero-title">拍下作品，也留下成長的方法。</h1>
        <p class="hero-lede">這裡先是一份個人攝影日誌：放進作品、拍攝過程與下一次想做得更好的地方。旁邊的攝影教學，則把每次學到的事整理成可以一步一步練習的路線。</p>
        <div class="hero-actions"><a class="button" href="#latest-journals">閱讀最新日誌</a><a class="button secondary" href="index.html?view=lessons">開始攝影教學</a></div>
      </div>
      <aside class="hero-note"><p class="eyebrow">最新作品</p><p id="photo-caption">等待第一張作品</p>
      <details><summary>上傳首頁照片</summary><form id="featured-form">
      <label>照片<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required></label>
      <label>作品說明（選填）<input name="caption" maxlength="160"></label>
      <label>相機或手機（選填）<input name="camera" maxlength="160"></label>
      <label>鏡頭（選填）<input name="lens" maxlength="160"></label>
      <button class="button">設為首頁背景</button><small role="status"></small></form>
      <small class="storage-note">${isLocalEditor() ? '照片會加入專案檔案。' : '照片只保存在目前瀏覽器，不會自動上傳到 GitHub。'}</small></details></aside>
    </section>

    <section class="section" aria-labelledby="latest-journals">
      <div class="section-heading"><div><p class="eyebrow">Journal First</p><h2 id="latest-journals">最新攝影日誌</h2><p>作品、拍攝故事、設定與反思都從同一份資料產生；之後只要新增一筆日誌，首頁與列表會一起更新。</p></div><a class="text-link" href="index.html?view=journals">瀏覽全部日誌</a></div>
      <div class="card-grid journal-grid">${latestJournals.map(item => card(item, 'journal')).join('')}</div>
      ${journals.length === 1 ? '<p class="collection-note">目前只有一篇示範拍攝計畫。等你提供真實照片與拍攝資訊後，就能在這裡持續累積自己的作品。</p>' : ''}
    </section>

    <section class="section learning-path" aria-labelledby="learning-title">
      <div class="section-heading"><div><p class="eyebrow">Step-by-step Learning</p><h2 id="learning-title">攝影教學路線</h2><p>從控制曝光、安排畫面，到穩定拍攝與光線實戰。依順序學，也可以直接挑選現在需要的課題。</p></div><a class="text-link" href="index.html?view=lessons">查看教學總覽</a></div>
      <div class="lesson-steps">${orderedLessons.map((item, index) => lessonStep(item, index, orderedLessons.length)).join('')}</div>
    </section>

    <section class="section growth" aria-labelledby="growth-title">
      <div class="growth-intro"><p class="eyebrow">Built to Continue</p><h2 id="growth-title">不是只做完一次，而是能一直新增</h2><p>每一次拍攝與閱讀都能成為下一篇日誌或下一堂短課。固定的內容方式讓作品、知識與練習保持同一個節奏，不必每次重新整理。</p></div>
      <div class="growth-steps"><div class="growth-step"><strong>新增日誌／作品</strong><span>放入照片與真實拍攝資料，首頁、列表、作品頁自動更新。</span></div><div class="growth-step"><strong>延伸攝影教學</strong><span>依學習順序加入新課程，與相關實拍日誌互相連結。</span></div><div class="growth-step"><strong>累積知識與版本</strong><span>同步更新 Wiki 索引、概念頁與紀錄，讓知識持續生長。</span></div></div>
    </section>
  </div>`;
}

function listView(items, type) {
  const journal = type === 'journal';
  const sorted = journal ? sortByDate(items, 'date') : sortLessons(items);
  if (!journal) {
    return `<div class="page"><header class="page-intro"><p class="eyebrow">Photography Course</p><h1>攝影教學</h1><p>這不是零散的技巧清單，而是一條可以逐步練習的學習路線。先理解控制，再處理畫面、穩定與光線。</p></header><div class="course-overview"><span>${sorted.length} 堂課</span><span>初學路線</span><span>每課都有現場練習</span></div>
    <section class="knowledge-flow" aria-labelledby="reading-to-practice"><div><p class="eyebrow">Reading to Practice</p><h2 id="reading-to-practice">把新知識變成下一次能做的練習</h2><p>讀到值得保留的攝影文章時，可以交給筆記助手整理。來源會被保留，重點會被放回既有知識中，再轉成短教程和能在現場驗證的任務。</p></div><ol><li><strong>保留來源</strong><span>記下作者、文章與閱讀日期。</span></li><li><strong>連結概念</strong><span>比對既有課程，避免重複筆記。</span></li><li><strong>整理短課</strong><span>把知識改寫成情境、操作與錯誤提醒。</span></li><li><strong>帶去實拍</strong><span>改變一個條件、比較結果，再寫回日誌。</span></li></ol></section>
    <div class="lesson-steps lesson-steps-page">${sorted.map((item, index) => lessonStep(item, index, sorted.length)).join('')}</div></div>`;
  }
  return `<div class="page"><header class="page-intro"><p class="eyebrow">Journal & Portfolio</p><h1>全部攝影日誌</h1><p>這裡會逐步成為個人的攝影作品與成長紀錄。實拍作品保留照片、地點與參數；尚未拍攝的內容會清楚標示為計畫。</p></header><div class="content-list">${sorted.length ? sorted.map(item => card(item, type, true)).join('') : '<div class="empty">目前還沒有日誌。</div>'}</div></div>`;
}

function relatedLinks(slugs, items, type) {
  const links = (slugs || []).map(slug => items.find(item => item.slug === slug)).filter(Boolean);
  if (!links.length) return '<p class="empty">目前沒有關聯文章。</p>';
  return `<div class="related">${links.map(item => `<a href="${articleUrl(type, item.slug)}">${escapeHtml(item.title)} →</a>`).join('')}</div>`;
}

function textSection(title, paragraphs = []) {
  return `<section class="article-section"><h2>${escapeHtml(title)}</h2>${paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join('')}</section>`;
}

function sourceSection(sources = []) {
  const valid = sources.map(source => ({ ...source, safeUrl: safeWebUrl(source.url) })).filter(source => source.title && source.safeUrl);
  if (!valid.length) return '';
  return `<section class="article-section"><h2>延伸閱讀與來源</h2><p class="section-note">教程以自己的文字重新整理；連結保留原作者與完整脈絡。</p><div class="source-list">${valid.map(source => `<a href="${escapeHtml(source.safeUrl)}" target="_blank" rel="noopener noreferrer"><span><strong>${escapeHtml(source.title)}</strong><small>${escapeHtml(source.author || '作者未註明')} · 讀取於 ${escapeHtml(source.accessedAt || '日期未記錄')}</small></span><span aria-hidden="true">↗</span></a>`).join('')}</div></section>`;
}

function journalMedia(item) {
  const cover = safeAssetPath(item.cover);
  const photos = (item.photos || []).map((photo, index) => {
    const src = safeAssetPath(typeof photo === 'string' ? photo : photo.src);
    const alt = typeof photo === 'object' && photo.alt ? photo.alt : `${item.title}作品照片 ${index + 1}`;
    return src ? { src, alt } : null;
  }).filter(Boolean);

  const coverHtml = cover
    ? `<figure class="article-photo"><img src="${escapeHtml(cover)}" alt="${escapeHtml(`${item.title}的代表照片`)}"><figcaption>代表作品</figcaption></figure>`
    : '<div class="article-cover" role="img" aria-label="尚無個人實拍照片，使用抽象光影漸層代替"><span>目前沒有個人實拍照片</span></div>';
  const gallery = photos.length ? `<section class="article-section"><h2>作品照片</h2><div class="photo-gallery">${photos.map(photo => `<figure><img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt)}" loading="lazy"></figure>`).join('')}</div></section>` : '';
  return coverHtml + gallery;
}

function journalArticle(item, lessons) {
  const value = text => text || '未記錄';
  const settings = item.settings || {};
  return `<article class="article"><a class="back-link" href="index.html?view=journals">← 返回全部日誌</a><header class="article-header"><div class="card-meta"><span>攝影日誌</span><time datetime="${escapeHtml(item.date)}">${formatDate(item.date)}</time>${item.isSample ? '<span class="badge">示範內容</span>' : ''}</div><h1>${escapeHtml(item.title)}</h1><p class="article-summary">${escapeHtml(item.summary)}</p>${tagsHtml(item.tags)}</header>
  ${item.isSample ? '<p class="notice">這是一篇學習計畫／示範內容，不代表已完成實地拍攝。</p>' : ''}
  ${journalMedia(item)}
  <div class="info-grid"><div class="info-item"><span>地點</span><strong>${escapeHtml(value(item.location))}</strong></div><div class="info-item"><span>相機／鏡頭</span><strong>${escapeHtml(`${value(item.camera)} · ${value(item.lens)}`)}</strong></div><div class="info-item"><span>焦距／光圈</span><strong>${escapeHtml(`${value(settings.focalLength)} · ${value(settings.aperture)}`)}</strong></div><div class="info-item"><span>快門／ISO</span><strong>${escapeHtml(`${value(settings.shutter)} · ${value(settings.iso)}`)}</strong></div></div>
  ${textSection('拍攝故事與計畫', item.story)}${textSection('這次學到的事', item.whatILearned)}${textSection('下一次要驗證', item.nextTime)}
  <section class="article-section"><h2>相關教學</h2>${relatedLinks(item.relatedLessons, lessons, 'lesson')}</section></article>`;
}

function lessonArticle(item, journals, lessons) {
  const ordered = sortLessons(lessons);
  const index = ordered.findIndex(lesson => lesson.slug === item.slug);
  const previous = index > 0 ? ordered[index - 1] : null;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;
  return `<article class="article"><a class="back-link" href="index.html?view=lessons">← 返回攝影教學</a><header class="article-header"><div class="card-meta"><span>第 ${item.order || index + 1} 課 · ${escapeHtml(item.stage || '攝影基礎')}</span><time datetime="${escapeHtml(item.updatedAt)}">更新 ${formatDate(item.updatedAt)}</time>${item.isSample ? '<span class="badge">示範教材</span>' : ''}</div><h1>${escapeHtml(item.title)}</h1><p class="article-summary">${escapeHtml(item.summary)}</p>${tagsHtml(item.tags)}</header>
  ${visualHtml(item, 'lesson', 'article-cover')}
  <section class="article-section"><h2>本課目標</h2><p>${escapeHtml(item.goal)}</p></section>
  ${(item.sections || []).map(section => textSection(section.heading, section.paragraphs)).join('')}
  <section class="article-section"><h2>跟著做：本課練習</h2><ol>${(item.practice || []).map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ol></section>
  ${sourceSection(item.sources)}
  <section class="article-section"><h2>相關日誌</h2>${relatedLinks(item.relatedJournals, journals, 'journal')}</section>
  <nav class="lesson-nav" aria-label="教學課程導覽">${previous ? `<a href="${articleUrl('lesson', previous.slug)}"><small>上一課</small>${escapeHtml(previous.title)}</a>` : '<span></span>'}${next ? `<a class="next" href="${articleUrl('lesson', next.slug)}"><small>下一課</small>${escapeHtml(next.title)} →</a>` : '<a class="next" href="index.html?view=journals"><small>完成基礎路線</small>回到攝影日誌 →</a>'}</nav></article>`;
}

function aboutView() {
  return `<div class="page"><header class="page-intro"><p class="eyebrow">About the Journal</p><h1>把拍攝和閱讀，都變成下一次練習</h1><p>這裡保存個人攝影作品與成長過程，也把讀過的攝影知識整理成能真正帶到現場的小課。</p></header>
  <section class="growth"><div class="growth-intro"><h2>誠實記錄，慢慢累積</h2><p>從手機到相機，都可以留下自己的作品。日誌中的器材由拍攝者自由填寫；尚未實拍的練習會標示為拍攝計畫。</p></div><div class="growth-steps"><div class="growth-step"><strong>攝影日誌／作品</strong><span>依日期累積作品、拍攝故事與反思。</span></div><div class="growth-step"><strong>循序攝影教學</strong><span>從基礎控制一路走到不同題材的現場實戰。</span></div><div class="growth-step"><strong>閱讀變成行動</strong><span>保留文章來源，把重點轉成短課與可觀察的練習。</span></div></div></section>
  <section class="section"><div class="section-heading"><div><p class="eyebrow">A Learning Loop</p><h2>閱讀、拍攝、回看，再修正</h2><p>每篇教程都只是理解的起點。真正的答案會在實拍比較與日誌反思中逐漸變清楚。</p></div></div><div class="fit-grid"><div><strong>01 · 閱讀</strong><p>找到值得保留的觀念，同時保留作者與來源。</p></div><div><strong>02 · 整理</strong><p>把觀念放進既有脈絡，不重複堆疊相同筆記。</p></div><div><strong>03 · 練習</strong><p>設計可控制變因、可以觀察差異的拍攝任務。</p></div><div><strong>04 · 回寫</strong><p>將真實結果放回日誌，修正下一次的做法。</p></div></div></section></div>`;
}

async function loadData() {
  const [journalResponse, lessonResponse] = await Promise.all([fetch('content/journals.json'), fetch('content/lessons.json')]);
  if (!journalResponse.ok || !lessonResponse.ok) throw new Error('內容資料讀取失敗');
  const baseJournals = (await journalResponse.json()).filter(item=>!item.archived);
  const lessons=(await lessonResponse.json()).filter(item=>!item.archived);
  return { journals: mergeBrowserJournals(baseJournals), lessons: isLocalEditor()?lessons:mergedLessons(lessons) };
}

async function render() {
  const params = new URLSearchParams(location.search);
  const view = params.get('view') || 'home';
  setCurrent(view);
  try {
    const { journals, lessons } = await loadData();
    if (view === 'journals') main.innerHTML = listView(journals, 'journal');
    else if (view === 'lessons') main.innerHTML = listView(lessons, 'lesson');
    else if (view === 'about') main.innerHTML = aboutView();
    else if (view === 'article') {
      const type = params.get('type');
      const slug = params.get('slug');
      const collection = type === 'journal' ? journals : lessons;
      const item = collection.find(entry => entry.slug === slug);
      main.innerHTML = item ? (type === 'journal' ? journalArticle(item, lessons) : lessonArticle(item, journals, lessons)) : '<div class="page"><div class="empty error">找不到這篇文章。<br><a href="index.html">返回日誌首頁</a></div></div>';
    } else main.innerHTML = homeView(journals, lessons);
    const item=view==='article' && params.get('type')==='journal' && journals.find(j=>j.slug===params.get('slug'));
    if(item || view==='journals') journalForm(main,item || null,params.has('new'));
    if(view==='home') main.querySelector('.journal-grid')?.insertAdjacentHTML('beforebegin','<p><a class="button secondary" href="index.html?view=journals&new=1">＋ 寫日誌</a></p>');
    document.title = `${main.querySelector('h1')?.textContent || '光影日誌'}｜Light & Frame`;
  } catch (error) {
    main.innerHTML = `<div class="page"><div class="empty error">無法載入內容。請使用本機 HTTP server 預覽，而不是直接開啟檔案。<br>${escapeHtml(error.message)}</div></div>`;
  }
}

async function showFeatured(record) {
  const hero = document.querySelector('.journal-hero');
  if (!record || !hero) return;
  const photo = new Image();
  const source = /^data:image\/jpeg;base64,/.test(record.dataUrl || '') ? record.dataUrl : safeAssetPath(record.src);
  if (!source) return;
  photo.src = source;
  photo.alt = record.caption || '最新攝影作品';
  await photo.decode();
  hero.querySelector('.featured-image')?.remove();
  photo.className = 'featured-image';
  hero.prepend(photo);
  hero.classList.add('with-photo');
  document.querySelector('#photo-caption').textContent = [photo.alt, record.camera, record.lens].filter(Boolean).join(' · ');
}

async function initFeatured() {
  if (!document.querySelector('.journal-hero')) return;
  try {
    const browserRecord = getBrowserFeatured();
    if (browserRecord) await showFeatured(browserRecord);
    else {
      const response = await fetch('content/featured-photo.json', {cache:'no-store'});
      if (response.ok) await showFeatured(await response.json());
    }
  } catch { /* Keep the gradient when no image is available. */ }
  const form = document.querySelector('#featured-form');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    const status = form.querySelector('[role=status]');
    button.disabled = true;
    status.textContent = '正在儲存…';
    try {
      const bitmap = await createImageBitmap(form.elements.photo.files[0]);
      const longestEdge = isLocalEditor() ? 2200 : 1400;
      const scale = Math.min(1, longestEdge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
      bitmap.close();
      const fields = new URLSearchParams();
      for (const key of ['caption','camera','lens']) fields.set(key,form.elements[key].value);
      if (isLocalEditor()) {
        const body = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',0.88));
        if (!body) throw Error();
        const result = await fetch('featured-photo?' + fields,{method:'POST',headers:{'Content-Type':'image/jpeg'},body});
        if (!result.ok) throw Error();
        await showFeatured(await result.json());
      } else {
        const record = {
          dataUrl: canvas.toDataURL('image/jpeg', 0.8),
          uploadedAt: new Date().toISOString(),
          caption: form.elements.caption.value.trim(),
          camera: form.elements.camera.value.trim(),
          lens: form.elements.lens.value.trim()
        };
        saveBrowserFeatured(record);
        await showFeatured(record);
      }
      status.textContent = '已儲存為首頁背景。';
    } catch { status.textContent = '無法儲存。請選擇較小的 JPG、PNG 或 WebP 圖片。'; }
    finally { button.disabled = false; }
  });
}
async function courseControls() {
  const local=['localhost','127.0.0.1'].includes(location.hostname);
  const params=new URLSearchParams(location.search);
  const list=main.querySelector('.lesson-steps-page');
  const nav=main.querySelector('.lesson-nav');
  if(list) main.querySelector('.page-intro').insertAdjacentHTML('beforeend','<p><a class="button" href="#new-lesson">＋ 新增攝影教學</a></p>');
  if(nav) main.querySelector('.article-header').insertAdjacentHTML('afterend','<p><a class="button" href="#practice-upload">上傳我的練習作業</a></p>');
  if(list) list.insertAdjacentHTML('afterend',`<section class="editor"><h2>＋ 新增教學</h2><p>可以先到 <a href="https://www.cambridgeincolour.com/tutorials.htm" target="_blank" rel="noopener noreferrer">Cambridge in Colour 攝影教學</a> 找一篇感興趣的文章，再回來寫下重點。</p><p>${local?'內容儲存至專案。':'內容只保存在目前瀏覽器，不會同步到其他裝置或 GitHub。'}</p><form data-edit="article">
    <label>文章名稱<input name="title" required maxlength="120"></label><label>來源網址（選填）<input name="url" type="url"></label><label>作者（選填）<input name="author"></label>
    <label>用自己的話寫下文章重點<textarea name="note" required minlength="8" maxlength="1000"></textarea></label><small>依你填寫的重點與攝影主題，立即編成對照練習。網址用於保留出處。</small>
    <button class="button">產生教學</button><output aria-live="polite"></output></form></section>`);
  if(nav){
    nav.insertAdjacentHTML('beforebegin',`<section class="article-section"><h2>上傳我的練習作業</h2><p>${local?'照片會儲存至專案。':'照片與心得只保存在目前瀏覽器，重新整理後仍保留；清除網站資料會遺失。'}</p><form class="editor" data-edit="photo"><label>選擇練習照片<input name="photo" type="file" required accept="image/png,image/jpeg,image/webp"></label><label>這次觀察到什麼？（選填）<textarea name="note" maxlength="500"></textarea></label><button class="button">上傳本課作品</button><output aria-live="polite"></output></form><div id="works"></div></section>`);
    nav.insertAdjacentHTML('afterend','<form class="editor" data-edit="delete"><button class="button secondary">刪除這堂教學</button><output aria-live="polite"></output></form>');
    const works=await fetch('content/practice-work.json',{cache:'no-store'}).then(r=>r.json());
    const matching=[...works,...(local?[]:courseState().works)].filter(w=>w.slug===params.get('slug')).reverse();
    main.querySelector('#works').innerHTML=matching.map(w=>`<figure class="article-photo"><img src="${escapeHtml(/^data:image\/jpeg;base64,/.test(w.src)?w.src:safeAssetPath(w.src))}" alt="${escapeHtml(w.note||'本課練習作品')}"><figcaption>${escapeHtml(w.date)} · ${escapeHtml(w.note||'實拍練習')}</figcaption></figure>`).join('')||'<p>目前尚無練習照片。</p>';
  }
  main.querySelector('[data-edit="article"]')?.closest('section').setAttribute('id','new-lesson');
  main.querySelector('[data-edit="photo"]')?.closest('section').setAttribute('id','practice-upload');
  for(const form of main.querySelectorAll('[data-edit]')) form.onsubmit=async event=>{
    event.preventDefault();
    const kind=form.dataset.edit, slug=params.get('slug')||'', fields=new FormData(form), button=form.querySelector('button'), status=form.querySelector('output');
    if(kind==='delete'&&!confirm('移除「'+main.querySelector('h1').textContent+'」？這堂課將從網站下架，來源及已交的照片會保留。'))return;
    button.disabled=true;status.textContent='正在儲存…';
    try{
      if(!local){
        if(kind==='article'){const {lessons}=await loadData();const result=addLesson(Object.fromEntries(fields),lessons);location.href=articleUrl('lesson',result.slug);}
        else if(kind==='delete'){removeLesson(slug);location.href='index.html?view=lessons';}
        else if(kind==='photo'){
          const bitmap=await createImageBitmap(fields.get('photo')),scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
          const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
          canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
          saveWork({slug,src:canvas.toDataURL('image/jpeg',0.75),note:String(fields.get('note')||''),date:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'})});location.reload();
        }
        return;
      }
      const query=new URLSearchParams({slug});let body, type='application/json';
      if(kind==='photo'){
        const bitmap=await createImageBitmap(fields.get('photo')), scale=Math.min(1,2200/Math.max(bitmap.width,bitmap.height));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
        canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
        body=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.88));type='image/jpeg';query.set('note',fields.get('note'));
      }else body=JSON.stringify(Object.fromEntries(fields));
      const res=await fetch('editor/'+kind+'?'+query,{method:'POST',headers:{'Content-Type':type},body});
      if(!res.ok)throw Error(await res.text());
      const result=await res.json();
      if(kind==='photo')location.reload();
      else location.href=kind==='article'?articleUrl('lesson',result.slug):'index.html?view=lessons';
    }catch(err){status.textContent='未儲存：'+err.message;button.disabled=false;}
  };
}
render().then(()=>Promise.all([initFeatured(),courseControls()]));
import { journalForm } from './journal-form.js';
import {courseState, mergedLessons, addLesson, saveWork, removeLesson} from './course-store.js';
import {getBrowserFeatured, isLocalEditor, mergeBrowserJournals, saveBrowserFeatured} from './browser-store.js';
