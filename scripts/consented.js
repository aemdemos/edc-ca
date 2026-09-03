// add functionality that requires user consent here (analytics, martech, etc.)

/*
 * Qualtrics Site Intercept (page-level feedback survey)
 * On the source site this zone script is injected site-wide by the tag manager
 * (Adobe Launch) once consent is granted; Qualtrics then scans each page and
 * injects its embedded "Was this page helpful?" survey wherever its own project
 * targeting matches (pages carrying the pagelevelfeedback component, which
 * exposes the `#idPageLevelFeedback` target). We mirror that here: load the zone
 * script globally from the consent-gated entry point rather than from the block.
 *
 * EDC deployment — brand: exportdevcanada, zone: ZN_0B7cPY8BSsWV2zr.
 */
const QUALTRICS_INTERCEPT_SRC = 'https://zn0b7cpy8bsswv2zr-exportdevcanada.siteintercept.qualtrics.com/SIE/?Q_ZID=ZN_0B7cPY8BSsWV2zr';

(function loadQualtricsIntercept() {
  if (document.querySelector(`script[src="${QUALTRICS_INTERCEPT_SRC}"]`)) return;
  const script = document.createElement('script');
  script.src = QUALTRICS_INTERCEPT_SRC;
  script.defer = true;
  // fail securely: a blocked/unreachable third party must not break the page
  script.onerror = () => {
    // eslint-disable-next-line no-console
    console.warn('Qualtrics site-intercept failed to load');
  };
  document.head.append(script);
}());
