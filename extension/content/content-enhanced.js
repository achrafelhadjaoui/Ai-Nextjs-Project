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
        this.selectedRange = null; // Store the selection range
        this.selectionStart = null; // Store selection start for input/textarea
        this.selectionEnd = null; // Store selection end for input/textarea
        this.isEnabled = false;
        this.eventListenersSetup = false; // Track if event listeners are set up
        this.grammarChecker = null; // Grammar checker instance
        this.init();
    }

    async init() {
        console.log('🔧 Initializing Farisly AI...');
        console.log('Current URL:', window.location.href);

        // CRITICAL: Always set up message listeners first, even if site is not allowed
        // This ensures extension can "wake up" when CONFIG_UPDATED arrives
        this.setupMessageListeners();

        // Check if extension should work on this site
        const isAllowed = await this.checkSiteAllowed();
        console.log('Is site allowed?', isAllowed);

        if (!isAllowed) {
            console.log('⏭️  Extension not allowed on this site');
            console.log('👉 Please add this site in your Extension Settings or enable "All Sites"');
            console.log('⚡ Listening for config updates to auto-enable when permission granted');
            return;
        }

        this.isEnabled = true;

        console.log('Initializing Quick Replies Manager...');
        this.quickRepliesManager = new QuickRepliesManager();

        console.log('Initializing Grammar Checker...');
        this.grammarChecker = new GrammarChecker();

        console.log('Loading settings...');
        await this.loadSettings();

        // Enable grammar checker if API key is available
        if (this.settings?.openaiKey) {
            this.grammarChecker.enable(this.settings.openaiKey);
            this.startMonitoringFields();
        }

        console.log('Creating icon...');
        this.createIcon();

        console.log('Creating panel...');
        this.createPanel();

        console.log('Setting up remaining event listeners...');
        this.setupEventListeners();
        this.setupTextSelectionDetection();
        this.eventListenersSetup = true;

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
                allowedSites: settings.allowedSites,
                lastConfigSync: settings.lastConfigSync ? new Date(settings.lastConfigSync).toISOString() : 'never'
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
                <div class="farisly-panel-actions">
                    <button class="farisly-panel-btn farisly-minimize-btn" id="minimize-btn" title="Minimize">−</button>
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
            <div class="farisly-resize-handle" id="resize-handle" title="Drag to resize"></div>
        `;

        // Set initial height (since we removed the fixed CSS height to allow resize)
        this.panel.style.height = '220px';

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

        // Resize functionality
        const resizeHandle = this.panel.querySelector('#resize-handle');
        if (!resizeHandle) {
            console.error('❌ Resize handle not found!');
            return;
        }
        console.log('✅ Resize handle found, setting up listeners');
        this.isResizing = false;

        const handleResizeMove = (e) => {
            if (this.isResizing) {
                e.preventDefault();
                e.stopPropagation();

                const deltaX = e.clientX - this.resizeStartX;
                const deltaY = e.clientY - this.resizeStartY;

                // Calculate new dimensions
                let newWidth = this.resizeStartWidth + deltaX;
                let newHeight = this.resizeStartHeight + deltaY;

                // Apply constraints
                const minWidth = 300;
                const maxWidth = window.innerWidth - (this.panel.getBoundingClientRect().left);
                const minHeight = 200;
                const maxHeight = window.innerHeight - (this.panel.getBoundingClientRect().top);

                // Clamp to constraints
                newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
                newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

                // Apply new dimensions
                this.panel.style.width = `${newWidth}px`;
                this.panel.style.height = `${newHeight}px`;

                console.log(`📏 Resizing to: ${newWidth}px × ${newHeight}px`);

                // Add visual feedback class if at boundaries
                if (newWidth === minWidth || newHeight === minHeight) {
                    this.panel.classList.add('at-min-size');
                } else {
                    this.panel.classList.remove('at-min-size');
                }
            }
        };

        const handleResizeEnd = () => {
            if (this.isResizing) {
                this.isResizing = false;
                this.panel.classList.remove('dragging');
                document.removeEventListener('mousemove', handleResizeMove);
                document.removeEventListener('mouseup', handleResizeEnd);
            }
        };

        resizeHandle.addEventListener('mousedown', (e) => {
            console.log('🖱️ Resize handle mousedown detected');
            e.preventDefault();
            e.stopPropagation(); // Prevent dragging when resizing

            this.isResizing = true;
            const rect = this.panel.getBoundingClientRect();
            this.resizeStartX = e.clientX;
            this.resizeStartY = e.clientY;
            this.resizeStartWidth = rect.width;
            this.resizeStartHeight = rect.height;

            console.log('📐 Starting resize:', {
                startX: this.resizeStartX,
                startY: this.resizeStartY,
                startWidth: this.resizeStartWidth,
                startHeight: this.resizeStartHeight
            });

            this.panel.classList.add('dragging'); // Disable transitions during resize

            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
        });

        // Tab switching
        this.panel.querySelectorAll('.farisly-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.showTab(tab);
            });
        });

        // Note: Message listeners are set up in setupMessageListeners()
        // which is called early in init(), even if site is not allowed
    }

    /**
     * Setup message listeners (ALWAYS called, even if site not allowed)
     * This ensures extension can "wake up" when CONFIG_UPDATED arrives
     */
    setupMessageListeners() {
        // Listen for messages from background
        chrome.runtime.onMessage.addListener(async (request) => {
            if (request.type === 'TOGGLE_PANEL') {
                // If icon is hidden, show it first
                if (this.iconContainer && this.iconContainer.style.display === 'none') {
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
            } else if (request.type === 'QUICK_REPLIES_UPDATED') {
                // Real-time update from server
                console.log('🔄 Quick Replies updated in real-time');
                if (request.data?.quickReplies) {
                    this.settings.quickReplies = request.data.quickReplies;
                    this.quickRepliesManager.updateReplies(request.data.quickReplies);

                    // Refresh UI if Quick Replies tab is visible
                    if (this.currentTab === 'quick-replies' && this.isVisible) {
                        const content = this.tabContent;
                        if (content) {
                            await this.showQuickRepliesTab(content);
                        }
                    }
                }
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
                // Use the settings passed directly in the message (no async fetch needed!)
                const startTime = performance.now();
                console.log('🔄 [INSTANT SYNC] Config updated, checking new settings...');

                const newSettings = request.data;
                console.log('📦 New settings received:', {
                    enableOnAllSites: newSettings.enableOnAllSites,
                    allowedSites: newSettings.allowedSites
                });

                // Check if site is allowed with the NEW settings (synchronous, no waiting!)
                const currentUrl = window.location.href;
                const currentDomain = window.location.hostname;

                let isAllowed = false;
                if (newSettings.enableOnAllSites) {
                    isAllowed = true;
                    console.log('✅ Extension enabled on all sites');
                } else if (newSettings.allowedSites && Array.isArray(newSettings.allowedSites)) {
                    isAllowed = newSettings.allowedSites.some(site =>
                        currentUrl.toLowerCase().includes(site.toLowerCase()) ||
                        currentDomain.toLowerCase().includes(site.toLowerCase())
                    );
                    console.log(isAllowed ? '✅ Site found in allowed list' : '❌ Site not in allowed list');
                }

                const checkTime = performance.now();
                console.log(`⏱️  Permission check took ${(checkTime - startTime).toFixed(2)}ms`);

                if (!isAllowed && this.isEnabled) {
                    // Site is no longer allowed, disable extension INSTANTLY
                    console.log('⛔ [INSTANT SYNC] Site no longer allowed, disabling extension');
                    this.disable();
                    const disableTime = performance.now();
                    console.log(`⏱️  TOTAL disable time: ${(disableTime - startTime).toFixed(2)}ms ⚡`);
                } else if (isAllowed && !this.isEnabled) {
                    // Site is now allowed, enable dynamically INSTANTLY
                    console.log('✅ [INSTANT SYNC] Site now allowed, enabling extension dynamically');
                    await this.enableDynamically();
                    const enableTime = performance.now();
                    console.log(`⏱️  TOTAL enable time: ${(enableTime - startTime).toFixed(2)}ms ⚡`);
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

                // Store the selection range for later use
                if (selection.rangeCount > 0) {
                    this.selectedRange = selection.getRangeAt(0).cloneRange();
                }

                // Store selection positions for input/textarea
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                    this.selectionStart = activeElement.selectionStart;
                    this.selectionEnd = activeElement.selectionEnd;
                    this.selectedElement = activeElement;
                }

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
                if (action === 'translate') {
                    this.showLanguageSelector();
                } else {
                    this.processSelectedText(action);
                }
            });

            this.quickMenu.appendChild(btn);
        });

        document.body.appendChild(this.quickMenu);
    }

    /**
     * Show language selector for translation
     */
    showLanguageSelector() {
        this.hideQuickActionMenu();

        const languages = [
            { code: 'es', name: 'Spanish', flag: '🇪🇸' },
            { code: 'fr', name: 'French', flag: '🇫🇷' },
            { code: 'de', name: 'German', flag: '🇩🇪' },
            { code: 'it', name: 'Italian', flag: '🇮🇹' },
            { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
            { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
            { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
            { code: 'ko', name: 'Korean', flag: '🇰🇷' },
            { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
            { code: 'ru', name: 'Russian', flag: '🇷🇺' },
            { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
            { code: 'nl', name: 'Dutch', flag: '🇳🇱' }
        ];

        // Create language selector modal
        const modal = document.createElement('div');
        modal.className = 'farisly-language-modal';
        modal.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            background: #1a1a1a !important;
            border: 1px solid #333 !important;
            border-radius: 12px !important;
            padding: 20px !important;
            z-index: 2147483647 !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
            max-width: 400px !important;
            width: 90% !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
        `;

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="color: white; margin: 0; font-size: 18px; font-weight: 600;">
                    🌍 Select Translation Language
                </h3>
                <button id="farisly-close-lang-selector" style="background: transparent; border: none; color: #999; font-size: 24px; cursor: pointer; padding: 0; line-height: 1;">×</button>
            </div>
            <div style="color: #999; font-size: 13px; margin-bottom: 16px;">
                Choose the language you want to translate to:
            </div>
            <div id="farisly-language-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            </div>
        `;

        const grid = modal.querySelector('#farisly-language-grid');
        languages.forEach(({ code, name, flag }) => {
            const langBtn = document.createElement('button');
            langBtn.style.cssText = `
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                padding: 12px !important;
                background: #2a2a2a !important;
                border: 1px solid #3a3a3a !important;
                border-radius: 8px !important;
                color: white !important;
                cursor: pointer !important;
                font-size: 14px !important;
                transition: all 0.2s ease !important;
                width: 100% !important;
            `;
            langBtn.innerHTML = `
                <span style="font-size: 20px;">${flag}</span>
                <span>${name}</span>
            `;

            langBtn.addEventListener('mouseenter', () => {
                langBtn.style.background = '#3a3a3a !important';
                langBtn.style.borderColor = '#667eea !important';
            });

            langBtn.addEventListener('mouseleave', () => {
                langBtn.style.background = '#2a2a2a !important';
                langBtn.style.borderColor = '#3a3a3a !important';
            });

            grid.appendChild(langBtn);
        });

        // Close modal function
        const closeModal = () => {
            modal.style.opacity = '0';
            modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
            overlay.style.background = 'rgba(0, 0, 0, 0)';
            setTimeout(() => {
                if (document.body.contains(modal)) document.body.removeChild(modal);
                if (document.body.contains(overlay)) document.body.removeChild(overlay);
            }, 300);
        };

        // Add click handlers to language buttons (needs to be after closeModal is defined)
        grid.querySelectorAll('button').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const selectedLang = languages[index].name;
                closeModal();
                setTimeout(() => {
                    this.processSelectedText('translate', selectedLang);
                }, 100);
            });
        });

        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0) !important;
            z-index: 2147483646 !important;
            transition: background 0.3s ease !important;
        `;

        overlay.addEventListener('click', closeModal);

        // Close button
        modal.querySelector('#farisly-close-lang-selector').addEventListener('click', closeModal);

        // Escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // Animate in
        setTimeout(() => {
            overlay.style.background = 'rgba(0, 0, 0, 0.7) !important';
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);

        // Set initial state for animation
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
        modal.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
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
     * Process selected text with AI (show in panel for grammar, direct replace for others)
     */
    async processSelectedText(action, targetLanguage = null) {
        if (!this.selectedText) return;

        this.hideQuickActionMenu();

        // For grammar action, show in panel instead of direct replace
        if (action === 'grammar') {
            // Open panel if not visible
            if (!this.isVisible) {
                this.togglePanel();
            }

            // Switch to compose tab
            this.showTab('compose');

            // Populate compose input with selected text
            const composeInput = this.panel.querySelector('#compose-input');
            if (composeInput) {
                composeInput.value = this.selectedText;
            }

            // Select the grammar action button
            const grammarBtn = this.panel.querySelector('[data-action="grammar"]');
            if (grammarBtn) {
                this.panel.querySelectorAll('.farisly-ai-btn').forEach(b => {
                    b.style.borderColor = b === grammarBtn ? '#667eea' : '#2a2a2a';
                });
            }

            // Auto-process the text
            this.showToast('Checking grammar...', 'info');

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

                    // Show result in panel
                    const resultArea = this.panel.querySelector('#result-area');
                    const resultText = this.panel.querySelector('#result-text');
                    if (resultArea && resultText) {
                        resultText.textContent = processedText;
                        resultArea.style.display = 'block';
                    }

                    this.showToast('✓ Grammar corrected! Click Insert to replace.', 'success');
                } else {
                    this.showToast(response.message || 'Grammar check failed', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showToast('Error checking grammar', 'error');
            }

            return;
        }

        // For other actions, process directly on page
        const actionLabel = action === 'translate' ? `Translating to ${targetLanguage}...` : 'Processing...';
        this.showToast(actionLabel, 'info');

        try {
            const payload = {
                text: this.selectedText,
                action: action,
                apiKey: this.settings?.openaiKey,
                userInstructions: this.settings?.aiInstructions?.join('\n')
            };

            // Add target language for translation
            if (action === 'translate' && targetLanguage) {
                payload.targetLanguage = targetLanguage;
            }

            const response = await chrome.runtime.sendMessage({
                type: 'AI_COMPOSE',
                payload: payload
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
     * Replace selected text in the page using stored selection
     */
    replaceSelectedText(newText) {
        // Check if we have stored selection for input/textarea
        if (this.selectedElement &&
            (this.selectedElement.tagName === 'INPUT' || this.selectedElement.tagName === 'TEXTAREA') &&
            this.selectionStart !== null && this.selectionEnd !== null) {

            const element = this.selectedElement;
            const value = element.value;

            // Replace text at stored selection positions
            element.value = value.substring(0, this.selectionStart) + newText + value.substring(this.selectionEnd);
            element.selectionStart = element.selectionEnd = this.selectionStart + newText.length;

            // Focus the element
            element.focus();

            // Trigger input event
            element.dispatchEvent(new Event('input', { bubbles: true }));

            console.log('✅ Text replaced in input/textarea at original position');
            return;
        }

        // Check if we have stored range for contenteditable or regular text
        if (this.selectedRange) {
            try {
                // Delete the old content
                this.selectedRange.deleteContents();

                // Insert new text
                const textNode = document.createTextNode(newText);
                this.selectedRange.insertNode(textNode);

                // If it's contenteditable, update selection
                if (this.selectedElement && this.selectedElement.isContentEditable) {
                    const selection = window.getSelection();
                    const newRange = document.createRange();
                    newRange.setStartAfter(textNode);
                    newRange.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(newRange);

                    // Focus the element
                    this.selectedElement.focus();
                }

                console.log('✅ Text replaced at original selection range');
                return;
            } catch (error) {
                console.error('Error using stored range:', error);
            }
        }

        // Fallback to current selection if stored selection is not available
        console.warn('⚠️ No stored selection found, using current selection as fallback');
        const selection = window.getSelection();
        if (!selection.rangeCount) {
            console.error('❌ No selection available');
            return;
        }

        const range = selection.getRangeAt(0);
        range.deleteContents();

        const textNode = document.createTextNode(newText);
        range.insertNode(textNode);

        // Update selection
        const newRange = document.createRange();
        newRange.setStartAfter(textNode);
        newRange.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(newRange);
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
            <div>
                <div class="farisly-ai-actions">
                    <button class="farisly-ai-btn" data-action="grammar">✓ Fix Grammar</button>
                    <button class="farisly-ai-btn" data-action="expand">📝 Expand</button>
                    <button class="farisly-ai-btn" data-action="summarize">📊 Summarize</button>
                    <button class="farisly-ai-btn" data-action="translate">🌍 Translate</button>
                    <button class="farisly-ai-btn" data-action="tone">🎭 Change Tone</button>
                    <button class="farisly-ai-btn" data-action="elaborate">📖 Elaborate</button>
                </div>

                <!-- Options for Translate and Tone actions -->
                <div id="translate-options" style="display: none; margin: 12px 0;">
                    <label style="display: block; color: #999; font-size: 12px; margin-bottom: 6px;">Target Language:</label>
                    <select id="target-language" style="width: 100%; padding: 8px; background: #111; border: 1px solid #2a2a2a; border-radius: 8px; color: #fff; font-size: 14px;">
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Italian">Italian</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Chinese (Simplified)">Chinese (Simplified)</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Korean">Korean</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Russian">Russian</option>
                        <option value="Hindi">Hindi</option>
                    </select>
                </div>

                <div id="tone-options" style="display: none; margin: 12px 0;">
                    <label style="display: block; color: #999; font-size: 12px; margin-bottom: 6px;">Select Tone:</label>
                    <select id="tone-select" style="width: 100%; padding: 8px; background: #111; border: 1px solid #2a2a2a; border-radius: 8px; color: #fff; font-size: 14px;">
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                    </select>
                </div>
            </div>
        `;

        // Handle action button clicks - process selected text directly
        content.querySelectorAll('.farisly-ai-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;

                // Get selected text from page
                const selectedText = window.getSelection().toString().trim();
                if (!selectedText) {
                    this.showToast('Please select text on the page first', 'error');
                    return;
                }

                // Show/hide options for translate and tone
                const translateOptions = content.querySelector('#translate-options');
                const toneOptions = content.querySelector('#tone-options');

                // If translate or tone, show options first and wait for confirmation
                if (action === 'translate' || action === 'tone') {
                    // Highlight selected button
                    content.querySelectorAll('.farisly-ai-btn').forEach(b => {
                        b.style.borderColor = b === btn ? '#667eea' : '#2a2a2a';
                    });

                    if (action === 'translate') {
                        translateOptions.style.display = 'block';
                        toneOptions.style.display = 'none';
                    } else if (action === 'tone') {
                        translateOptions.style.display = 'none';
                        toneOptions.style.display = 'block';
                    }

                    // Add one-time confirmation handler
                    const processWithOptions = async () => {
                        let tone = undefined;
                        let targetLanguage = undefined;

                        if (action === 'tone') {
                            tone = content.querySelector('#tone-select').value;
                        } else if (action === 'translate') {
                            targetLanguage = content.querySelector('#target-language').value;
                        }

                        await this.processTextAction(selectedText, action, tone, targetLanguage, btn);

                        // Hide options after processing
                        translateOptions.style.display = 'none';
                        toneOptions.style.display = 'none';
                    };

                    // Listen for select change to auto-process
                    if (action === 'translate') {
                        const select = content.querySelector('#target-language');
                        select.onchange = processWithOptions;
                    } else if (action === 'tone') {
                        const select = content.querySelector('#tone-select');
                        select.onchange = processWithOptions;
                    }
                } else {
                    // For other actions, process immediately
                    translateOptions.style.display = 'none';
                    toneOptions.style.display = 'none';

                    // Highlight selected button
                    content.querySelectorAll('.farisly-ai-btn').forEach(b => {
                        b.style.borderColor = b === btn ? '#667eea' : '#2a2a2a';
                    });

                    await this.processTextAction(selectedText, action, undefined, undefined, btn);
                }
            });
        });
    }

    /**
     * Process text with AI action
     */
    async processTextAction(text, action, tone, targetLanguage, btn) {
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ Processing...';

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'AI_COMPOSE',
                payload: {
                    text: text,
                    action: action,
                    tone: tone,
                    targetLanguage: targetLanguage,
                    apiKey: this.settings?.openaiKey,
                    userInstructions: this.settings?.aiInstructions?.join('\n')
                }
            });

            if (response.success && response.data) {
                const processedText = response.data.processedText;

                // Replace selected text with processed text
                this.replaceSelectedText(processedText);
                this.showToast('✓ Text processed and replaced!', 'success');
            } else {
                this.showToast(response.message || 'Processing failed', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error processing text', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
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
     * Render replies HTML with modern design
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
                    <div class="farisly-empty-icon">🔍</div>
                    <div class="farisly-empty-text">No replies found</div>
                    <div class="farisly-empty-hint">Try adjusting your search or filters</div>
                </div>
            `;
        }

        return filtered.map((reply, index) => {
            const contentPreview = this.escapeHtml(reply.content).substring(0, 150);
            const isLong = reply.content.length > 150;
            const usageCount = reply.usageCount || 0;

            return `
                <div class="farisly-reply-card" data-reply-id="${reply._id || reply.key}" style="animation-delay: ${index * 0.05}s">
                    <div class="farisly-reply-card-inner">
                        <div class="farisly-reply-header">
                            <div class="farisly-reply-title-row">
                                <span class="farisly-reply-icon">💬</span>
                                <h3 class="farisly-reply-title">${this.escapeHtml(reply.title)}</h3>
                            </div>
                            ${reply.category ? `
                                <span class="farisly-reply-badge farisly-badge-${this.getCategoryColor(reply.category)}">
                                    <span class="farisly-badge-dot"></span>
                                    ${this.escapeHtml(reply.category)}
                                </span>
                            ` : ''}
                        </div>
                        <div class="farisly-reply-content">
                            <p class="farisly-reply-text">${contentPreview}${isLong ? '...' : ''}</p>
                        </div>
                        <div class="farisly-reply-footer">
                            <div class="farisly-reply-meta">
                                ${usageCount > 0 ? `
                                    <span class="farisly-usage-stat">
                                        <svg class="farisly-usage-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M2 14V7L8 2L14 7V14H10V10H6V14H2Z"></path>
                                        </svg>
                                        ${usageCount} use${usageCount > 1 ? 's' : ''}
                                    </span>
                                ` : `
                                    <span class="farisly-usage-stat farisly-stat-new">
                                        <svg class="farisly-usage-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="8" cy="8" r="6"></circle>
                                            <path d="M8 5V8L10 10"></path>
                                        </svg>
                                        New
                                    </span>
                                `}
                                <span class="farisly-word-count">${this.getWordCount(reply.content)} words</span>
                            </div>
                            <span class="farisly-insert-hint">
                                <span class="farisly-insert-text">Click to insert</span>
                                <svg class="farisly-insert-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 12L10 8L6 4"></path>
                                </svg>
                            </span>
                        </div>
                    </div>
                    <div class="farisly-card-glow"></div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get category color for badge styling
     */
    getCategoryColor(category) {
        const colors = {
            'Business': 'blue',
            'Personal': 'green',
            'Support': 'purple',
            'Sales': 'orange',
            'Marketing': 'pink',
            'Technical': 'cyan'
        };
        return colors[category] || 'gray';
    }

    /**
     * Get word count from text
     */
    getWordCount(text) {
        return text.trim().split(/\s+/).length;
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
        // Initialize conversation detector
        if (!this.conversationDetector) {
            this.conversationDetector = new ConversationDetector();
        }

        // Auto-detect conversation on page
        const detectedConversation = this.conversationDetector.detectConversation();
        const stats = this.conversationDetector.getStats(detectedConversation);
        const formattedContext = this.conversationDetector.formatConversation(detectedConversation);

        content.innerHTML = `
            <div style="padding: 8px;">
                <!-- Detection Status -->
                ${stats && stats.messageCount > 0 ? `
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 20px;">✓</div>
                        <div style="flex: 1;">
                            <div style="font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 2px;">
                                Conversation Detected!
                            </div>
                            <div style="font-size: 11px; color: rgba(255, 255, 255, 0.9);">
                                ${stats.platform} • ${stats.messageCount} messages • ${stats.senderCount} participants
                            </div>
                        </div>
                    </div>
                ` : `
                    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 18px;">⚠️</div>
                        <div style="flex: 1;">
                            <div style="font-size: 12px; font-weight: 500; color: #78350f;">
                                No conversation detected. Paste manually below.
                            </div>
                        </div>
                    </div>
                `}

                <!-- Auto-Detect Button -->
                <button class="farisly-btn-secondary" id="auto-detect-btn" style="width: 100%; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span style="font-size: 16px;">🔍</span>
                    <span>Auto-Detect Conversation</span>
                </button>

                <!-- Conversation Context -->
                <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <label style="color: #a3a3a3; font-size: 12px; font-weight: 500;">Conversation Context</label>
                    ${formattedContext ? `
                        <button class="farisly-text-btn" id="clear-context-btn" style="font-size: 11px; color: #ef4444;">Clear</button>
                    ` : ''}
                </div>

                <textarea
                    class="farisly-textarea"
                    id="ai-context"
                    placeholder="Paste conversation here or click Auto-Detect..."
                    style="min-height: 120px; font-size: 12px; line-height: 1.5;"
                >${formattedContext || ''}</textarea>

                <!-- Generate Button -->
                <button class="farisly-btn-primary" id="generate-reply-btn" style="width: 100%; margin-top: 12px;">
                    ✨ Generate AI Reply
                </button>

                <!-- Result Display -->
                <div id="ai-reply-result" style="margin-top: 12px; display: none;">
                    <div style="color: #10b981; font-size: 12px; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                        <span>✓</span>
                        <span>Generated Reply:</span>
                    </div>
                    <div style="background: #111; border: 1px solid #2a2a2a; border-radius: 8px; padding: 12px; color: #fff; max-height: 150px; overflow-y: auto; font-size: 13px; line-height: 1.6;" id="ai-reply-text"></div>
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button class="farisly-btn-primary" id="insert-reply-btn" style="flex: 1;">
                            📤 Insert Reply
                        </button>
                        <button class="farisly-btn-secondary" id="copy-reply-btn" style="flex: 1;">
                            📋 Copy
                        </button>
                    </div>
                </div>
            </div>
        `;

        let generatedReply = '';
        let detectedInputField = detectedConversation?.detectedInputField;

        // Auto-Detect button handler
        content.querySelector('#auto-detect-btn').addEventListener('click', () => {
            console.log('🔍 Manual auto-detect triggered');
            const freshDetection = this.conversationDetector.detectConversation();
            const freshFormatted = this.conversationDetector.formatConversation(freshDetection);

            if (freshFormatted) {
                content.querySelector('#ai-context').value = freshFormatted;
                detectedInputField = freshDetection.detectedInputField;
                this.showToast('✓ Conversation detected and loaded!', 'success');

                // Refresh the tab to show the detection status
                this.showAIReplyTab(content);
            } else {
                this.showToast('No conversation found on this page', 'error');
            }
        });

        // Clear context button handler
        const clearBtn = content.querySelector('#clear-context-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                content.querySelector('#ai-context').value = '';
                this.showAIReplyTab(content);
            });
        }

        // Generate Reply button handler
        content.querySelector('#generate-reply-btn').addEventListener('click', async () => {
            const context = content.querySelector('#ai-context').value.trim();
            if (!context) {
                this.showToast('Please enter conversation context or click Auto-Detect', 'error');
                return;
            }

            const btn = content.querySelector('#generate-reply-btn');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span style="font-size: 14px;">⏳</span> Generating...';

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
                    this.showToast('✓ Reply generated successfully!', 'success');
                } else {
                    this.showToast(response.message || 'Generation failed', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showToast('Error generating reply', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });

        // Insert Reply button handler
        const insertBtn = content.querySelector('#insert-reply-btn');
        if (insertBtn) {
            insertBtn.addEventListener('click', () => {
                if (generatedReply) {
                    // Try to use detected input field first
                    if (detectedInputField && document.contains(detectedInputField)) {
                        console.log('📤 Inserting reply into detected field');
                        this.quickRepliesManager.insertText(generatedReply, detectedInputField);
                        this.showToast('✓ Reply inserted!', 'success');
                        this.togglePanel();
                    } else {
                        // Fallback to QuickRepliesManager auto-detection
                        const result = this.quickRepliesManager.insertText(generatedReply);
                        if (result.success) {
                            this.showToast('✓ Reply inserted!', 'success');
                            this.togglePanel();
                        } else {
                            this.showToast('Could not find input field. Please select one.', 'error');
                        }
                    }
                }
            });
        }

        // Copy Reply button handler
        const copyBtn = content.querySelector('#copy-reply-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                if (generatedReply) {
                    try {
                        await navigator.clipboard.writeText(generatedReply);
                        this.showToast('✓ Copied to clipboard!', 'success');
                    } catch (error) {
                        console.error('Copy failed:', error);
                        this.showToast('Failed to copy', 'error');
                    }
                }
            });
        }
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

                <!-- AI Configuration Section -->
                ${isAuthenticated ? `
                <div class="farisly-settings-section">
                    <h3>AI Configuration</h3>
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; color: #999; font-size: 12px; margin-bottom: 6px;">
                            OpenAI API Key
                        </label>
                        <input
                            type="password"
                            id="openai-api-key"
                            placeholder="sk-..."
                            value="${this.escapeHtml(this.settings?.openaiKey || '')}"
                            style="width: 100%; padding: 10px; background: #111; border: 1px solid #2a2a2a; border-radius: 8px; color: #fff; font-size: 14px; font-family: monospace;"
                        />
                        <div style="color: #666; font-size: 11px; margin-top: 4px;">
                            Required for AI text processing features (Compose & AI Reply)
                        </div>
                    </div>
                    <button class="farisly-btn-primary" id="save-api-key-btn">
                        Save API Key
                    </button>
                </div>
                ` : ''}

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
                // Open Settings panel where Quick Replies are managed
                window.open('http://localhost:3000/panel', '_blank');
            });
        }

        // API Key save button
        const saveApiKeyBtn = content.querySelector('#save-api-key-btn');
        if (saveApiKeyBtn) {
            saveApiKeyBtn.addEventListener('click', async () => {
                const apiKeyInput = content.querySelector('#openai-api-key');
                const apiKey = apiKeyInput.value.trim();

                saveApiKeyBtn.disabled = true;
                saveApiKeyBtn.textContent = 'Saving...';

                try {
                    // Send to background to save to server
                    const response = await chrome.runtime.sendMessage({
                        type: 'SAVE_API_KEY',
                        payload: { apiKey }
                    });

                    if (response?.success) {
                        this.showToast('✓ API Key saved successfully!', 'success');
                        // Update local settings
                        if (this.settings) {
                            this.settings.openaiKey = apiKey;
                        }
                    } else {
                        this.showToast(response?.message || 'Failed to save API key', 'error');
                    }
                } catch (error) {
                    console.error('Error saving API key:', error);
                    this.showToast('Error saving API key', 'error');
                } finally {
                    saveApiKeyBtn.disabled = false;
                    saveApiKeyBtn.textContent = 'Save API Key';
                }
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
     * Enable extension dynamically without page reload
     * Called when site becomes allowed after initial check
     */
    async enableDynamically() {
        console.log('🚀 Enabling extension dynamically...');

        // Set enabled flag
        this.isEnabled = true;

        // Initialize Quick Replies Manager if not already done
        if (!this.quickRepliesManager) {
            console.log('Initializing Quick Replies Manager...');
            this.quickRepliesManager = new QuickRepliesManager();
        }

        // Initialize Grammar Checker if not already done
        if (!this.grammarChecker) {
            console.log('Initializing Grammar Checker...');
            this.grammarChecker = new GrammarChecker();
        }

        // Load settings
        console.log('Loading settings...');
        await this.loadSettings();

        // Enable grammar checker if API key is available
        console.log('📝 Checking for OpenAI API key...', this.settings?.openaiKey ? '✅ Found' : '❌ Not found');
        if (this.settings?.openaiKey) {
            console.log('✅ Enabling grammar checker with API key');
            this.grammarChecker.enable(this.settings.openaiKey);
            this.startMonitoringFields();
        } else {
            console.log('⚠️ Grammar checker NOT enabled - no API key found in settings');
        }

        // Create icon if it doesn't exist
        if (!this.iconContainer) {
            console.log('Creating icon...');
            this.createIcon();

            // Fade in animation for smooth UX
            if (this.iconContainer) {
                this.iconContainer.style.opacity = '0';
                this.iconContainer.style.transition = 'opacity 0.3s ease-in';
                // Force reflow
                this.iconContainer.offsetHeight;
                this.iconContainer.style.opacity = '1';
            }
        } else {
            // Icon exists but might be hidden, show it with fade in
            this.iconContainer.style.display = 'block';
            this.iconContainer.style.opacity = '0';
            this.iconContainer.style.transition = 'opacity 0.3s ease-in';
            // Force reflow
            this.iconContainer.offsetHeight;
            this.iconContainer.style.opacity = '1';
        }

        // Create panel if it doesn't exist
        if (!this.panel) {
            console.log('Creating panel...');
            this.createPanel();

            // Fade in animation for smooth UX
            if (this.panel) {
                this.panel.style.opacity = '0';
                this.panel.style.transition = 'opacity 0.3s ease-in';
                // Force reflow
                this.panel.offsetHeight;
                this.panel.style.opacity = '1';
            }
        } else {
            // Panel exists but might be hidden, ensure proper state
            this.panel.style.display = this.isVisible ? 'flex' : 'none';
            this.panel.style.opacity = '0';
            this.panel.style.transition = 'opacity 0.3s ease-in';
            // Force reflow
            this.panel.offsetHeight;
            this.panel.style.opacity = '1';
        }

        // Set up event listeners if not already done
        if (!this.eventListenersSetup) {
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            this.setupTextSelectionDetection();
            this.eventListenersSetup = true;
        }

        console.log('✅ Extension enabled dynamically without page reload!');

        // Show a subtle notification
        this.showToast('Extension enabled on this site', 'success');
    }

    /**
     * Start monitoring text fields for grammar checking
     */
    startMonitoringFields() {
        if (!this.grammarChecker) return;

        console.log('👁️ Starting field monitoring for grammar checking...');

        // Monitor existing fields
        const fields = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
        fields.forEach(field => {
            this.grammarChecker.monitorField(field);
        });

        // Monitor dynamically added fields
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if the node itself is a field
                        if (node.matches && (node.matches('textarea') || node.matches('input[type="text"]') || node.matches('[contenteditable="true"]'))) {
                            this.grammarChecker.monitorField(node);
                        }
                        // Check for fields within the node
                        const innerFields = node.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
                        innerFields.forEach(field => {
                            this.grammarChecker.monitorField(field);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Store observer for cleanup
        this.fieldObserver = observer;
    }

    /**
     * Stop monitoring fields
     */
    stopMonitoringFields() {
        if (this.fieldObserver) {
            this.fieldObserver.disconnect();
            this.fieldObserver = null;
        }
    }

    /**
     * Disable extension dynamically (when not allowed on site)
     * Gracefully removes UI without page reload
     */
    disable() {
        console.log('🔌 Disabling extension dynamically...');

        // Disable grammar checker
        if (this.grammarChecker) {
            this.grammarChecker.disable();
            this.stopMonitoringFields();
        }

        // Cleanup drag manager
        if (this.dragManager) {
            this.dragManager.destroy();
            this.dragManager = null;
        }

        // Hide and remove icon
        if (this.iconContainer) {
            // Fade out animation for smooth UX
            this.iconContainer.style.transition = 'opacity 0.2s ease-out';
            this.iconContainer.style.opacity = '0';

            setTimeout(() => {
                if (this.iconContainer) {
                    this.iconContainer.remove();
                    this.iconContainer = null;
                }
            }, 200);
        }

        // Hide and remove panel
        if (this.panel) {
            // Close panel first if open
            if (this.isVisible) {
                this.isVisible = false;
            }

            // Fade out animation
            this.panel.style.transition = 'opacity 0.2s ease-out';
            this.panel.style.opacity = '0';

            setTimeout(() => {
                if (this.panel) {
                    this.panel.remove();
                    this.panel = null;
                }
            }, 200);
        }

        // Reset state flags
        this.isEnabled = false;
        this.eventListenersSetup = false;

        console.log('✅ Extension disabled dynamically without page reload!');

        // Show a subtle notification
        this.showToast('Extension disabled on this site', 'info');
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
