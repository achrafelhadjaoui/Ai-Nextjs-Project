/**
 * Farisly AI Enhanced Content Script
 * Features:
 * - Draggable icon that moves with panel
 * - Closable icon (can hide completely)
 * - Works only on admin-specified websites
 * - Applies features directly to page content (no redirects)
 * - Text selection detection for grammar fix, rewrite, etc.
 */

console.log('🚀 Farisly AI Enhanced Content Script Loaded');

class FarislyAI {
    constructor() {
        this.isVisible = false;
        this.isMinimized = false;
        this.isDragging = false;
        this.isIconDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.iconDragOffset = { x: 0, y: 0 };
        this.currentTab = 'compose';
        this.settings = null;
        this.selectedText = '';
        this.selectedElement = null;
        this.isEnabled = false;
        this.init();
    }

    async init() {
        console.log('🔧 Initializing Farisly AI...');
        console.log('Current URL:', window.location.href);

        // Check if extension should work on this site
        const isAllowed = await this.checkSiteAllowed();
        console.log('Is site allowed?', isAllowed);

        if (!isAllowed) {
            console.log('⏭️  Extension not allowed on this site');
            console.log('👉 Please add this site in Admin Extension Settings or enable "All Sites"');
            return;
        }

        this.isEnabled = true;

        console.log('Initializing Quick Replies Manager...');
        this.quickRepliesManager = new QuickRepliesManager();

        console.log('Loading settings...');
        await this.loadSettings();

        console.log('Creating icon...');
        this.createIcon();

        console.log('Creating panel...');
        this.createPanel();

        console.log('Setting up event listeners...');
        this.setupEventListeners();
        this.setupTextSelectionDetection();

        console.log('✅ Farisly AI initialized successfully');
    }

    /**
     * Check if extension is allowed on current website
     */
    async checkSiteAllowed() {
        try {
            const currentUrl = window.location.href;
            const currentDomain = window.location.hostname;

            console.log('Checking site permission for:', currentDomain);

            // Get settings from background
            const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });

            console.log('Settings response:', response);

            if (!response.success) {
                console.log('Failed to get settings from background');
                return false;
            }

            const settings = response.settings;

            console.log('Extension settings:', {
                enableOnAllSites: settings.enableOnAllSites,
                allowedSites: settings.allowedSites
            });

            // If enabled on all sites
            if (settings.enableOnAllSites) {
                console.log('✅ Extension enabled on all sites');
                return true;
            }

            // Check if current domain is in allowed list
            if (settings.allowedSites && Array.isArray(settings.allowedSites)) {
                const isAllowed = settings.allowedSites.some(site =>
                    currentUrl.toLowerCase().includes(site.toLowerCase()) ||
                    currentDomain.toLowerCase().includes(site.toLowerCase())
                );

                if (isAllowed) {
                    console.log('✅ Site found in allowed list');
                } else {
                    console.log('❌ Site not in allowed list:', settings.allowedSites);
                }

                return isAllowed;
            }

            console.log('❌ No allowed sites configured');
            return false;
        } catch (error) {
            console.error('❌ Error checking site permission:', error);
            return false; // Default to disabled on error
        }
    }

    /**
     * Load settings from storage
     */
    async loadSettings() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
            if (response.success) {
                this.settings = response.settings;
                console.log('⚙️  Settings loaded:', this.settings);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    /**
     * Create floating icon (draggable and closable)
     */
    createIcon() {
        this.iconContainer = document.createElement('div');
        this.iconContainer.id = 'farisly-ai-icon-container';
        this.iconContainer.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 2147483647 !important;
            display: flex !important;
            align-items: flex-start !important;
            gap: 8px !important;
        `;

        this.icon = document.createElement('div');
        this.icon.id = 'farisly-ai-icon';
        this.icon.innerHTML = '🤖';
        this.icon.style.cssText = `
            width: 56px !important;
            height: 56px !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: 2px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 28px !important;
            cursor: grab !important;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3) !important;
            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) !important;
            user-select: none !important;
        `;

        // Close button for icon
        this.closeIconBtn = document.createElement('button');
        this.closeIconBtn.innerHTML = '×';
        this.closeIconBtn.style.cssText = `
            width: 24px !important;
            height: 24px !important;
            background: rgba(255, 59, 48, 0.9) !important;
            border: none !important;
            border-radius: 50% !important;
            color: white !important;
            font-size: 18px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            display: none !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
            transition: all 0.2s ease !important;
        `;

        this.iconContainer.appendChild(this.icon);
        this.iconContainer.appendChild(this.closeIconBtn);
        document.body.appendChild(this.iconContainer);

        // Icon hover effects - always respond to hover
        this.iconContainer.addEventListener('pointerenter', () => {
            // Always apply hover effects (don't check isIconDragging)
            this.icon.style.transform = 'scale(1.1)';
            this.icon.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.6), 0 6px 16px rgba(0, 0, 0, 0.4)';
            this.closeIconBtn.style.display = 'flex';
        });

        this.iconContainer.addEventListener('pointerleave', () => {
            // Always reset hover effects
            this.icon.style.transform = 'scale(1)';
            this.icon.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)';
            this.closeIconBtn.style.display = 'none';
        });

        // Close icon button - use pointerdown for instant response
        this.closeIconBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.hideIcon();
        });

        // Make icon draggable
        this.setupIconDragging();

        console.log('✨ Icon created');
    }

    /**
     * Setup icon dragging functionality using professional DragManager
     */
    setupIconDragging() {
        this.dragManager = new DragManager(this.icon, {
            threshold: 3,

            onDragStart: () => {
                this.isIconDragging = true;
                this.icon.style.cursor = 'grabbing';
                console.log('🎯 Drag started');
            },

            onDrag: (state) => {
                // Clamp to viewport
                const maxX = window.innerWidth - this.iconContainer.offsetWidth;
                const maxY = window.innerHeight - this.iconContainer.offsetHeight;

                const clampedX = Math.max(0, Math.min(state.currentX, maxX));
                const clampedY = Math.max(0, Math.min(state.currentY, maxY));

                // Update position
                this.iconContainer.style.left = `${clampedX}px`;
                this.iconContainer.style.top = `${clampedY}px`;
                this.iconContainer.style.right = 'auto';
                this.iconContainer.style.bottom = 'auto';

                // Move panel with icon if visible
                if (this.isVisible && this.panel) {
                    this.updatePanelPosition(clampedX, clampedY);
                }
            },

            onDragEnd: () => {
                this.isIconDragging = false;
                this.icon.style.cursor = 'grab';
                console.log('🎯 Drag ended');
            },

            onClick: (e) => {
                // Don't click if target is close button
                if (e.target === this.closeIconBtn) return;

                console.log('👆 Icon clicked - toggling panel');
                this.togglePanel();
            }
        });
    }

    /**
     * Update panel position relative to icon
     */
    updatePanelPosition(iconX, iconY) {
        const iconWidth = this.iconContainer.offsetWidth;
        const iconHeight = this.iconContainer.offsetHeight;
        const panelWidth = this.panel.offsetWidth;
        const panelHeight = this.panel.offsetHeight;

        const padding = 10;
        let panelX, panelY;

        // Determine best position for panel based on available space
        const spaceRight = window.innerWidth - (iconX + iconWidth);
        const spaceLeft = iconX;
        const spaceBelow = window.innerHeight - (iconY + iconHeight);
        const spaceAbove = iconY;

        // Prefer right side, but adjust based on space
        if (spaceRight >= panelWidth + padding) {
            // Place to the right of icon
            panelX = iconX + iconWidth + padding;
            panelY = iconY;
        } else if (spaceLeft >= panelWidth + padding) {
            // Place to the left of icon
            panelX = iconX - panelWidth - padding;
            panelY = iconY;
        } else {
            // Not enough horizontal space, try vertical
            if (spaceBelow >= panelHeight + padding) {
                panelX = iconX;
                panelY = iconY + iconHeight + padding;
            } else {
                panelX = iconX;
                panelY = iconY - panelHeight - padding;
            }
        }

        // Clamp to viewport bounds
        const maxX = window.innerWidth - panelWidth - 10;
        const maxY = window.innerHeight - panelHeight - 10;

        const clampedX = Math.max(10, Math.min(panelX, maxX));
        const clampedY = Math.max(10, Math.min(panelY, maxY));

        this.panel.style.left = `${clampedX}px`;
        this.panel.style.top = `${clampedY}px`;
        this.panel.style.right = 'auto';
        this.panel.style.bottom = 'auto';
    }

    /**
     * Hide icon completely
     */
    hideIcon() {
        this.iconContainer.style.transition = 'all 0.3s ease';
        this.iconContainer.style.transform = 'scale(0)';
        this.iconContainer.style.opacity = '0';

        setTimeout(() => {
            this.iconContainer.style.display = 'none';
        }, 300);

        // Close panel if open
        if (this.isVisible) {
            this.togglePanel();
        }

        // Save state
        chrome.storage.local.set({ iconHidden: true });

        // Show toast to restore
        this.showToast('Icon hidden. Click the Farisly AI extension icon to show again', 'info');
    }

    /**
     * Show icon
     */
    showIcon() {
        this.iconContainer.style.display = 'flex';
        this.iconContainer.style.transition = 'all 0.3s ease';

        // Trigger reflow
        this.iconContainer.offsetHeight;

        this.iconContainer.style.transform = 'scale(1)';
        this.iconContainer.style.opacity = '1';

        // Save state
        chrome.storage.local.set({ iconHidden: false });
    }

    /**
     * Toggle icon visibility
     */
    toggleIcon() {
        const isHidden = this.iconContainer.style.display === 'none';

        if (isHidden) {
            this.showIcon();
        } else {
            this.hideIcon();
        }
    }

    /**
     * Create floating panel
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'farisly-ai-panel';
        this.panel.className = 'farisly-ai-panel';

        this.panel.innerHTML = `
            <div class="farisly-panel-header" id="panel-header">
                <div class="farisly-panel-title">
                    <span>🤖</span>
                    <span>Farisly AI</span>
                </div>
                <div class="farisly-panel-actions">
                    <button class="farisly-panel-btn" id="minimize-btn" title="Minimize">−</button>
                    <button class="farisly-panel-btn" id="close-btn" title="Close">×</button>
                </div>
            </div>

            <div class="farisly-tab-nav">
                <button class="farisly-tab-btn active" data-tab="compose">✏️ Compose</button>
                <button class="farisly-tab-btn" data-tab="quick-replies">💾 Quick Replies</button>
                <button class="farisly-tab-btn" data-tab="ai-reply">🤖 AI Reply</button>
                <button class="farisly-tab-btn" data-tab="settings">⚙️ Settings</button>
            </div>

            <div class="farisly-panel-content" id="panel-content">
                <!-- Content will be loaded dynamically -->
            </div>
        `;

        // Initially hide the panel using CSS class
        this.panel.classList.add('hidden');
        this.panel.style.opacity = '0';

        document.body.appendChild(this.panel);
        this.showTab('compose');

        console.log('📋 Panel created (hidden initially)');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Panel dragging
        const header = this.panel.querySelector('#panel-header');
        header.addEventListener('mousedown', (e) => {
            // Don't start dragging if clicking on buttons
            if (e.target.closest('.farisly-panel-btn')) return;

            e.preventDefault(); // Prevent text selection
            this.isDragging = true;
            this.panel.classList.add('dragging');

            const rect = this.panel.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                e.preventDefault(); // Prevent text selection while dragging

                const newX = e.clientX - this.dragOffset.x;
                const newY = e.clientY - this.dragOffset.y;

                const maxX = window.innerWidth - this.panel.offsetWidth;
                const maxY = window.innerHeight - this.panel.offsetHeight;

                const clampedX = Math.max(0, Math.min(newX, maxX));
                const clampedY = Math.max(0, Math.min(newY, maxY));

                this.panel.style.left = `${clampedX}px`;
                this.panel.style.top = `${clampedY}px`;
                this.panel.style.right = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.panel.classList.remove('dragging');
            }
        });

        // Minimize button - collapse to header only
        this.panel.querySelector('#minimize-btn').addEventListener('click', () => {
            this.isMinimized = !this.isMinimized;
            this.panel.classList.toggle('minimized', this.isMinimized);

            const content = this.panel.querySelector('.farisly-panel-content');
            const tabNav = this.panel.querySelector('.farisly-tab-nav');
            const minimizeBtn = this.panel.querySelector('#minimize-btn');

            if (this.isMinimized) {
                content.style.display = 'none';
                tabNav.style.display = 'none';
                minimizeBtn.innerHTML = '□'; // Restore icon
                minimizeBtn.title = 'Restore';
            } else {
                content.style.display = 'block';
                tabNav.style.display = 'flex';
                minimizeBtn.innerHTML = '−'; // Minimize icon
                minimizeBtn.title = 'Minimize';
            }
        });

        // Close button
        this.panel.querySelector('#close-btn').addEventListener('click', () => {
            this.togglePanel();
        });

        // Tab switching
        this.panel.querySelectorAll('.farisly-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.showTab(tab);
            });
        });

        // Listen for messages from background
        chrome.runtime.onMessage.addListener(async (request) => {
            if (request.type === 'TOGGLE_PANEL') {
                // If icon is hidden, show it first
                const isIconHidden = this.iconContainer.style.display === 'none';
                if (isIconHidden) {
                    this.showIcon();
                }
                // Then toggle the panel
                this.togglePanel();
            } else if (request.type === 'OPEN_QUICK_REPLIES') {
                this.showTab('quick-replies');
                if (!this.isVisible) {
                    this.togglePanel();
                }
            } else if (request.type === 'DATA_SYNCED') {
                this.loadSettings();
            } else if (request.type === 'AUTH_UPDATED') {
                // Authentication state changed - refresh current tab
                console.log('🔄 Auth updated:', request.data);
                const currentTab = this.currentTab;

                // Refresh the current tab's content
                if (currentTab === 'quick-replies') {
                    const content = this.tabContent;
                    if (content) {
                        await this.showQuickRepliesTab(content);
                    }
                } else if (currentTab === 'settings') {
                    const content = this.tabContent;
                    if (content) {
                        this.showSettingsTab(content);
                    }
                }
            } else if (request.type === 'CONFIG_UPDATED') {
                // Re-check if site is still allowed
                console.log('🔄 Config updated, re-checking site permission...');
                const isAllowed = await this.checkSiteAllowed();

                if (!isAllowed && this.isEnabled) {
                    // Site is no longer allowed, disable extension
                    console.log('⛔ Site no longer allowed, disabling extension');
                    this.disable();
                } else if (isAllowed && !this.isEnabled) {
                    // Site is now allowed, re-initialize
                    console.log('✅ Site now allowed, re-initializing extension');
                    window.location.reload(); // Reload to re-initialize properly
                }
            } else if (request.type === 'DISABLE_EXTENSION') {
                this.disable();
            }
        });
    }

    /**
     * Setup text selection detection for direct page interaction
     */
    setupTextSelectionDetection() {
        document.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text.length > 0) {
                this.selectedText = text;
                this.selectedElement = selection.anchorNode.parentElement;
                console.log('📝 Text selected:', text.substring(0, 50) + '...');

                // Show quick action menu
                this.showQuickActionMenu(selection);
            }
        });

        // Clear selection when clicking elsewhere
        document.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.farisly-quick-menu')) {
                this.hideQuickActionMenu();
            }
        });
    }

    /**
     * Show quick action menu for selected text
     */
    showQuickActionMenu(selection) {
        // Remove existing menu
        this.hideQuickActionMenu();

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        this.quickMenu = document.createElement('div');
        this.quickMenu.className = 'farisly-quick-menu';
        this.quickMenu.style.cssText = `
            position: fixed !important;
            top: ${rect.bottom + 10}px !important;
            left: ${rect.left}px !important;
            background: #1a1a1a !important;
            border: 1px solid #333 !important;
            border-radius: 8px !important;
            padding: 8px !important;
            display: flex !important;
            gap: 6px !important;
            z-index: 2147483646 !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
        `;

        const actions = [
            { icon: '✓', label: 'Fix Grammar', action: 'grammar' },
            { icon: '📝', label: 'Rewrite', action: 'expand' },
            { icon: '🌍', label: 'Translate', action: 'translate' },
            { icon: '📊', label: 'Summarize', action: 'summarize' }
        ];

        actions.forEach(({ icon, label, action }) => {
            const btn = document.createElement('button');
            btn.innerHTML = `${icon}`;
            btn.title = label;
            btn.style.cssText = `
                width: 32px !important;
                height: 32px !important;
                background: #2a2a2a !important;
                border: none !important;
                border-radius: 6px !important;
                color: white !important;
                cursor: pointer !important;
                font-size: 14px !important;
                transition: all 0.2s ease !important;
            `;

            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#3a3a3a !important';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.background = '#2a2a2a !important';
            });

            btn.addEventListener('click', () => {
                this.processSelectedText(action);
            });

            this.quickMenu.appendChild(btn);
        });

        document.body.appendChild(this.quickMenu);
    }

    /**
     * Hide quick action menu
     */
    hideQuickActionMenu() {
        if (this.quickMenu) {
            this.quickMenu.remove();
            this.quickMenu = null;
        }
    }

    /**
     * Process selected text with AI (directly on page)
     */
    async processSelectedText(action) {
        if (!this.selectedText) return;

        this.hideQuickActionMenu();
        this.showToast('Processing...', 'info');

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'AI_COMPOSE',
                payload: {
                    text: this.selectedText,
                    action: action,
                    apiKey: this.settings?.openaiKey,
                    userInstructions: this.settings?.aiInstructions?.join('\n')
                }
            });

            if (response.success && response.data) {
                const processedText = response.data.processedText;

                // Replace selected text directly in the page
                this.replaceSelectedText(processedText);

                this.showToast(`✓ ${action} applied!`, 'success');
            } else {
                this.showToast(response.message || 'AI processing failed', 'error');
            }
        } catch (error) {
            console.error('Error processing text:', error);
            this.showToast('Error processing text', 'error');
        }
    }

    /**
     * Replace selected text in the page
     */
    replaceSelectedText(newText) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        range.deleteContents();

        // Check if we're in an input/textarea
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const value = activeElement.value;

            activeElement.value = value.substring(0, start) + newText + value.substring(end);
            activeElement.selectionStart = activeElement.selectionEnd = start + newText.length;
        } else if (activeElement && activeElement.isContentEditable) {
            // For contenteditable elements
            const textNode = document.createTextNode(newText);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // For regular text
            const textNode = document.createTextNode(newText);
            range.insertNode(textNode);
        }
    }

    /**
     * Toggle panel visibility
     */
    togglePanel() {
        console.log('🔄 togglePanel called, current state:', this.isVisible);
        this.isVisible = !this.isVisible;

        if (this.isVisible) {
            console.log('📂 Opening panel...');

            // Position panel near icon BEFORE showing
            const iconRect = this.iconContainer.getBoundingClientRect();
            this.updatePanelPosition(iconRect.left, iconRect.top);

            // Remove hidden class, add visible class
            this.panel.classList.remove('hidden');
            this.panel.classList.add('visible');

            // Trigger opacity transition
            requestAnimationFrame(() => {
                this.panel.style.opacity = '1';
            });

            console.log('✅ Panel opened');
        } else {
            console.log('📁 Closing panel...');
            this.panel.style.opacity = '0';

            setTimeout(() => {
                // Remove visible class, add hidden class
                this.panel.classList.remove('visible');
                this.panel.classList.add('hidden');
                console.log('✅ Panel closed');
            }, 300);
        }
    }

    /**
     * Show specific tab
     */
    showTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        this.panel.querySelectorAll('.farisly-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update content
        const content = this.panel.querySelector('#panel-content');

        switch(tabName) {
            case 'compose':
                this.showComposeTab(content);
                break;
            case 'quick-replies':
                this.showQuickRepliesTab(content);
                break;
            case 'ai-reply':
                this.showAIReplyTab(content);
                break;
            case 'settings':
                this.showSettingsTab(content);
                break;
        }
    }

    /**
     * Show Compose tab
     */
    showComposeTab(content) {
        content.innerHTML = `
            <div class="farisly-ai-actions">
                <button class="farisly-ai-btn" data-action="grammar">✓ Fix Grammar</button>
                <button class="farisly-ai-btn" data-action="expand">📝 Expand</button>
                <button class="farisly-ai-btn" data-action="summarize">📊 Summarize</button>
                <button class="farisly-ai-btn" data-action="translate">🌍 Translate</button>
                <button class="farisly-ai-btn" data-action="tone">🎭 Change Tone</button>
                <button class="farisly-ai-btn" data-action="elaborate">📖 Elaborate</button>
            </div>
            <textarea class="farisly-textarea" id="compose-input" placeholder="Paste text here or select text on the page..."></textarea>
            <button class="farisly-btn-primary" id="process-btn">Process Text</button>
            <div id="result-area" style="margin-top: 12px; display: none;">
                <div style="color: #999; font-size: 12px; margin-bottom: 6px;">Result:</div>
                <div style="background: #111; border: 1px solid #2a2a2a; border-radius: 8px; padding: 12px; color: #fff; max-height: 200px; overflow-y: auto;" id="result-text"></div>
            </div>
        `;

        let selectedAction = 'grammar';

        content.querySelectorAll('.farisly-ai-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedAction = btn.dataset.action;
                content.querySelectorAll('.farisly-ai-btn').forEach(b => {
                    b.style.borderColor = b === btn ? '#667eea' : '#2a2a2a';
                });
            });
        });

        content.querySelector('#process-btn').addEventListener('click', async () => {
            const text = content.querySelector('#compose-input').value.trim();
            if (!text) {
                this.showToast('Please enter text to process', 'error');
                return;
            }

            const btn = content.querySelector('#process-btn');
            btn.disabled = true;
            btn.textContent = 'Processing...';

            try {
                const response = await chrome.runtime.sendMessage({
                    type: 'AI_COMPOSE',
                    payload: {
                        text: text,
                        action: selectedAction,
                        apiKey: this.settings?.openaiKey,
                        userInstructions: this.settings?.aiInstructions?.join('\n')
                    }
                });

                if (response.success && response.data) {
                    content.querySelector('#result-area').style.display = 'block';
                    content.querySelector('#result-text').textContent = response.data.processedText;
                    this.showToast('✓ Processed successfully!', 'success');
                } else {
                    this.showToast(response.message || 'Processing failed', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showToast('Error processing text', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Process Text';
            }
        });
    }

    /**
     * Show Quick Replies tab
     */
    async showQuickRepliesTab(content) {
        // Fetch latest replies from server
        const loadResult = await this.loadQuickReplies();

        const replies = this.settings?.quickReplies || [];

        // If needs authentication, show sign-in prompt
        if (loadResult && loadResult.needsAuth) {
            content.innerHTML = `
                <div class="farisly-quick-replies-container">
                    <div class="farisly-empty">
                        <div class="farisly-empty-icon">🔒</div>
                        <div class="farisly-empty-title">Sign In Required</div>
                        <div class="farisly-empty-text">${this.escapeHtml(loadResult.message || 'Please sign in to access your Quick Replies')}</div>
                        <button class="farisly-btn-primary" id="goto-settings-btn" style="margin-bottom: 8px;">
                            Go to Settings
                        </button>
                        <button class="farisly-btn-secondary" id="open-dashboard-btn">
                            Open Dashboard
                        </button>
                    </div>
                </div>
            `;

            // Setup button listeners
            const gotoSettingsBtn = content.querySelector('#goto-settings-btn');
            if (gotoSettingsBtn) {
                gotoSettingsBtn.addEventListener('click', () => {
                    this.showTab('settings');
                });
            }

            const dashboardBtn = content.querySelector('#open-dashboard-btn');
            if (dashboardBtn) {
                dashboardBtn.addEventListener('click', () => {
                    chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
                });
            }
            return;
        }

        content.innerHTML = `
            <div class="farisly-quick-replies-container">
                <!-- Search Bar -->
                <div class="farisly-search-bar">
                    <input
                        type="text"
                        id="reply-search"
                        placeholder="🔍 Search replies..."
                        class="farisly-search-input"
                    />
                </div>

                <!-- Category Filter (if categories exist) -->
                ${this.getCategories(replies).length > 1 ? `
                    <div class="farisly-category-filter">
                        <button class="farisly-category-btn active" data-category="all">All</button>
                        ${this.getCategories(replies).map(cat => `
                            <button class="farisly-category-btn" data-category="${cat}">${cat}</button>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- Replies List -->
                <div class="farisly-replies-list" id="replies-list">
                    ${replies.length === 0 ? `
                        <div class="farisly-empty">
                            <div class="farisly-empty-icon">💾</div>
                            <div class="farisly-empty-title">No Quick Replies Yet</div>
                            <div class="farisly-empty-text">Create quick replies in your dashboard to use them here</div>
                            <button class="farisly-btn-secondary" id="open-dashboard-btn">
                                Open Dashboard
                            </button>
                        </div>
                    ` : this.renderReplies(replies)}
                </div>

                <!-- Detected Input Info -->
                <div class="farisly-input-detector">
                    <span id="detected-input-status">🎯 Auto-detecting input field...</span>
                </div>
            </div>
        `;

        // Setup event listeners
        this.setupQuickRepliesListeners(content, replies);

        // Show detected input
        this.updateDetectedInputStatus(content);
    }

    /**
     * Get unique categories from replies
     */
    getCategories(replies) {
        const categories = new Set();
        replies.forEach(r => {
            if (r.category && r.category !== 'General') {
                categories.add(r.category);
            }
        });
        return Array.from(categories);
    }

    /**
     * Render replies HTML
     */
    renderReplies(replies, filter = null) {
        const filtered = filter ?
            replies.filter(r =>
                r.title?.toLowerCase().includes(filter.toLowerCase()) ||
                r.content?.toLowerCase().includes(filter.toLowerCase())
            ) : replies;

        if (filtered.length === 0) {
            return `
                <div class="farisly-empty">
                    <div class="farisly-empty-text">No replies match your search</div>
                </div>
            `;
        }

        return filtered.map(reply => `
            <div class="farisly-reply-card" data-reply-id="${reply._id || reply.key}">
                <div class="farisly-reply-header">
                    <div class="farisly-reply-title">${this.escapeHtml(reply.title)}</div>
                    ${reply.category ? `<span class="farisly-reply-badge">${this.escapeHtml(reply.category)}</span>` : ''}
                </div>
                <div class="farisly-reply-content">${this.escapeHtml(reply.content)}</div>
                <div class="farisly-reply-footer">
                    ${reply.usageCount ? `<span class="farisly-usage-count">📊 Used ${reply.usageCount}x</span>` : ''}
                    <span class="farisly-click-hint">Click to insert →</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Setup Quick Replies event listeners
     */
    setupQuickRepliesListeners(content, replies) {
        // Search functionality
        const searchInput = content.querySelector('#reply-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const filter = e.target.value.trim();
                const listContainer = content.querySelector('#replies-list');
                listContainer.innerHTML = this.renderReplies(replies, filter);
                this.attachReplyClickHandlers(listContainer, replies);
            });
        }

        // Category filter
        content.querySelectorAll('.farisly-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                content.querySelectorAll('.farisly-category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const category = btn.dataset.category;
                const filtered = category === 'all' ?
                    replies :
                    replies.filter(r => r.category === category);

                const listContainer = content.querySelector('#replies-list');
                listContainer.innerHTML = this.renderReplies(filtered);
                this.attachReplyClickHandlers(listContainer, replies);
            });
        });

        // Open dashboard button
        const dashboardBtn = content.querySelector('#open-dashboard-btn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => {
                window.open('http://localhost:3000/dashboard', '_blank');
            });
        }

        // Reply click handlers
        this.attachReplyClickHandlers(content, replies);
    }

    /**
     * Attach click handlers to reply cards
     */
    attachReplyClickHandlers(container, replies) {
        container.querySelectorAll('.farisly-reply-card').forEach(card => {
            card.addEventListener('click', async () => {
                const replyId = card.dataset.replyId;
                const reply = replies.find(r => (r._id || r.key) === replyId);

                if (reply) {
                    // Use QuickRepliesManager for smart insertion
                    const result = this.quickRepliesManager.insertText(reply.content);

                    if (result.success) {
                        this.showToast(`✓ "${reply.title}" inserted!`, 'success');

                        // Track usage
                        await this.quickRepliesManager.trackUsage(replyId);

                        // Visual feedback
                        card.classList.add('used');
                        setTimeout(() => card.classList.remove('used'), 600);
                    } else {
                        this.showToast(result.error || 'Failed to insert', 'error');
                    }
                }
            });
        });
    }

    /**
     * Update detected input field status
     */
    updateDetectedInputStatus(content) {
        const statusEl = content.querySelector('#detected-input-status');
        if (!statusEl) return;

        const input = this.quickRepliesManager.findBestInput();

        if (input) {
            const type = input.tagName === 'TEXTAREA' ? 'Textarea' :
                         input.tagName === 'INPUT' ? `Input (${input.type || 'text'})` :
                         'Content Editable';
            statusEl.textContent = `✅ Ready to insert into ${type}`;
            statusEl.style.color = '#4ade80';
        } else {
            statusEl.textContent = '⚠️ Click on an input field first';
            statusEl.style.color = '#fb923c';
        }
    }

    /**
     * Load quick replies from server
     */
    async loadQuickReplies() {
        try {
            console.log('📥 Requesting quick replies from background...');

            const response = await chrome.runtime.sendMessage({
                type: 'GET_SAVED_REPLIES'
            });

            console.log('📦 Quick replies response:', response);

            if (response && response.success && response.replies) {
                this.settings.quickReplies = response.replies;
                this.quickRepliesManager.updateReplies(response.replies);
                console.log(`✅ Loaded ${response.replies.length} quick replies`);
                return { success: true, needsAuth: false };
            } else if (response && !response.success) {
                console.warn('⚠️ Failed to load quick replies:', response.message);
                this.settings.quickReplies = [];
                this.quickRepliesManager.updateReplies([]);
                return {
                    success: false,
                    needsAuth: response.needsAuth || false,
                    message: response.message
                };
            } else {
                console.warn('⚠️ Invalid response from background');
                this.settings.quickReplies = [];
                this.quickRepliesManager.updateReplies([]);
                return { success: false, needsAuth: false };
            }
        } catch (error) {
            console.error('❌ Error loading quick replies:', error);
            this.settings.quickReplies = [];
            this.quickRepliesManager.updateReplies([]);
            return { success: false, needsAuth: false };
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Insert reply into active input
     */
    insertReply(reply) {
        const activeElement = document.activeElement;

        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
            if (activeElement.isContentEditable) {
                document.execCommand('insertText', false, reply.content);
            } else {
                const start = activeElement.selectionStart || 0;
                const end = activeElement.selectionEnd || 0;
                const value = activeElement.value || '';

                activeElement.value = value.substring(0, start) + reply.content + value.substring(end);
                activeElement.selectionStart = activeElement.selectionEnd = start + reply.content.length;

                // Trigger input event
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Track usage
            chrome.runtime.sendMessage({
                type: 'TRACK_REPLY_USAGE',
                payload: { replyId: reply.key || reply._id }
            });

            this.showToast('✓ Reply inserted!', 'success');
            this.togglePanel();
        } else {
            this.showToast('Please click on an input field first', 'error');
        }
    }

    /**
     * Show AI Reply tab
     */
    showAIReplyTab(content) {
        content.innerHTML = `
            <textarea class="farisly-textarea" id="ai-context" placeholder="Paste the conversation context here..." style="min-height: 150px;"></textarea>
            <button class="farisly-btn-primary" id="generate-reply-btn">Generate AI Reply</button>
            <div id="ai-reply-result" style="margin-top: 12px; display: none;">
                <div style="color: #999; font-size: 12px; margin-bottom: 6px;">Generated Reply:</div>
                <div style="background: #111; border: 1px solid #2a2a2a; border-radius: 8px; padding: 12px; color: #fff; max-height: 200px; overflow-y: auto;" id="ai-reply-text"></div>
                <button class="farisly-btn-primary" id="insert-reply-btn" style="margin-top: 12px;">Insert Reply</button>
            </div>
        `;

        let generatedReply = '';

        content.querySelector('#generate-reply-btn').addEventListener('click', async () => {
            const context = content.querySelector('#ai-context').value.trim();
            if (!context) {
                this.showToast('Please enter conversation context', 'error');
                return;
            }

            const btn = content.querySelector('#generate-reply-btn');
            btn.disabled = true;
            btn.textContent = 'Generating...';

            try {
                const response = await chrome.runtime.sendMessage({
                    type: 'AI_REPLY',
                    payload: {
                        conversationContext: context,
                        tone: this.settings?.agentTone || 'friendly',
                        apiKey: this.settings?.openaiKey,
                        agentName: this.settings?.agentName,
                        useLineSpacing: this.settings?.useLineSpacing,
                        userInstructions: this.settings?.aiInstructions?.join('\n')
                    }
                });

                if (response.success && response.data) {
                    generatedReply = response.data.reply;
                    content.querySelector('#ai-reply-result').style.display = 'block';
                    content.querySelector('#ai-reply-text').textContent = generatedReply;
                    this.showToast('✓ Reply generated!', 'success');
                } else {
                    this.showToast(response.message || 'Generation failed', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showToast('Error generating reply', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Generate AI Reply';
            }
        });

        content.querySelector('#insert-reply-btn').addEventListener('click', () => {
            if (generatedReply) {
                this.insertTextIntoActive(generatedReply);
                this.togglePanel();
            }
        });
    }

    /**
     * Show Settings tab
     */
    async showSettingsTab(content) {
        // Check auth status
        const authResponse = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });
        const isAuthenticated = authResponse?.success && authResponse?.authState?.isAuthenticated;
        const user = authResponse?.authState?.user;

        content.innerHTML = `
            <div style="padding: 8px;">
                <!-- Account Section -->
                <div class="farisly-settings-section">
                    <h3>Account</h3>

                    ${isAuthenticated ? `
                        <div class="farisly-auth-card">
                            <div class="farisly-user-profile">
                                <div class="farisly-user-avatar">
                                    ${user?.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div class="farisly-user-info">
                                    <div class="farisly-user-name">${this.escapeHtml(user?.name || 'User')}</div>
                                    <div class="farisly-user-email">${this.escapeHtml(user?.email || '')}</div>
                                </div>
                            </div>
                            <div class="farisly-auth-status">
                                <span style="color: #10b981; font-size: 20px;">✓</span>
                                <span class="farisly-auth-status-success">Signed In</span>
                            </div>
                        </div>

                        <button class="farisly-btn-secondary" id="logout-btn">
                            Sign Out
                        </button>
                    ` : `
                        <div class="farisly-login-prompt">
                            <div class="farisly-login-icon">🔒</div>
                            <div class="farisly-login-text">Sign in to access Quick Replies and AI features</div>
                            <button class="farisly-btn-primary" id="sync-auth-btn">
                                Sign In with Dashboard
                            </button>
                            <div class="farisly-login-hint">
                                Make sure you're signed in on the web dashboard, then click the button above
                            </div>
                        </div>
                    `}
                </div>

                <!-- Quick Actions Section -->
                <div class="farisly-settings-section">
                    <h3>Quick Actions</h3>
                    <button class="farisly-btn-secondary" id="open-dashboard-settings" style="margin-bottom: 8px;">
                        📊 Open Dashboard
                    </button>
                    <button class="farisly-btn-secondary" id="open-saved-replies">
                        💾 Manage Quick Replies
                    </button>
                </div>
            </div>
        `;

        // Setup event listeners
        const syncAuthBtn = content.querySelector('#sync-auth-btn');
        if (syncAuthBtn) {
            syncAuthBtn.addEventListener('click', async () => {
                syncAuthBtn.disabled = true;
                syncAuthBtn.textContent = 'Signing in...';

                try {
                    const response = await chrome.runtime.sendMessage({ type: 'SYNC_AUTH_FROM_WEB' });

                    if (response?.success) {
                        this.showToast('✓ Signed in successfully!', 'success');
                        // AUTH_UPDATED broadcast will automatically refresh the UI
                    } else {
                        this.showToast('Not signed in on dashboard. Please log in first.', 'error');
                    }
                } catch (error) {
                    console.error('Error syncing auth:', error);
                    this.showToast('Error signing in', 'error');
                } finally {
                    syncAuthBtn.disabled = false;
                    syncAuthBtn.textContent = 'Sign In with Dashboard';
                }
            });
        }

        const logoutBtn = content.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await chrome.runtime.sendMessage({ type: 'LOGOUT' });
                this.showToast('Signed out', 'info');
                // AUTH_UPDATED broadcast will automatically refresh the UI
            });
        }

        const dashboardBtn = content.querySelector('#open-dashboard-settings');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => {
                chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });
            });
        }

        const repliesBtn = content.querySelector('#open-saved-replies');
        if (repliesBtn) {
            repliesBtn.addEventListener('click', () => {
                window.open('http://localhost:3000/saved-replies', '_blank');
            });
        }
    }

    /**
     * Insert text into active element
     */
    insertTextIntoActive(text) {
        const activeElement = document.activeElement;

        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
            if (activeElement.isContentEditable) {
                document.execCommand('insertText', false, text);
            } else {
                const start = activeElement.selectionStart || 0;
                const end = activeElement.selectionEnd || 0;
                const value = activeElement.value || '';

                activeElement.value = value.substring(0, start) + text + value.substring(end);
                activeElement.selectionStart = activeElement.selectionEnd = start + text.length;

                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
            }

            this.showToast('✓ Text inserted!', 'success');
        } else {
            this.showToast('Please click on an input field first', 'error');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `farisly-toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'farisly-slide-out 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Disable extension (when not allowed on site)
     */
    disable() {
        // Cleanup drag manager
        if (this.dragManager) {
            this.dragManager.destroy();
            this.dragManager = null;
        }

        // Remove DOM elements
        if (this.iconContainer) {
            this.iconContainer.remove();
            this.iconContainer = null;
        }
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }

        this.isEnabled = false;
        console.log('🔌 Extension disabled and cleaned up');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FarislyAI();
    });
} else {
    new FarislyAI();
}
