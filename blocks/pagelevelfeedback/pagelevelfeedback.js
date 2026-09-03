/*
 * Page Level Feedback Block
 * Provides the container that the EDC Qualtrics site-intercept targets to inject
 * an embedded "Was this page helpful?" Yes/No (Oui/Non) survey. Authored once as
 * a fragment and referenced across templates (EN/FR).
 *
 * Like the source component, this block only establishes the DOM the intercept
 * looks for — the `cmp-pageLevelFeedback` / `c-page-level-feedback` hooks and the
 * fixed `#idPageLevelFeedback` target. It does NOT load Qualtrics itself: on the
 * source site the Site Intercept zone script is injected site-wide by the
 * (consent-gated) tag manager, mirrored here in `scripts/consented.js`. All survey
 * markup is injected and controlled at runtime by the Qualtrics project.
 */

const FEEDBACK_TARGET_ID = 'idPageLevelFeedback';

/**
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // Mirror the source component's DOM signature exactly:
  // <div class="cmp-pageLevelFeedback c-page-level-feedback"
  //      data-event-component="pagelevelfeedback" data-edc-script="true">
  block.classList.add('cmp-pageLevelFeedback', 'c-page-level-feedback');
  block.dataset.eventComponent = 'pagelevelfeedback';
  block.dataset.edcScript = 'true';

  // ensure the fixed-id target the intercept fills in exists exactly once
  let target = block.querySelector(`#${FEEDBACK_TARGET_ID}`);
  if (!target) {
    block.innerHTML = '';
    target = document.createElement('div');
    target.id = FEEDBACK_TARGET_ID;
    block.append(target);
  }
}
