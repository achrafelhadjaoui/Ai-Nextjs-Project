/**
 * Debug script to check chrome.storage contents
 * Run this in the extension service worker console to see what's stored
 */

// Check all storage
chrome.storage.local.get(null, (result) => {
  if (result.settings) {
  }

  if (result.authToken) {
  }
});

// Force sync config
chrome.runtime.sendMessage({ type: 'SYNC_EXTENSION_CONFIG' }, (response) => {
  // Check storage again after sync
  setTimeout(() => {
    chrome.storage.local.get('settings', (result) => {
    });
  }, 1000);
});
