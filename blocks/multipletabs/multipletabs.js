import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { buildPictureContentFromImageCell } from '../../scripts/utils.js';

/**
 * @param {Element} block
 * @param {Element} tablist
 */
function ensureTablistClickDelegation(block, tablist) {
  if (tablist.dataset.tabsClickDelegated === 'true') {
    return;
  }
  tablist.dataset.tabsClickDelegated = 'true';
  tablist.addEventListener('click', (e) => {
    const button = e.target.closest('button.tabs-tab');
    if (!button || !tablist.contains(button)) {
      return;
    }
    const panelId = button.getAttribute('aria-controls');
    if (!panelId) {
      return;
    }
    const tabpanel = document.getElementById(panelId);
    if (!tabpanel || !block.contains(tabpanel)) {
      return;
    }
    block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
      panel.setAttribute('aria-hidden', true);
    });
    tablist.querySelectorAll('button.tabs-tab').forEach((btn) => {
      btn.setAttribute('aria-selected', false);
    });
    tabpanel.setAttribute('aria-hidden', false);
    button.setAttribute('aria-selected', true);
  });
}

/**
 * Consolidates any image cell(s) in a tab panel row into a single &lt;picture&gt;
 * (art-direction if 2-5 images are authored) — see /docs/art-direction-images.md.
 * @param {Element} row
 */
function consolidatePanelImages(row) {
  [...row.children].forEach((cell) => {
    if (!cell.querySelector('picture')) return;
    cell.replaceChildren(buildPictureContentFromImageCell(cell));
  });
}

/**
 * @param {Element} row
 * @param {Element | null} tablist
 */
function isTabRowCandidate(row, tablist) {
  if (row === tablist || row.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }
  if (row.matches('.tabs-panel[role="tabpanel"]')) {
    return true;
  }
  return !!(row.firstElementChild && row.firstElementChild.children.length > 0);
}

/**
 * Ensures the block has a `.multipletabs-text` column (the first row) and a `.multipletabs-group`
 * wrapper holding the tab rows, folding in any rows UE inserted directly under the block since the
 * last sync (UE's authored resource tree doesn't know about this decoration-time wrapper).
 * @param {Element} block
 * @returns {Element} the `.multipletabs-group` wrapper
 */
function ensureMultipleTabsGroup(block) {
  let group = block.querySelector(':scope > .multipletabs-group');
  if (!group) {
    group = document.createElement('div');
    group.className = 'multipletabs-group';
  }

  let textCol = block.querySelector(':scope > .multipletabs-text');
  if (!textCol) {
    [textCol] = [...block.children].filter((c) => c !== group);
    textCol?.classList.add('multipletabs-text');
  }

  [...block.children].forEach((child) => {
    if (child !== textCol && child !== group) {
      group.append(child);
    }
  });

  if (textCol && block.firstElementChild !== textCol) {
    block.insertBefore(textCol, block.firstElementChild);
  }
  if (block.lastElementChild !== group) {
    block.append(group);
  }

  return group;
}

/**
 * Rebuilds tab buttons and panel ids/indexes when tab items are added or removed (e.g. in Universal
 * Editor). The block's first row is always the plain-text column and is left untouched.
 * @param {Element} block
 */
export function resyncMultipleTabsBlock(block) {
  const blockId = block.getAttribute('id');
  if (!blockId) {
    return;
  }

  const group = ensureMultipleTabsGroup(block);

  let tablist = group.querySelector(':scope > .tabs-list');
  if (!tablist) {
    tablist = document.createElement('div');
    tablist.className = 'tabs-list';
    tablist.setAttribute('role', 'tablist');
    tablist.id = `tablist-${blockId}`;
    group.prepend(tablist);
  }

  const openResource = group.querySelector('.tabs-panel[aria-hidden="false"]')?.getAttribute('data-aue-resource');

  const rows = [...group.children].filter((c) => isTabRowCandidate(c, tablist));
  const MAX_TAB_ITEMS = 200;
  if (rows.length > MAX_TAB_ITEMS) {
    return;
  }

  const existingButtons = [...tablist.children];
  if (existingButtons.length > rows.length) {
    tablist.replaceChildren(...existingButtons.slice(0, rows.length));
  } else if (existingButtons.length < rows.length) {
    const fragment = document.createDocumentFragment();
    const toAdd = rows.length - existingButtons.length;
    for (let b = 0; b < toAdd; b += 1) {
      const btn = document.createElement('button');
      btn.className = 'tabs-tab';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('type', 'button');
      fragment.append(btn);
    }
    tablist.append(fragment);
  }

  rows.forEach((row, i) => {
    const id = `tabpanel-${blockId}-tab-${i + 1}`;
    const buttonId = `tab-${id}`;

    const button = tablist.children[i];

    if (!row.matches('.tabs-panel[role="tabpanel"]')) {
      const tabCell = row.firstElementChild;
      if (!tabCell || !tabCell.children.length) {
        return;
      }
      const labelText = tabCell.textContent;
      tabCell.remove();

      row.className = 'tabs-panel';
      row.id = id;
      row.setAttribute('data-tab-index', String(i));
      row.setAttribute('aria-labelledby', buttonId);
      row.setAttribute('role', 'tabpanel');

      button.id = buttonId;
      button.textContent = labelText;
      button.setAttribute('aria-controls', id);
      button.setAttribute('aria-selected', 'false');

      if (button.firstElementChild) {
        moveInstrumentation(button.firstElementChild, null);
      }
    } else {
      row.className = 'tabs-panel';
      row.id = id;
      row.setAttribute('data-tab-index', String(i));
      row.setAttribute('aria-labelledby', buttonId);
      row.setAttribute('role', 'tabpanel');

      button.id = buttonId;
      button.setAttribute('aria-controls', id);
      button.setAttribute('aria-selected', 'false');
    }

    consolidatePanelImages(row);
  });

  let activeIdx = 0;
  if (openResource) {
    const idx = rows.findIndex((r) => r.getAttribute('data-aue-resource') === openResource);
    if (idx !== -1) {
      activeIdx = idx;
    }
  }

  rows.forEach((row, i) => {
    row.setAttribute('aria-hidden', String(i !== activeIdx));
  });
  tablist.querySelectorAll(':scope > button.tabs-tab').forEach((btn, i) => {
    btn.setAttribute('aria-selected', String(i === activeIdx));
  });

  ensureTablistClickDelegation(block, tablist);
}

export default async function decorate(block) {
  const blockId = getBlockId('multipletabs');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `multipletabs-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Multiple Tabs');

  resyncMultipleTabsBlock(block);
}
