import { getBlockId } from '../../scripts/scripts.js';
import { buildPictureContentFromImageCell } from '../../scripts/utils.js';

export default function decorate(block) {
  const blockId = getBlockId('herobanner');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `herobanner-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Hero Banner');

  const imageCell = block.querySelector(':scope > div:first-child > div');
  if (imageCell?.querySelector('picture')) {
    imageCell.replaceChildren(buildPictureContentFromImageCell(imageCell));
  }
}
