# Grammar Checker Testing Guide

## Current Status
✅ **Critical bug FIXED**: Changed from `AI_COMPOSE` to `CHECK_GRAMMAR` message type
✅ **Debug logging added**: Comprehensive console logs at every step
✅ **API endpoint corrected**: Now using `/api/ai/grammar` route

## How to Test

### Step 1: Reload the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Find "Farisly AI" extension
3. Click the **refresh/reload icon** 🔄
4. This ensures the latest code changes are loaded

### Step 2: Open Console
1. Right-click anywhere on a webpage (like Gmail)
2. Click "Inspect" or press `Cmd+Option+I`
3. Click the "Console" tab
4. Keep this open while testing

### Step 3: Test Grammar Checking
1. Navigate to a supported website (Gmail, LinkedIn, etc.)
2. Click in a text field (compose email, post, etc.)
3. **Type text with grammar errors**, for example:
   - "i am not gived the things"
   - "she dont know nothing"
   - "we was going to store"
4. **IMPORTANT**: After typing, **WAIT 2 SECONDS** without clicking anywhere
5. The grammar checker uses a 2-second delay before checking

### Step 4: Check Console Logs

You should see this sequence of logs:

```
✅ Grammar checker enabled
👁️ Monitoring field: TEXTAREA compose-input API Key: ✅ Set
📝 Field focused: TEXTAREA Text length: 27
⌨️ Input detected in field: TEXTAREA Text length: 27
⏱️ Grammar check scheduled (2000ms delay)...
⏰ Debounce timer expired, starting grammar check...
📤 Sending grammar check request: {type: 'CHECK_GRAMMAR', textLength: 27}
📥 Received grammar check response: {success: true, errors: Array(3)}
✅ Grammar API returned 3 errors: [{type: "Grammar Error", ...}, ...]
📍 Rendering 3 error markers
✨ Created marker for error at position 0-1
```

### Expected Results

✅ **Red squiggly underlines** should appear under grammar errors
✅ **Console shows errors detected** from the API
✅ **Error count badge** may appear on the field

### Troubleshooting

#### If no logs appear:
- Extension may not be loaded - reload it
- Field may not be supported - try Gmail compose
- Console may be filtered - click "All levels" in console filter

#### If logs show "⚠️ Grammar checker NOT enabled":
- API key is not set
- Go to extension settings and add your OpenAI API key

#### If logs show input but no API call:
- Check for JavaScript errors in console
- Verify the 2-second debounce timer completes

#### If API returns errors but no red lines:
- Check for marker rendering logs starting with "📍"
- Verify SVG marker creation logs "✨ Created marker"
- Check if markers are created but positioned incorrectly

## Technical Details

### Fixed Bug Location
**File**: `extension/content/GrammarChecker.js`
**Lines**: 228-234

**BEFORE** (Wrong):
```javascript
const response = await chrome.runtime.sendMessage({
    type: 'AI_COMPOSE',  // WRONG ENDPOINT
    payload: { text, action: 'grammar', apiKey }
});
```

**AFTER** (Correct):
```javascript
const response = await chrome.runtime.sendMessage({
    type: 'CHECK_GRAMMAR',  // CORRECT ENDPOINT
    payload: { text, apiKey }
});
```

### API Response Structure
```json
{
  "success": true,
  "errors": [
    {
      "type": "Grammar Error",
      "message": "Subject-verb agreement error",
      "original": "i am",
      "suggestion": "I am",
      "start": 0,
      "end": 4
    }
  ],
  "originalText": "i am not gived the things"
}
```

## Next Steps

After testing, please share:
1. **Console logs** (copy/paste the entire output)
2. **Screenshot** showing if red underlines appeared
3. **Text you typed** for testing

This will help confirm if the fix is working or if there are remaining issues.
