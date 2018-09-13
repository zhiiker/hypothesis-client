'use strict';

const rpcServer = require('../rpc-server');

describe('sidebar.services.rpc-server', () => {
  let fakePostMessageRpc;
  let fakeServer;
  let fakeStore;
  let fakeWindow;
  let settings;
  let server;

  beforeEach(() => {
    fakeStore = {
      searchUris: sinon.stub().returns('THE_SEARCH_URIS'),
    };

    settings = {
      rpcAllowedOrigins: ['https://allowed1.com', 'https://allowed2.com'],
    };

    fakeWindow = {};

    fakeServer = {
      listen: sinon.stub(),
    };

    fakePostMessageRpc = {
      Server: sinon.stub().returns(fakeServer),
    };

    server = rpcServer(fakePostMessageRpc, fakeStore, settings, fakeWindow);
  });

  it('starts a server', () => {
    server.start();

    assert.calledWith(
      fakePostMessageRpc.Server, sinon.match.any, settings.rpcAllowedOrigins, fakeWindow
    );
    assert.called(fakeServer.listen);
  });

  it('responds to "searchUris" method', () => {
    server.start();

    const methods = fakePostMessageRpc.Server.getCall(0).args[0];
    const handler = methods.searchUris;
    assert.equal(handler(), fakeStore.searchUris());
  });
});
