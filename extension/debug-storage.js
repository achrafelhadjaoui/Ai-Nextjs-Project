/**
 * Debug script to check chrome.storage contents
 * Run this in the extension service worker console to see what's stored
 */

// Check all storage
chrome.storage.local.get(null, (result) => {
  console.log('📦 Full chrome.storage.local contents:', result);

  if (result.settings) {
    console.log('⚙️  Settings:', {
      enableOnAllSites: result.settings.enableOnAllSites,
      allowedSites: result.settings.allowedSites
    });
  } else {
    console.log('⚠️  No settings found in storage!');
  }

  if (result.authToken) {
    console.log('🔐 Auth token exists:', !!result.authToken);
  } else {
    console.log('⚠️  No auth token found');
  }
});

// Force sync config
console.log('🔄 Forcing config sync...');
chrome.runtime.sendMessage({ type: 'SYNC_EXTENSION_CONFIG' }, (response) => {
  console.log('✅ Sync response:', response);

  // Check storage again after sync
  setTimeout(() => {
    chrome.storage.local.get('settings', (result) => {
      console.log('📦 Settings after sync:', {
        enableOnAllSites: result.settings?.enableOnAllSites,
        allowedSites: result.settings?.allowedSites
      });
    });
  }, 1000);
});
