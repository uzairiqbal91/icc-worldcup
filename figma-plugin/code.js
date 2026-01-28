// ICC Match Poster Editor - Figma Plugin
// This plugin modifies the match poster template directly in Figma

figma.showUI(__html__, { width: 400, height: 500 });

// Node IDs from the template
const NODE_IDS = {
  team1Name: '1:40',    // "new zealand" text
  team2Name: '1:41',    // "bangladesh" text
  dateText: '1:45',     // "20 Jan | Tuesday"
  timeText: '1:46',     // "12:30 PM"
  vsSmall: '1:38',      // "vs" between logos
  vsYellow: '1:42',     // "VS" yellow between names
  team1Captain: '1:10', // team1 captain image
  team2Captain: '1:12', // team2 captain image
  team1Logo: '1:39',    // team1 logo
  team2Logo: '1:11',    // team2 logo
};

// Find a node by ID
function findNodeById(id) {
  return figma.currentPage.findOne(node => node.id === id);
}

// Update text content
function updateText(nodeId, newText) {
  const node = findNodeById(nodeId);
  if (node && node.type === 'TEXT') {
    // Load fonts first
    return figma.loadFontAsync(node.fontName).then(() => {
      node.characters = newText;
      return true;
    }).catch(err => {
      console.error('Font load error:', err);
      // Try with a fallback font
      return figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }).then(() => {
        node.fontName = { family: "Inter", style: "Semi Bold" };
        node.characters = newText;
        return true;
      });
    });
  }
  return Promise.resolve(false);
}

// Replace image on a node
async function replaceImage(nodeId, imageBytes) {
  const node = findNodeById(nodeId);
  if (node && 'fills' in node) {
    const image = figma.createImage(new Uint8Array(imageBytes));
    const fills = JSON.parse(JSON.stringify(node.fills));
    for (let i = 0; i < fills.length; i++) {
      if (fills[i].type === 'IMAGE') {
        fills[i].imageHash = image.hash;
      }
    }
    node.fills = fills;
    return true;
  }
  return false;
}

// Duplicate the frame to create a new poster
async function duplicateFrame() {
  const frame = findNodeById('1:2');
  if (frame) {
    const clone = frame.clone();
    clone.x = frame.x + frame.width + 100;
    clone.name = 'VS - Copy';
    figma.currentPage.selection = [clone];
    figma.viewport.scrollAndZoomIntoView([clone]);
    return clone.id;
  }
  return null;
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'update-text') {
    const { team1, team2, date, time } = msg.data;

    try {
      if (team1) await updateText(NODE_IDS.team1Name, team1.toLowerCase());
      if (team2) await updateText(NODE_IDS.team2Name, team2.toLowerCase());
      if (date) await updateText(NODE_IDS.dateText, date);
      if (time) await updateText(NODE_IDS.timeText, time);

      figma.ui.postMessage({ type: 'success', message: 'Text updated successfully!' });
    } catch (error) {
      figma.ui.postMessage({ type: 'error', message: 'Error: ' + error.message });
    }
  }

  if (msg.type === 'replace-image') {
    const { nodeId, imageBytes } = msg.data;
    try {
      const result = await replaceImage(nodeId, imageBytes);
      if (result) {
        figma.ui.postMessage({ type: 'success', message: 'Image replaced!' });
      } else {
        figma.ui.postMessage({ type: 'error', message: 'Node not found or not an image node.' });
      }
    } catch (error) {
      figma.ui.postMessage({ type: 'error', message: 'Error: ' + error.message });
    }
  }

  if (msg.type === 'duplicate') {
    try {
      const newId = await duplicateFrame();
      if (newId) {
        figma.ui.postMessage({ type: 'success', message: 'Poster duplicated! New frame ID: ' + newId });
      }
    } catch (error) {
      figma.ui.postMessage({ type: 'error', message: 'Error: ' + error.message });
    }
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
