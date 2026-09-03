import { moveInstrumentation, getBlockId, decorateExternalLinks } from '../../scripts/scripts.js';
import { buildPictureContentFromImageCell } from '../../scripts/utils.js';

/*
 * Fixed rows: 0 title, 1 subtitle, 2 phone, 3 CTA text, 4 employee image,
 * 5 employee name (optional), 6 employee title (optional).
 * Rows 5-6 can only be omitted from the end; to skip name but keep title,
 * leave row 5's cell blank rather than deleting the row.
 * Adds schema.org microdata (Organization/Person/telephone) from the plain
 * authored fields.
 */

function cellText(row) {
  const cell = row?.firstElementChild;
  const text = cell?.textContent?.trim();
  return text ? { cell, text } : null;
}

// title: reuse an authored heading's inline content, else plain text
function buildTitle(block, blockId, titleRow) {
  if (!titleRow?.firstElementChild) return null;
  const cell = titleRow.firstElementChild;
  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  const h2 = document.createElement('h2');
  h2.id = `${blockId}-heading`;
  moveInstrumentation(titleRow, h2);
  if (heading) h2.append(...heading.childNodes);
  else h2.textContent = cell.textContent.trim();
  block.setAttribute('aria-labelledby', h2.id);
  return h2;
}

// subtitle: authored paragraph, left as-is
function buildSubtitle(subtitleRow) {
  if (!subtitleRow?.firstElementChild) return null;
  const cell = subtitleRow.firstElementChild;
  cell.classList.add('contactinfo-subtitle');
  moveInstrumentation(subtitleRow, cell);
  return cell;
}

// phone: build the tel: link + telephone microdata around the authored number
function buildPhone(phoneRow) {
  const phone = cellText(phoneRow);
  if (!phone) return null;
  const { cell, text } = phone;
  cell.classList.add('contactinfo-phone');
  moveInstrumentation(phoneRow, cell);
  cell.textContent = '';
  const span = document.createElement('span');
  span.setAttribute('itemprop', 'telephone');
  // content attribute matches the live EDC site's markup verbatim (issue #24)
  span.setAttribute('content', text);
  const a = document.createElement('a');
  a.href = `tel:${text.replace(/[^\d+]/g, '')}`;
  a.textContent = text;
  span.append(a);
  cell.append(span);
  return cell;
}

// CTA paragraph: plain inline link authored as-is, no button styling
function buildCta(ctaRow) {
  if (!ctaRow?.firstElementChild) return null;
  const cell = ctaRow.firstElementChild;
  cell.classList.add('contactinfo-cta');
  moveInstrumentation(ctaRow, cell);
  // sitewide new-tab treatment (target/rel + the ::after icon) for external links
  decorateExternalLinks(cell);
  return cell;
}

// employee photo: converts the authored image into an optimized picture + Person.image
function buildPersonImage(imageRow, name) {
  const imageCell = imageRow?.firstElementChild;
  if (!imageCell?.querySelector('picture, img')) return null;
  imageCell.classList.add('contactinfo-person-image');
  moveInstrumentation(imageRow, imageCell);
  imageCell.replaceChildren(buildPictureContentFromImageCell(imageCell));
  const img = imageCell.querySelector('img');
  if (img) {
    // meaningful alt when we have a name, else decorative (matches source's alt="")
    img.alt = name ? name.text : '';
    img.setAttribute('itemprop', 'image');
  }
  return imageCell;
}

// employee name/title: only rendered when authored, carrying Person.name/jobTitle
function buildPersonField(row, className, itemprop) {
  const field = cellText(row);
  if (!field) return null;
  const { cell, text } = field;
  cell.classList.add(className);
  cell.setAttribute('itemprop', itemprop);
  cell.textContent = text;
  moveInstrumentation(row, cell);
  return cell;
}

function buildPersonColumn(imageRow, nameRow, jobTitleRow) {
  const name = cellText(nameRow);
  const image = buildPersonImage(imageRow, name);
  const nameEl = buildPersonField(nameRow, 'contactinfo-person-name', 'name');
  const jobTitleEl = buildPersonField(jobTitleRow, 'contactinfo-person-title', 'jobTitle');
  if (!image && !nameEl && !jobTitleEl) return null;

  const personCol = document.createElement('div');
  personCol.className = 'contactinfo-person';
  personCol.setAttribute('itemscope', '');
  personCol.setAttribute('itemtype', 'https://schema.org/Person');
  personCol.setAttribute('itemprop', 'employee');
  [image, nameEl, jobTitleEl].forEach((el) => { if (el) personCol.append(el); });
  return personCol;
}

export default function decorate(block) {
  const blockId = getBlockId('contactinfo');
  block.id = blockId;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Contact information');
  block.setAttribute('itemscope', '');
  block.setAttribute('itemtype', 'https://schema.org/Organization');

  const [
    titleRow, subtitleRow, phoneRow, ctaRow, imageRow, nameRow, jobTitleRow,
  ] = [...block.children];

  const textCol = document.createElement('div');
  textCol.className = 'contactinfo-text';
  [
    buildTitle(block, blockId, titleRow),
    buildSubtitle(subtitleRow),
    buildPhone(phoneRow),
    buildCta(ctaRow),
  ].forEach((el) => { if (el) textCol.append(el); });

  const personCol = buildPersonColumn(imageRow, nameRow, jobTitleRow);

  block.textContent = '';
  block.append(textCol);
  if (personCol) block.append(personCol);
}
