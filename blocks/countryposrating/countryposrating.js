/*
 * Country Position Rating Block
 * Two-column panel: the EDC market position (with status gauge icon) on the left,
 * and how that position is determined on the right. Authored once as a fragment and
 * referenced across country detail pages.
 */

/**
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const [row] = block.children;
  if (!row) return;

  const [positionCell, determinationCell] = [...row.children];

  // left column: EDC position + status gauge icon
  // (the gauge is authored as an EDS icon token and rendered by decorateIcons in scripts.js)
  if (positionCell) {
    positionCell.classList.add('position');
  }

  // right column: how the position is determined
  if (determinationCell) {
    determinationCell.classList.add('determination');
  }
}
