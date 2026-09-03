import decorate from '../subscribe.js';

/** Distinct fragment from the English widget, but delegates to its decorate() forced to French. */
export default function decorateFr(widget) {
  widget.dataset.lang = 'fr';
  return decorate(widget);
}
