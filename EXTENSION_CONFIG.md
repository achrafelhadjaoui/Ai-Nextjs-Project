# Extension Configuration System

## Overview

This document describes the .env-based configuration system for the Farisly AI browser extension. All configuration is centralized in `.env.local` and automatically built into the extension.

## How It Works

```
.env.local → build script → extension/config.js → extension files
```

1. **Source**: `.env.local` contains `NEXT_PUBLIC_APP_URL`
2. **Build**: `npm run build:extension` generates `extension/config.js`
3. **Usage**: Extension files use `window.FARISLY_CONFIG.API_URL` or `self.FARISLY_CONFIG.API_URL`

## Quick Start

### 1. Update Configuration

Edit `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 2. Build Extension Config

```bash
npm run build:extension
```

This generates `extension/config.js` with the correct API URL.

### 3. Reload Extension

1. Go to `chrome://extensions/`
2. Find **Farisly AI**
3. Click **Reload** (↻)

## File Structure

```
.
├── .env.local                          # Source of truth for configuration
├── scripts/
│   └── build-extension-config.js       # Build script
├── extension/
│   ├── config.js                       # AUTO-GENERATED - do not edit
│   ├── manifest.json                   # Loads config.js first
│   ├── background/
│   │   └── background.js               # Uses self.FARISLY_CONFIG
│   ├── popup/
│   │   ├── popup.html                  # Loads ../config.js
│   │   └── popup.js                    # Uses window.FARISLY_CONFIG
│   └── content/
│       ├── content-enhanced.js         # Uses window.FARISLY_CONFIG
│       └── content.js                  # Uses window.FARISLY_CONFIG
└── package.json                        # Contains build:extension script
```

## Configuration Usage

### In Background Service Worker

```javascript
// background/background.js
importScripts('config.js');
const API_URL = self.FARISLY_CONFIG?.API_URL || 'http://localhost:3001';
```

### In Popup Pages

```html
<!-- popup.html -->
<script src="../config.js"></script>
<script src="popup.js"></script>
```

```javascript
// popup.js
const API_URL = window.FARISLY_CONFIG?.API_URL || 'http://localhost:3001';
chrome.tabs.create({ url: `${API_URL}/dashboard` });
```

### In Content Scripts

```javascript
// content-enhanced.js or content.js
// config.js is loaded first via manifest.json
const API_URL = window.FARISLY_CONFIG?.API_URL || 'http://localhost:3001';
window.open(`${API_URL}/panel`, '_blank');
```

## Environment Variables

### .env.local

```env
# Development (default)
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Production
NEXT_PUBLIC_APP_URL=https://api.farisly.com
```

## Build Script

Located at `scripts/build-extension-config.js`:

- Reads `NEXT_PUBLIC_APP_URL` from `.env.local`
- Generates `extension/config.js`
- Makes config available in both `window` and `self` contexts

## Manifest Configuration

The `manifest.json` loads `config.js` **first** in the content_scripts array:

```json
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": [
        "config.js",                    // ← LOADED FIRST
        "content/DragManager.js",
        "content/QuickRepliesManager.js",
        "content/GrammarChecker.js",
        "content/ConversationDetector.js",
        "content/content-enhanced.js"
      ]
    }
  ]
}
```

## Development Workflow

### Option 1: Running on Default Port (3001)

1. Your `.env.local` is already configured for port 3001
2. Run: `npm run dev` (now uses `-p 3001` flag)
3. Extension config is already built for port 3001

### Option 2: Changing Ports

If you want to run on a different port:

1. Edit `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXTAUTH_URL=http://localhost:3000
   ```

2. Build extension config:
   ```bash
   npm run build:extension
   ```

3. Update npm script in `package.json`:
   ```json
   "dev": "next dev -p 3000"
   ```

4. Reload extension in Chrome

## Production Deployment

### 1. Update .env.local

```env
NEXT_PUBLIC_APP_URL=https://api.farisly.com
NEXTAUTH_URL=https://api.farisly.com
```

### 2. Build Extension Config

```bash
npm run build:extension
```

### 3. Verify Generated Config

Check `extension/config.js`:
```javascript
const API_URL = 'https://api.farisly.com';
```

### 4. Update Manifest (if needed)

Update `host_permissions` in `manifest.json`:
```json
"host_permissions": [
  "https://api.openai.com/*",
  "https://api.farisly.com/*",
  "https://*.farisly.com/*"
]
```

### 5. Build Production Version

Package the extension for Chrome Web Store.

## Files Modified

All files now use centralized configuration:

✅ **extension/background/background.js**
- Line 7: `importScripts('config.js')`
- Line 10: `const API_URL = self.FARISLY_CONFIG?.API_URL || 'http://localhost:3001';`

✅ **extension/popup/popup.html**
- Line 213: `<script src="../config.js"></script>`

✅ **extension/popup/popup.js**
- Line 8: `const API_URL = window.FARISLY_CONFIG?.API_URL || 'http://localhost:3001';`
- Lines 26, 33, 40: Uses `${API_URL}/...` template literals

✅ **extension/content/content-enhanced.js**
- Line 14: `const API_URL = window.FARISLY_CONFIG?.API_URL || 'http://localhost:3001';`
- Lines 2158, 2634: Uses `${API_URL}/...` template literals

✅ **extension/content/content.js**
- Line 10: `const API_URL = window.FARISLY_CONFIG?.API_URL || 'http://localhost:3001';`
- Line 1168: Uses `${API_URL}/api/settings`

✅ **extension/manifest.json**
- Line 31: Removed `"type": "module"` to allow `importScripts()`
- Line 37: Added `"config.js"` as first script

✅ **package.json**
- Line 6: `"dev": "next dev -p 3001"`
- Line 11: `"build:extension": "node scripts/build-extension-config.js"`

✅ **.env.local**
- Line 22: `NEXT_PUBLIC_APP_URL=http://localhost:3001`
- Line 33: `NEXTAUTH_URL=http://localhost:3001`

## Troubleshooting

### Extension icon not appearing

1. Check browser console for errors
2. Verify `extension/config.js` exists
3. Check config.js has correct API_URL
4. Reload extension in chrome://extensions/

### Wrong URL being used

1. Check `.env.local` has correct `NEXT_PUBLIC_APP_URL`
2. Run `npm run build:extension`
3. Verify `extension/config.js` has updated URL
4. Reload extension

### Build script errors

```bash
# Check if dotenv is installed
npm list dotenv

# Reinstall if needed
npm install --save-dev dotenv --legacy-peer-deps

# Run build with debug
npm run build:extension
```

## Best Practices

1. **Never edit `extension/config.js` manually** - it's auto-generated
2. **Always run `npm run build:extension` after changing `.env.local`**
3. **Add `extension/config.js` to .gitignore** (optional, but recommended)
4. **Use fallback values** in all config accesses: `?.API_URL || 'http://localhost:3001'`
5. **Test extension after every config change**

## Summary

This configuration system provides:

✅ **Single source of truth** - All config in `.env.local`
✅ **Type-safe** - Generated config file is consistent
✅ **Environment-agnostic** - Works for dev and production
✅ **Safe loading** - Fallbacks prevent extension breakage
✅ **Simple workflow** - Edit .env, run build, reload

No more hardcoded URLs, no more port conflicts, no more manual updates across multiple files!
