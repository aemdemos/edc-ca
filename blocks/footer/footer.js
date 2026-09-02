import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { decorateExternalLinks } from '../../scripts/scripts.js';

/**
 * Tags the footnotes' info row cells (company name, legal links, social links) with
 * semantic classes, so footer.css can target them directly instead of relying on
 * cell position (nth-child/last-child), which breaks silently if authors reorder content.
 * @param {Element} footer The decorated footer content root
 */
function decorateFootnotes(footer) {
  const info = footer.querySelector('.footer-info > div');
  if (!info) return;
  const [name, legal, social] = info.children;
  if (name) name.classList.add('footer-info-name');
  if (legal) legal.classList.add('footer-info-legal');
  if (social) social.classList.add('footer-info-social');
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  decorateFootnotes(footer);
  // only the footnotes bar (legal + social links) opens links in a new tab, matching
  // source — the category-links nav keeps its links in the same tab
  const footnotes = footer.querySelector('.footer-footnotes');
  if (footnotes) decorateExternalLinks(footnotes);

  block.append(footer);
}
