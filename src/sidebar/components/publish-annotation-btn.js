'use strict';

/**
 * @description Displays a combined privacy/selection post button to post
 *              a new annotation
 */
// @ngInject
function PublishAnnotationController($window, analytics, groups) {
  this.groups = groups.all();
  this.showDropdown = false;
  this.privateLabel = 'Only Me';

  this.setGroup = function(grp) {
    // Use current privacy setting except when the group to change to is 
    // the current group. This allows the user to toggle between private
    // and shared in the current group.
    if (grp.name === this.group.name) {
        this.onSetPrivacy({level: 'shared'});
    }
    this.group = grp;
    this.onSetGroup({group: grp.id});
  };

  this.publishDestination = function () {
    return this.isShared ? this.group.name : this.privateLabel;
  };

  this.groupCategory = function (groupType) {
    return groupType === 'open' ? 'public' : 'group';
  };

  this.setPrivacy = function (level) {
    this.onSetPrivacy({level: level});
  };
}

module.exports = {
  controller: PublishAnnotationController,
  controllerAs: 'vm',
  bindings: {
    group: '<',
    canPost: '<',
    isShared: '<',
    onCancel: '&',
    onSave: '&',
    onSetPrivacy: '&',
    onSetGroup: '&',
  },
  template: require('../templates/publish-annotation-btn.html'),
};
