'use strict';

const EventEmitter = require('tiny-emitter');

const { call, Server } = require('../postmessage-json-rpc');

class FakeWindow {
  constructor() {
    this.emitter = new EventEmitter;

    this.sendMessage = (source, origin, data) => {
      this.emitter.emit('message', { source, origin, data });
    };
    this.addEventListener = this.emitter.on.bind(this.emitter);
    this.removeEventListener = this.emitter.off.bind(this.emitter);
    this.postMessage = sinon.stub();
  }
}

function assertPromiseIsRejected(promise, expectedErr) {
  const rejectFlag = {};
  return promise.catch(err => {
    assert.equal(err.message, expectedErr);
    return rejectFlag;
  }).then(result => {
    assert.equal(result, rejectFlag, 'expected promise to be rejected but it was fulfilled');
  });
}

describe('sidebar.util.postmessage-json-rpc', () => {
  const origin = 'https://embedder.com';
  const messageId = 42;

  describe('call', () => {
    let frame;
    let fakeWindow;

    function doCall() {
      const timeout = 1;
      return call(
        frame, origin, 'testMethod', [1, 2, 3], timeout, fakeWindow, messageId
      );
    }

    beforeEach(() => {
      frame = { postMessage: sinon.stub() };
      fakeWindow = new FakeWindow;
    });

    it('sends a message to the target frame', () => {
      doCall().catch(() => {} /* Ignore timeout. */);

      assert.calledWith(frame.postMessage, {
        jsonrpc: '2.0',
        id: messageId,
        method: 'testMethod',
        params: [1, 2, 3],
      });
    });

    [{
      // Wrong origin.
      origin: 'https://not-the-embedder.com',
      data: {
        jsonrpc: '2.0',
        id: messageId,
      },
    },{
      // Non-object `data` field.
      data: null,
    },{
      // No jsonrpc header
      data: {},
    },{
      // No ID
      data: {
        jsonrpc: '2.0',
      },
    },{
      // ID mismatch
      data: {
        jsonrpc: '2.0',
        id: 'wrong-id',
      },
    }].forEach(reply => {
      it('ignores messages that do not have required reply fields', () => {
        const result = doCall();

        fakeWindow.emitter.emit('message', reply);

        const notCalled = Promise.resolve('notcalled');
        return Promise.race([result, notCalled]).then(result => {
          assert.equal(result, 'notcalled');
        });
      });
    });

    it('rejects with an error if the `error` field is set in the response', () => {
      const result = doCall();
      fakeWindow.emitter.emit('message', {
        origin,
        data: {
          jsonrpc: '2.0',
          id: messageId,
          error: {
            message: 'Something went wrong',
          },
        },
      });

      return assertPromiseIsRejected(result, 'Something went wrong');
    });

    it('resolves with the result if the `result` field is set in the response', () => {
      const result = doCall();
      const expectedResult = { foo: 'bar' };
      fakeWindow.emitter.emit('message', {
        origin,
        data: {
          jsonrpc: '2.0',
          id: messageId,
          result: expectedResult,
        },
      });

      return result.then(result => {
        assert.deepEqual(result, expectedResult);
      });
    });

    it('rejects with an error if the timeout is exceeded', () => {
      const result = doCall();
      return assertPromiseIsRejected(result, 'Request to https://embedder.com timed out');
    });
  });

  describe('Server', () => {
    let fakeSourceWindow;
    let fakeWindow;
    let server;
    let methods;
    const validRequest = {
      jsonrpc: '2.0',
      method: 'validMethod',
      params: [1, 2, 3],
      id: 42,
    };
    const validOrigin = 'https://embedder.com';

    beforeEach(() => {
      fakeSourceWindow = new FakeWindow;
      fakeWindow = new FakeWindow;
      methods = {
        validMethod: sinon.stub(),
      };

      server = new Server(methods, [validOrigin], fakeWindow);
      server.listen();
    });

    it('ignores messages from unknown origins', () => {
      fakeWindow.sendMessage('https://unknown.com', validRequest);
      assert.notCalled(methods.validMethod);
    });

    it('ignores messages that are not valid JSON-RPC requests', () => {
      const request = Object.assign({}, validRequest, { jsonrpc: null });
      fakeWindow.sendMessage(fakeSourceWindow, validOrigin, request);
      assert.notCalled(methods.validMethod);
    });

    it('returns an error if the method name is unknown', () => {
      const request = Object.assign({}, validRequest, { method: 'unknown' });
      fakeWindow.sendMessage(fakeSourceWindow, validOrigin, request);
      assert.notCalled(methods.validMethod);

      assert.calledWith(fakeSourceWindow.postMessage, {
        jsonrpc: '2.0',
        id: validRequest.id,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      });
    });

    it('calls the handler if defined', () => {
      fakeWindow.sendMessage(fakeSourceWindow, validOrigin, validRequest);
      assert.calledWith(methods.validMethod, validRequest.params);
    });

    it("returns the handler's response if an id is set", () => {
      methods.validMethod.returns({ foo: 'bar' });

      fakeWindow.sendMessage(fakeSourceWindow, validOrigin, validRequest);

      assert.calledWith(fakeSourceWindow.postMessage, {
        jsonrpc: '2.0',
        id: validRequest.id,
        result: { foo: 'bar' },
      });
    });

    it('does not return a response if no id is set', () => {
      const request = Object.assign({}, validRequest, { id: undefined });
      methods.validMethod.returns({ foo: 'bar' });

      fakeWindow.sendMessage(fakeSourceWindow, validOrigin, request);

      assert.notCalled(fakeSourceWindow.postMessage);
    });

    it('returns an error if the handler throws', () => {
      methods.validMethod.throws(new Error('Something went wrong'));

      fakeWindow.sendMessage(fakeSourceWindow, validOrigin, validRequest);

      assert.calledWith(fakeSourceWindow.postMessage, {
        jsonrpc: '2.0',
        id: validRequest.id,
        error: {
          code: -32000,
          message: 'Something went wrong',
        },
      });
    });
  });
});
