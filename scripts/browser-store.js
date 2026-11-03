const JOURNAL_KEY = 'light-frame-journals-v1';
const FEATURED_KEY = 'light-frame-featured-v1';

export const isLocalEditor = () => ['localhost', '127.0.0.1'].includes(location.hostname);

function readJournalState() {
  try {
    const value = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '{}');
    return {
      items: Array.isArray(value.items) ? value.items : [],
      deleted: Array.isArray(value.deleted) ? value.deleted : []
    };
  } catch {
    return {items: [], deleted: []};
  }
}

function writeJournalState(value) {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(value));
}

export function mergeBrowserJournals(baseItems) {
  if (isLocalEditor()) return baseItems;
  const state = readJournalState();
  const overrides = new Map(state.items.map(item => [item.slug, item]));
  const merged = baseItems
    .filter(item => !state.deleted.includes(item.slug))
    .map(item => overrides.get(item.slug) || item);
  const baseSlugs = new Set(baseItems.map(item => item.slug));
  merged.push(...state.items.filter(item => !baseSlugs.has(item.slug) && !state.deleted.includes(item.slug)));
  return merged;
}

export function saveBrowserJournal(item) {
  const state = readJournalState();
  const index = state.items.findIndex(entry => entry.slug === item.slug);
  if (index >= 0) state.items[index] = item;
  else state.items.push(item);
  state.deleted = state.deleted.filter(slug => slug !== item.slug);
  writeJournalState(state);
}

export function deleteBrowserJournal(slug) {
  const state = readJournalState();
  state.items = state.items.filter(item => item.slug !== slug);
  if (!state.deleted.includes(slug)) state.deleted.push(slug);
  writeJournalState(state);
}

export function getBrowserFeatured() {
  if (isLocalEditor()) return null;
  try {
    const record = JSON.parse(localStorage.getItem(FEATURED_KEY) || 'null');
    return record && /^data:image\/jpeg;base64,/.test(record.dataUrl || '') ? record : null;
  } catch {
    return null;
  }
}

export function saveBrowserFeatured(record) {
  localStorage.setItem(FEATURED_KEY, JSON.stringify(record));
}
