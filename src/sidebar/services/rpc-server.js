'use strict';

/**
 * Service that listens for JSON-RPC requests from other frames.
 *
 * Only frames whose origin is in the rpcAllowedOrigins config setting will be
 * responded to.
 */
// @ngInject
function rpcServer(postMessageRpc, store, settings, $window) {
  function start() {
    const methods = {
      searchUris: store.searchUris,
    };
    const server = new postMessageRpc.Server(methods, settings.rpcAllowedOrigins || [], $window);
    server.listen();
  }

  return { start };
}

module.exports = rpcServer;
