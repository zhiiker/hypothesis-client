'use strict';

/**
 * This module implements a basic RPC system for cross-frame communication
 * using `Window.postMessage`.
 *
 * The RPC messages use the JSON-RPC 2.0 format.
 * See https://www.jsonrpc.org/specification
 */

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

/** Error codes defined by the JSON-RPC spec. */
const errorCodes = {
  METHOD_NOT_FOUND: -32601,
  SERVER_ERROR: -32000,

  // Other standard error codes exist but are not used here.
};

/**
 * RPC server for cross-frame communication.
 */
class Server {
  /**
   * Create an RPC server with the given methods.
   *
   * @param {Object} methods - Map of method names to handler functions
   * @param {string[]} allowedOrigins - Origins that the server will accept
   *   requests from.
   * @param {Window} window_ - Test seam
   */
  constructor(methods, allowedOrigins, window_=window) {
    this.window_ = window_;
    this.handleMessage = event => {
      if (!allowedOrigins.includes(event.origin) ||
          !(event.data instanceof Object) ||
          event.data.jsonrpc !== '2.0' ||
          !event.data.method) {
        return;
      }

      const respond = (response) => {
        if (!event.data.id) {
          // No ID? No response.
          return;
        }
        response.id = event.data.id;
        response.jsonrpc = '2.0';
        event.source.postMessage(response, event.origin);
      };

      const handler = methods[event.data.method];

      if (!handler) {
        respond({ error: {
          code: errorCodes.METHOD_NOT_FOUND,
          message: 'Method not found',
        } });
        return;
      }

      try {
        const result = handler(event.data.params);
        respond({ result });
      } catch (err) {
        respond({ error: {
          code: errorCodes.SERVER_ERROR,
          message: err.message,
        } });
      }
    };
  }

  /** Begin listening for RPC requests. */
  listen() {
    this.window_.addEventListener('message', this.handleMessage);
  }

  /** Stop listening for RPC requests. */
  stop() {
    this.window_.removeEventListener('message', this.handleMessage);
  }
}

module.exports = {
  call,
  Server,
};
