import { getBlockId } from '../../scripts/scripts.js';

export default function decorate(block) {
  const blockId = getBlockId('overviewtext');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `overviewtext-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Overview Text');

  block.querySelector('h1, h2, h3, h4, h5, h6')?.classList.add('overviewtext-title');
  block.querySelectorAll('p').forEach((p) => p.classList.add('overviewtext-text'));
}
