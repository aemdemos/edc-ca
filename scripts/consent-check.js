let consentedLoaded = false;

/**
 * OneTrust consent category that gates the consented scripts (Qualtrics
 * page-level feedback is a measurement/feedback tool → Performance Cookies).
 * EDC OneTrust categories: C0001 Strictly Necessary, C0002 Performance,
 * C0003 Functional, C0004 Advertising, C0005 Social Media.
 */
const REQUIRED_CONSENT_GROUP = 'C0002';

/**
 * OneTrust CMP loader (otSDKStub.js). Matches the source site's deployment:
 * the EDC domain-script id and document-language matching for locale.
 *
 * Loaded here (not in head.html) on purpose: scripts.js installs the Trusted
 * Types default policy that permits OneTrust's own script-URL injections. This
 * module runs after that policy exists, so loading OneTrust now avoids the
 * `require-trusted-types-for 'script'` block that occurs if the stub runs first.
 */
const ONETRUST_SRC = 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js';
const ONETRUST_DOMAIN_SCRIPT = '7b260088-30b2-4fe3-b3d6-d3c1abf7ab50';

function loadOneTrust() {
  if (document.querySelector(`script[src="${ONETRUST_SRC}"]`)) return;
  const script = document.createElement('script');
  script.src = ONETRUST_SRC;
  script.type = 'text/javascript';
  script.setAttribute('data-domain-script', ONETRUST_DOMAIN_SCRIPT);
  script.setAttribute('data-document-language', 'true');
  // fail securely: if the CMP can't load, consent stays declined and no
  // consented third parties are loaded.
  script.onerror = () => {
    // eslint-disable-next-line no-console
    console.warn('OneTrust CMP failed to load');
  };
  document.head.append(script);
}

/**
 * Reads consent from OneTrust.
 *
 * OneTrust (loaded by loadOneTrust above) exposes the granted category ids on
 * `window.OnetrustActiveGroups` (e.g. ",C0001,C0002,") and re-runs the
 * global `OptanonWrapper` callback whenever the visitor changes their choice.
 *
 * A `?consent=` query parameter still overrides OneTrust for local development
 * and testing, where the CMP may be unavailable or a specific state is needed:
 *   ?consent=accept   grant consent
 *   ?consent=decline  decline consent
 *
 * @returns {boolean} true if the user has consented to the required category
 */
function hasConsent() {
  const consent = new URLSearchParams(window.location.search).get('consent');
  if (consent !== null) {
    return ['accept', 'true', '1', 'yes'].includes(consent.toLowerCase());
  }
  const groups = window.OnetrustActiveGroups;
  if (typeof groups === 'string') {
    return groups.split(',').includes(REQUIRED_CONSENT_GROUP);
  }
  // OneTrust not ready / no decision yet: default to declined (fail secure)
  return false;
}

/**
 * Loads consented scripts once consent is available.
 */
function loadConsented() {
  if (consentedLoaded) return;
  consentedLoaded = true;
  import('./consented.js');
}

/**
 * Notifies listeners of the current consent state and loads consented
 * scripts if consent has been granted. Safe to call repeatedly — the event
 * fires on every consent change, but consented scripts load only once.
 */
function onConsentUpdate() {
  const consented = hasConsent();
  window.dispatchEvent(new CustomEvent('consent.update', { detail: { consented } }));
  if (consented) {
    loadConsented();
  }
}

// OneTrust invokes this global callback on load and on every consent change.
// Chain any pre-existing definition so we don't clobber other integrations.
const existingWrapper = typeof window.OptanonWrapper === 'function' ? window.OptanonWrapper : null;
window.OptanonWrapper = function OptanonWrapper(...args) {
  if (existingWrapper) existingWrapper.apply(this, args);
  onConsentUpdate();
};

// A `?consent=` query parameter fully overrides the CMP for local development
// and testing, so there's no need to load OneTrust in that case.
const hasConsentOverride = new URLSearchParams(window.location.search).get('consent') !== null;
if (!hasConsentOverride) {
  loadOneTrust();
}

// Evaluate immediately for the query-param override and for the case where
// OneTrust has already fired (or is absent) by the time this module runs.
onConsentUpdate();
