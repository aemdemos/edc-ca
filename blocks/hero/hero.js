import { getBlockId } from '../../scripts/scripts.js';
import { buildPictureContentFromImageCell } from '../../scripts/utils.js';

export default function decorate(block) {
  const blockId = getBlockId('hero');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `hero-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Hero');

  // Image field's cell may hold 1 image (standard) or 2-5 (art-direction) — see
  // /docs/art-direction-images.md. Consolidates it into one <picture> either way,
  // which the block's CSS then positions as a full-bleed background.
  const imageCell = block.querySelector(':scope > div:first-child > div');
  if (imageCell?.querySelector('picture')) {
    imageCell.replaceChildren(buildPictureContentFromImageCell(imageCell));
  }
}
