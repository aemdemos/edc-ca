/**
 * Modified date: renders a localized "Date modified" line (e.g. "Date modified: 2025-06-24").
 *
 * The date is auto-populated from the page's own last-modified timestamp
 * (`document.lastModified`, backed by the Last-Modified response header, which EDS sets to
 * the content's publish/modification time). It falls back to today's date if that value is
 * unavailable. Authors simply place the block — they never enter or edit the date, so it
 * always reflects when the page content was actually last modified.
 *
 * The date is always displayed in ISO `YYYY-MM-DD` format, matching the source site.
 * The label is chosen from the page language (`<html lang>`): `fr` uses the French
 * label, everything else falls back to English. No user-facing text is hard-coded in
 * a way that can't be localized.
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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Resolve the date to display from the page's last-modified timestamp, then today.
 * `document.lastModified` reflects the Last-Modified response header (content publish
 * time on preview/live). Block content is ignored so authors cannot override the value.
 */
function resolveDate() {
  const fromLastModified = toIsoDate(document.lastModified);
  if (fromLastModified) return fromLastModified;

  return todayIsoDate();
}

/**
 * loads and decorates the modified date block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const date = resolveDate();

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
