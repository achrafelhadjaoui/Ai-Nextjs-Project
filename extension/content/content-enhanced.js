// Enhanced Farisly AI content script with working tab switching
console.log('Enhanced Farisly AI content script loaded');

class EnhancedFarislyAI {
    constructor() {
        console.log('EnhancedFarislyAI constructor called');
        this.isVisible = false;
        this.isMinimized = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.currentTab = 'compose';
        this.savedReplies = [];
        this.aiInstructions = '';
        this.currentTextInput = null;
        this.init();
    }

    async init() {
        console.log('EnhancedFarislyAI init called');
        this.createIcon();
        this.createPanel();
        this.setupEventListeners();
        await this.loadSettings();
        console.log('EnhancedFarislyAI initialization completed');
    }

    createIcon() {
        console.log('Creating icon...');
        this.icon = document.createElement('div');
        this.icon.id = 'farisly-ai-icon';
        this.icon.innerHTML = '🤖';
        this.icon.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #2d2d2d;
            border: 2px solid #444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            transition: all 0.3s ease;
            user-select: none;
        `;
        document.body.appendChild(this.icon);
        console.log('Icon created and appended');
    }

    createPanel() {
        console.log('Creating panel...');
        this.panel = document.createElement('div');
        this.panel.id = 'farisly-ai-panel';
        this.panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 80px;
            background: #1a1a1a;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: none;
            z-index: 10001;
            min-width: 400px;
            max-width: 500px;
            border: 1px solid #333;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        this.panel.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0;">
                <!-- App Name Header (Draggable) -->
                <div id="app-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: #1a1a1a;
                    border-bottom: 1px solid #333;
                    cursor: move;
                    user-select: none;
                ">
                    <div style="
                        color: white;
                        font-weight: 600;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        🤖 Farisly AI
                    </div>
                    <button id="minimize-btn" style="
                        width: 24px;
                        height: 24px;
                        background: #333;
                        color: white;
                        border: none;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        transition: all 0.2s ease;
                    ">−</button>
                </div>

                <!-- Tab Menu -->
                <div style="display: flex; gap: 12px; align-items: center; padding: 12px 16px; background: #1a1a1a; border-bottom: 1px solid #333;">
                    <button id="tab-compose" class="tab-btn active" style="
                        flex: 1;
                        padding: 10px 12px;
                        background: #6366f1;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 400;
                        font-size: 13px;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    ">✏️ Compose</button>
                    
                    <button id="tab-quick" class="tab-btn" style="
                        flex: 1;
                        padding: 10px 12px;
                        background: #333;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 400;
                        font-size: 13px;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        white-space: nowrap;
                    ">💾 Quick Replies</button>
                    
                    <button id="tab-ai" class="tab-btn" style="
                        flex: 1;
                        padding: 10px 12px;
                        background: #333;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 400;
                        font-size: 13px;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                    ">🤖 AI Reply</button>
                </div>

                <!-- Content Area -->
                <div style="min-height: 200px; padding: 16px;">
                    <!-- Compose Options -->
                    <div id="content-compose" class="tab-content" style="display: block;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <button class="compose-option" data-action="fix-grammar" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                text-align: left;
                                transition: all 0.2s ease;
                                font-size: 13px;
                                font-weight: 400;
                            ">🔧 Fix Grammar</button>
                            
                            <button class="compose-option" data-action="expand" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                text-align: left;
                                transition: all 0.2s ease;
                                font-size: 13px;
                                font-weight: 400;
                            ">📝 Expand</button>
                            
                            <button class="compose-option" data-action="elaborate" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                text-align: left;
                                transition: all 0.2s ease;
                                font-size: 13px;
                                font-weight: 400;
                            ">💭 Elaborate</button>
                            
                            <button class="compose-option" data-action="summarize" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                text-align: left;
                                transition: all 0.2s ease;
                                font-size: 13px;
                                font-weight: 400;
                            ">📋 Summarize</button>
                            
                            <button class="compose-option" data-action="professional" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                text-align: left;
                                transition: all 0.2s ease;
                                font-size: 13px;
                                font-weight: 400;
                            ">👔 Professional</button>
                            
                            <button class="compose-option" data-action="friendly" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                text-align: left;
                                transition: all 0.2s ease;
                                font-size: 13px;
                                font-weight: 400;
                            ">😊 Friendly</button>
                        </div>
                    </div>

                    <!-- Quick Replies -->
                    <div id="content-quick" class="tab-content" style="display: none;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="color: white; margin: 0; font-size: 14px;">Quick Replies</h4>
                            <button id="refresh-quick-replies" style="
                                background: #333;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                padding: 4px 8px;
                                cursor: pointer;
                                font-size: 12px;
                                transition: all 0.2s ease;
                            ">🔄 Refresh</button>
                        </div>
                        <div id="quick-replies-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <!-- Quick replies will be loaded here -->
                        </div>
                    </div>

                    <!-- AI Reply -->
                    <div id="content-ai" class="tab-content" style="display: none;">
                        <div style="margin-bottom: 12px;">
                            <label style="color: white; font-size: 13px; margin-bottom: 6px; display: block;">
                                Optional: Add context or question
                            </label>
                            <textarea id="ai-context-input" placeholder="Enter additional context or question (optional)..." style="
                                width: 100%;
                                height: 60px;
                                padding: 8px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                resize: vertical;
                                font-size: 13px;
                                font-family: inherit;
                            "></textarea>
                        </div>
                        <button id="generate-ai-reply" style="
                            width: 100%;
                            padding: 12px;
                            background: #6366f1;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 500;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            transition: all 0.2s ease;
                        ">🤖 Generate AI Reply</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.panel);
        console.log('Panel created and appended');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Icon click
        this.icon.addEventListener('click', () => {
            console.log('Icon clicked!');
            this.togglePanel();
        });

        // Minimize button
        const minimizeBtn = document.getElementById('minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMinimize();
            });
        }

        // Tab buttons - using the working logic from simple version
        const tabCompose = document.getElementById('tab-compose');
        const tabQuick = document.getElementById('tab-quick');
        const tabAi = document.getElementById('tab-ai');

        console.log('Tab buttons found:', { tabCompose, tabQuick, tabAi });

        if (tabCompose) {
            tabCompose.addEventListener('click', () => {
                console.log('Compose tab clicked!');
                this.switchTab('compose');
            });
        }

        if (tabQuick) {
            tabQuick.addEventListener('click', () => {
                console.log('Quick tab clicked!');
                this.switchTab('quick');
            });
        }

        if (tabAi) {
            tabAi.addEventListener('click', () => {
                console.log('AI tab clicked!');
                this.switchTab('ai');
            });
        }

        // Compose options
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('compose-option')) {
                const action = e.target.dataset.action;
                this.processText(action);
            }
        });

        // Quick replies
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('quick-reply-item')) {
                const index = parseInt(e.target.dataset.index);
                this.insertSavedReply(this.savedReplies[index]);
            }
        });

        // AI Reply
        const generateAIReplyBtn = document.getElementById('generate-ai-reply');
        if (generateAIReplyBtn) {
            generateAIReplyBtn.addEventListener('click', () => {
                this.generateAIReply();
            });
        }

        // Refresh Quick Replies
        const refreshQuickRepliesBtn = document.getElementById('refresh-quick-replies');
        if (refreshQuickRepliesBtn) {
            refreshQuickRepliesBtn.addEventListener('click', () => {
                console.log('Refresh quick replies clicked');
                this.loadSettings().then(() => {
                    this.loadQuickReplies();
                });
            });
        }

        // Drag functionality
        this.setupDragListeners();

        console.log('Event listeners setup completed');
    }

    setupDragListeners() {
        console.log('Setting up drag listeners...');
        // Make app header draggable
        const appHeader = this.panel.querySelector('#app-header');
        console.log('App header found:', !!appHeader);
        
        if (appHeader) {
            appHeader.addEventListener('mousedown', (e) => {
                console.log('App header mousedown event');
                if (e.target === appHeader || e.target.closest('#app-header')) {
                    console.log('Starting drag');
                    this.isDragging = true;
                    this.dragOffset.x = e.clientX - this.panel.offsetLeft;
                    this.dragOffset.y = e.clientY - this.panel.offsetTop;
                    appHeader.style.cursor = 'grabbing';
                    e.preventDefault(); // Prevent default behavior
                }
            });
        }

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                console.log('Dragging panel...');
                const x = e.clientX - this.dragOffset.x;
                const y = e.clientY - this.dragOffset.y;
                
                // Ensure panel never goes off-screen
                const panelWidth = this.panel.offsetWidth;
                const panelHeight = this.panel.offsetHeight;
                const minX = 0;
                const maxX = window.innerWidth - panelWidth;
                const minY = 0;
                const maxY = window.innerHeight - panelHeight;
                
                const clampedX = Math.max(minX, Math.min(maxX, x));
                const clampedY = Math.max(minY, Math.min(maxY, y));
                
                this.panel.style.left = clampedX + 'px';
                this.panel.style.top = clampedY + 'px';
                this.panel.style.right = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                console.log('Stopping drag');
                this.isDragging = false;
                const appHeader = this.panel.querySelector('#app-header');
                if (appHeader) {
                    appHeader.style.cursor = 'move';
                }
            }
        });
    }

    togglePanel() {
        console.log('togglePanel called, isVisible:', this.isVisible);
        this.isVisible = !this.isVisible;
        
        if (this.isVisible) {
            this.panel.style.display = 'block';
            // Force a reflow to ensure display change takes effect
            this.panel.offsetHeight;
            this.panel.style.opacity = '1';
        } else {
            this.panel.style.opacity = '0';
            // Hide after transition completes
            setTimeout(() => {
                if (!this.isVisible) {
                    this.panel.style.display = 'none';
                }
            }, 300);
        }
        console.log('Panel display updated, isVisible:', this.isVisible);
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        if (this.isMinimized) {
            this.panel.style.display = 'none';
            this.isVisible = false;
        } else {
            this.panel.style.display = 'block';
            this.isVisible = true;
        }
    }

    switchTab(tabName) {
        console.log('switchTab called with:', tabName);
        
        // Update current tab
        this.currentTab = tabName;
        
        // Update tab buttons - using the working logic from simple version
        const tabButtons = document.querySelectorAll('.tab-btn');
        console.log('Found tab buttons:', tabButtons.length);
        
        tabButtons.forEach(btn => {
            btn.style.background = '#333';
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(`tab-${tabName}`);
        console.log('Active button found:', activeBtn);
        
        if (activeBtn) {
            activeBtn.style.background = '#6366f1';
            activeBtn.classList.add('active');
            console.log('Active button styled');
        }
        
        // Update content - using the working logic from simple version
        const contentSections = document.querySelectorAll('.tab-content');
        console.log('Found content sections:', contentSections.length);
        
        contentSections.forEach(section => {
            section.style.display = 'none';
        });
        
        const activeContent = document.getElementById(`content-${tabName}`);
        console.log('Active content found:', activeContent);
        
        if (activeContent) {
            activeContent.style.display = 'block';
            console.log('Active content shown');
        }
        
        // Load quick replies if switching to that tab
        if (tabName === 'quick') {
            this.loadQuickReplies();
        }
        
        console.log('switchTab completed for:', tabName);
    }

    loadQuickReplies() {
        const quickRepliesList = document.getElementById('quick-replies-list');
        if (!quickRepliesList) {
            console.log('❌ Quick replies list element not found');
            return;
        }

        console.log('📝 Loading quick replies with data:', this.savedReplies);
        console.log('📝 Number of replies to display:', this.savedReplies.length);

        // Sort saved replies by title (same as panel)
        const sortedReplies = [...this.savedReplies].sort((a, b) => 
            a.title.toLowerCase().localeCompare(b.title.toLowerCase())
        );

        console.log('Sorted replies:', sortedReplies);

        quickRepliesList.innerHTML = sortedReplies.map((reply, index) => `
            <button class="quick-reply-item" data-index="${this.savedReplies.indexOf(reply)}" style="
                padding: 10px 12px;
                background: #2d2d2d;
                color: white;
                border: 1px solid #444;
                border-radius: 6px;
                cursor: pointer;
                text-align: left;
                transition: all 0.2s ease;
                font-size: 13px;
                font-weight: 400;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            ">${reply.title}</button>
        `).join('');
    }

    async loadSettings() {
        try {
            console.log('🔄 Loading settings from panel...');
            console.log('🔄 Current URL:', window.location.href);
            
            // Fetch from panel API to get the latest settings
            const response = await fetch('http://localhost:3000/api/settings');
            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', response.headers);
            
            const data = await response.json();
            
            console.log('📊 Raw data from panel API:', data);
            console.log('📊 Number of saved replies:', data.savedReplies?.length || 0);
            
            // Use the settings from the panel
            this.savedReplies = data.savedReplies || [];
            this.aiInstructions = data.aiInstructions || '';
            
            console.log('Processed settings:', { savedReplies: this.savedReplies, aiInstructions: this.aiInstructions });
            
            // If we're currently on the quick replies tab, reload it
            if (this.currentTab === 'quick') {
                this.loadQuickReplies();
            }
            
            console.log('Successfully loaded settings from panel:', { savedReplies: this.savedReplies, aiInstructions: this.aiInstructions });
        } catch (error) {
            console.error('❌ Could not load settings from panel:', error);
            console.error('❌ Error type:', error.constructor.name);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            
            // Use default settings if panel is not available
            this.savedReplies = [
                {
                    title: "Thank you message",
                    content: "Thank you for your message. I'll get back to you as soon as possible."
                },
                {
                    title: "Follow up",
                    content: "I wanted to follow up on our previous conversation. Do you have any updates?"
                }
            ];
            this.aiInstructions = "You are a helpful AI assistant. When replying to messages, be professional, concise, and helpful.";
            console.log('Using default settings:', { savedReplies: this.savedReplies });
        }
    }

    processText(action) {
        console.log('Processing text with action:', action);
        // Implementation for text processing
    }

    insertSavedReply(reply) {
        console.log('Inserting saved reply:', reply);
        
        // Find the best text input on the page
        const targetInput = this.findBestTextInput();
        if (targetInput) {
            this.insertText(reply.content, targetInput);
            console.log('Successfully inserted reply into input');
        } else {
            console.log('No suitable text input found');
        }
    }

    findBestTextInput() {
        // Priority order for finding text inputs
        const selectors = [
            'textarea[placeholder*="message" i]',
            'textarea[placeholder*="reply" i]',
            'textarea[placeholder*="comment" i]',
            'input[type="text"][placeholder*="message" i]',
            'input[type="text"][placeholder*="reply" i]',
            'input[type="text"][placeholder*="comment" i]',
            'textarea:not([readonly]):not([disabled])',
            'input[type="text"]:not([readonly]):not([disabled])',
            'div[contenteditable="true"]',
            'div[contenteditable="true"][role="textbox"]'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (this.isElementVisible(element) && !element.disabled && !element.readOnly) {
                    return element;
                }
            }
        }

        return null;
    }

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               rect.top >= 0 && rect.left >= 0 &&
               rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
    }

    insertText(text, targetInput) {
        if (targetInput.tagName === 'TEXTAREA' || targetInput.tagName === 'INPUT') {
            // For regular input/textarea elements
            const startPos = targetInput.selectionStart || 0;
            const endPos = targetInput.selectionEnd || 0;
            const currentValue = targetInput.value || '';
            
            const newValue = currentValue.slice(0, startPos) + text + currentValue.slice(endPos);
            targetInput.value = newValue;
            
            // Set cursor position after inserted text
            const newPos = startPos + text.length;
            targetInput.setSelectionRange(newPos, newPos);
            
            // Trigger input event to notify the page
            targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
            
        } else if (targetInput.contentEditable === 'true') {
            // For contenteditable divs
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                targetInput.textContent = text;
            }
            
            // Trigger input event
            targetInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Focus the input
        targetInput.focus();
    }

    generateAIReply() {
        console.log('Generating AI reply');
        // Implementation for AI reply generation
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing EnhancedFarislyAI');
        new EnhancedFarislyAI();
    });
} else {
    console.log('DOM already loaded, initializing EnhancedFarislyAI');
    new EnhancedFarislyAI();
}
