/**
 * Modified date: renders a localized "Date modified" line (e.g. "Date modified: 2025-06-24").
 * The date is read from the author-entered value; any label cell the author adds is ignored
 * because the localized label ("Date modified:" / "Date de modification :") is added by JS
 * from the page language. Supports a single date cell or a two-cell (label | date) layout.
 * Renders nothing when no cell holds a parseable date.
 */

/** Localized labels keyed by language prefix; extend as more locales are added. */
const LABELS = {
  en: 'Date modified:',
  fr: 'Date de modification :',
};

function getLabel() {
  const lang = (document.documentElement.lang || 'en').toLowerCase();
  const prefix = lang.split('-')[0];
  return LABELS[prefix] ?? LABELS.en;
}

/**
 * Normalize an arbitrary date value to ISO `YYYY-MM-DD`.
 * Returns '' when the value cannot be parsed as a valid date.
 */
function toIsoDate(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  // Already ISO (YYYY-MM-DD) — keep as-is to avoid timezone shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

/**
 * loads and decorates the modified date block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // The author may use one cell (date) or two (label | date). Try each cell's text and
  // use the first that parses as a date, so a label cell like "Date modified:" is ignored.
  const cells = block.querySelectorAll(':scope > div > div');
  let date = '';
  cells.forEach((cell) => {
    if (!date) date = toIsoDate(cell.textContent);
  });
  if (!date) date = toIsoDate(block.textContent);
  // Render nothing when no cell holds a parseable date.
  if (!date) {
    block.replaceChildren();
    return;
  }

  // Match the source markup: <section><span>Date modified: YYYY-MM-DD</span></section>
  const section = document.createElement('section');
  section.className = 'c-date-modified';

  const span = document.createElement('span');
  span.className = 'c-date-modified-date';
  span.textContent = `${getLabel()} ${date}`;

  section.append(span);
  block.replaceChildren(section);
}
