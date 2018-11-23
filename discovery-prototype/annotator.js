import { listenForSidebarConnectionRequests, connectToSidebar } from './discovery.js';

function createSidebar() {
  const iframe = document.createElement('iframe');
  iframe.width = 300;
  iframe.height = 300;
  iframe.src = './sidebar.html';

  document.body.appendChild(iframe);

  return iframe;
}

let config = {};
if (window.hypothesisConfig) {
  config = window.hypothesisConfig();
}

// Setup the sidebar unless this frame explicitly indicates that it should use
// a sidebar from a parent frame.
let sidebar = null;
if (!config.subFrameIdentifier) {
  console.log(`Creating sidebar in ${window.location.href}`);
  sidebar = createSidebar();
  listenForSidebarConnectionRequests(sidebar);
}

/**
 * Run a dummy annotation client.
 */
async function runClient() {
  console.log(`Client ${window.location.href} connecting to sidebar`);
  const sidebarInParentFrame = sidebar === null;
  const port = await connectToSidebar(sidebarInParentFrame);
  port.onmessage = event => {
    console.log(`Client in ${window.location.href} received message from sidebar: ${event.data}`);
  };
  port.postMessage(`Message from client in ${window.location.href}`);
}
runClient();
