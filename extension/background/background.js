/**
 * Farisly AI - Background Service Worker
 * Handles authentication, messaging, alarms, and cross-component communication
 */

// Configuration
const API_URL = 'http://localhost:3000'; // Change to production URL when deploying
const SYNC_INTERVAL = 30; // minutes

// State management
let authState = {
  isAuthenticated: false,
  user: null,
  token: null,
  expiresAt: null
};

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🚀 Farisly AI Extension installed/updated', details.reason);

  if (details.reason === 'install') {
    // First time install - fetch settings from server
    await syncExtensionConfig();

    // Open onboarding page
    chrome.tabs.create({ url: `${API_URL}/onboarding` });
  }

  if (details.reason === 'update') {
    // Extension updated - refresh config
    await syncExtensionConfig();
  }

  // Set up periodic sync alarms
  chrome.alarms.create('syncData', { periodInMinutes: SYNC_INTERVAL });
  chrome.alarms.create('syncConfig', { periodInMinutes: 5 }); // Sync config every 5 minutes

  // Load auth state from storage
  await loadAuthState();
});

/**
 * Handle extension startup
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('🔄 Extension started');
  await loadAuthState();
  await syncExtensionConfig(); // Sync config first
  await syncDataWithServer();
});

/**
 * Sync extension configuration from server
 */
async function syncExtensionConfig() {
  try {
    console.log('🔄 Syncing extension config from server...');

    const response = await fetch(`${API_URL}/api/extension/config`);
    const data = await response.json();

    if (data.success && data.settings) {
      // Get current settings
      const result = await chrome.storage.local.get('settings');
      const currentSettings = result.settings || {};

      // IMPORTANT: Completely replace site permission settings from server
      // This ensures changes from admin are properly reflected
      const updatedSettings = {
        ...currentSettings,
        enableOnAllSites: Boolean(data.settings.enableOnAllSites),
        allowedSites: Array.isArray(data.settings.allowedSites) ? data.settings.allowedSites : []
      };

      await chrome.storage.local.set({ settings: updatedSettings });

      console.log('✅ Extension config synced from server:', {
        enableOnAllSites: updatedSettings.enableOnAllSites,
        allowedSites: updatedSettings.allowedSites,
        timestamp: new Date().toISOString()
      });

      // Notify all tabs to reload if necessary
      broadcastMessage({
        type: 'CONFIG_UPDATED',
        data: {
          enableOnAllSites: updatedSettings.enableOnAllSites,
          allowedSites: updatedSettings.allowedSites
        }
      });

      return true;
    } else {
      console.error('Failed to sync config:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error syncing extension config:', error);
    // Set default safe config on error
    const result = await chrome.storage.local.get('settings');
    if (!result.settings) {
      await chrome.storage.local.set({
        settings: {
          enableOnAllSites: false,
          allowedSites: [],
          useOpenAI: true,
          openaiKey: '',
          agentName: '',
          agentTone: 'friendly',
          useLineSpacing: true,
          panelMinimized: false,
          aiInstructions: [],
          quickReplies: []
        }
      });
    }
    return false;
  }
}

/**
 * Load authentication state from storage
 */
async function loadAuthState() {
  try {
    const result = await chrome.storage.local.get(['authToken', 'user', 'tokenExpiry']);

    if (result.authToken && result.tokenExpiry) {
      const now = Date.now();
      if (now < result.tokenExpiry) {
        authState = {
          isAuthenticated: true,
          user: result.user,
          token: result.authToken,
          expiresAt: result.tokenExpiry
        };
        console.log('✅ Auth state loaded:', authState.user?.email);
      } else {
        console.log('⚠️  Token expired, clearing auth');
        await clearAuthState();
      }
    }
  } catch (error) {
    console.error('❌ Error loading auth state:', error);
  }
}

/**
 * Save authentication state to storage
 */
async function saveAuthState(user, token, expiresIn = 86400000) {
  const expiresAt = Date.now() + expiresIn;

  authState = {
    isAuthenticated: true,
    user,
    token,
    expiresAt
  };

  await chrome.storage.local.set({
    authToken: token,
    user: user,
    tokenExpiry: expiresAt
  });

  console.log('✅ Auth state saved for:', user.email);
}

/**
 * Clear authentication state
 */
async function clearAuthState() {
  authState = {
    isAuthenticated: false,
    user: null,
    token: null,
    expiresAt: null
  };

  await chrome.storage.local.remove(['authToken', 'user', 'tokenExpiry']);
  console.log('🔒 Auth state cleared');
}

/**
 * Verify user still exists in database
 */
async function verifyUserExists() {
  if (!authState.isAuthenticated || !authState.token) {
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authState.token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        // Update user data
        authState.user = data.user;
        await chrome.storage.local.set({ user: data.user });
        return true;
      }
    }

    // User doesn't exist or token invalid
    console.log('⚠️  User verification failed');
    await clearAuthState();
    return false;
  } catch (error) {
    console.error('❌ Error verifying user:', error);
    return false;
  }
}

/**
 * Sync data with server
 */
async function syncDataWithServer() {
  if (!authState.isAuthenticated || !authState.user) {
    console.log('⏭️  Skipping sync - not authenticated');
    return;
  }

  try {
    console.log('🔄 Syncing data with server...');

    // Fetch saved replies from database
    const repliesResponse = await fetch(
      `${API_URL}/api/extension/saved-replies?userId=${authState.user.id}`,
      {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      }
    );

    if (repliesResponse.ok) {
      const repliesData = await repliesResponse.json();
      if (repliesData.success) {
        // Update local storage
        const settings = await chrome.storage.local.get('settings');
        const updatedSettings = {
          ...settings.settings,
          quickReplies: repliesData.data || []
        };

        await chrome.storage.local.set({ settings: updatedSettings });
        console.log(`✅ Synced ${repliesData.data?.length || 0} saved replies`);

        // Notify all tabs about the update
        broadcastMessage({
          type: 'DATA_SYNCED',
          data: { quickReplies: repliesData.data }
        });
      }
    }
  } catch (error) {
    console.error('❌ Sync error:', error);
  }
}

/**
 * Broadcast message to all tabs
 */
async function broadcastMessage(message) {
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, message).catch(() => {
      // Ignore errors for tabs that don't have content script
    });
  });
}

/**
 * Handle alarms (periodic tasks)
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('⏰ Alarm triggered:', alarm.name);

  if (alarm.name === 'syncData') {
    await syncDataWithServer();
  } else if (alarm.name === 'syncConfig') {
    await syncExtensionConfig();
  }
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request.type, 'from', sender.tab ? 'content' : 'popup');

  // Handle async responses
  (async () => {
    try {
      switch (request.type) {
        case 'GET_AUTH_STATE':
          // Verify user still exists
          if (authState.isAuthenticated) {
            const exists = await verifyUserExists();
            if (!exists) {
              sendResponse({ success: false, message: 'User no longer exists' });
              return;
            }
          }
          sendResponse({ success: true, authState });
          break;

        case 'LOGIN':
          const { user, token, expiresIn } = request.payload;
          await saveAuthState(user, token, expiresIn);
          await syncDataWithServer();
          sendResponse({ success: true });
          break;

        case 'LOGOUT':
          await clearAuthState();
          sendResponse({ success: true });
          break;

        case 'SYNC_NOW':
          await syncDataWithServer();
          sendResponse({ success: true });
          break;

        case 'SYNC_CONFIG':
          const configSynced = await syncExtensionConfig();
          sendResponse({ success: configSynced });
          break;

        case 'GET_SETTINGS':
          const result = await chrome.storage.local.get('settings');
          // Ensure we always return valid settings with defaults
          const validSettings = result.settings || {
            enableOnAllSites: false,
            allowedSites: [],
            useOpenAI: true,
            openaiKey: '',
            agentName: '',
            agentTone: 'friendly',
            useLineSpacing: true,
            panelMinimized: false,
            aiInstructions: [],
            quickReplies: []
          };

          // Log for debugging
          console.log('📋 GET_SETTINGS returning:', {
            enableOnAllSites: validSettings.enableOnAllSites,
            allowedSites: validSettings.allowedSites
          });

          sendResponse({ success: true, settings: validSettings });
          break;

        case 'UPDATE_SETTINGS':
          await chrome.storage.local.set({ settings: request.payload });
          broadcastMessage({ type: 'SETTINGS_UPDATED', data: request.payload });
          sendResponse({ success: true });
          break;

        case 'TRACK_REPLY_USAGE':
          // Track usage in database
          if (authState.isAuthenticated && request.payload.replyId) {
            await fetch(`${API_URL}/api/extension/saved-replies`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.token}`
              },
              body: JSON.stringify({
                replyId: request.payload.replyId,
                userId: authState.user.id
              })
            });
          }
          sendResponse({ success: true });
          break;

        case 'AI_COMPOSE':
          // Forward to AI API
          const composeResponse = await fetch(`${API_URL}/api/ai/compose`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authState.token ? `Bearer ${authState.token}` : ''
            },
            body: JSON.stringify(request.payload)
          });

          const composeData = await composeResponse.json();
          sendResponse(composeData);
          break;

        case 'AI_REPLY':
          // Forward to AI Reply API
          const replyResponse = await fetch(`${API_URL}/api/ai/reply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authState.token ? `Bearer ${authState.token}` : ''
            },
            body: JSON.stringify(request.payload)
          });

          const replyData = await replyResponse.json();
          sendResponse(replyData);
          break;

        case 'OPEN_DASHBOARD':
          chrome.tabs.create({ url: `${API_URL}/dashboard` });
          sendResponse({ success: true });
          break;

        case 'OPEN_LOGIN':
          chrome.tabs.create({ url: `${API_URL}/auth/login` });
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, message: 'Unknown message type' });
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, message: error.message });
    }
  })();

  // Return true to indicate we'll send response asynchronously
  return true;
});

/**
 * Handle extension icon click
 */
chrome.action.onClicked.addListener(async (tab) => {
  console.log('🖱️ Extension icon clicked on tab:', tab.id);

  // Send message to content script to toggle the panel
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
  } catch (error) {
    console.error('Error sending toggle message:', error);
  }
});

/**
 * Handle keyboard commands
 */
chrome.commands.onCommand.addListener(async (command) => {
  console.log('⌨️  Command triggered:', command);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (command === 'toggle-panel') {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
  } else if (command === 'quick-reply') {
    chrome.tabs.sendMessage(tab.id, { type: 'OPEN_QUICK_REPLIES' });
  }
});

/**
 * Handle tab updates
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if site is allowed
    chrome.storage.local.get('settings').then(result => {
      const settings = result.settings || {};

      if (!settings.enableOnAllSites) {
        const allowed = settings.allowedSites?.some(keyword =>
          tab.url.toLowerCase().includes(keyword.toLowerCase())
        );

        if (!allowed) {
          // Disable extension on this page
          chrome.tabs.sendMessage(tabId, { type: 'DISABLE_EXTENSION' });
        }
      }
    });
  }
});

/**
 * Handle extension icon click
 */
chrome.action.onClicked.addListener(async (tab) => {
  // Toggle panel on the active tab
  chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
});

console.log('🎯 Farisly AI Background Service Worker initialized');
