const fs = require('fs');

const Mustache = require('mustache');

/**
 * Render the `embed.js` script which loads the Hypothesis client into a page.
 *
 * @param manifest - JSON manifest object mapping asset paths to relative or
 *                   absolute URLs. If the URLs are relative then they are
 *                   assumed to be relative to the URL that embed.js is
 *                   served from.
 */
function renderEmbedScript(manifest) {
  const embedTemplate =
    fs.readFileSync(require.resolve('./embed.js.mustache')).toString();

  const resourceURLs = [
    'scripts/polyfills.bundle.js',
    'scripts/jquery.bundle.js',
    'scripts/injector.bundle.js',

    'styles/icomoon.css',
    'styles/inject.css',
    'styles/pdfjs-overrides.css',
  ].map(path => ({url: manifest[path]}));

  // A random string that is very unlikely to occur in other scripts on the
  // page. Used in a `document.currentScript` polyfill.
  const topSecretTag = 'H:' + Array(10).fill(0).map(_ =>
      Math.round(Math.random() * 255).toString(16)).join('');

  const context = {
    resourceURLs,
    topSecretTag, 
  };

  return Mustache.render(embedTemplate, context);
}

module.exports = renderEmbedScript;

