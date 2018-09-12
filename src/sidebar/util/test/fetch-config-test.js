'use strict';

const proxyquire = require('proxyquire');

describe('sidebar.util.fetch-config', () => {
  let fetchConfig;
  let fakeHostConfig;
  let fakeJsonRpc;
  let fakeWindow;

  beforeEach(() => {
    fakeHostConfig = sinon.stub();
    fakeJsonRpc = {
      call: sinon.stub(),
    };
    const patched = proxyquire('../fetch-config', {
      '../host-config': fakeHostConfig,
      './postmessage-json-rpc': fakeJsonRpc,
    });
    fetchConfig = patched.fetchConfig;

    // By default, embedder provides no custom config.
    fakeHostConfig.returns({});

    // By default, fetching config from parent frames fails.
    fakeJsonRpc.call.throws(new Error('call() response not set'));

    // `fakeWindow` is the sidebar app's `window`.
    fakeWindow = {
      // The parent is the embedder (eg. a PDF or document viewer).
      // Usually this is the top level window.
      parent: {
        // In the context of the LMS app or a web page with an embedded document
        // viewer, _that_ viewer will be the top level window.
        parent: {
          parent: null, // This gets replaced below.
        },
      },
    };
    fakeWindow.top = fakeWindow.parent.parent;
    fakeWindow.top.parent = fakeWindow.top;
  });

  describe('fetchConfig', () => {
    // By default, combine the settings rendered into the sidebar's HTML page
    // by h with the settings from `window.hypothesisConfig` in the parent
    // window.
    it('reads config from sidebar URL query string', () => {
      fakeHostConfig
        .withArgs(fakeWindow)
        .returns({ apiUrl: 'https://dev.hypothes.is/api/' });

      return fetchConfig({}, fakeWindow).then(config => {
        assert.deepEqual(config, { apiUrl: 'https://dev.hypothes.is/api/' });
      });
    });

    it('merges config from sidebar HTML app and embedder', () => {
      const apiUrl = 'https://dev.hypothes.is/api/';
      fakeHostConfig.returns({
        appType: 'via',
      });

      return fetchConfig({ apiUrl }, fakeWindow).then(config => {
        assert.deepEqual(config, { apiUrl, appType: 'via' });
      });
    });

    // By default, don't try to fetch settings from parent frames via
    // `postMessage` requests.
    it('does not fetch settings from ancestor frames by default', () => {
      return fetchConfig({}, fakeWindow).then(() => {
        assert.notCalled(fakeJsonRpc.call);
      });
    });

    // In scenarios like LMS integrations, the client is annotating a document
    // inside an iframe and the client needs to retrieve configuration securely
    // from the top-level window without that configuration being exposed to the
    // document itself.
    //
    // This config fetching is enabled by a setting in the host page.
    context('when fetching config from an ancestor frame is enabled', () => {
      const expectedTimeout = 3000;

      beforeEach(() => {
        fakeHostConfig.returns({
          requestConfigFromFrame: 'https://embedder.com',
        });
        sinon.stub(console, 'warn');
      });

      afterEach(() => {
        console.warn.restore();
      });

      it('fetches config from ancestor frames', () => {
        fakeJsonRpc.call.returns(Promise.resolve({}));

        return fetchConfig({}, fakeWindow).then(() => {
          // The client will send a message to each ancestor asking for
          // configuration. Only those with the expected origin will be able to
          // respond.
          const ancestors = [fakeWindow.parent, fakeWindow.parent.parent];
          ancestors.forEach(frame => {
            assert.calledWith(
              fakeJsonRpc.call, frame, 'https://embedder.com', 'requestConfig', expectedTimeout
            );
          });
        });
      });

      it('uses config from sidebar HTML if fetching config fails', () => {
        const clientSettings = { apiUrl: 'https://servi.ce/api/' };
        fakeJsonRpc.call.returns(Promise.reject(new Error('Nope')));

        return fetchConfig(clientSettings, fakeWindow).then(config => {
          assert.deepEqual(config, clientSettings);
          assert.calledWith(
            console.warn,
            'Failed to retrieve configuration from https://embedder.com:',
            sinon.match.any
          );
        });
      });

      it('returns config from ancestor frame', () => {
        // When the embedder responds with configuration, that should be
        // returned by `fetchConfig`.
        fakeJsonRpc.call.returns(new Promise(() => {}));
        fakeJsonRpc.call.withArgs(
          fakeWindow.parent.parent, 'https://embedder.com', 'requestConfig', expectedTimeout
        ).returns(Promise.resolve({
          // Here the embedder's parent returns service configuration
          // (aka. credentials for automatic login).
          services: [{
            apiUrl: 'https://servi.ce/api/',
            grantToken: 'secret-token',
          }],
        }));

        return fetchConfig({}, fakeWindow).then(config => {
          assert.deepEqual(config, {
            apiUrl: 'https://servi.ce/api/',
            services: [{
              apiUrl: 'https://servi.ce/api/',
              grantToken: 'secret-token',
            }],
          });
        });
      });

    });
  });
});
