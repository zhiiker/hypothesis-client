'use strict';

const getApiUrl = require('../get-api-url');
const hostConfig = require('../host-config');
const postMessageJsonRpc = require('./postmessage-json-rpc');

/**
 * Fetch client configuration from an ancestor frame.
 *
 * @param {string} origin - The origin of the frame to fetch config from.
 * @param {Window} window_ - Test seam.
 * @return {Promise<any>}
 */
function fetchConfigFromAncestorFrame(origin, window_=window) {
  if (window_ === window_.top) {
    return Promise.reject(new Error('Client is top level frame'));
  }

  const configResponses = [];

  let ancestor = window_.parent;
  while (ancestor) {
    const timeout = 3000;
    const result = postMessageJsonRpc.call(
      ancestor, origin, 'requestConfig', timeout
    );
    configResponses.push(result);

    if (ancestor === window_.top) {
      break;
    }
    ancestor = ancestor.parent;
  }

  return Promise.race(configResponses).then((response) => {
    return response;
  }).catch(err => {
    console.warn(`Failed to retrieve configuration from ${origin}:`, err);
    console.warn('Hypothesis will use default configuration instead.');
    return {};
  });
}

/**
 * Merge client configuration from h service with config fetched from
 * embedding frame.
 *
 * Typically the configuration from the embedding frame is passed
 * synchronously in the query string. However it can also be retrieved from
 * an ancestor of the embedding frame. See tests for more details.
 *
 * @param {Object} clientSettings - Settings rendered into `app.html` by the
 *   h service.
 * @param {Window} window_ - Test seam.
 * @return {Promise<Object>} - The merged settings.
 */
function fetchConfig(clientSettings, window_=window) {
  const hostPageConfig = hostConfig(window_);

  let embedderConfig;
  if (hostPageConfig.requestConfigFromFrame) {
    const origin = hostPageConfig.requestConfigFromFrame;
    embedderConfig = fetchConfigFromAncestorFrame(origin, window_);
  } else {
    embedderConfig = Promise.resolve(hostPageConfig);
  }

  return embedderConfig.then(embedderConfig => {
    const settings = Object.assign({}, clientSettings, embedderConfig);
    settings.apiUrl = getApiUrl(settings);
    return settings;
  });
}

module.exports = {
  fetchConfig,
};
