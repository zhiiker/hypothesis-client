import { listenForClientConnectionRequests } from './discovery.js';

function indexOfFrame(frames, frame) {
  for (let i = 0; i < frames.length; i++) {
    if (frames[i] === frame) {
      return i;
    }
  }
  return -1;
}

/**
 * Return an identifier for the current frame based on the path to it
 * from the root frame.
 */
function framePath() {
  let current = window;
  const path = [];
  while (current !== current.top) {
    const idx = indexOfFrame(current.parent.frames, current);
    path.push(`[frame ${idx}]`);
    current = current.parent;
  }
  path.reverse();
  return path.join('->');
}

function clientConnected(port) {
  const id = framePath();
  port.postMessage(`The sidebar ${id} says hello!`);
  port.onmessage = event => {
    console.log(`Sidebar ${id} received event from client ${event.data}`);
  };
}

listenForClientConnectionRequests(clientConnected);
