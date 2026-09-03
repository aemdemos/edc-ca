/**
 * Modified date: renders a localized "Date modified" line (e.g. "Date modified: 2025-06-24")
 * from an author-entered date. Renders nothing when the block is blank or unparseable.
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
  // Author types the date into the block; render nothing when blank/unparseable.
  const date = toIsoDate(block.textContent);
  if (!date) {
    block.replaceChildren();
    return;
  }

  const section = document.createElement('section');
  section.className = 'c-date-modified';

  const span = document.createElement('span');
  span.className = 'c-date-modified-date';

  const label = document.createElement('span');
  label.className = 'c-date-modified-label';
  label.textContent = `${getLabel()} `;

  const time = document.createElement('time');
  time.setAttribute('datetime', date);
  time.textContent = date;

  span.append(label, time);
  section.append(span);

  block.replaceChildren(section);
}
