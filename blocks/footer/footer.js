import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { decorateExternalLinks } from '../../scripts/scripts.js';

/** Tags the footnotes' info row cells with semantic classes for footer.css to target. */
function decorateFootnotes(footer) {
  const info = footer.querySelector('.footer-info > div');
  if (!info) return;
  const [name, legal, social] = info.children;
  if (name) name.classList.add('footer-info-name');
  if (legal) legal.classList.add('footer-info-legal');
  if (social) social.classList.add('footer-info-social');
}

/** loads and decorates the footer */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  decorateFootnotes(footer);
  // only footnotes (legal + social) opens links in a new tab, matching source — category-links stays same-tab
  const footnotes = footer.querySelector('.footer-footnotes');
  if (footnotes) decorateExternalLinks(footnotes);

  block.append(footer);
}
