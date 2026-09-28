/*
 * Where the website reads live products and blog posts from (the CompleteBytePOS backend).
 * - Local preview: the Django dev server on port 8000.
 * - Production: set apiBase to the backend's public address, e.g. "https://pos.omuwenga.co.ke".
 *   Leave it empty when the backend is served from the same domain under /api/.
 */
(function () {
  var local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  window.OMUWENGA_CONFIG = {
    apiBase: local ? 'http://127.0.0.1:8000' : '',
    siteUrl: 'https://example.co.ke',
  };
})();
