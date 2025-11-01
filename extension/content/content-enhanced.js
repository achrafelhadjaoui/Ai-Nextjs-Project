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

        // Icon hover effects
        this.icon.addEventListener('mouseenter', () => {
            this.icon.style.transform = 'scale(1.1)';
            this.icon.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.6), 0 6px 16px rgba(0, 0, 0, 0.4)';
            this.closeIconBtn.style.display = 'flex';
        });

        this.iconContainer.addEventListener('mouseleave', () => {
            if (!this.isIconDragging) {
                this.icon.style.transform = 'scale(1)';
                this.icon.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)';
                this.closeIconBtn.style.display = 'none';
            }
        });

        // Icon click to toggle panel
        this.icon.addEventListener('click', (e) => {
            if (!this.isIconDragging) {
                this.togglePanel();
            }
        });

        // Close icon button
        this.closeIconBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideIcon();
        });

        // Make icon draggable
        this.setupIconDragging();

        console.log('✨ Icon created');
    }

    /**
     * Setup icon dragging functionality
     */
    setupIconDragging() {
        this.icon.addEventListener('mousedown', (e) => {
            this.isIconDragging = true;
            this.icon.style.cursor = 'grabbing';

            const rect = this.iconContainer.getBoundingClientRect();
            this.iconDragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isIconDragging) {
                const newX = e.clientX - this.iconDragOffset.x;
                const newY = e.clientY - this.iconDragOffset.y;

                // Keep within viewport
                const maxX = window.innerWidth - this.iconContainer.offsetWidth;
                const maxY = window.innerHeight - this.iconContainer.offsetHeight;

                const clampedX = Math.max(0, Math.min(newX, maxX));
                const clampedY = Math.max(0, Math.min(newY, maxY));

                this.iconContainer.style.left = `${clampedX}px`;
                this.iconContainer.style.top = `${clampedY}px`;
                this.iconContainer.style.right = 'auto';

                // Move panel with icon
                if (this.isVisible && this.panel) {
                    this.updatePanelPosition(clampedX, clampedY);
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isIconDragging) {
                this.isIconDragging = false;
                this.icon.style.cursor = 'grab';
            }
        });
    }

    /**
     * Update panel position relative to icon
     */
    updatePanelPosition(iconX, iconY) {
        const panelX = iconX + 70; // Position panel to the right of icon
        const panelY = iconY;

        const maxX = window.innerWidth - this.panel.offsetWidth - 20;
        const maxY = window.innerHeight - this.panel.offsetHeight - 20;

        const clampedX = Math.max(20, Math.min(panelX, maxX));
        const clampedY = Math.max(20, Math.min(panelY, maxY));

        this.panel.style.left = `${clampedX}px`;
        this.panel.style.top = `${clampedY}px`;
        this.panel.style.right = 'auto';
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
            </div>

            <div class="farisly-panel-content" id="panel-content">
                <!-- Content will be loaded dynamically -->
            </div>
        `;

        document.body.appendChild(this.panel);
        this.showTab('compose');

        console.log('📋 Panel created');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Panel dragging
        const header = this.panel.querySelector('#panel-header');
        header.addEventListener('mousedown', (e) => {
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

        // Minimize button
        this.panel.querySelector('#minimize-btn').addEventListener('click', () => {
            this.isMinimized = !this.isMinimized;
            this.panel.classList.toggle('minimized', this.isMinimized);
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
        chrome.runtime.onMessage.addListener((request) => {
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
        this.isVisible = !this.isVisible;

        if (this.isVisible) {
            this.panel.style.display = 'flex';
            setTimeout(() => {
                this.panel.style.opacity = '1';
            }, 10);

            // Position panel near icon
            const iconRect = this.iconContainer.getBoundingClientRect();
            this.updatePanelPosition(iconRect.left, iconRect.top);
        } else {
            this.panel.style.opacity = '0';
            setTimeout(() => {
                this.panel.style.display = 'none';
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
    showQuickRepliesTab(content) {
        const replies = this.settings?.quickReplies || [];

        if (replies.length === 0) {
            content.innerHTML = `
                <div class="farisly-empty">
                    <div class="farisly-empty-icon">💾</div>
                    <div class="farisly-empty-text">No quick replies yet</div>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="farisly-replies-list">
                ${replies.map(reply => `
                    <div class="farisly-reply-item" data-reply-id="${reply.key || reply._id}">
                        <div class="farisly-reply-title">${reply.title}</div>
                        <div class="farisly-reply-content">${reply.content}</div>
                        ${reply.category ? `<span class="farisly-reply-category">${reply.category}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        // Add click handlers
        content.querySelectorAll('.farisly-reply-item').forEach(item => {
            item.addEventListener('click', () => {
                const replyId = item.dataset.replyId;
                const reply = replies.find(r => (r.key || r._id) === replyId);
                if (reply) {
                    this.insertReply(reply);
                }
            });
        });
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
        if (this.iconContainer) {
            this.iconContainer.remove();
        }
        if (this.panel) {
            this.panel.remove();
        }
        this.isEnabled = false;
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
