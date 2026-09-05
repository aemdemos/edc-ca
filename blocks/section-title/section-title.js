/**
 * Section title: semantic heading with size, alignment, token-based text color, and an optional
 * anchor id so other content can link to this block. Authored as a plain name/value table
 * (readBlockConfig) — only include the rows you need; there is no fixed row count or order.
 */
import { readBlockConfig } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6, p';
const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'];
const ALIGNMENTS = ['left', 'center', 'right'];

/**
 * Default tokens = :root colors in styles/styles.css (--{key}-color, except link-hover → --link-hover-color).
 * To add a site token: append the key here, add `section-title-color-{key}` in section-title.css, and add it to the library page docs.
 */
const TEXT_COLOR_VAR_KEYS = [
  'background',
  'light',
  'dark',
  'text',
  'link',
  'link-hover',
];

const ALLOWED_TEXT_COLOR_CLASSES = new Set([
  '',
  ...TEXT_COLOR_VAR_KEYS.map((k) => `section-title-color-${k}`),
]);

/** Older authored values / classes map to token-based colors */
const LEGACY_TONE_TO_COLOR_CLASS = new Map([
  ['section-title-tone-text', 'section-title-color-text'],
  ['section-title-tone-muted', 'section-title-color-dark'],
  ['section-title-tone-accent', 'section-title-color-link'],
]);

const SIZE_MAP = new Map([
  ['xxl', 'size-xxl'],
  ['xl', 'size-xl'],
  ['l', 'size-l'],
  ['m', 'size-m'],
  ['s', 'size-s'],
  ['xs', 'size-xs'],
]);

function hasValue(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

function validTag(t) {
  if (!t || typeof t !== 'string') return '';
  const lower = t.trim().toLowerCase();
  return (HEADING_TAGS.includes(lower)) ? lower : '';
}

function normalizeAlignment(val) {
  if (!val || typeof val !== 'string') return '';
  const a = val.trim().toLowerCase();
  return ALIGNMENTS.includes(a) ? a : '';
}

// Values are authored against an explicitly labeled row, so this is an exact match — no need to
// guess a size token out of arbitrary text the way a positional/unlabeled table would.
function normalizeSize(val) {
  if (!val || typeof val !== 'string') return '';
  const n = val.trim().toLowerCase();
  const mapped = SIZE_MAP.get(n);
  if (mapped) return mapped;
  if (n.startsWith('size-') && SIZE_MAP.has(n.slice(5))) return n;
  return '';
}

function normalizeTextColorClass(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const t = raw.trim();
  if (!t) return '';
  const lowerFull = t.toLowerCase();
  if (LEGACY_TONE_TO_COLOR_CLASS.has(lowerFull)) return LEGACY_TONE_TO_COLOR_CLASS.get(lowerFull);
  if (ALLOWED_TEXT_COLOR_CLASSES.has(lowerFull)) return lowerFull;
  const compact = lowerFull.replace(/\s+/g, '');
  const withoutPrefix = compact.replace(/^section-title-color-/, '');
  if (TEXT_COLOR_VAR_KEYS.includes(withoutPrefix)) {
    return `section-title-color-${withoutPrefix}`;
  }
  if (withoutPrefix === 'linkhover' || compact === 'hover') {
    return 'section-title-color-link-hover';
  }
  const lower = lowerFull;
  if (lower === 'muted' || lower === 'secondary') return 'section-title-color-dark';
  if (lower === 'accent') return 'section-title-color-link';
  if (lower === 'body' || lower === 'primary') return 'section-title-color-text';
  return '';
}

function get(config, ...keys) {
  const v = keys.reduce((acc, k) => acc ?? config[k], undefined);
  return typeof v === 'string' ? v.trim() : '';
}

/** First authoring key that resolves (readBlockConfig kebab-cases the row label). */
function getTextColorRawFromConfig(config) {
  return get(config, 'text-color', 'classes', 'tone', 'color', 'colour');
}

/** True legacy content authored a bare class on the block for text color; still honored if present. */
function allowlistedTextColorFromClassList(block) {
  const list = [...block.classList];
  const fromNew = list.find((c) => ALLOWED_TEXT_COLOR_CLASSES.has(c) && c);
  if (fromNew) return fromNew;
  const fromLegacy = list.find((c) => LEGACY_TONE_TO_COLOR_CLASS.has(c));
  return fromLegacy ? LEGACY_TONE_TO_COLOR_CLASS.get(fromLegacy) : '';
}

// Row explicitly labeled with one of the given names (readBlockConfig-style label | value row).
function findRowByLabel(rows, labels) {
  return rows.find((row) => {
    if (!row.children || row.children.length !== 2) return false;
    const label = (row.children[0].textContent ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-/, '')
      .replace(/-$/, '');
    return labels.includes(label);
  }) ?? null;
}

function readState(block, config) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const titleRow = findRowByLabel(rows, ['title', 'title-text']);
  const titleHeadingEl = titleRow?.children?.[1]?.querySelector?.(HEADING_SELECTOR) ?? null;
  const titleText = titleHeadingEl
    ? (titleHeadingEl.textContent ?? '').trim()
    : get(config, 'title-text', 'title');
  const titleTag = titleHeadingEl
    ? titleHeadingEl.tagName.toLowerCase()
    : (validTag(get(config, 'title-type')) || 'h2');

  return {
    titleText,
    titleTag,
    titleHeadingEl,
    titleSizeClass: normalizeSize(get(config, 'title-size')),
    alignVal: normalizeAlignment(get(config, 'alignment')),
    textColorClass: normalizeTextColorClass(getTextColorRawFromConfig(config))
      || allowlistedTextColorFromClassList(block),
    anchorId: get(config, 'anchor-id', 'anchor', 'link-target'),
  };
}

function renderSectionTitle(block, state) {
  block.replaceChildren();
  if (hasValue(state.anchorId)) {
    block.id = state.anchorId;
  } else {
    block.removeAttribute('id');
  }
  block.classList.remove(
    'left',
    'center',
    'right',
    'size-xxl',
    'size-xl',
    'size-l',
    'size-m',
    'size-s',
    'size-xs',
    ...TEXT_COLOR_VAR_KEYS.map((k) => `section-title-color-${k}`),
    ...TEXT_COLOR_VAR_KEYS,
    'section-title-tone-text',
    'section-title-tone-muted',
    'section-title-tone-accent',
  );

  if (hasValue(state.titleText) || state.titleHeadingEl) {
    const tag = HEADING_TAGS.includes(state.titleTag) ? state.titleTag : 'h2';
    const titleEl = document.createElement(tag);
    titleEl.classList.add('title');
    if (state.titleHeadingEl) {
      moveInstrumentation(state.titleHeadingEl, titleEl);
      titleEl.append(...state.titleHeadingEl.childNodes);
    } else {
      titleEl.textContent = state.titleText;
    }
    block.appendChild(titleEl);
  }
  if (state.titleSizeClass) block.classList.add(state.titleSizeClass);
  if (state.alignVal) block.classList.add(state.alignVal);
  if (state.textColorClass && ALLOWED_TEXT_COLOR_CLASSES.has(state.textColorClass)) {
    block.classList.add(state.textColorClass);
  }
}

export default function decorate(block) {
  const config = readBlockConfig(block) ?? {};
  const state = readState(block, config);
  if (!hasValue(state.titleText) && !state.titleHeadingEl && !hasValue(state.anchorId)) return;
  renderSectionTitle(block, state);
}
