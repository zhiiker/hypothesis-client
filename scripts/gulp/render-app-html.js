const fs = require('fs');

const Mustache = require('mustache');

/**
 * Render the `app.html` file for the sidebar application.
 *
 * @param manifest - The JSON manifest mapping asset paths to URLs
 * @param appConfig - Config object specifying endpoint URLs and other settings
 */
function renderAppHTML(manifest, appConfig) {
  const appTemplate =
    fs.readFileSync(require.resolve('./app.html.mustache')).toString();

  const appCSSURLs = [
    'styles/angular-csp.css',
    'styles/angular-toastr.css',
    'styles/katex.min.css',

    'styles/app.css',
    'styles/icomoon.css',
  ].map(path => ({url: manifest[path]}));

  const appJSURLs = [
    'scripts/angular.bundle.js',
    'scripts/katex.bundle.js',
    'scripts/polyfills.bundle.js',
    'scripts/raven.bundle.js',
    'scripts/showdown.bundle.js',
    'scripts/unorm.bundle.js',

    'scripts/app.bundle.js',
  ].map(path => ({url: manifest[path]}));
  
  const metaAttrs = [];
  const linkTags = [];
  const gaTracking = process.env.H_GA_TRACKING_ID ? {
    id: process.env.H_GA_TRACKING_ID,
    domain: 'auto',
  } : null;

  const context = {
    appConfig: JSON.stringify(appConfig, null, 2),
    appCSSURLs,
    appJSURLs,
    metaAttrs,
    linkTags,
    gaTracking,
  };

  return Mustache.render(appTemplate, context);
};

module.exports = renderAppHTML;
