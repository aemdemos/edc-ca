/*
 * Page Level Feedback Block
 * Provides the container that the EDC Qualtrics site-intercept targets to inject
 * an embedded "Was this page helpful? Yes/No" (Oui/Non) survey. Authored once as
 * a fragment and referenced across templates (EN/FR).
 *
 * The block establishes the `#idPageLevelFeedback` target and the
 * `c-page-level-feedback` hook, then loads the Qualtrics Site Intercept engine.
 * All survey markup (the Yes/No buttons, prompts, thank-you state) is injected
 * and fully controlled at runtime by the Qualtrics project — this block does not
 * author any of that copy. Loading is consent-gated: the intercept is only
 * requested once the visitor has granted consent, matching the source site.
 */

import { loadScript } from '../../scripts/aem.js';

const FEEDBACK_TARGET_ID = 'idPageLevelFeedback';

// EDC Qualtrics Site Intercept deployment (brand: exportdevcanada, zone: ZN_0B7cPY8BSsWV2zr).
// Loading the zone's SIE bootstrap lets Qualtrics scan the page and inject the
// embedded feedback survey. Kept as a constant so it can be swapped per environment.
const QUALTRICS_INTERCEPT_SRC = 'https://zn0b7cpy8bsswv2zr-exportdevcanada.siteintercept.qualtrics.com/SIE/?Q_ZID=ZN_0B7cPY8BSsWV2zr';

let interceptRequested = false;

/**
 * Loads the Qualtrics Site Intercept engine once. Safe to call multiple times.
 */
async function loadQualtricsIntercept() {
  if (interceptRequested) return;
  interceptRequested = true;
  try {
    await loadScript(QUALTRICS_INTERCEPT_SRC, { defer: '' });
  } catch (error) {
    // fail securely: a blocked/unreachable third party must not break the page
    // eslint-disable-next-line no-console
    console.warn('pagelevelfeedback: Qualtrics site-intercept failed to load', error);
  }
}

/**
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // styling/intercept hook mirrored from the source component
  block.classList.add('c-page-level-feedback');
  block.dataset.eventComponent = 'pagelevelfeedback';

  // ensure the fixed-id target the intercept fills in exists exactly once
  let target = block.querySelector(`#${FEEDBACK_TARGET_ID}`);
  if (!target) {
    block.innerHTML = '';
    target = document.createElement('div');
    target.id = FEEDBACK_TARGET_ID;
    block.append(target);
  }

  // Consent-gated load. consent-check.js dispatches `consent.update` with the
  // current state; load the intercept as soon as consent is granted.
  window.addEventListener('consent.update', (e) => {
    if (e.detail?.consented) loadQualtricsIntercept();
  });
}
