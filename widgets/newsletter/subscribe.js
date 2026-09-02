import { decorateIcons } from '../../scripts/aem.js';

const STRINGS_URL = `${window.hlx.codeBasePath}/widgets/newsletter/subscribe.json`;

let stringsPromise;

/**
 * Fetches (once) and caches the widget's bilingual strings.
 * @returns {Promise<{en: object, fr: object}>}
 */
function loadStrings() {
  stringsPromise ??= fetch(STRINGS_URL).then((resp) => resp.json());
  return stringsPromise;
}

/**
 * Fills in every data-key/data-key-placeholder/data-key-aria-label node from the strings object.
 * @param {Element} widget The widget root
 * @param {object} strings Resolved strings for the current language
 */
function applyStrings(widget, strings) {
  widget.querySelectorAll('[data-key]').forEach((el) => {
    el.textContent = strings[el.dataset.key] ?? '';
  });
  widget.querySelectorAll('[data-key-placeholder]').forEach((el) => {
    el.placeholder = strings[el.dataset.keyPlaceholder] ?? '';
  });
  widget.querySelectorAll('[data-key-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', strings[el.dataset.keyAriaLabel] ?? '');
  });
}

/**
 * Shows/clears the inline field error, driven by native ValidityState (no hand-rolled regex).
 * @param {HTMLInputElement} input The email input
 * @param {Element} errorEl The inline error message element
 * @param {string} [message] Error message to show; omit to clear
 */
function setFieldError(input, errorEl, message) {
  if (message) {
    input.classList.add('error');
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    input.classList.remove('error');
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

/**
 * Submits the email address. Uses `widget.dataset.action` if set (real endpoint, wired later);
 * otherwise resolves a mock success, since no backend exists yet for this EDS site.
 * @param {Element} widget The widget root
 * @param {string} emailAddress The submitted email address
 * @returns {Promise<boolean>} Whether the submission succeeded
 */
async function submitEmail(widget, emailAddress) {
  const { action } = widget.dataset;
  if (!action) {
    await new Promise((resolve) => { setTimeout(resolve, 600); });
    return true;
  }
  try {
    const resp = await fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailAddress }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * @param {Element} widget The widget root
 */
export default async function decorate(widget) {
  const lang = widget.dataset.lang === 'fr' ? 'fr' : 'en';
  const allStrings = await loadStrings();
  const strings = allStrings[lang];
  applyStrings(widget, strings);
  decorateIcons(widget); // widget markup bypasses the page's decorateMain(), so icons need decorating here

  const form = widget.querySelector('.subscribe-form');
  const input = widget.querySelector('.subscribe-email');
  const errorEl = widget.querySelector('.subscribe-error');
  const failEl = widget.querySelector('.subscribe-fail');
  const submitBtn = widget.querySelector('.subscribe-submit');

  widget.dataset.stage = 'form';

  input.addEventListener('input', () => setFieldError(input, errorEl, ''));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    failEl.hidden = true;

    if (input.validity.valueMissing) {
      setFieldError(input, errorEl, strings.requiredError);
      return;
    }
    if (input.validity.typeMismatch) {
      setFieldError(input, errorEl, strings.invalidEmailError);
      return;
    }
    setFieldError(input, errorEl, '');

    submitBtn.disabled = true;
    const ok = await submitEmail(widget, input.value);
    submitBtn.disabled = false;

    if (ok) {
      widget.dataset.stage = 'success';
    } else {
      failEl.hidden = false;
    }
  });
}
