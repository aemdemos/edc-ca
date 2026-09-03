import { getMetadata } from '../../scripts/aem.js';
import { getBlockId } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

function getDirectTextContent(menuItem) {
  const menuLink = menuItem.querySelector(':scope > :where(a,p)');
  if (menuLink) {
    return menuLink.textContent.trim();
  }
  return Array.from(menuItem.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join(' ');
}

const MAX_BREADCRUMB_DEPTH = 20;

function buildBreadcrumbsFromNavTree(navSections, homeUrl, currentUrl) {
  const crumbs = [];

  let menuItem = Array.from(navSections.querySelectorAll('a')).find((a) => a.href === currentUrl);
  if (menuItem) {
    let depth = 0;
    do {
      const link = menuItem.querySelector(':scope > a');
      crumbs.unshift({ title: getDirectTextContent(menuItem), url: link ? link.href : null });
      menuItem = menuItem.closest('ul')?.closest('li');
      depth += 1;
    } while (menuItem && depth < MAX_BREADCRUMB_DEPTH);
  } else if (currentUrl !== homeUrl) {
    crumbs.unshift({ title: getMetadata('og:title'), url: currentUrl });
  }

  crumbs.unshift({ title: 'Home', url: homeUrl });

  // last link is current page and should not be linked
  if (crumbs.length > 1) {
    crumbs.at(-1).url = null;
  }
  crumbs.at(-1)['aria-current'] = 'page';
  return crumbs;
}

function buildBreadcrumbsList(crumbs) {
  const ol = document.createElement('ol');
  ol.append(...crumbs.map((item) => {
    const li = document.createElement('li');
    if (item['aria-current']) li.setAttribute('aria-current', item['aria-current']);
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title;
      li.append(a);
    } else {
      li.textContent = item.title;
    }
    return li;
  }));
  return ol;
}

export default async function decorate(block) {
  block.textContent = '';

  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  const [navBrand, navSections] = fragment ? fragment.children : [];
  if (!navSections) return;

  const homeUrl = navBrand?.querySelector('a[href]')?.href || window.location.origin;
  const crumbs = buildBreadcrumbsFromNavTree(navSections, homeUrl, document.location.href);

  const blockId = getBlockId('breadcrumbs');
  block.setAttribute('id', blockId);
  block.setAttribute('role', 'navigation');
  block.setAttribute('aria-label', 'Breadcrumb');
  block.append(buildBreadcrumbsList(crumbs));
}
