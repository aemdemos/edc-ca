import { getBlockId } from '../../scripts/scripts.js';

export default function decorate(block) {
  const blockId = getBlockId('overviewtext');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `overviewtext-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Overview Text');

  const [titleRow, textRow] = [...block.children];
  titleRow?.firstElementChild?.classList.add('overviewtext-title');
  textRow?.firstElementChild?.classList.add('overviewtext-text');
}
