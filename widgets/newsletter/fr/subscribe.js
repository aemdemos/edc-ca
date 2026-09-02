import decorate from '../subscribe.js';

/**
 * French subscribe widget. A distinct fragment (own HTML/CSS/JS files) rather than the
 * English widget invoked with `?lang=fr`, so `/fr/footer` links to a fully independent
 * fragment — but it forces the shared decorate() into French rather than duplicating its
 * logic, since the only difference is which locale's strings from subscribe.json apply.
 * @param {Element} widget The widget root
 */
export default function decorateFr(widget) {
  widget.dataset.lang = 'fr';
  return decorate(widget);
}
