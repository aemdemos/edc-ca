# Art-Direction Images

Lets authors provide **multiple images in the same cell** so each screen breakpoint shows a different, purpose-cropped image ("art direction") instead of one image simply scaled up or down. Implemented once in `scripts/utils.js` and used by `hero`, `columns`, `tabs`, `accordion`, and `carousel`; section backgrounds use the same underlying picture builders via a separate, non-cell-based path in `scripts/feature-flags/sections.js` (see [1.5](#15-section-backgrounds)).

---

## 1. Authoring

### 1.1 Basic idea

Normally an image cell contains a single picture, and it is shown at every breakpoint (just resized). To art-direct instead, place **2 to 5 images in the same cell**, in order from the **largest breakpoint (desktop) down to the smallest (mobile)**. Each image is shown only at its own breakpoint and up, so you can crop or choose a different asset per screen size.

### 1.2 How many images

| Images in the cell | Result |
|---|---|
| 0 | Cell content is left exactly as authored — no picture is built. |
| 1 | Standard single responsive image, shown at every breakpoint. |
| 2–5 | Art-direction: each image activates at its own breakpoint (see below). |
| More than 5 | Only the first 5 (in document order — the 5 largest) are used — remove extra images if you need fewer breakpoints. |

### 1.3 Order = breakpoint (widescreen → mobile)

Images are read in the order they appear in the cell. The **first** image is the largest/desktop image; each image after it takes over at a progressively smaller breakpoint, and the **last** image is the mobile/base fallback:

| Order authored | Applies from | Suggested use |
|---|---|---|
| 1st | 1200px and up | desktop |
| 2nd | 992px and up | small desktop |
| 3rd | 768px and up | tablet |
| 4th | 576px and up | large phone |
| 5th | base (no minimum — mobile default) | phone |

For fewer than 5 images, drop rows from the bottom of the table above — e.g. with 3 images: 1st = 992px and up, 2nd = 768px and up, 3rd = base/mobile.

### 1.4 Linking the image(s)

If the **first** image (the largest/desktop one) is wrapped in a link (select the image and add a hyperlink), that same link wraps the whole combined picture, so it stays clickable at every breakpoint. Links on later images, if present, are ignored — only the first image's link is used.

### 1.5 Section backgrounds

Section backgrounds don't use a single multi-image cell — instead, add up to 5 fields to the section's metadata table: `Background Image`, `Background Image 2`, `Background Image 3`, `Background Image 4`, `Background Image 5`, each pointing at one image (via a link) in the **same largest → smallest order** as [1.3](#13-order--breakpoint-widescreen--mobile). One image behaves like [1.2](#12-how-many-images)'s single-image case; 2–5 art-direct the same way. `Background Color`/`Background` still work independently and can be combined with an image.

### 1.6 Where this is available

- **Image cells** (largest → smallest in one cell): `hero`, `columns`, `tabs` (per tab panel), `accordion` (per item body), `carousel` (per slide's image column).
- **Section backgrounds**: any section, via the metadata fields in [1.5](#15-section-backgrounds).

---

## 2. Developer

### 2.1 Where the code lives

Exported from `scripts/utils.js`:

| Export | Purpose |
|--------|---------|
| `buildPictureContentFromImageCell(cell, options)` | Main entry point for cell-based callers — returns a `DocumentFragment` to replace a cell's contents |
| `collectBlockCellImageSources(cell)` | Walks a cell and collects up to 5 `{ src, alt, link }` entries in document order |
| `createArtDirectionPicture(sources, eager)` | Builds one `<picture>` with a `<source media="...">` per breakpoint |
| `DEFAULT_BLOCK_SINGLE_PICTURE_BREAKPOINTS` | Breakpoints used for the single-image case |

Section backgrounds (`applySectionBackgroundDecorations` in `scripts/feature-flags/sections.js`) don't have a cell to walk — the section-metadata fields are plain URLs — so that path builds its `sources` array directly from `Background Image` … `Background Image 5` and calls `createOptimizedPicture` (from `scripts/aem.js`) or `createArtDirectionPicture` itself, skipping `collectBlockCellImageSources`/`buildPictureContentFromImageCell` entirely.

### 2.2 How it works

`collectBlockCellImageSources` recursively walks the cell's descendants in document order and collects up to `MAX_BLOCK_CELL_IMAGES` (5) images, matching either a `<picture>` (using its `<img>`) or a bare `<img>` not already inside a `<picture>`. For the **first** matched image only (the largest/desktop one, per the authoring order above), it also walks up the ancestor chain (stopping at the cell) looking for a wrapping `<a href>`; links wrapping any later image are not recorded.

`buildPictureContentFromImageCell` then branches on the number of sources found:

- **0** — the cell's original child nodes are returned unchanged.
- **1** — `createOptimizedPicture` builds a standard responsive picture using `DEFAULT_BLOCK_SINGLE_PICTURE_BREAKPOINTS` (`(min-width: 600px)` → width 2000, else width 750).
- **2–5** — `createArtDirectionPicture` builds one `<picture>` with a `<source media="...">` per image (largest breakpoint first, so the browser picks the first matching source), plus a fallback `<img>` for the last/base image. Internally it reverses the authored (largest → smallest) order once so the smallest-first breakpoint math below stays simple; callers never need to think about this.

If the first source has a captured link, the resulting `<picture>` is wrapped in a clone of that `<a>` (preserving attributes like `target`/`rel`), so a single `<a>` surrounds the whole responsive image.

Breakpoint/width mapping used by `createArtDirectionPicture` (see `getArtDirectionSourceMeta`) — widths are stepped up a tier from their breakpoint to stay crisp on the CDN rather than matching the viewport 1:1:

| Order authored | `media` | CDN `width` |
|---|---|---|
| 1st | `(min-width: 1200px)` | 2000 |
| 2nd | `(min-width: 992px)` | 1200 |
| 3rd | `(min-width: 768px)` | 992 |
| 4th | `(min-width: 576px)` | 768 |
| 5th | *(none — fallback `<img>`)* | 750 |

### 2.3 How to use it in a block

```javascript
import { buildPictureContentFromImageCell } from '../../scripts/utils.js';

const built = buildPictureContentFromImageCell(cell);
cell.replaceChildren(built);
```

`options` (all optional): `eagerSingle` (default `true`), `eagerArtDirection` (default `false`), `singlePictureBreakpoints` (default `DEFAULT_BLOCK_SINGLE_PICTURE_BREAKPOINTS`).

### 2.4 Reference implementations

| Block | Image cell(s) | Notes |
|---|---|---|
| `hero` (`blocks/hero/hero.js`) | The `image` field's cell | `_hero.json`'s `image` field is `"multi": true` so authors can add 2–5 images; the built picture is positioned full-bleed by `hero.css`. |
| `columns` (`blocks/columns/columns.js`) | Any column containing a `<picture>` | Runs after `decorateCellClass`; a column left with only the picture also gets `columns-img-col`. |
| `tabs` (`blocks/tabs/tabs.js`) | Any cell in a tab panel row containing a `<picture>` | Runs in `resyncTabsBlock`, so it re-applies on every Universal Editor resync, not just first load. |
| `accordion` (`blocks/accordion/accordion.js`) | The item's body cell | Only runs if the body contains a `<picture>`; text-only bodies are untouched. |
| `carousel` (`blocks/carousel/carousel.js`) | Each slide's first (image) column | Uses `moveInstrumentation` to carry Universal Editor click-to-edit from the original `<img>` to the rebuilt one. |
| Section backgrounds (`scripts/feature-flags/sections.js`) | N/A — URLs from metadata fields, not a cell | See [2.1](#21-where-the-code-lives)'s note on `applySectionBackgroundDecorations`. |

All five block integrations use the same guard: skip the cell entirely if it has no `<picture>`, so blocks with text-only content are left alone.

### 2.5 Compatibility

Works with any cell whose images are nested arbitrarily deep (bare `<picture>`/`<img>`, or wrapped in `<p>`, `<a>`, etc.) — `collectBlockCellImageSources` walks the full subtree. It also undoes a `wrapTextNodes` (aem.js) forced wrap, so a leading `<blockquote>` or similar in the cell doesn't hide an image run one level too deep. It makes no assumptions about surrounding text content and is safe to call on cells with no images.
