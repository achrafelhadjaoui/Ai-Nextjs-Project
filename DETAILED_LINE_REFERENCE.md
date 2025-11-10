# DETAILED LINE REFERENCE - All Icon Click Components

## File: /extension/content/content-enhanced.js

### Class Constructor (Line 16-36)
```javascript
constructor() {
    this.isVisible = false;           // Line 18 - Visibility state
    this.isMinimized = false;         // Line 19
    this.isDragging = false;          // Line 20
    this.isIconDragging = false;      // Line 21
    // ... more state variables
    this.init();                       // Line 36
}
```

### Initialization (Line 39-102)
```javascript
async init() {
    this.setupMessageListeners();     // Line 44 - FIRST: Setup message handlers
    await this.checkAuthentication(); // Line 47
    const isAllowed = await this.checkSiteAllowed(); // Line 51
    if (!isAllowed) return;           // Line 54 - Exit if not allowed
    this.isEnabled = true;            // Line 61
    await this.loadSettings();        // Line 65
    this.createIcon();                // Line 69
    this.createPanel();               // Line 72
    if (this.isAuthenticated) {
        this.quickRepliesManager = new QuickRepliesManager(); // Line 79
        this.grammarChecker = new GrammarChecker();           // Line 82
        this.setupEventListeners();   // Line 91
    }
}
```

### Icon Creation (Line 218-318)

#### Create Icon Container & Element (Line 224-258)
```javascript
createIcon() {
    // Remove existing
    if (this.iconContainer && this.iconContainer.parentNode) {
        this.iconContainer.parentNode.removeChild(this.iconContainer); // Line 221
    }
    
    this.iconContainer = document.createElement('div');      // Line 224
    this.iconContainer.id = 'farisly-ai-icon-container';    // Line 225
    
    this.icon = document.createElement('div');              // Line 238
    this.icon.id = 'farisly-ai-icon';                       // Line 239
    this.icon.innerHTML = '🤖';                             // Line 240
    // ... styles applied ...
}
```

#### Event Listener 1: Pointer Enter (Line 289-296)
```javascript
this.iconContainer.addEventListener('pointerenter', () => {
    this.icon.style.transform = 'scale(1.1)';               // Line 291
    this.closeIconBtn.style.display = 'flex';               // Line 293
    this.closeIconBtn.style.pointerEvents = 'auto';         // Line 294
});
```

#### Event Listener 2: Pointer Leave (Line 298-305)
```javascript
this.iconContainer.addEventListener('pointerleave', () => {
    this.icon.style.transform = 'scale(1)';                 // Line 300
    this.closeIconBtn.style.display = 'none';               // Line 302
    this.closeIconBtn.style.pointerEvents = 'none';         // Line 303
});
```

#### Event Listener 3: Close Button Pointer Down (Line 308-312)
```javascript
this.closeIconBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation();              // Line 309 - CRITICAL
    e.preventDefault();               // Line 310 - CRITICAL
    this.hideIcon();                  // Line 311
});
```

#### Setup Simple Click (Line 315)
```javascript
this.setupSimpleIconClick();          // Line 315
```

### Simple Click Handler Setup (Line 320-338)

```javascript
/**
 * Setup simple click handler for icon - opens panel on click
 */
setupSimpleIconClick() {
    this.icon.addEventListener('click', (e) => {            // Line 324
        console.log('👆 Icon clicked!', { target: e.target });

        // Don't toggle if clicking close button
        if (e.target === this.closeIconBtn) {               // Line 328 - TARGET CHECK
            console.log('❌ Click was on close button - ignoring');
            return;                                         // Line 330 - RETURN EARLY
        }

        console.log('✅ Opening/closing panel');
        this.togglePanel();                                 // Line 334 - MAIN CALL
    });

    console.log('✅ Simple click handler attached to icon');
}
```

### Panel Creation (Line 534-635)

#### Remove Old Panel (Line 535-538)
```javascript
createPanel(appendToDOM = true) {
    if (this.panel && this.panel.parentNode) {
        this.panel.parentNode.removeChild(this.panel);      // Line 537
    }
```

#### Create New Element (Line 540-542)
```javascript
    this.panel = document.createElement('div');            // Line 540
    this.panel.id = 'farisly-ai-panel';                    // Line 541
    this.panel.className = 'farisly-ai-panel';             // Line 542
```

#### Conditional HTML (Line 544-607)
```javascript
    if (!this.isAuthenticated) {                            // Line 545
        // Auth gate HTML (lines 546-587)
        this.panel.innerHTML = `
            <!-- Sign In button, Sync button -->
        `;                                                  // Line 587
    } else {
        // Full UI with tabs (lines 588-607)
        this.panel.innerHTML = `
            <!-- Tab buttons and content -->
        `;                                                  // Line 606
    }
```

#### Set Initial Styles (Line 610-620)
```javascript
    this.panel.style.height = '280px';                      // Line 610
    this.panel.style.setProperty('top', '20px', 'important');    // Line 616
    this.panel.style.setProperty('right', '20px', 'important'); // Line 617
```

#### Hide Initially (Line 622-623)
```javascript
    this.panel.classList.add('hidden');                     // Line 622
    this.panel.style.opacity = '0';                         // Line 623
```

#### Append to DOM (Line 626-628)
```javascript
    if (appendToDOM) {
        document.body.appendChild(this.panel);              // Line 627
    }
```

#### Show Initial Tab (Line 631-632)
```javascript
    if (this.isAuthenticated) {
        this.showTab('compose');                            // Line 632
    }
```

### Event Listeners Setup (Line 641-923)

#### Panel Dragging - Mouse Down (Line 644-657)
```javascript
setupEventListeners() {
    const header = this.panel.querySelector('#panel-header');
    header.addEventListener('mousedown', (e) => {           // Line 644
        if (e.target.closest('.farisly-panel-btn')) return; // Line 646
        e.preventDefault();                                 // Line 648
        this.isDragging = true;                             // Line 649
        this.panel.classList.add('dragging');               // Line 650
        // ... calculate drag offset ...
    });
```

#### Panel Dragging - Mouse Move (Line 659-676)
```javascript
    document.addEventListener('mousemove', (e) => {         // Line 659
        if (this.isDragging) {
            // ... position calculations ...
            this.panel.style.left = `${clampedX}px`;       // Line 672
            this.panel.style.top = `${clampedY}px`;        // Line 673
        }
    });
```

#### Panel Dragging - Mouse Up (Line 678-683)
```javascript
    document.addEventListener('mouseup', () => {            // Line 678
        if (this.isDragging) {
            this.isDragging = false;                        // Line 680
            this.panel.classList.remove('dragging');        // Line 681
        }
    });
```

#### Minimize Button (Line 686-705)
```javascript
    this.panel.querySelector('#minimize-btn').addEventListener('click', () => {
        this.isMinimized = !this.isMinimized;               // Line 687
        this.panel.classList.toggle('minimized', this.isMinimized); // Line 688
        // ... show/hide content ...
    });
```

#### Tab Buttons (Line 708-713)
```javascript
    this.panel.querySelectorAll('.farisly-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {               // Line 709
            const tab = btn.dataset.tab;
            this.showTab(tab);                              // Line 711
        });
    });
```

#### Auth Gate Buttons (Line 716-887)
```javascript
    if (!this.isAuthenticated) {                            // Line 716
        const signInBtn = this.panel.querySelector('#auth-gate-signin-btn'); // Line 717
        const syncBtn = this.panel.querySelector('#auth-gate-sync-btn');    // Line 718
        
        if (signInBtn) {
            signInBtn.addEventListener('click', () => {    // Line 721
                chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
            });
        }
        
        if (syncBtn) {
            syncBtn.addEventListener('click', async () => { // Line 750
                // Sync auth logic (lines 751-886)
            });
        }
    }
```

#### Window Resize Listener (Line 908-920)
```javascript
    let resizeTimeout;
    window.addEventListener('resize', () => {              // Line 909
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (this.isVisible && this.panel) {
                const iconRect = this.iconContainer.getBoundingClientRect();
                this.updatePanelPosition(iconRect.left, iconRect.top); // Line 915
            }
        }, 150);
    });
```

### Message Listeners (Line 929-1025)

```javascript
setupMessageListeners() {
    chrome.runtime.onMessage.addListener(async (request) => {  // Line 931
        if (request.type === 'TOGGLE_PANEL') {              // Line 932
            if (this.iconContainer && this.iconContainer.style.display === 'none') {
                this.showIcon();                            // Line 935
            }
            this.togglePanel();                             // Line 938
        } else if (request.type === 'OPEN_QUICK_REPLIES') { // Line 939
            this.showTab('quick-replies');                  // Line 940
            if (!this.isVisible) {
                this.togglePanel();                         // Line 942
            }
        } else if (request.type === 'CONFIG_UPDATED') {     // Line 978
            // Dynamic enable/disable (lines 979-1020)
        } else if (request.type === 'DISABLE_EXTENSION') {  // Line 1021
            this.disable();                                 // Line 1022
        }
    });
}
```

### TEXT SELECTION DETECTION (Line 1030-1065)

```javascript
setupTextSelectionDetection() {
    document.addEventListener('mouseup', () => {            // Line 1031
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text.length > 0) {
            this.selectedText = text;                       // Line 1036
            this.selectedElement = selection.anchorNode.parentElement;
            
            if (selection.rangeCount > 0) {
                this.selectedRange = selection.getRangeAt(0).cloneRange(); // Line 1041
            }
            
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                this.selectionStart = activeElement.selectionStart; // Line 1047
                this.selectionEnd = activeElement.selectionEnd;     // Line 1048
                this.selectedElement = activeElement;
            }
            
            this.showQuickActionMenu(selection);             // Line 1055
        }
    });
    
    document.addEventListener('mousedown', (e) => {         // Line 1060
        if (!e.target.closest('.farisly-quick-menu')) {
            this.hideQuickActionMenu();
        }
    });
}
```

### TOGGLE PANEL FUNCTION (Line 1491-1555) - THE MOST CRITICAL

```javascript
togglePanel() {
    console.log('🔄 togglePanel called, current state:', this.isVisible, 'panel exists:', !!this.panel);
    // Line 1492

    // VALIDATION
    if (!this.panel) {                                      // Line 1495
        console.error('❌ Panel does not exist! Cannot toggle.');
        return;
    }

    // STATE DETECTION - Check actual DOM state
    const isCurrentlyHidden = this.panel.classList.contains('hidden'); // Line 1501
    const currentOpacity = this.panel.style.opacity;                   // Line 1502
    console.log('📊 Panel DOM state:', {                   // Line 1503
        hasHiddenClass: isCurrentlyHidden,
        opacity: currentOpacity,
        isVisible: this.isVisible
    });

    // STATE SYNC FIX - THE CRITICAL FIX!
    if (isCurrentlyHidden && this.isVisible) {             // Line 1510 - DETECTION
        console.warn('⚠️ State mismatch detected! Panel hidden but isVisible=true. Fixing...');
        this.isVisible = false;                            // Line 1512 - FIX
    }

    // TOGGLE STATE
    this.isVisible = !this.isVisible;                       // Line 1515

    if (this.isVisible) {                                   // Line 1517
        console.log('📂 Opening panel...');                 // Line 1518

        // CRITICAL FIX: Make panel visible (but transparent) FIRST
        // so dimensions are calculated correctly
        this.panel.classList.remove('hidden');             // Line 1522
        this.panel.classList.add('visible');               // Line 1523
        this.panel.style.opacity = '0';                    // Line 1524 - Keep invisible

        // Force browser to calculate layout (reflow)
        void this.panel.offsetHeight;                       // Line 1527

        // Calculate correct height for current tab
        this.adjustPanelHeightForTab(this.currentTab, true); // Line 1532

        // Position panel relative to icon
        const iconRect = this.iconContainer.getBoundingClientRect(); // Line 1535
        this.updatePanelPosition(iconRect.left, iconRect.top);        // Line 1536

        // Fade in the panel
        requestAnimationFrame(() => {                       // Line 1539
            this.panel.style.opacity = '1';               // Line 1540
        });

        console.log('✅ Panel opened with correct height for tab:', this.currentTab);
    } else {
        console.log('📁 Closing panel...');                 // Line 1545
        this.panel.style.opacity = '0';                    // Line 1546

        setTimeout(() => {                                  // Line 1548
            this.panel.classList.remove('visible');        // Line 1550
            this.panel.classList.add('hidden');            // Line 1551
            console.log('✅ Panel closed');                 // Line 1552
        }, 300);  // Wait for fade-out animation          // Line 1553
    }
}
```

### Update Panel Position (Line 344-410)

```javascript
updatePanelPosition(iconX, iconY) {
    // Get current dimensions
    const iconWidth = this.iconContainer.offsetWidth;      // Line 346
    const iconHeight = this.iconContainer.offsetHeight;    // Line 347
    const panelWidth = this.panel.offsetWidth;             // Line 348
    const panelHeight = this.panel.offsetHeight;           // Line 349
    
    // Calculate position to show panel next to icon
    // ... positioning logic ...
}
```

### Show Tab (Line 1560-1589)

```javascript
showTab(tabName) {
    this.currentTab = tabName;                             // Line 1561
    
    // Update tab buttons
    this.panel.querySelectorAll('.farisly-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName); // Line 1565
    });
    
    // Update content
    const content = this.panel.querySelector('#panel-content');
    
    switch(tabName) {
        case 'compose':
            this.showComposeTab(content);                 // Line 1573
            break;
        case 'quick-replies':
            this.showQuickRepliesTab(content);            // Line 1576
            break;
        case 'ai-reply':
            this.showAIReplyTab(content);                 // Line 1579
            break;
    }
    
    requestAnimationFrame(() => {
        this.adjustPanelHeightForTab(tabName);            // Line 1587
    });
}
```

### Adjust Panel Height (Line 1598-1642)

```javascript
adjustPanelHeightForTab(tabName, immediate = false) {
    if (!this.panel) return;                              // Line 1599
    
    const content = this.panel.querySelector('#panel-content');
    if (!content) return;                                 // Line 1602
    
    const calculateAndSetHeight = () => {                 // Line 1604
        const header = this.panel.querySelector('.farisly-panel-header');
        const tabNav = this.panel.querySelector('.farisly-tab-nav');
        const headerHeight = header ? header.offsetHeight : 52;
        const tabNavHeight = tabNav ? tabNav.offsetHeight : 46;
        
        const contentHeight = content.scrollHeight;       // Line 1612
        const totalHeight = headerHeight + tabNavHeight + contentHeight + 16; // Line 1615
        
        const viewportMaxHeight = window.innerHeight - 40;
        const finalHeight = Math.min(totalHeight, viewportMaxHeight); // Line 1619
        
        this.panel.style.height = `${finalHeight}px`;    // Line 1622
    };
    
    if (immediate) {
        calculateAndSetHeight();                         // Line 1632
    } else {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                calculateAndSetHeight();                 // Line 1638
            });
        });
    }
}
```

## File: /extension/content/panel.css

### Panel Visible Class (Line 40-43)
```css
/* When panel is visible */
#farisly-ai-panel.visible {
  display: flex !important;  /* Shows panel */
}
```

### Panel Hidden Class (Line 45-48)
```css
/* When panel is hidden */
#farisly-ai-panel.hidden {
  display: none !important;  /* Hides panel */
}
```

### Panel Transition (Line 33)
```css
transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s ease, height 0.3s ease !important;
```

## File: /extension/manifest.json

### Content Scripts (Line 33-46)
```json
"content_scripts": [
    {
        "matches": ["<all_urls>"],
        "js": [
            "config.js",
            "content/DragManager.js",                    // Line 38 - LOADED BUT NOT USED
            "content/QuickRepliesManager.js",            // Line 39
            "content/GrammarChecker.js",                 // Line 40
            "content/ConversationDetector.js",           // Line 41
            "content/content-enhanced.js"                // Line 42 - MAIN FILE
        ],
        "css": ["content/panel.css"],                    // Line 44
        "run_at": "document_idle"                        // Line 45
    }
]
```

### Action Configuration (Line 21-29)
```json
"action": {
    "default_title": "Farisly AI - Click to toggle panel",
    "default_icon": {                                   // Line 23
        "16": "assets/icon16.png",
        "32": "assets/icon32.png",
        "48": "assets/icon48.png",
        "128": "assets/icon128.png"
    }
}
```

### Keyboard Shortcut (Line 58-72)
```json
"commands": {
    "toggle-panel": {                                   // Line 59
        "suggested_key": {
            "default": "Ctrl+Shift+F",                  // Line 61
            "mac": "Command+Shift+F"                    // Line 62
        },
        "description": "Toggle Farisly AI panel"
    },
    "quick-reply": {                                    // Line 66
        "suggested_key": {
            "default": "Ctrl+Shift+Q",                  // Line 68
            "mac": "Command+Shift+Q"                    // Line 69
        },
        "description": "Open Quick Replies"
    }
}
```

## File: /extension/background/background.js

### Extension Icon Click Handler (Line 965-968)
```javascript
/**
 * Handle extension icon click
 */
chrome.action.onClicked.addListener(async (tab) => {    // Line 965
    // Toggle panel on the active tab
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' }); // Line 967
});
```

### Keyboard Command Listener (Line 927-937)
```javascript
/**
 * Handle keyboard commands
 */
chrome.commands.onCommand.addListener(async (command) => { // Line 927
    console.log('⌨️  Command triggered:', command);
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (command === 'toggle-panel') {                   // Line 932
        chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' }); // Line 933
    } else if (command === 'quick-reply') {            // Line 934
        chrome.tabs.sendMessage(tab.id, { type: 'OPEN_QUICK_REPLIES' }); // Line 935
    }
});
```

---

## SUMMARY OF KEY LINES

| Component | File | Line | Purpose |
|-----------|------|------|---------|
| Icon click listener | content-enhanced.js | 324 | Main click handler |
| Close button check | content-enhanced.js | 328 | Target validation |
| Call togglePanel | content-enhanced.js | 334 | Toggle visibility |
| Panel hidden class | panel.css | 47 | Hide panel (display:none) |
| Panel visible class | panel.css | 42 | Show panel (display:flex) |
| State mismatch detection | content-enhanced.js | 1510 | Detect out-of-sync state |
| State mismatch fix | content-enhanced.js | 1512 | Fix the state |
| Remove hidden class | content-enhanced.js | 1522 | Show panel |
| Add visible class | content-enhanced.js | 1523 | Show panel |
| Force reflow | content-enhanced.js | 1527 | Calculate dimensions |
| Update position | content-enhanced.js | 1536 | Position relative to icon |
| Fade in animation | content-enhanced.js | 1540 | opacity: 0 → 1 |
| Extension icon click | background.js | 967 | Send TOGGLE_PANEL message |
| Keyboard shortcut | manifest.json | 61 | Ctrl+Shift+F to toggle |

