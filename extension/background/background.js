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

// SSE (Server-Sent Events) connection for real-time config updates
let sseConnection = null;
let sseReconnectTimeout = null;
let lastConfigUpdate = null;

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
  // Note: Config sync is now handled by real-time SSE connection, no polling needed!

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

    // Prepare headers with auth token if available
    const headers = {
      'Accept': 'application/json'
    };

    if (authState.isAuthenticated && authState.token) {
      headers['Authorization'] = `Bearer ${authState.token}`;
      console.log('📤 Fetching user-specific config');
    } else {
      console.log('📤 Fetching default config (not authenticated)');
    }

    const response = await fetch(`${API_URL}/api/extension/config`, { headers });
    const data = await response.json();

    if (data.success && data.settings) {
      // Get current settings
      const result = await chrome.storage.local.get('settings');
      const currentSettings = result.settings || {};

      // Merge server config with local settings
      const updatedSettings = {
        ...currentSettings,
        enableOnAllSites: data.settings.enableOnAllSites,
        allowedSites: data.settings.allowedSites || [],
        openaiKey: data.settings.openaiApiKey || currentSettings.openaiKey || '',
        lastConfigSync: Date.now() // Add timestamp for cache validation
      };

      await chrome.storage.local.set({ settings: updatedSettings });

      console.log('✅ Extension config synced:', {
        enableOnAllSites: updatedSettings.enableOnAllSites,
        allowedSites: updatedSettings.allowedSites,
        lastConfigSync: new Date(updatedSettings.lastConfigSync).toISOString()
      });

      // Notify all tabs to reload if necessary
      broadcastMessage({
        type: 'CONFIG_UPDATED',
        data: {
          enableOnAllSites: updatedSettings.enableOnAllSites,
          allowedSites: updatedSettings.allowedSites,
          lastConfigSync: updatedSettings.lastConfigSync
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
 * Connect to SSE (Server-Sent Events) for real-time config updates
 * This provides instant config sync instead of polling every 30 seconds
 */
async function connectConfigStream() {
  // Close existing connection if any
  if (sseConnection) {
    console.log('🔌 Closing existing SSE connection');
    sseConnection.close();
    sseConnection = null;
  }

  // Clear any pending reconnect
  if (sseReconnectTimeout) {
    clearTimeout(sseReconnectTimeout);
    sseReconnectTimeout = null;
  }

  // Only connect if authenticated
  if (!authState.isAuthenticated || !authState.token) {
    console.log('⏸️  Not authenticated, skipping SSE connection');
    return;
  }

  console.log('🌐 Connecting to config stream (SSE)...');

  try {
    // Use fetch with ReadableStream for SSE
    const response = await fetch(`${API_URL}/api/extension/config/stream`, {
      headers: {
        'Authorization': `Bearer ${authState.token}`,
        'Accept': 'text/event-stream'
      }
    });

    if (!response.ok) {
      throw new Error(`SSE connection failed: ${response.status}`);
    }

    console.log('✅ SSE connection established');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Store connection reference
    sseConnection = {
      close: () => {
        reader.cancel();
      }
    };

    // Read the stream
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('📡 SSE stream ended');
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete messages (separated by \n\n)
      const messages = buffer.split('\n\n');
      buffer = messages.pop(); // Keep incomplete message in buffer

      for (const message of messages) {
        if (!message.trim()) continue;

        // Parse SSE message format: "data: {...}"
        const dataMatch = message.match(/^data: (.+)$/m);
        if (dataMatch) {
          try {
            const data = JSON.parse(dataMatch[1]);

            if (data.type === 'connected') {
              console.log('✅ SSE Config stream connected:', data.message);
            } else if (data.type === 'config') {
              // Check if config actually changed
              const currentUpdate = data.settings?.updatedAt || Date.now();

              if (lastConfigUpdate === null || currentUpdate > lastConfigUpdate) {
                console.log('🔄 Config changed! Syncing...', {
                  enableOnAllSites: data.settings.enableOnAllSites,
                  allowedSitesCount: data.settings.allowedSites?.length || 0
                });
                lastConfigUpdate = currentUpdate;

                // Update local storage
                const result = await chrome.storage.local.get('settings');
                const currentSettings = result.settings || {};

                const updatedSettings = {
                  ...currentSettings,
                  enableOnAllSites: data.settings.enableOnAllSites,
                  allowedSites: data.settings.allowedSites || [],
                  openaiKey: data.settings.openaiApiKey || currentSettings.openaiKey || '',
                  lastConfigSync: Date.now()
                };

                await chrome.storage.local.set({ settings: updatedSettings });

                // Broadcast to all tabs
                broadcastMessage({
                  type: 'CONFIG_UPDATED',
                  data: {
                    enableOnAllSites: updatedSettings.enableOnAllSites,
                    allowedSites: updatedSettings.allowedSites,
                    lastConfigSync: updatedSettings.lastConfigSync
                  }
                });

                console.log('✅ Config synced via SSE - instant broadcast sent to all tabs');
              } else {
                // Config unchanged - this should never happen with event-based system
                console.log('⏭️  Config unchanged, skipping broadcast');
              }
            } else if (data.type === 'heartbeat') {
              // Just keep connection alive, no action needed
              // console.log('💓 SSE heartbeat'); // Commented out to reduce console noise
            }
          } catch (err) {
            console.error('Error parsing SSE message:', err);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ SSE connection error:', error);
  }

  // Connection closed or errored, reconnect after 5 seconds
  sseConnection = null;
  if (authState.isAuthenticated) {
    console.log('🔄 Reconnecting SSE in 5 seconds...');
    sseReconnectTimeout = setTimeout(() => connectConfigStream(), 5000);
  }
}

/**
 * Disconnect from config stream
 */
function disconnectConfigStream() {
  if (sseConnection) {
    console.log('🔌 Disconnecting config stream');
    sseConnection.close();
    sseConnection = null;
  }

  if (sseReconnectTimeout) {
    clearTimeout(sseReconnectTimeout);
    sseReconnectTimeout = null;
  }

  lastConfigUpdate = null;
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
  }
  // Note: Config sync is now handled by real-time SSE, no alarm needed
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
          await syncExtensionConfig(); // Sync user-specific config
          await syncDataWithServer();
          await connectConfigStream(); // Connect to real-time config stream (SSE)
          sendResponse({ success: true });
          break;

        case 'SYNC_AUTH_FROM_WEB':
          // Sync authentication from web dashboard
          try {
            console.log('🔄 Syncing auth from web dashboard...');
            const authResponse = await fetch(`${API_URL}/api/extension/auth/status`, {
              credentials: 'include', // Include cookies for session auth
              headers: {
                'Accept': 'application/json'
              }
            });

            console.log('📡 Auth response status:', authResponse.status);

            const authData = await authResponse.json();
            console.log('📦 Auth response data:', authData);

            if (authData.success && authData.authenticated) {
              console.log('✅ Authentication successful, saving state...');
              await saveAuthState(authData.user, authData.token, authData.expiresIn);
              await syncExtensionConfig(); // Sync user-specific config
              await syncDataWithServer();
              await connectConfigStream(); // Connect to real-time config stream (SSE)

              // Broadcast auth update to all tabs to refresh UI
              broadcastMessage({
                type: 'AUTH_UPDATED',
                data: {
                  authenticated: true,
                  user: authData.user
                }
              });

              sendResponse({ success: true, user: authData.user });
            } else {
              console.warn('⚠️ Not authenticated on web:', authData.message);
              sendResponse({ success: false, message: authData.message || 'Not authenticated on web' });
            }
          } catch (error) {
            console.error('❌ Error syncing auth from web:', error);
            sendResponse({ success: false, message: error.message });
          }
          break;

        case 'LOGOUT':
          await clearAuthState();
          disconnectConfigStream(); // Disconnect SSE stream

          // Sync config back to defaults
          await syncExtensionConfig();

          // Broadcast logout to all tabs to refresh UI
          broadcastMessage({
            type: 'AUTH_UPDATED',
            data: {
              authenticated: false,
              user: null
            }
          });

          sendResponse({ success: true });
          break;

        case 'SYNC_NOW':
          await syncDataWithServer();
          sendResponse({ success: true });
          break;

        case 'SYNC_EXTENSION_CONFIG':
          // Manually trigger extension config sync
          console.log('📨 Manual config sync requested');
          try {
            await syncExtensionConfig();
            console.log('✅ Manual config sync completed successfully');
            sendResponse({ success: true, message: 'Config synced successfully' });
          } catch (error) {
            console.error('❌ Manual config sync failed:', error);
            sendResponse({ success: false, message: error.message || 'Config sync failed' });
          }
          break;

        case 'GET_AUTH_STATE':
          // Return current authentication state
          sendResponse({
            success: true,
            authState: {
              isAuthenticated: authState.isAuthenticated,
              user: authState.user,
              token: authState.token ? '***' : null // Don't send actual token, just indicate if exists
            }
          });
          break;

        case 'GET_SETTINGS':
          const settings = await chrome.storage.local.get('settings');
          // Return settings with safe defaults if not initialized
          const safeSettings = settings.settings || {
            enableOnAllSites: true, // Default to true for non-authenticated users
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
          sendResponse({ success: true, settings: safeSettings });
          break;

        case 'SAVE_API_KEY':
          // Save API key to server (user profile)
          console.log('💾 Saving API key to server...');
          try {
            if (!authState.isAuthenticated || !authState.token) {
              sendResponse({ success: false, message: 'Please sign in first' });
              break;
            }

            const { apiKey } = request.payload;

            const response = await fetch(`${API_URL}/api/profile`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.token}`
              },
              body: JSON.stringify({
                extensionSettings: {
                  openaiApiKey: apiKey
                }
              })
            });

            const data = await response.json();

            if (data.success) {
              // Update local storage
              const currentSettings = await chrome.storage.local.get('settings');
              await chrome.storage.local.set({
                settings: {
                  ...currentSettings.settings,
                  openaiKey: apiKey
                }
              });

              console.log('✅ API key saved successfully');
              sendResponse({ success: true, message: 'API key saved successfully' });
            } else {
              console.error('❌ Failed to save API key:', data.message);
              sendResponse({ success: false, message: data.message || 'Failed to save API key' });
            }
          } catch (error) {
            console.error('❌ Error saving API key:', error);
            sendResponse({ success: false, message: error.message || 'Error saving API key' });
          }
          break;

        case 'UPDATE_SETTINGS':
          await chrome.storage.local.set({ settings: request.payload });
          broadcastMessage({ type: 'SETTINGS_UPDATED', data: request.payload });
          sendResponse({ success: true });
          break;

        case 'GET_SAVED_REPLIES':
          // Fetch saved replies from database OR return cached data
          console.log('📨 GET_SAVED_REPLIES request received');
          console.log('Auth state:', {
            isAuthenticated: authState.isAuthenticated,
            hasUser: !!authState.user,
            userId: authState.user?.id
          });

          // If not authenticated, return empty array and prompt to log in
          if (!authState.isAuthenticated || !authState.user) {
            console.warn('⚠️ Not authenticated - user needs to log in');
            sendResponse({
              success: false,
              message: 'Please sign in to access Quick Replies',
              needsAuth: true,
              replies: []
            });
            break;
          }

          try {
            const url = `${API_URL}/api/extension/saved-replies?userId=${authState.user.id}`;
            console.log('🔗 Fetching from:', url);

            const repliesResponse = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${authState.token}`
              }
            });

            console.log('📡 Response status:', repliesResponse.status);

            if (repliesResponse.ok) {
              const repliesData = await repliesResponse.json();
              console.log('📦 Response data:', repliesData);

              if (repliesData.success) {
                console.log(`✅ Got ${repliesData.data?.length || 0} replies from server`);

                // Update local storage cache
                const settings = await chrome.storage.local.get('settings');
                const updatedSettings = {
                  ...settings.settings,
                  quickReplies: repliesData.data || []
                };
                await chrome.storage.local.set({ settings: updatedSettings });

                sendResponse({ success: true, replies: repliesData.data || [] });
              } else {
                console.error('❌ API returned error:', repliesData.message);
                sendResponse({ success: false, message: repliesData.message, replies: [] });
              }
            } else if (repliesResponse.status === 401 || repliesResponse.status === 403) {
              // Unauthorized - clear auth and prompt re-login
              console.error('❌ Authentication failed - clearing auth state');
              await clearAuthState();
              sendResponse({
                success: false,
                message: 'Session expired. Please sign in again.',
                needsAuth: true,
                replies: []
              });
            } else {
              const errorText = await repliesResponse.text();
              console.error('❌ HTTP error:', repliesResponse.status, errorText);
              sendResponse({
                success: false,
                message: `Failed to fetch replies (${repliesResponse.status})`,
                replies: []
              });
            }
          } catch (error) {
            console.error('❌ Error fetching saved replies:', error);
            sendResponse({
              success: false,
              message: 'Network error. Please check your connection.',
              replies: []
            });
          }
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

        case 'CHECK_GRAMMAR':
          // Forward to Grammar Check API
          console.log('📝 Checking grammar via API...');
          try {
            const grammarResponse = await fetch(`${API_URL}/api/ai/grammar`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authState.token ? `Bearer ${authState.token}` : ''
              },
              body: JSON.stringify(request.payload)
            });

            const grammarData = await grammarResponse.json();
            sendResponse(grammarData);
          } catch (error) {
            console.error('❌ Grammar check failed:', error);
            sendResponse({ success: false, message: error.message, errors: [] });
          }
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

/**
 * Connect to real-time saved replies stream via SSE
 */
let savedRepliesEventSource = null;

async function connectSavedRepliesStream() {
  if (!authState.isAuthenticated || !authState.user?.id) {
    console.log('⏭️ Skipping saved replies stream - not authenticated');
    return;
  }

  // Close existing connection if any
  if (savedRepliesEventSource) {
    savedRepliesEventSource.close();
  }

  const streamUrl = `${API_URL}/api/extension/saved-replies/stream?userId=${authState.user.id}`;
  console.log('🔌 Connecting to saved replies real-time stream...');

  savedRepliesEventSource = new EventSource(streamUrl);

  savedRepliesEventSource.onopen = () => {
    console.log('✅ Connected to saved replies real-time stream');
  };

  savedRepliesEventSource.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 Received real-time update:', data.type);

      // Handle different event types
      if (data.type === 'connected' || data.type === 'heartbeat') {
        // Just keep-alive messages
        return;
      }

      if (data.type === 'created' || data.type === 'updated' || data.type === 'deleted') {
        console.log(`🔄 Quick Reply ${data.type}:`, data.replyId);

        // Re-sync saved replies from server
        await syncSavedReplies();
      }
    } catch (error) {
      console.error('Error processing saved replies stream event:', error);
    }
  };

  savedRepliesEventSource.onerror = (error) => {
    console.error('❌ Saved replies stream error:', error);
    savedRepliesEventSource.close();

    // Retry connection after 5 seconds
    setTimeout(() => {
      if (authState.isAuthenticated) {
        console.log('🔄 Reconnecting to saved replies stream...');
        connectSavedRepliesStream();
      }
    }, 5000);
  };
}

/**
 * Sync saved replies from server (called by real-time updates)
 */
async function syncSavedReplies() {
  if (!authState.isAuthenticated) return;

  try {
    const response = await fetch(
      `${API_URL}/api/extension/saved-replies?userId=${authState.user.id}`,
      {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Update local storage
        const settings = await chrome.storage.local.get('settings');
        const updatedSettings = {
          ...settings.settings,
          quickReplies: data.data || []
        };

        await chrome.storage.local.set({ settings: updatedSettings });
        console.log(`✅ Real-time sync: ${data.data?.length || 0} quick replies updated`);

        // Notify all tabs about the update
        broadcastMessage({
          type: 'QUICK_REPLIES_UPDATED',
          data: { quickReplies: data.data }
        });
      }
    }
  } catch (error) {
    console.error('❌ Error syncing saved replies:', error);
  }
}

// Load auth state immediately when service worker starts
(async () => {
  console.log('🎯 Farisly AI Background Service Worker initialized');
  await loadAuthState();
  console.log('✅ Auth state loaded on initialization:', {
    isAuthenticated: authState.isAuthenticated,
    userEmail: authState.user?.email
  });

  // Sync extension config on startup
  await syncExtensionConfig();
  console.log('✅ Extension config synced on initialization');

  // Connect to real-time config stream if authenticated
  if (authState.isAuthenticated) {
    await connectConfigStream();
    console.log('✅ Real-time config stream connected');

    // Connect to real-time saved replies stream
    await connectSavedRepliesStream();
    console.log('✅ Real-time saved replies stream connected');

    // Start heartbeat to indicate extension is installed
    startHeartbeat();
    console.log('✅ Extension heartbeat started');
  }
})();

/**
 * Send heartbeat to server every 30 seconds to indicate extension is active
 */
function startHeartbeat() {
  // Send initial heartbeat
  sendHeartbeat();

  // Send heartbeat every 30 seconds
  setInterval(() => {
    if (authState.isAuthenticated) {
      sendHeartbeat();
    }
  }, 30000); // 30 seconds
}

/**
 * Send heartbeat ping to server
 */
async function sendHeartbeat() {
  try {
    await fetch(`${API_URL}/api/extension/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: authState.user.id })
    });
    console.log('💓 Heartbeat sent');
  } catch (error) {
    console.error('❌ Failed to send heartbeat:', error);
  }
}
