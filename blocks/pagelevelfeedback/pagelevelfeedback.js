/*
 * Page Level Feedback Block
 * Provides the container that a third-party Qualtrics site-intercept targets to
 * inject an embedded "page feedback" survey. Authored once as a fragment and
 * referenced across templates (EN/FR).
 *
 * This block only establishes the structure the intercept expects — the fixed
 * `#idPageLevelFeedback` target and the `c-page-level-feedback` hook. It does NOT
 * load the Qualtrics site-intercept and does NOT instrument analytics; until the
 * loader is wired up separately, the container renders empty.
 */

const FEEDBACK_TARGET_ID = 'idPageLevelFeedback';

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
}
