'use strict';

var session = require('../session');

var util = require('../util');

var init = session.init;
var actions = session.actions;
var update = util.createReducer(session.update);

describe('session reducer', function () {
  describe('#updateSession', function () {
    it('updates the session state', function () {
      var newSession = Object.assign(init(), {userid: 'john'});
      var state = update(init(), actions.updateSession(newSession));
      assert.deepEqual(state.session, newSession);
    });
  });

  describe('#currentUserid', function () {
    it('returns `null` if the user is not logged-in', function () {
      var state = init();
      assert.equal(session.currentUserid(state), null);
    });

    it('returns the current logged-in user ID', function () {
      var newSession = { userid: 'acct:user@hypothes.is' };
      var state = update(init(), actions.updateSession(newSession));
      assert.equal(session.currentUserid(state), 'acct:user@hypothes.is');
    });
  });
});
