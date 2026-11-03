import { access, readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const root = process.cwd();
const journals = JSON.parse(await readFile(resolve(root, 'content/journals.json'), 'utf8'));
const lessons = JSON.parse(await readFile(resolve(root, 'content/lessons.json'), 'utf8'));
const errors = [];

const requiredJournalFields = ['slug', 'title', 'date', 'location', 'tags', 'summary', 'cover', 'photos', 'camera', 'lens', 'settings', 'story', 'whatILearned', 'nextTime', 'relatedLessons', 'isSample'];
const requiredLessonFields = ['slug', 'title', 'updatedAt', 'order', 'stage', 'level', 'tags', 'summary', 'cover', 'goal', 'sections', 'practice', 'sources', 'relatedJournals', 'isSample'];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function checkRequired(item, fields, label) {
  for (const field of fields) {
    if (!(field in item)) errors.push(`${label} 缺少欄位：${field}`);
  }
}

function checkUnique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) errors.push(`${label} 重複：${value}`);
    seen.add(value);
  }
}

function localAssetPath(value, label) {
  const path = String(value || '').trim().replace(/\\/g, '/');
  if (!path) return null;
  if (path.startsWith('/') || path.startsWith('//') || path.includes('..') || /^[a-z]+:/i.test(path)) {
    errors.push(`${label} 必須使用專案內相對路徑：${path}`);
    return null;
  }
  const absolute = resolve(root, path);
  if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) {
    errors.push(`${label} 超出專案範圍：${path}`);
    return null;
  }
  return absolute;
}

const journalSlugs = new Set(journals.map(item => item.slug));
const lessonSlugs = new Set(lessons.map(item => item.slug));
checkUnique(journals.map(item => item.slug), '日誌 slug');
checkUnique(lessons.map(item => item.slug), '教學 slug');
checkUnique(lessons.map(item => item.order), '教學 order');

const assets = [];
for (const item of journals) {
  checkRequired(item, requiredJournalFields, `日誌 ${item.slug || '(無 slug)'}`);
  if (!slugPattern.test(item.slug || '')) errors.push(`日誌 slug 格式錯誤：${item.slug}`);
  if (!datePattern.test(item.date || '')) errors.push(`日誌日期格式錯誤：${item.slug}`);
  for (const slug of item.relatedLessons || []) {
    if (!lessonSlugs.has(slug)) errors.push(`日誌 ${item.slug} 引用了不存在的教學：${slug}`);
  }
  const cover = localAssetPath(item.cover, `日誌 ${item.slug} cover`);
  if (cover) assets.push([cover, `日誌 ${item.slug} cover`]);
  for (const [index, photo] of (item.photos || []).entries()) {
    const path = typeof photo === 'string' ? photo : photo.src;
    const absolute = localAssetPath(path, `日誌 ${item.slug} photos[${index}]`);
    if (absolute) assets.push([absolute, `日誌 ${item.slug} photos[${index}]`]);
  }
}

for (const item of lessons) {
  checkRequired(item, requiredLessonFields, `教學 ${item.slug || '(無 slug)'}`);
  if (!slugPattern.test(item.slug || '')) errors.push(`教學 slug 格式錯誤：${item.slug}`);
  if (!datePattern.test(item.updatedAt || '')) errors.push(`教學日期格式錯誤：${item.slug}`);
  if (!Number.isInteger(item.order) || item.order < 1) errors.push(`教學 order 必須是正整數：${item.slug}`);
  for (const slug of item.relatedJournals || []) {
    if (!journalSlugs.has(slug)) errors.push(`教學 ${item.slug} 引用了不存在的日誌：${slug}`);
  }
  if (!Array.isArray(item.sources)) {
    errors.push(`教學 ${item.slug} sources 必須是陣列`);
  } else {
    for (const [index, source] of item.sources.entries()) {
      const label = `教學 ${item.slug} sources[${index}]`;
      for (const field of ['title', 'author', 'url', 'rawPath', 'accessedAt']) {
        if (!(field in source)) errors.push(`${label} 缺少欄位：${field}`);
      }
      if (source.url && !/^https?:\/\//i.test(source.url)) errors.push(`${label} url 必須使用 http 或 https`);
      if (source.accessedAt && !datePattern.test(source.accessedAt)) errors.push(`${label} accessedAt 日期格式錯誤`);
      const rawPath = localAssetPath(source.rawPath, `${label} rawPath`);
      if (rawPath) assets.push([rawPath, `${label} rawPath`]);
    }
  }
  const cover = localAssetPath(item.cover, `教學 ${item.slug} cover`);
  if (cover) assets.push([cover, `教學 ${item.slug} cover`]);
}

for (const [path, label] of assets) {
  try {
    await access(path);
  } catch {
    errors.push(`${label} 找不到檔案：${path}`);
  }
}

if (errors.length) {
  console.error(`內容驗證失敗（${errors.length} 項）：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`內容驗證通過：${journals.length} 篇日誌、${lessons.length} 堂教學，slug、順序、關聯、來源與圖片路徑皆有效。`);
}

