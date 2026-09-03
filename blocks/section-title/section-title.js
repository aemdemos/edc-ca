/**
 * Section title: semantic heading with size, alignment, token-based text color, and an optional
 * anchor id so other content can link to this block. Supports key/value rows from readBlockConfig (UE/DA).
 * Legacy imports: parseFromId() reads optional heading id fragments (---) from migrated content only.
 */
import { readBlockConfig } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6, p';
const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'];
const ALIGNMENTS = ['left', 'center', 'right'];

/**
 * Default tokens = :root colors in styles/styles.css (--{key}-color, except link-hover → --link-hover-color).
 * To add a site token: append the key here, add `section-title-color-{key}` in section-title.css, and add a select option in block models.
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

// Row count of the full template (title, titleType, title-size, alignment, classes, anchor-id).
const ANCHOR_ROW_COUNT = 6;

const SIZE_MAP = new Map([
  ['xxl', 'size-xxl'],
  ['xl', 'size-xl'],
  ['l', 'size-l'],
  ['m', 'size-m'],
  ['s', 'size-s'],
  ['xs', 'size-xs'],
]);

function normalizeAlignment(val) {
  if (!val || typeof val !== 'string') return '';
  const a = val.trim().toLowerCase();
  return ALIGNMENTS.includes(a) ? a : '';
}

function normalizeSize(val) {
  if (!val || typeof val !== 'string') return '';
  const n = val.trim().toLowerCase();
  if (!n) return '';
  if (ALIGNMENTS.includes(n)) return '';
  const mapped = SIZE_MAP.get(n);
  if (mapped) return mapped;
  if (n.startsWith('size-')) return n;
  const order = ['xxl', 'xs', 'xl', 'l', 'm', 's'];
  const key = order.find((k) => n.includes(k));
  return key ? SIZE_MAP.get(key) ?? '' : '';
}

// Row explicitly labeled as the anchor field in a two-column named table (readBlockConfig style).
function isAnchorLabeledRow(row) {
  if (!row?.children || row.children.length !== 2) return false;
  const label = (row.children[0].textContent ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');
  return ['anchor-id', 'anchorid', 'anchor', 'link-target', 'linktarget'].includes(label);
}

function cellText(row) {
  if (!row?.children?.length) return '';
  const col = row.children.length >= 2 ? row.children[1] : row.children[0];
  return (col?.textContent ?? '').trim();
}

/**
 * DA / Franklin key–value table rows often have two columns: label | authored value.
 * Headings/text must be read only from the value column so we never pick `<p>Title</p>` labels.
 */
function valueColumnScope(row) {
  if (!row) return row;
  if (typeof row.matches === 'function' && row.matches('.section-title')) {
    return row;
  }
  if (!row.children?.length) return row;
  if (row.children.length === 2) return row.children[1];
  return row.children[0];
}

function get(config, ...keys) {
  const v = keys.reduce((acc, k) => acc ?? config[k], undefined);
  return typeof v === 'string' ? v.trim() : '';
}

/** First authoring key that resolves (DA labels → readBlockConfig keys). */
function getTextColorRawFromConfig(config) {
  return get(
    config,
    'classes',
    'tone',
    'text-color',
    'textcolor',
    'text-colour',
    'colour',
    'color',
  );
}

function hasValue(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

function validTag(t) {
  if (!t || typeof t !== 'string') return '';
  const lower = t.trim().toLowerCase();
  return (HEADING_TAGS.includes(lower)) ? lower : '';
}

/** Legacy migration helper: optional segments in heading id (not used for greenfield authoring). */
function parseFromId(id) {
  const out = { type: '', sizeClass: '', alignment: '' };
  if (!id || typeof id !== 'string') return out;
  const parts = id.split('---');
  if (parts[1] && HEADING_TAGS.includes(parts[1].toLowerCase())) {
    out.type = parts[1].toLowerCase();
  }
  const rest = (parts[2] ?? '').toLowerCase();
  const sizePart = (rest.split('-and-')[0] ?? '').replace(/^size-/, '');
  out.sizeClass = normalizeSize(sizePart) || normalizeSize(rest);
  if (rest.includes('right')) out.alignment = 'right';
  else if (rest.includes('center')) out.alignment = 'center';
  return out;
}

function getHeadingFromCell(cell, existingHeading = null) {
  const scope = valueColumnScope(cell);
  const heading = existingHeading ?? scope?.querySelector?.(HEADING_SELECTOR);
  if (heading) {
    return {
      text: (heading.textContent ?? '').trim(),
      tag: heading.tagName.toLowerCase(),
      id: heading.id ?? '',
    };
  }
  return { text: cellText(cell), tag: 'h2', id: '' };
}

function createTitleElement(tag, className, text, id, sourceEl) {
  const t = validTag(tag) || 'h2';
  const el = document.createElement(HEADING_TAGS.includes(t) ? t : 'p');
  el.classList.add(className);
  if (sourceEl) {
    moveInstrumentation(sourceEl, el);
    el.append(...sourceEl.childNodes);
  } else {
    el.textContent = text ?? '';
  }
  if (hasValue(id)) el.id = id;
  return el;
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

function readTitleFromRows(rows, block) {
  const state = {
    titleText: '',
    titleTag: 'h2',
    titleSizeClass: '',
    titleId: '',
    alignVal: '',
    titleHeadingEl: null,
  };
  const titleSource = rows.length >= 1 ? rows[0] : block;
  const titleSearchRoot = valueColumnScope(titleSource);
  const rawTitleHeadingEl = titleSearchRoot?.querySelector?.(HEADING_SELECTOR) ?? null;
  // Anchor-labeled rows are never title content, even once wrapTextNodes() wraps their text in a <p>.
  const rowIsAnchorField = isAnchorLabeledRow(titleSource);
  const titleHeadingEl = rowIsAnchorField ? null : rawTitleHeadingEl;
  state.titleHeadingEl = titleHeadingEl;
  const titleInfo = rowIsAnchorField
    ? { text: '', tag: 'h2', id: '' }
    : getHeadingFromCell(titleSource, titleHeadingEl);
  if (!hasValue(titleInfo.text) && !titleHeadingEl) return state;
  state.titleText = titleInfo.text;
  state.titleTag = titleInfo.tag;
  state.titleId = titleInfo.id;
  const fromId = parseFromId(titleInfo.id);
  if (fromId.type) state.titleTag = fromId.type;
  if (rows.length === 0) {
    state.titleSizeClass = fromId.sizeClass;
    state.alignVal = fromId.alignment;
  }
  if (!state.alignVal && fromId.alignment) state.alignVal = fromId.alignment;
  if (!state.titleSizeClass && fromId.sizeClass) state.titleSizeClass = fromId.sizeClass;
  return state;
}

function applyConfig(state, config) {
  const cfg = (key, ...alt) => get(config, key, ...alt);
  const titleCfg = cfg('title-text', 'title') || cfg('title');
  if (hasValue(titleCfg)) state.titleText = titleCfg;
  const tType = validTag(cfg('title-type', 'titleType'));
  if (tType) state.titleTag = tType;
  if (hasValue(cfg('title-size', 'titleSize'))) {
    state.titleSizeClass = normalizeSize(cfg('title-size', 'titleSize'));
  }
  const alignField = normalizeAlignment(cfg('alignment'));
  if (alignField) state.alignVal = alignField;
  const classesField = getTextColorRawFromConfig(config);
  const textColor = normalizeTextColorClass(classesField);
  if (textColor) {
    state.textColorClass = textColor;
  } else if (!state.alignVal) {
    const classesAsAlign = normalizeAlignment(classesField);
    if (classesAsAlign) state.alignVal = classesAsAlign;
  }
  const anchorCfg = cfg('anchor-id', 'anchorId', 'anchor');
  if (hasValue(anchorCfg)) state.anchorId = anchorCfg;
}

/** Scans rows after the title for alignment/size/color tokens; anchor-labeled rows are never metadata content. */
function applyTitleMetaScan(rows, fromIdx, cfg) {
  let haveTitleSize = hasValue(get(cfg, 'title-size', 'titleSize'));
  let haveAlign = hasValue(normalizeAlignment(String(cfg.alignment ?? '')));
  let haveTextColor = hasValue(normalizeTextColorClass(getTextColorRawFromConfig(cfg)));
  let ri = fromIdx;
  while (ri < rows.length) {
    const row = rows.at(ri);
    const raw = isAnchorLabeledRow(row) ? '' : cellText(row);
    if (hasValue(raw)) {
      const color = normalizeTextColorClass(raw);
      const align = normalizeAlignment(raw);
      const size = normalizeSize(raw);
      if (!haveTextColor && color) {
        cfg.classes = raw.trim();
        haveTextColor = true;
      } else if (!haveTitleSize && size) {
        cfg['title-size'] = raw;
        haveTitleSize = true;
      } else if (!haveAlign && align) {
        cfg.alignment = align;
        haveAlign = true;
      }
    }
    ri += 1;
  }
}

/** Explicit-position read of the trailing anchor-id row (see ANCHOR_ROW_COUNT). */
function readAnchorFromRows(allRows) {
  if (allRows.length < ANCHOR_ROW_COUNT) return '';
  return cellText(allRows[ANCHOR_ROW_COUNT - 1]);
}

function configFromSingleColumnRows(rows, tableConfig) {
  const cfg = { ...tableConfig };
  applyTitleMetaScan(rows, 1, cfg);
  return cfg;
}

function allowlistedTextColorFromClassList(block) {
  const list = [...block.classList];
  const fromNew = list.find((c) => ALLOWED_TEXT_COLOR_CLASSES.has(c) && c);
  if (fromNew) return fromNew;
  const fromLegacy = list.find((c) => LEGACY_TONE_TO_COLOR_CLASS.has(c));
  return fromLegacy ? LEGACY_TONE_TO_COLOR_CLASS.get(fromLegacy) : '';
}

/**
 * UE may add the dropdown value as a bare class on the block (`.section-title.link`)
 * rather than embedding it in row 5 or `section-title-color-*`; map those to canonical classes.
 */
function bareTextColorTokenFromBlockClasses(block) {
  const list = [...block.classList];
  const key = TEXT_COLOR_VAR_KEYS.find((k) => list.includes(k));
  return key ? `section-title-color-${key}` : '';
}

function initialTextColorFromBlock(block) {
  return (
    allowlistedTextColorFromClassList(block)
    || bareTextColorTokenFromBlockClasses(block)
  );
}

function renderSectionTitle(block, state) {
  const keepAlign = normalizeAlignment(state.alignVal);
  const keepSize = hasValue(state.titleSizeClass) ? state.titleSizeClass : '';
  const keepTextColor = state.textColorClass && ALLOWED_TEXT_COLOR_CLASSES.has(state.textColorClass)
    ? state.textColorClass
    : '';

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

  const hasTitle = hasValue(state.titleText) || !!state.titleHeadingEl;
  if (hasTitle) {
    const titleEl = createTitleElement(
      state.titleTag,
      'title',
      state.titleText,
      state.titleId,
      state.titleHeadingEl,
    );
    block.appendChild(titleEl);
  }
  if (keepSize) block.classList.add(keepSize);
  if (keepAlign) block.classList.add(keepAlign);
  if (keepTextColor) block.classList.add(keepTextColor);
}

export default function decorate(block) {
  const initialTextColor = initialTextColorFromBlock(block);
  const tableConfig = readBlockConfig(block) ?? {};
  const allRows = Array.from(block.querySelectorAll(':scope > div'));
  const anchorRowValue = readAnchorFromRows(allRows);
  const rows = allRows.length >= ANCHOR_ROW_COUNT ? allRows.slice(0, ANCHOR_ROW_COUNT - 1) : allRows;
  const mergedConfig = configFromSingleColumnRows(rows, tableConfig);
  const state = {
    ...readTitleFromRows(rows, block),
    textColorClass: '',
    anchorId: '',
  };
  applyConfig(state, mergedConfig);
  if (hasValue(anchorRowValue) && !hasValue(state.anchorId)) state.anchorId = anchorRowValue;
  if (initialTextColor && !state.textColorClass) state.textColorClass = initialTextColor;
  if (!hasValue(state.titleText) && !state.titleHeadingEl && !hasValue(state.anchorId)) return;
  renderSectionTitle(block, state);
}
