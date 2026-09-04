import { getBlockId } from '../../scripts/scripts.js';

/**
 * On-page navigation: an intro line ("In this article:") followed by a list of
 * anchor/jump links to sections on the same page.
 *
 * Authoring (da.live): a single cell containing an intro paragraph and a
 * bulleted list of links. Default has no icon; the `arrow` variant adds a
 * right-arrow before each link (the legacy `arrows` class is an alias).
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const blockId = getBlockId('onpagenavigation');
  block.setAttribute('id', blockId);
  block.setAttribute('role', 'navigation');
  block.setAttribute('aria-label', block.querySelector('p')?.textContent.trim() || 'On this page');
  block.setAttribute('aria-roledescription', 'On-page navigation');

  // Intro text: the paragraph(s) before the list.
  block.querySelectorAll('p').forEach((p) => p.classList.add('intro-text'));

  // Links list: reuse the authored <ul>, mark it for styling.
  const list = block.querySelector('ul');
  if (list) {
    list.classList.add('links-list');
    list.querySelectorAll('li a').forEach((a) => a.classList.add('link'));
  }
}
