'use strict';

const { generateHexString } = require('./random');

function generateId() {
  return generateHexString(10);
}

/**
 * Make a JSON-RPC call to a server in another frame using `postMessage`.
 *
 * @param {Window} frame - Frame to send call to
 * @param {string} origin - Origin filter for `window.postMessage` call
 * @param {string} method - Name of the JSON-RPC method
 * @param {any[]} params - Parameters of the JSON-RPC method
 * @param [number] timeout - Maximum time to wait in ms
 * @param [Window] window_ - Test seam.
 * @param [id] id - Test seam.
 * @return {Promise<any>} - A Promise for the response to the call
 */
function call(frame, origin, method, params=[], timeout=2000,
                   window_=window, id=generateId()) {
  const message = {
    jsonrpc: '2.0',
    method,
    params,
    id,
  };

  try {
    frame.postMessage(message, origin);
  } catch (err) {
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    let didFinish = false;
    const listener = (event) => {
      if (didFinish) {
        return;
      }
      if (event.origin !== origin ||
          !(event.data instanceof Object) ||
          event.data.jsonrpc !== '2.0' ||
          event.data.id !== id) {
        return;
      }

      didFinish = true;

      if (typeof event.data.error !== 'undefined') {
        reject(event.data.error);
      } else {
        resolve(event.data.result);
      }

      window_.removeEventListener('message', listener);
    };
    setTimeout(() => {
      if (didFinish) {
        return;
      }
      didFinish = true;
      reject(new Error(`Request to ${origin} timed out`));
      window_.removeEventListener('message', listener);
    }, timeout);
    window_.addEventListener('message', listener);
  });
}

module.exports = {
  call,
};
