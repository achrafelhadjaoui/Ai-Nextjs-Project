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

// Get API URL from config (loaded from config.js via manifest)
const API_URL = window.FARISLY_CONFIG?.API_URL || 'http://localhost:3001';

class FarislyAI {
    constructor() {
        this.isVisible = false;
        this.isMinimized = false;
        this.isAnimating = false;  // Lock during panel animations
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
        this.isAuthenticated = false; // CRITICAL: Authentication state
        this.authState = null; // Store full auth state
        this.init();
    }

    async init() {
        console.log('🔧 Initializing Farisly AI...');
        console.log('Current URL:', window.location.href);

        // CRITICAL: Always set up message listeners first
        this.setupMessageListeners();

        // STEP 1: Check authentication FIRST before anything else
        await this.checkAuthentication();
        console.log('🔐 Authentication status:', this.isAuthenticated);

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

        // Load settings first (needed for UI)
        console.log('Loading settings...');
        await this.loadSettings();

        // Create icon and panel (UI always shown)
        console.log('Creating icon...');
        this.createIcon();

        console.log('Creating panel...');
        this.createPanel();

        // If authenticated, enable full features
        if (this.isAuthenticated) {
            console.log('✅ User authenticated - enabling full features');

            console.log('Initializing Quick Replies Manager...');
            this.quickRepliesManager = new QuickRepliesManager();

            console.log('Initializing Grammar Checker...');
            this.grammarChecker = new GrammarChecker();

            // Enable grammar checker if API key is available
            if (this.settings?.openaiKey) {
                this.grammarChecker.enable(this.settings.openaiKey);
                this.startMonitoringFields();
            }

            console.log('Setting up event listeners...');
            this.setupEventListeners();
            this.setupTextSelectionDetection();
            this.eventListenersSetup = true;
        } else {
            console.log('🔒 User not authenticated - showing auth gate');
            // Only setup panel events, no feature events
            this.setupEventListeners();
            this.eventListenersSetup = true;
        }

        console.log('✅ Farisly AI initialized successfully');
    }

    /**
     * Check if user is authenticated
     * CRITICAL: This determines if ANY features are accessible
     * On page load, we check BOTH extension auth state AND dashboard session cookie
     */
    async checkAuthentication() {
        try {
            // First check extension's stored auth state
            const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });

            if (response && response.success && response.authState && response.authState.isAuthenticated) {
                this.authState = response.authState;
                this.isAuthenticated = true;
                console.log('✅ User authenticated via extension:', response.authState.user?.email);
                return;
            }

            // If extension auth not found, try to sync from dashboard session cookie
            console.log('🔍 Extension not authenticated, checking dashboard session...');
            const syncResult = await chrome.runtime.sendMessage({ type: 'SYNC_AUTH_FROM_WEB' });

            if (syncResult && syncResult.success) {
                this.authState = {
                    isAuthenticated: true,
                    user: syncResult.user
                };
                this.isAuthenticated = true;
                console.log('✅ User authenticated via dashboard session:', syncResult.user?.email);
            } else {
                this.isAuthenticated = false;
                console.log('🔒 User not authenticated on extension or dashboard');
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            this.isAuthenticated = false;
        }
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
        // Remove existing icon if it exists (prevent duplicates)
        if (this.iconContainer && this.iconContainer.parentNode) {
            this.iconContainer.parentNode.removeChild(this.iconContainer);
        }

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
            pointer-events: auto !important;
            isolation: isolate !important;
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
            cursor: pointer !important;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3) !important;
            transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) !important;
            user-select: none !important;
            pointer-events: auto !important;
            position: relative !important;
            z-index: 1 !important;
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
            pointer-events: none !important;
            position: relative !important;
            z-index: 2 !important;
            flex-shrink: 0 !important;
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
            this.closeIconBtn.style.pointerEvents = 'auto';
            console.log('👋 Hover enter - close button shown');
        });

        this.iconContainer.addEventListener('pointerleave', () => {
            // Always reset hover effects
            this.icon.style.transform = 'scale(1)';
            this.icon.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)';
            this.closeIconBtn.style.display = 'none';
            this.closeIconBtn.style.pointerEvents = 'none';
            console.log('👋 Hover leave - close button hidden');
        });

        // Close icon button - use pointerdown for instant response
        this.closeIconBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.hideIcon();
        });

        // Simple click handler - no dragging complexity
        this.setupSimpleIconClick();

        console.log('✨ Icon created');
    }

    /**
     * Setup simple click handler for icon - opens panel on click
     */
    setupSimpleIconClick() {
        this.icon.addEventListener('click', (e) => {
            console.log('👆 Icon clicked!', { target: e.target });

            // Don't toggle if clicking close button
            if (e.target === this.closeIconBtn) {
                console.log('❌ Click was on close button - ignoring');
                return;
            }

            console.log('✅ Opening/closing panel');
            this.togglePanel();
        });

        console.log('✅ Simple click handler attached to icon');
    }

    /**
     * Update panel position relative to icon with smart viewport boundary detection
     * Ensures panel never goes outside screen borders
     */
    updatePanelPosition(iconX, iconY) {
        // Get current dimensions
        const iconWidth = this.iconContainer.offsetWidth;
        const iconHeight = this.iconContainer.offsetHeight;
        const panelWidth = this.panel.offsetWidth;
        const panelHeight = this.panel.offsetHeight;

        // DEBUG: Log dimensions to catch zero-size issues
        console.log('📏 Panel dimensions:', { panelWidth, panelHeight });
        if (panelWidth === 0 || panelHeight === 0) {
            console.error('⚠️ CRITICAL: Panel dimensions are 0! Display property might be none.');
        }

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Safe margins from viewport edges
        const minMargin = 10;
        const padding = 12; // Space between icon and panel

        // Calculate available space in all directions
        const spaceRight = viewportWidth - (iconX + iconWidth);
        const spaceLeft = iconX;
        const spaceBelow = viewportHeight - (iconY + iconHeight);
        const spaceAbove = iconY;

        let panelX, panelY;
        let positionStrategy = '';

        // Priority 1: Try placing to the right of icon (preferred position)
        if (spaceRight >= panelWidth + padding + minMargin) {
            panelX = iconX + iconWidth + padding;
            panelY = iconY;
            positionStrategy = 'right';
        }
        // Priority 2: Try placing to the left of icon
        else if (spaceLeft >= panelWidth + padding + minMargin) {
            panelX = iconX - panelWidth - padding;
            panelY = iconY;
            positionStrategy = 'left';
        }
        // Priority 3: Try placing below icon
        else if (spaceBelow >= panelHeight + padding + minMargin) {
            panelX = iconX;
            panelY = iconY + iconHeight + padding;
            positionStrategy = 'below';
        }
        // Priority 4: Try placing above icon
        else if (spaceAbove >= panelHeight + padding + minMargin) {
            panelX = iconX;
            panelY = iconY - panelHeight - padding;
            positionStrategy = 'above';
        }
        // Fallback: Place in best available position and clamp
        else {
            // Determine which direction has most space
            const maxHorizontalSpace = Math.max(spaceRight, spaceLeft);
            const maxVerticalSpace = Math.max(spaceBelow, spaceAbove);

            if (maxHorizontalSpace > maxVerticalSpace) {
                // Use horizontal positioning
                if (spaceRight > spaceLeft) {
                    panelX = iconX + iconWidth + padding;
                    positionStrategy = 'right-constrained';
                } else {
                    panelX = iconX - panelWidth - padding;
                    positionStrategy = 'left-constrained';
                }
                panelY = iconY;
            } else {
                // Use vertical positioning
                if (spaceBelow > spaceAbove) {
                    panelY = iconY + iconHeight + padding;
                    positionStrategy = 'below-constrained';
                } else {
                    panelY = iconY - panelHeight - padding;
                    positionStrategy = 'above-constrained';
                }
                panelX = iconX;
            }
        }

        // Strict viewport boundary enforcement
        const maxX = viewportWidth - panelWidth - minMargin;
        const maxY = viewportHeight - panelHeight - minMargin;

        // Clamp X position
        let finalX = Math.max(minMargin, Math.min(panelX, maxX));

        // Clamp Y position
        let finalY = Math.max(minMargin, Math.min(panelY, maxY));

        // Additional safety check: If panel is still too wide/tall for viewport
        if (panelWidth > viewportWidth - (minMargin * 2)) {
            // Panel is wider than viewport - center it horizontally
            finalX = minMargin;
            console.warn('⚠️ Panel width exceeds viewport, centering horizontally');
        }

        if (panelHeight > viewportHeight - (minMargin * 2)) {
            // Panel is taller than viewport - position at top
            finalY = minMargin;
            console.warn('⚠️ Panel height exceeds viewport, positioning at top');
        }

        // Apply calculated position with !important to override any CSS
        this.panel.style.setProperty('left', `${finalX}px`, 'important');
        this.panel.style.setProperty('top', `${finalY}px`, 'important');
        this.panel.style.setProperty('right', 'auto', 'important');
        this.panel.style.setProperty('bottom', 'auto', 'important');

        // Verify position is within bounds (debug logging)
        const actualRect = this.panel.getBoundingClientRect();
        const isWithinBounds =
            actualRect.left >= 0 &&
            actualRect.right <= viewportWidth &&
            actualRect.top >= 0 &&
            actualRect.bottom <= viewportHeight;

        if (!isWithinBounds) {
            console.warn('⚠️ Panel still outside viewport after adjustment', {
                strategy: positionStrategy,
                position: { x: finalX, y: finalY },
                panelRect: actualRect,
                viewport: { width: viewportWidth, height: viewportHeight }
            });
        } else {
            console.log(`✅ Panel positioned: ${positionStrategy} at (${finalX}, ${finalY})`);
        }
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
     * @param {boolean} appendToDOM - Whether to append to DOM (false when replacing existing panel)
     */
    createPanel(appendToDOM = true) {
        // Remove existing panel from DOM if it exists (prevent duplicates)
        if (this.panel && this.panel.parentNode) {
            this.panel.parentNode.removeChild(this.panel);
        }

        this.panel = document.createElement('div');
        this.panel.id = 'farisly-ai-panel';
        this.panel.className = 'farisly-ai-panel';

        // If NOT authenticated, show ONLY auth gate UI (no tabs!)
        if (!this.isAuthenticated) {
            this.panel.innerHTML = `
                <div class="farisly-panel-header" id="panel-header">
                    <div class="farisly-panel-actions">
                        <button class="farisly-panel-btn farisly-minimize-btn" id="minimize-btn" title="Minimize">−</button>
                    </div>
                </div>

                <div class="farisly-panel-content" id="panel-content" style="padding: 40px 24px; text-align: center;">
                    <div style="max-width: 320px; margin: 0 auto;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>

                        <h2 style="color: #fff; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.3;">
                            Sign In Required
                        </h2>

                        <p style="color: #9ca3af; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
                            Access powerful AI features including AI Compose, Grammar Check, Quick Replies, and more.
                        </p>

                        <button id="auth-gate-signin-btn" style="width: 100%; padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); margin-bottom: 12px;">
                            Sign In to Dashboard
                        </button>

                        <button id="auth-gate-sync-btn" style="width: 100%; padding: 12px 24px; background: rgba(255, 255, 255, 0.05); color: #9ca3af; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                            </svg>
                            <span id="sync-btn-text">Sync with Dashboard</span>
                        </button>

                        <p style="color: #6b7280; font-size: 12px; margin: 20px 0 0 0; line-height: 1.5;">
                            Already signed in on the dashboard? Click "Sync with Dashboard" to activate your account here instantly.
                        </p>
                    </div>
                </div>
                <div class="farisly-resize-handle" id="resize-handle" title="Drag to resize"></div>
            `;
        } else {
            // Authenticated - show full UI with all tabs
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
                </div>

                <div class="farisly-panel-content" id="panel-content">
                    <!-- Content will be loaded dynamically -->
                </div>
            `;
        }

        // Set initial reasonable height - will be adjusted dynamically when panel opens
        this.panel.style.height = '280px';

        // Set safe default position (top-right with margins) using !important
        // This ensures panel never starts outside viewport even before JS positioning runs
        const safeMargin = 20;
        const defaultWidth = 340;
        this.panel.style.setProperty('top', `${safeMargin}px`, 'important');
        this.panel.style.setProperty('right', `${safeMargin}px`, 'important');
        this.panel.style.setProperty('left', 'auto', 'important');
        this.panel.style.setProperty('bottom', 'auto', 'important');

        // Initially hide the panel using CSS class
        this.panel.classList.add('hidden');
        this.panel.style.opacity = '0';

        // Only append to DOM if requested (default: true, false when replacing)
        if (appendToDOM) {
            document.body.appendChild(this.panel);
        }

        // Only show tabs if authenticated
        if (this.isAuthenticated) {
            this.showTab('compose');
        }

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

        // Tab switching (only if authenticated and tabs exist)
        this.panel.querySelectorAll('.farisly-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.showTab(tab);
            });
        });

        // Auth gate buttons (only if not authenticated)
        if (!this.isAuthenticated) {
            const signInBtn = this.panel.querySelector('#auth-gate-signin-btn');
            const syncBtn = this.panel.querySelector('#auth-gate-sync-btn');

            if (signInBtn) {
                signInBtn.addEventListener('click', () => {
                    console.log('🔐 Sign in button clicked - opening dashboard in new tab');
                    // Open dashboard in new tab - DON'T navigate current page
                    chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' });

                    // Show helpful message to user
                    const originalText = signInBtn.textContent;
                    signInBtn.textContent = 'Dashboard opened - Sign in there';
                    signInBtn.style.opacity = '0.7';

                    // Reset button after 3 seconds
                    setTimeout(() => {
                        signInBtn.textContent = originalText;
                        signInBtn.style.opacity = '1';
                    }, 3000);
                });

                // Hover effect
                signInBtn.addEventListener('mouseenter', () => {
                    signInBtn.style.transform = 'translateY(-2px)';
                    signInBtn.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                });
                signInBtn.addEventListener('mouseleave', () => {
                    signInBtn.style.transform = 'translateY(0)';
                    signInBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                });
            }

            if (syncBtn) {
                syncBtn.addEventListener('click', async () => {
                    console.log('🔄 Sync with Dashboard button clicked');

                    // Get reference to button text and SVG
                    const btnText = syncBtn.querySelector('#sync-btn-text');
                    const btnSvg = syncBtn.querySelector('svg');
                    const originalText = btnText.textContent;

                    // Disable button and show loading state
                    syncBtn.disabled = true;
                    syncBtn.style.cursor = 'not-allowed';
                    syncBtn.style.opacity = '0.7';
                    btnText.textContent = 'Checking...';

                    // Add rotation animation to SVG
                    btnSvg.style.animation = 'spin 1s linear infinite';
                    const styleSheet = document.createElement('style');
                    styleSheet.textContent = `
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                    `;
                    if (!document.querySelector('style[data-sync-animation]')) {
                        styleSheet.setAttribute('data-sync-animation', 'true');
                        document.head.appendChild(styleSheet);
                    }

                    try {
                        // Try to sync auth from web with timeout
                        const result = await Promise.race([
                            chrome.runtime.sendMessage({ type: 'SYNC_AUTH_FROM_WEB' }),
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Sync timeout')), 10000)
                            )
                        ]);

                        console.log('🔄 Sync result:', result);

                        if (result && result.success) {
                            // Success - show success state
                            btnText.textContent = 'Synced Successfully!';
                            btnSvg.style.animation = '';
                            syncBtn.style.background = 'rgba(16, 185, 129, 0.2)';
                            syncBtn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                            syncBtn.style.color = '#10b981';

                            console.log('✅ Auth synced successfully - updating UI');

                            // Update internal state
                            this.isAuthenticated = true;
                            this.authState = {
                                isAuthenticated: true,
                                user: result.user
                            };

                            // Show success message for 1.5 seconds, then transform the panel
                            setTimeout(async () => {
                                // Initialize features now that user is authenticated
                                console.log('🔄 Initializing authenticated features...');

                                // Load settings
                                await this.loadSettings();

                                // Initialize feature managers
                                this.quickRepliesManager = new QuickRepliesManager();
                                this.grammarChecker = new GrammarChecker();

                                if (this.settings?.openaiKey) {
                                    this.grammarChecker.enable(this.settings.openaiKey);
                                    this.startMonitoringFields();
                                }

                                // Recreate the panel with authenticated UI
                                // createPanel() now automatically removes old panel before creating new one
                                this.createPanel();

                                // Set up event listeners for the new panel
                                this.setupEventListeners();

                                // Show the panel and default tab
                                this.panel.classList.remove('hidden');
                                this.panel.style.opacity = '1';
                                this.showTab('compose');

                                // Enable text selection detection for authenticated features
                                if (!this.eventListenersSetup) {
                                    this.setupTextSelectionDetection();
                                    this.eventListenersSetup = true;
                                }

                                console.log('✨ Panel transformed to authenticated view with all features enabled');
                            }, 1500);
                        } else {
                            // Failed - show helpful message (NO redirect, just inform)
                            btnText.textContent = 'Not signed in on dashboard';
                            btnSvg.style.animation = '';
                            syncBtn.style.background = 'rgba(234, 179, 8, 0.2)';
                            syncBtn.style.borderColor = 'rgba(234, 179, 8, 0.4)';
                            syncBtn.style.color = '#eab308';

                            const errorMsg = result?.message || 'Not authenticated on dashboard';
                            console.log('⚠️ Sync failed:', errorMsg);

                            // Just reset button - DON'T redirect to dashboard
                            // User can use "Sign In to Dashboard" button above if they want
                            setTimeout(() => {
                                btnText.textContent = originalText;
                                syncBtn.disabled = false;
                                syncBtn.style.cursor = 'pointer';
                                syncBtn.style.opacity = '1';
                                syncBtn.style.background = 'rgba(255, 255, 255, 0.05)';
                                syncBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                syncBtn.style.color = '#9ca3af';
                            }, 3000);
                        }
                    } catch (error) {
                        console.error('❌ Error during sync:', error);

                        // Error state - likely timeout or network issue
                        btnText.textContent = error.message === 'Sync timeout' ? 'Timeout - Please try again' : 'Error - Try again';
                        btnSvg.style.animation = '';
                        syncBtn.style.background = 'rgba(239, 68, 68, 0.2)';
                        syncBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                        syncBtn.style.color = '#ef4444';

                        // Reset button after delay
                        setTimeout(() => {
                            btnText.textContent = originalText;
                            syncBtn.disabled = false;
                            syncBtn.style.cursor = 'pointer';
                            syncBtn.style.opacity = '1';
                            syncBtn.style.background = 'rgba(255, 255, 255, 0.05)';
                            syncBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            syncBtn.style.color = '#9ca3af';
                        }, 3000);
                    }
                });

                // Hover effect (only when not disabled)
                syncBtn.addEventListener('mouseenter', () => {
                    if (!syncBtn.disabled) {
                        syncBtn.style.background = 'rgba(255, 255, 255, 0.08)';
                        syncBtn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                        syncBtn.style.transform = 'translateY(-1px)';
                    }
                });
                syncBtn.addEventListener('mouseleave', () => {
                    if (!syncBtn.disabled) {
                        syncBtn.style.background = 'rgba(255, 255, 255, 0.05)';
                        syncBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        syncBtn.style.transform = 'translateY(0)';
                    }
                });
            }
        }

        // Window resize listener - reposition panel if it goes outside viewport
        let resizeTimeout;
        window.addEventListener('resize', () => {
            // Debounce resize events
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.isVisible && this.panel) {
                    const iconRect = this.iconContainer.getBoundingClientRect();
                    this.updatePanelPosition(iconRect.left, iconRect.top);
                    console.log('🔄 Window resized - panel repositioned');
                }
            }, 150);
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
     * Toggle panel visibility - SIMPLE VERSION
     */
    togglePanel() {
        if (!this.panel) {
            console.error('❌ Panel does not exist!');
            return;
        }

        // Simple toggle
        this.isVisible = !this.isVisible;
        console.log('🔄 Toggling panel. New state:', this.isVisible ? 'OPEN' : 'CLOSED');

        if (this.isVisible) {
            console.log('📂 Opening panel...');

            // CRITICAL FIX: Make panel visible (but transparent) FIRST so dimensions are calculated
            // This fixes the first-click positioning issue where offsetWidth/Height return 0
            this.panel.classList.remove('hidden');
            this.panel.classList.add('visible');
            this.panel.style.opacity = '0'; // Keep invisible while positioning

            // Force browser to calculate layout (reflow) so offsetWidth/Height are accurate
            void this.panel.offsetHeight;

            // IMPORTANT: Calculate and set the correct height BEFORE showing the panel
            // This ensures the panel opens with the correct height for the current tab
            // Use immediate=true to calculate synchronously before panel is shown
            this.adjustPanelHeightForTab(this.currentTab, true);

            // NOW position panel with accurate dimensions
            const iconRect = this.iconContainer.getBoundingClientRect();
            this.updatePanelPosition(iconRect.left, iconRect.top);

            // Finally, fade in the panel
            requestAnimationFrame(() => {
                this.panel.style.opacity = '1';

                // Unlock after fade-in completes
                setTimeout(() => {
                    this.isAnimating = false;
                    console.log('🔓 Animation lock released (open)');
                }, 300);
            });

            console.log('✅ Panel opened with correct height for tab:', this.currentTab);
        } else {
            console.log('📁 Closing panel...');
            this.panel.style.opacity = '0';

            setTimeout(() => {
                // Remove visible class, add hidden class
                this.panel.classList.remove('visible');
                this.panel.classList.add('hidden');

                // Unlock after fade-out completes
                this.isAnimating = false;
                console.log('🔓 Animation lock released (close)');
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
        }

        // Adjust panel height dynamically based on content
        // Each tab will have its own flexible height
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
            this.adjustPanelHeightForTab(tabName);
        });
    }

    /**
     * Dynamically adjust panel height based on tab content
     * Each tab gets flexible height based on its actual content
     * Panel height adjusts automatically when switching tabs
     * @param {string} tabName - The name of the current tab
     * @param {boolean} immediate - If true, calculate immediately without RAF
     */
    adjustPanelHeightForTab(tabName, immediate = false) {
        if (!this.panel) return;

        const content = this.panel.querySelector('#panel-content');
        if (!content) return;

        const calculateAndSetHeight = () => {
            // Calculate header and tab nav heights
            const header = this.panel.querySelector('.farisly-panel-header');
            const tabNav = this.panel.querySelector('.farisly-tab-nav');
            const headerHeight = header ? header.offsetHeight : 52;
            const tabNavHeight = tabNav ? tabNav.offsetHeight : 46;

            // Get the actual content height
            const contentHeight = content.scrollHeight;

            // Calculate total panel height needed
            const totalHeight = headerHeight + tabNavHeight + contentHeight + 16; // +16 for padding

            // Set maximum height to not exceed viewport
            const viewportMaxHeight = window.innerHeight - 40;
            const finalHeight = Math.min(totalHeight, viewportMaxHeight);

            // Apply the height (transition is in CSS)
            this.panel.style.height = `${finalHeight}px`;

            console.log(`📐 Panel height adjusted for ${tabName}: ${finalHeight}px (content: ${contentHeight}px, header: ${headerHeight}px, tabNav: ${tabNavHeight}px)`);
        };

        if (immediate) {
            // Calculate immediately (for initial panel open)
            calculateAndSetHeight();
        } else {
            // Wait for content to render, then measure
            // Use double requestAnimationFrame to ensure DOM is fully painted
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    calculateAndSetHeight();
                });
            });
        }
    }

    /**
     * Legacy function for backward compatibility
     * Now calls the new adjustPanelHeightForTab
     */
    adjustPanelHeight() {
        this.adjustPanelHeightForTab(this.currentTab);
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
                        <button class="farisly-btn-primary" id="open-dashboard-btn">
                            Open Dashboard to Sign In
                        </button>
                    </div>
                </div>
            `;

            // Setup button listener
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

                // Adjust panel height after content changes
                requestAnimationFrame(() => {
                    this.adjustPanelHeight();
                });
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

                // Adjust panel height after content changes
                requestAnimationFrame(() => {
                    this.adjustPanelHeight();
                });
            });
        });

        // Open dashboard button
        const dashboardBtn = content.querySelector('#open-dashboard-btn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => {
                window.open(`${API_URL}/dashboard`, '_blank');
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
