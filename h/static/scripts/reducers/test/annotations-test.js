'use strict';

var annotations = require('../annotations');
var uiConstants = require('../../ui-constants');
var util = require('../util');

var annotationFixtures = require('../../test/annotation-fixtures');
var unroll = require('../../test/util').unroll;

var actions = annotations.actions;
var init = annotations.init;
var update = util.createReducer(annotations.update);

// Tests for most of the functionality in reducers/annotations.js are currently
// in the tests for the whole Redux store

var fixtures = {
  session: {
    features: {'orphans_tab': true},
  },
};

describe('annotations reducer', function () {
  describe('#addAnnotations', function () {
    unroll('switches to the #tab tab when #type is loaded', function (testCase) {
      var selection = {};
      selection[testCase.annot.id] = true;
      var state = Object.assign(init(), {
        session: fixtures.session,
        selectedAnnotationMap: selection,
        selectedTab: testCase.initialTab,
      });

      state = update(state, {
        type: 'ADD_ANNOTATIONS',
        annotations: [testCase.annot],
      });

      assert.equal(state.selectedTab, testCase.tab);
    },[{
      annot: annotationFixtures.oldPageNote(),
      initialTab: uiConstants.TAB_ANNOTATIONS,
      tab: uiConstants.TAB_NOTES,
      type: 'a page note',
    },{
      annot: annotationFixtures.oldAnnotation(),
      initialTab: uiConstants.TAB_NOTES,
      tab: uiConstants.TAB_ANNOTATIONS,
      type: 'an annotation',
    }]);

    it('does not change the current tab if there is no selection', function () {
      var state = Object.assign(init(), {
        session: fixtures.session,
        selectedTab: uiConstants.TAB_ORPHANS,
        selectedAnnotationMap: null,
      });

      state = update(state, {
        type: 'ADD_ANNOTATIONS',
        annotations: [annotationFixtures.oldPageNote()],
      });

      assert.equal(state.selectedTab, uiConstants.TAB_ORPHANS);
    });
  });

  describe('#updateAnchorStatus', function () {
    var annot = annotationFixtures.oldAnnotation();

    var selectedAnnotationMap = {};
    selectedAnnotationMap[annot.id] = true;

    var initialState = Object.assign(init(), {
      annotations: [annot],
      session: fixtures.session,
      selectedTab: uiConstants.TAB_ANNOTATIONS,
      selectedAnnotationMap: selectedAnnotationMap,
    });

    it('switches to the Orphans tab if a selected annotation becomes an orphan', function () {
      var state = update(initialState,
        actions.updateAnchorStatus(annot.id, 't1', true /* orphan */));
      assert.equal(state.selectedTab, uiConstants.TAB_ORPHANS);
    });

    it('does not switch to the Orphans tab if an unselected annotation becomes an orphan', function () {
      var stateWithoutSelection = Object.assign(initialState,
        {selectedAnnotationMap: {}});
      var state = update(stateWithoutSelection,
        actions.updateAnchorStatus(annot.id, 't1', true /* orphan */));
      assert.equal(state.selectedTab, uiConstants.TAB_ANNOTATIONS);
    });
  });

  describe('#savedAnnotations', function () {
    var savedAnnotations = annotations.savedAnnotations;

    it('returns annotations which are saved', function () {
      var state = {
        annotations: [annotationFixtures.newAnnotation(),
                      annotationFixtures.defaultAnnotation()],
      };
      assert.deepEqual(savedAnnotations(state), [annotationFixtures.defaultAnnotation()]);
    });
  });
});
