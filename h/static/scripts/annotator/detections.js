
var listenerOptions = {
    // know when things happen
    onEvent: function(){}
};

// modern browsers use the history api as a way for
// sites to change the browser history and address of the current
// website more easily. PJAX based websites utilize this when they want
// to swap out large portions of the content of their website.
// We need to know when that happens so that we can update our annotations
var attachHistoryListeners = function(){
    var history = window.history;
    var pushState = history && history.pushState;
    var replaceState = history && history.replaceState;

    if(pushState){
        window.history.pushState = function(){
            listenerOptions.onEvent('urlChanged');
            console.log('pushStateUsed');
        };
    }
    if(replaceState){
        window.history.replaceState = function(){
            listenerOptions.onEvent('urlChanged');
            console.log('replaceStateUsed');
        };
    }
};

module.exports = {
    addListeners: function(options){
        listenerOptions = Object.assign(listenerOptions, options);
        attachHistoryListeners();
    }
};
