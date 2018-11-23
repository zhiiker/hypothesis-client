function isMessage(event, method) {
  if (typeof event.data !== 'object' || event.data === null) {
    return false;
  }
  return event.data.type === method;
}

/**
 * Return a promise which resolves when the sidebar application has loaded.
 *
 * @param {HTMLIFrameElement} sidebar - The sidebar iframe
 * @param {Window} window_ - Test seam.
 * @return {Promise<string>} - The origin of the sidebar app.
 */
function waitForSidebarToLoad(sidebar, window_ = window) {
  return new Promise(resolve => {
    function handleMessage(event) {
      if (event.source !== sidebar.contentWindow ||
          !isMessage(event, 'hypothesis:sidebarReady')) {
        return;
      }
      window_.removeEventListener('message', handleMessage);
      resolve(event.origin);
    }
    window_.addEventListener('message', handleMessage);
  });
}

/**
 * Establish connections between clients containing annotatable content and
 * a sidebar application which fetches and displays annotation contents.
 *
 * This function should be called in the frame that creates the sidebar,
 * immediately after the sidebar iframe has been created.
 *
 * @param {HTMLIFrameElement} sidebar - The sidebar iframe
 * @return {Function} Function that stops listening for connection requests.
 */
export function listenForSidebarConnectionRequests(sidebar, window_ = window) {
  const sidebarReady = waitForSidebarToLoad(sidebar);

  function handleMessage(event) {
    if (!isMessage(event, 'hypothesis:sidebarRequest')) {
      return;
    }

    sidebarReady.then(sidebarOrigin => {
      const channel = new MessageChannel;
      const sidebarFoundMsg = {
        type: 'hypothesis:sidebarFound',
        port: channel.port1,
      };
      const clientFoundMsg = {
        type: 'hypothesis:clientFound',
        port: channel.port2,
      };
      event.source.postMessage(sidebarFoundMsg, event.origin, [channel.port1]);
      sidebar.contentWindow.postMessage(clientFoundMsg, sidebarOrigin, [channel.port2]);
    });
  }

  window_.addEventListener('message', handleMessage);
  return () => {
    window_.removeEventListener('message', handleMessage);
  };
}

/**
 * Listen for connection requests from clients.
 *
 * This should be called within the sidebar application.
 *
 * @param {(port: MessagePort) => any} callback - A callback that is passed a
 *   port for communicating with the client when a new client is found.
 * @param {Window} window_ - Test seam.
 * @return {Function} - Function that stops listening for clients.
 */
export function listenForClientConnectionRequests(callback, window_ = window) {
  console.log('Sidebar is listening for connection requests');

  // Notify the parent frame that we are ready to receive connection requests.
  window_.parent.postMessage({ type: 'hypothesis:sidebarReady' }, '*');

  function handleMessage(event) {
    if (!isMessage(event, 'hypothesis:clientFound')) {
      return;
    }
    callback(event.data.port);
  }
  window_.addEventListener('message', handleMessage);
  return () => {
    window_.removeEventListener('message', handleMessage);
  };
}

/**
 * Connect to a sidebar in the current frame or the parent frame.
 *
 * @return {Promise<MessagePort>} - A port for communicating with the sidebar.
 */
export function connectToSidebar(inParentFrame, window_ = window) {
  const sidebarRequestMsg = { type: 'hypothesis:sidebarRequest' };
  if (inParentFrame) {
    window_.parent.postMessage(sidebarRequestMsg, '*');
  } else {
    window_.postMessage(sidebarRequestMsg, '*');
  }

  return new Promise(resolve => {
    function handleMessage(event) {
      if (!isMessage(event, 'hypothesis:sidebarFound')) {
        return;
      }
      window_.removeEventListener('message', handleMessage);
      resolve(event.data.port);
    }
    window_.addEventListener('message', handleMessage);
  });
}
