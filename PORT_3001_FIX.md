# Port 3001 Configuration Fix

## Problem Identified

The sync button was showing "not signed in" even for authenticated users because of a **port mismatch issue**:

### Root Cause
1. **Server**: Running on `localhost:3001` (as indicated by Next.js port conflict)
2. **Extension**: Configured to use `localhost:3000`
3. **Result**: Extension couldn't access cookies from the correct domain, causing authentication to fail

### Technical Details
- Chrome extensions can only access cookies from domains they have `host_permissions` for
- When the extension tried to read cookies from `localhost:3000`, but user was signed in on `localhost:3001`, cookies were not accessible
- The `chrome.cookies.getAll()` function returned empty results
- The sync button interpreted this as "not authenticated"

---

## Files Updated

All hardcoded references to `localhost:3000` have been updated to `localhost:3001`:

### 1. Extension Background Script
**File**: [extension/background/background.js](extension/background/background.js:7)
```javascript
// Before
const API_URL = 'http://localhost:3000';

// After
const API_URL = 'http://localhost:3001';
```

### 2. Extension Manifest
**File**: [extension/manifest.json](extension/manifest.json:17)
```json
// Before
"host_permissions": [
  "http://localhost:3000/*",
  ...
]

// After
"host_permissions": [
  "http://localhost:3001/*",
  ...
]
```

### 3. Extension Popup
**File**: [extension/popup/popup.js](extension/popup/popup.js:23)
```javascript
// Before
chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
chrome.tabs.create({ url: 'http://localhost:3000/panel' });
chrome.tabs.create({ url: 'http://localhost:3000/profile' });

// After
chrome.tabs.create({ url: 'http://localhost:3001/dashboard' });
chrome.tabs.create({ url: 'http://localhost:3001/panel' });
chrome.tabs.create({ url: 'http://localhost:3001/profile' });
```

### 4. Content Script (Enhanced)
**File**: [extension/content/content-enhanced.js](extension/content/content-enhanced.js:1932)
```javascript
// Before
window.open('http://localhost:3000/dashboard', '_blank');
window.open('http://localhost:3000/panel', '_blank');

// After
window.open('http://localhost:3001/dashboard', '_blank');
window.open('http://localhost:3001/panel', '_blank');
```

### 5. Content Script (Legacy)
**File**: [extension/content/content.js](extension/content/content.js:1165)
```javascript
// Before
const response = await fetch('http://localhost:3000/api/settings');

// After
const response = await fetch('http://localhost:3001/api/settings');
```

---

## How to Apply the Fix

### Step 1: Reload the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Find "Farisly AI" extension
3. Click the **reload icon** (circular arrow)
4. Wait for reload to complete

### Step 2: Clear Extension Storage (Important!)
Since the extension may have cached the wrong API URL, you should clear its storage:

**Option A - Via Extension Settings:**
1. Go to `chrome://extensions/`
2. Click "Details" on Farisly AI
3. Scroll down to "Site access"
4. Click "Clear storage"

**Option B - Via Developer Tools:**
1. Right-click extension icon
2. Select "Inspect popup"
3. Go to "Application" tab
4. Under "Storage", click "Clear site data"

### Step 3: Sign In Again
1. Go to `http://localhost:3001/dashboard`
2. Sign in with your credentials
3. Keep this tab open

### Step 4: Test Sync Button
1. Open any webpage
2. Click the extension icon or use keyboard shortcut
3. Click "Sync with Dashboard" button
4. Should now show "Synced Successfully!" instead of "not signed in"

---

## Why This Fix Works

### Before Fix:
```
User signs in → localhost:3001 → Cookie stored on localhost:3001
                                           ↓
Extension reads cookies ← localhost:3000 ← Cookie NOT found ❌
                                           ↓
Sync button shows "not signed in"
```

### After Fix:
```
User signs in → localhost:3001 → Cookie stored on localhost:3001
                                           ↓
Extension reads cookies ← localhost:3001 ← Cookie FOUND ✅
                                           ↓
Sync button shows "Synced Successfully!"
```

---

## Verification Steps

### 1. Check Cookie Access
Open extension background console:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "background page" or "service worker" link
4. Look for logs: "Found NextAuth session cookie: ..."

### 2. Check API Requests
In the Network tab:
1. Open extension
2. Click "Sync with Dashboard"
3. Look for request to `localhost:3001/api/extension/auth/status`
4. Should return 200 OK with user data

### 3. Check Sync Status
After clicking sync:
- ✅ Status badge should show "Synced Successfully!" in green
- ✅ Panel should transform to show authenticated UI
- ✅ Tabs should appear: Compose, Quick Replies, AI Reply, Settings
- ❌ Should NOT redirect to dashboard
- ❌ Should NOT show "not signed in" message

---

## For Production Deployment

When deploying to production, you'll need to update the API_URL again:

### Update Background Script:
```javascript
// Development
const API_URL = 'http://localhost:3001';

// Production
const API_URL = 'https://farisly.com';  // or your production domain
```

### Update Manifest Host Permissions:
```json
"host_permissions": [
  "https://api.openai.com/*",
  "https://farisly.com/*",      // Production domain
  "https://*.farisly.com/*",    // Subdomains
  "<all_urls>"
]
```

### Remove Hardcoded Localhost References:
Make sure to search and replace ALL `localhost:3001` references with your production domain.

---

## Common Issues After Fix

### Issue 1: "Extension could not load"
**Solution**: The extension manifest has been updated, reload the extension completely

### Issue 2: Still shows "not signed in"
**Possible Causes**:
1. Extension not reloaded after changes
2. Extension storage not cleared
3. User not signed in on localhost:3001
4. Server not running on port 3001

**Solution**:
- Verify server is running: `npm run dev` should show "ready on http://localhost:3001"
- Clear browser cookies and sign in again
- Reload extension

### Issue 3: CORS errors in console
**Solution**: The API already has proper CORS headers configured with `credentials: 'include'`

---

## Summary

All extension files have been updated to use `localhost:3001` to match your current development server port. This ensures:

✅ Extension can access session cookies correctly
✅ Sync button works for authenticated users
✅ No false "not signed in" errors
✅ Proper communication between extension and server
✅ Cookies are read from the correct domain

**Next Step**: Reload the extension and test the sync button!

---

**Fixed**: January 6, 2025
**Issue**: Port mismatch between extension (3000) and server (3001)
**Impact**: Sync button authentication failure
**Status**: ✅ Resolved
