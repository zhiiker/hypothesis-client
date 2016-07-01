/**
 * Generate a config object for the sidebar app.
 *
 * Reads configuration settings from the environment and package.json files and
 * returns a config object which can be included in `app.html` to tell the
 * client which endpoints to connect to.
 */
module.exports = (env = process.env) => {
  const release = require('../../package.json').version;

  let serviceUrl;
  let apiUrl;
  let websocketUrl;

  if (!env.H_SERVICE_URL) {
    serviceUrl = 'https://hypothes.is/';
    apiUrl = 'https://hypothes.is/api/';
    websocketUrl = 'wss://hypothes.is/ws';
  } else if (env.H_SERVICE_URL === 'dev') {
    serviceUrl = 'http://localhost:5000/';
    apiUrl = 'http://localhost:5000/api/';
    websocketUrl = 'ws://localhost:5001/ws';
  } else {
    serviceUrl = env.H_SERVICE_URL;
    apiUrl = env.H_API_URL;
    websocketUrl = env.H_WEBSOCKET_URL;
  }

  return {
    release,
    apiUrl,
    serviceUrl,
    websocketUrl,
    raven: env.H_RAVEN_DSN ? {
      dsn: env.H_RAVEN_DSN,
      release,
    } : null,
  };
};
