// Enhanced content script for Farisly Ai extension
console.log('Farisly Ai content script loaded');

// Test if the script is working
console.log('Content script is executing...');
console.log('Document ready state:', document.readyState);
console.log('Document body exists:', !!document.body);

class FarislyAI {
    constructor() {
        this.isVisible = false;
        this.isMinimized = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.currentTextInput = null;
        this.savedReplies = [];
        this.aiInstructions = '';
        this.isLoading = false;
        
        this.init().catch(error => {
            console.error('Error initializing Farisly AI:', error);
        });
    }

    async init() {
        console.log('Starting Farisly AI initialization...');
        this.createFloatingIcon();
        console.log('Floating icon created');
        this.createOptionsPanel();
        console.log('Options panel created');
        this.setupEventListeners();
        console.log('Event listeners setup');
        
        // Load settings in background, don't wait for it
        this.loadSettings().then(() => {
            console.log('Settings loaded successfully');
        }).catch((error) => {
            console.error('Settings loading failed:', error);
        });
        
        console.log('Farisly AI initialization completed');
    }

    createFloatingIcon() {
        console.log('Creating floating icon...');
        // Create the main floating icon
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
        
        console.log('Icon created:', this.icon);
        console.log('Icon styles applied');

        // Create minimize button (will be positioned in the panel)
        this.minimizeBtn = document.createElement('div');
        this.minimizeBtn.id = 'farisly-ai-minimize';
        this.minimizeBtn.innerHTML = '−';
        this.minimizeBtn.style.cssText = `
            width: 24px;
            height: 24px;
            background: #333;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid #444;
        `;

        // Create the options panel
        this.optionsPanel = document.createElement('div');
        this.optionsPanel.id = 'farisly-ai-options';
        this.optionsPanel.style.cssText = `
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

        this.optionsPanel.innerHTML = `
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
                    <div id="minimize-btn-container"></div>
                </div>

                <!-- Tab Menu -->
                <div style="display: flex; gap: 12px; align-items: center; padding: 12px 16px; background: #1a1a1a; border-bottom: 1px solid #333;">
                    <button id="compose-btn" class="tab-btn active" style="
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
                    ">✏️ Compose</button>
                    
                    <button id="quick-replies-btn" class="tab-btn" style="
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
                    
                    <button id="ai-reply-btn" class="tab-btn" style="
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
                <div id="content-area" style="min-height: 200px; padding: 16px;">
                    <!-- Compose Options -->
                    <div id="compose-content" class="content-section" style="display: block;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <button class="compose-option" data-action="fix-grammar" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s ease;
                                text-align: left;
                            ">🔧 Fix Grammar</button>
                            <button class="compose-option" data-action="expand" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s ease;
                                text-align: left;
                            ">📝 Expand Text</button>
                            <button class="compose-option" data-action="elaborate" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s ease;
                                text-align: left;
                            ">💡 Elaborate</button>
                            <button class="compose-option" data-action="summarize" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s ease;
                                text-align: left;
                            ">📋 Summarize</button>
                            <button class="compose-option" data-action="tone-professional" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s ease;
                                text-align: left;
                            ">💼 Professional</button>
                            <button class="compose-option" data-action="tone-friendly" style="
                                padding: 10px 12px;
                                background: #2d2d2d;
                                color: white;
                                border: 1px solid #444;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s ease;
                                text-align: left;
                            ">😊 Friendly</button>
                        </div>
                    </div>

                    <!-- Quick Replies Content -->
                    <div id="quick-replies-content" class="content-section" style="display: none;">
                        <div id="quick-replies-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 200px; overflow-y: auto;">
                            <!-- Quick replies will be loaded here -->
                        </div>
                    </div>

                    <!-- AI Reply Content -->
                    <div id="ai-reply-content" class="content-section" style="display: none;">
                        <div style="padding: 0;">
                            <div style="margin-bottom: 12px;">
                                <label style="display: block; color: #ccc; font-size: 12px; margin-bottom: 6px;">Optional: Add context or question</label>
                                <textarea id="ai-context-input" placeholder="Enter additional context or question (optional)..." style="
                                    width: 100%;
                                    height: 60px;
                                    padding: 8px 12px;
                                    background: #2d2d2d;
                                    color: white;
                                    border: 1px solid #444;
                                    border-radius: 6px;
                                    font-size: 13px;
                                    resize: vertical;
                                    font-family: inherit;
                                "></textarea>
                            </div>
                            <div style="text-align: center;">
                                <button id="generate-ai-reply" style="
                                    padding: 10px 20px;
                                    background: #6366f1;
                                    color: white;
                                    border: none;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-weight: 500;
                                    font-size: 13px;
                                    transition: all 0.2s ease;
                                ">🤖 Generate AI Reply</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.icon);
        document.body.appendChild(this.optionsPanel);
        
        console.log('Panel appended to DOM, panel element:', this.optionsPanel);
        console.log('Panel display style:', this.optionsPanel.style.display);
        
        // Add minimize button to the panel
        const minimizeContainer = this.optionsPanel.querySelector('#minimize-btn-container');
        if (minimizeContainer) {
            minimizeContainer.appendChild(this.minimizeBtn);
            console.log('Minimize button added to panel');
        } else {
            console.error('Minimize button container not found!');
        }
    }

    createOptionsPanel() {
        console.log('Creating options panel...');
        
        // Create the options panel
        this.optionsPanel = document.createElement('div');
        this.optionsPanel.id = 'farisly-ai-options';
        this.optionsPanel.style.cssText = `
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

        this.optionsPanel.innerHTML = `
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
                    <div id="minimize-btn-container"></div>
                </div>

                <!-- Tab Menu -->
                <div style="display: flex; gap: 12px; align-items: center; padding: 12px 16px; background: #1a1a1a; border-bottom: 1px solid #333;">
                    <button id="compose-btn" class="tab-btn active" style="
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
                    ">✏️ Compose</button>
                    
                    <button id="quick-replies-btn" class="tab-btn" style="
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
                    
                    <button id="ai-reply-btn" class="tab-btn" style="
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
                <div id="content-area" style="min-height: 200px; padding: 16px;">
                    <!-- Compose Options -->
                    <div id="compose-content" class="content-section" style="display: block;">
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
                    <div id="quick-replies-content" class="content-section" style="display: none;">
                        <div id="quick-replies-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <!-- Quick replies will be loaded here -->
                        </div>
                    </div>

                    <!-- AI Reply -->
                    <div id="ai-reply-content" class="content-section" style="display: none;">
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

        document.body.appendChild(this.optionsPanel);
        
        console.log('Panel appended to DOM, panel element:', this.optionsPanel);
        console.log('Panel display style:', this.optionsPanel.style.display);
        
        // Add minimize button to the panel
        const minimizeContainer = this.optionsPanel.querySelector('#minimize-btn-container');
        if (minimizeContainer) {
            minimizeContainer.appendChild(this.minimizeBtn);
            console.log('Minimize button added to panel');
        } else {
            console.error('Minimize button container not found!');
        }
    }

    setupEventListeners() {
        // Icon click to toggle options
        this.icon.addEventListener('click', (e) => {
            console.log('Icon clicked!');
            e.stopPropagation();
            this.toggleOptions();
        });
        
        // Add hover effect to show it's clickable
        this.icon.addEventListener('mouseenter', () => {
            this.icon.style.transform = 'scale(1.1)';
            this.icon.style.background = '#4a90e2';
        });
        
        this.icon.addEventListener('mouseleave', () => {
            if (!this.isVisible) {
                this.icon.style.transform = 'scale(1)';
                this.icon.style.background = '#2d2d2d';
            }
        });

        // Minimize button click
        this.minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        });

        // Make icon draggable (both icon and panel move together)
        this.icon.addEventListener('mousedown', (e) => {
            if (e.target === this.icon) {
                this.isDragging = true;
                this.dragOffset.x = e.clientX - this.icon.offsetLeft;
                this.dragOffset.y = e.clientY - this.icon.offsetTop;
                this.icon.style.cursor = 'grabbing';
            }
        });

        // Make app header draggable
        const appHeader = this.optionsPanel.querySelector('#app-header');
        if (appHeader) {
            appHeader.addEventListener('mousedown', (e) => {
                if (e.target === appHeader || e.target.closest('#app-header')) {
                    this.isDragging = true;
                    this.dragOffset.x = e.clientX - this.optionsPanel.offsetLeft;
                    this.dragOffset.y = e.clientY - this.optionsPanel.offsetTop;
                    appHeader.style.cursor = 'grabbing';
                }
            });
        }

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const x = e.clientX - this.dragOffset.x;
                const y = e.clientY - this.dragOffset.y;
                
                // Calculate panel dimensions
                const panelWidth = this.optionsPanel.offsetWidth;
                const panelHeight = this.optionsPanel.offsetHeight;
                const iconSize = 50;
                
                // Ensure panel never goes off-screen
                const minX = 0;
                const maxX = window.innerWidth - panelWidth;
                const minY = 0;
                const maxY = window.innerHeight - panelHeight;
                
                // Clamp panel position to screen bounds
                const clampedX = Math.max(minX, Math.min(maxX, x));
                const clampedY = Math.max(minY, Math.min(maxY, y));
                
                // Position panel
                this.optionsPanel.style.left = clampedX + 'px';
                this.optionsPanel.style.top = clampedY + 'px';
                this.optionsPanel.style.right = 'auto';
                
                // Position icon relative to panel (to the right of panel)
                const iconLeft = clampedX + panelWidth + 10;
                const iconTop = clampedY;
                
                // Ensure icon doesn't go off-screen either
                const iconClampedX = Math.max(0, Math.min(window.innerWidth - iconSize, iconLeft));
                const iconClampedY = Math.max(0, Math.min(window.innerHeight - iconSize, iconTop));
                
                this.icon.style.left = iconClampedX + 'px';
                this.icon.style.top = iconClampedY + 'px';
                this.icon.style.right = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.icon.style.cursor = 'move';
                const appHeader = this.optionsPanel.querySelector('#app-header');
                if (appHeader) {
                    appHeader.style.cursor = 'move';
                }
            }
        });

        // Tab switching
        const composeBtn = document.getElementById('compose-btn');
        const quickRepliesBtn = document.getElementById('quick-replies-btn');
        const aiReplyBtn = document.getElementById('ai-reply-btn');
        
        console.log('Tab buttons found:', { composeBtn, quickRepliesBtn, aiReplyBtn });
        
        if (composeBtn) {
            composeBtn.addEventListener('click', () => {
                console.log('Compose tab clicked');
                this.switchTab('compose');
            });
        } else {
            console.error('Compose button not found!');
        }

        if (quickRepliesBtn) {
            quickRepliesBtn.addEventListener('click', () => {
                console.log('Quick Replies tab clicked');
                this.switchTab('quick-replies');
            });
        } else {
            console.error('Quick Replies button not found!');
        }

        if (aiReplyBtn) {
            aiReplyBtn.addEventListener('click', () => {
                console.log('AI Reply tab clicked');
                this.switchTab('ai-reply');
            });
        } else {
            console.error('AI Reply button not found!');
        }

        // Compose options
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('compose-option')) {
                const action = e.target.dataset.action;
                this.processText(action);
            }
        });

        // Add hover effects to compose options
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('compose-option')) {
                e.target.style.background = '#3d3d3d';
                e.target.style.borderColor = '#555';
                e.target.style.transform = 'translateY(-1px)';
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('compose-option')) {
                e.target.style.background = '#2d2d2d';
                e.target.style.borderColor = '#444';
                e.target.style.transform = 'translateY(0)';
            }
        }, true);

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
        } else {
            console.error('Generate AI Reply button not found!');
        }

        // Remove click outside behavior - app stays open until minimize button is clicked

        // Detect text inputs
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                this.currentTextInput = e.target;
            }
        });
    }

    toggleOptions() {
        console.log('toggleOptions called, isMinimized:', this.isMinimized, 'isVisible:', this.isVisible);
        
        if (this.isMinimized) {
            this.toggleMinimize();
            return;
        }
        
        this.isVisible = !this.isVisible;
        console.log('Setting panel display to:', this.isVisible ? 'block' : 'none');
        
        if (this.optionsPanel) {
            if (this.isVisible) {
                this.optionsPanel.style.display = 'block';
                // Force a reflow to ensure display change takes effect
                this.optionsPanel.offsetHeight;
                this.optionsPanel.style.opacity = '1';
            } else {
                this.optionsPanel.style.opacity = '0';
                // Hide after transition completes
                setTimeout(() => {
                    if (!this.isVisible) {
                        this.optionsPanel.style.display = 'none';
                    }
                }, 300);
            }
            console.log('Panel display updated, isVisible:', this.isVisible);
        } else {
            console.error('Options panel not found!');
        }
        
        if (this.isVisible) {
            this.icon.style.transform = 'scale(1.1)';
            this.icon.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.6)';
            // Ensure panel is positioned correctly when shown
            this.ensurePanelInBounds();
        } else {
            this.icon.style.transform = 'scale(1)';
            this.icon.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
        }
    }

    ensurePanelInBounds() {
        const panelWidth = this.optionsPanel.offsetWidth;
        const panelHeight = this.optionsPanel.offsetHeight;
        const iconSize = 50;
        
        // Get current positions
        let panelLeft = parseInt(this.optionsPanel.style.left) || 20;
        let panelTop = parseInt(this.optionsPanel.style.top) || 20;
        
        // Ensure panel doesn't go off-screen
        const minX = 0;
        const maxX = window.innerWidth - panelWidth;
        const minY = 0;
        const maxY = window.innerHeight - panelHeight;
        
        // Clamp panel position
        panelLeft = Math.max(minX, Math.min(maxX, panelLeft));
        panelTop = Math.max(minY, Math.min(maxY, panelTop));
        
        // Update panel position
        this.optionsPanel.style.left = panelLeft + 'px';
        this.optionsPanel.style.top = panelTop + 'px';
        
        // Position icon relative to panel
        const iconLeft = panelLeft + panelWidth + 10;
        const iconTop = panelTop;
        
        // Ensure icon doesn't go off-screen
        const iconClampedX = Math.max(0, Math.min(window.innerWidth - iconSize, iconLeft));
        const iconClampedY = Math.max(0, Math.min(window.innerHeight - iconSize, iconTop));
        
        this.icon.style.left = iconClampedX + 'px';
        this.icon.style.top = iconClampedY + 'px';
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        
        if (this.isMinimized) {
            this.icon.style.transform = 'scale(0.7)';
            this.icon.style.opacity = '0.5';
            this.minimizeBtn.innerHTML = '+';
            this.minimizeBtn.style.background = '#444';
            this.optionsPanel.style.display = 'none';
            this.isVisible = false;
        } else {
            this.icon.style.transform = 'scale(1)';
            this.icon.style.opacity = '1';
            this.minimizeBtn.innerHTML = '−';
            this.minimizeBtn.style.background = '#333';
            this.optionsPanel.style.display = 'block';
            this.isVisible = true;
        }
    }

    hideOptions() {
        this.isVisible = false;
        this.optionsPanel.style.display = 'none';
        this.icon.style.transform = 'scale(1)';
        this.icon.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
    }

    showLoading(button, originalText) {
        if (this.isLoading) return;
        this.isLoading = true;
        button.disabled = true;
        button.dataset.originalText = originalText;
        button.innerHTML = '⏳ Processing...';
        button.style.opacity = '0.7';
    }

    hideLoading(button) {
        if (!this.isLoading) return;
        this.isLoading = false;
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || 'Button';
        button.style.opacity = '1';
    }

    async switchTab(tabName) {
        console.log('switchTab called with:', tabName);
        
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        console.log('Found tab buttons:', tabButtons.length);
        
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = '#333';
        });
        
        const activeBtn = document.getElementById(`${tabName}-btn`);
        console.log('Active button found:', activeBtn);
        
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = '#6366f1';
            console.log('Active button styled');
        } else {
            console.error(`Button with id '${tabName}-btn' not found!`);
        }

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        
        const activeContent = document.getElementById(`${tabName}-content`);
        if (activeContent) {
            activeContent.style.display = 'block';
        }

        // Load quick replies if switching to that tab
        if (tabName === 'quick-replies') {
            try {
                // Refresh settings from panel before loading quick replies
                await this.loadSettings();
                this.loadQuickReplies();
            } catch (error) {
                console.error('Error loading quick replies:', error);
                this.loadQuickReplies(); // Load with existing data
            }
        }
    }

    loadQuickReplies() {
        const quickRepliesList = document.getElementById('quick-replies-list');
        if (!quickRepliesList) {
            console.log('Quick replies list element not found');
            return;
        }

        console.log('Loading quick replies with data:', this.savedReplies);

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
            " title="${reply.content}">
                ${reply.title}
            </button>
        `).join('');

        // Add hover effects
        quickRepliesList.querySelectorAll('.quick-reply-item').forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.background = '#3d3d3d';
                this.style.borderColor = '#555';
                this.style.transform = 'translateY(-1px)';
            });
            btn.addEventListener('mouseleave', function() {
                this.style.background = '#2d2d2d';
                this.style.borderColor = '#444';
                this.style.transform = 'translateY(0)';
            });
        });
    }


    async generateAIReply() {
        const input = this.findBestTextInput();
        if (!input) {
            alert('Please click on a text input first');
            return;
        }

        if (!this.aiInstructions) {
            alert('No AI instructions found. Please set them in the panel settings.');
            return;
        }

        // Show loading on the AI Reply button
        const aiReplyBtn = document.getElementById('generate-ai-reply');
        if (aiReplyBtn) {
            this.showLoading(aiReplyBtn, aiReplyBtn.innerHTML);
        }

        // Get optional context from the textarea
        const contextInput = document.getElementById('ai-context-input');
        const additionalContext = contextInput ? contextInput.value.trim() : '';

        // Get recent messages from the page
        const recentMessages = this.extractRecentMessages();
        
        // Combine instructions with additional context
        let fullPrompt = this.aiInstructions;
        if (additionalContext) {
            fullPrompt += `\n\nAdditional context: ${additionalContext}`;
        }
        
        try {
            const response = await this.callOpenAI(fullPrompt, recentMessages);
            this.insertText(response, input);
            
            // Clear the context input after successful generation
            if (contextInput) {
                contextInput.value = '';
            }
        } catch (error) {
            console.error('AI Reply error:', error);
            alert('Error generating AI reply. Please check your API key and try again.');
        } finally {
            if (aiReplyBtn) {
                this.hideLoading(aiReplyBtn);
            }
        }

        this.hideOptions();
    }

    async processText(action) {
        // Find the best text input to work with
        const textInput = this.findBestTextInput();
        if (!textInput) {
            alert('Please click on a text input first');
            return;
        }

        const currentText = textInput.value;
        if (!currentText.trim()) {
            alert('Please enter some text first');
            return;
        }

        // Find the button that was clicked
        const clickedButton = document.querySelector(`[data-action="${action}"]`);
        if (clickedButton) {
            this.showLoading(clickedButton, clickedButton.innerHTML);
        }

        const prompt = this.getPromptForAction(action, currentText);
        
        try {
            const response = await this.callOpenAI(prompt, currentText);
            this.insertText(response, textInput);
        } catch (error) {
            console.error('Text processing error:', error);
            alert('Error processing text. Please check your API key and try again.');
        } finally {
            if (clickedButton) {
                this.hideLoading(clickedButton);
            }
        }
    }

    findBestTextInput() {
        // First try the currently focused input
        if (this.currentTextInput && this.currentTextInput.value.trim()) {
            return this.currentTextInput;
        }

        // Look for any text input with content
        const textInputs = document.querySelectorAll('textarea, input[type="text"], input[type="email"], input[type="search"], [contenteditable="true"]');
        for (let input of textInputs) {
            if (input.value && input.value.trim()) {
                return input;
            }
        }

        // Return the last focused input as fallback
        return this.currentTextInput;
    }

    getPromptForAction(action, text) {
        const prompts = {
            'fix-grammar': `Fix the grammar and spelling in this text: "${text}"`,
            'expand': `Expand and elaborate on this text to make it more detailed: "${text}"`,
            'elaborate': `Elaborate on this text with more context and examples: "${text}"`,
            'summarize': `Summarize this text concisely: "${text}"`,
            'tone-professional': `Rewrite this text in a professional tone: "${text}"`,
            'tone-friendly': `Rewrite this text in a friendly, casual tone: "${text}"`
        };
        return prompts[action] || text;
    }

    async callOpenAI(prompt, context = '') {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'callOpenAI',
                prompt: prompt,
                context: context
            }, (response) => {
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.response);
                }
            });
        });
    }

    insertText(text, targetInput = null) {
        const input = targetInput || this.findBestTextInput();
        if (!input) {
            alert('No text input found');
            return;
        }

        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const before = input.value.substring(0, start);
        const after = input.value.substring(end);
        
        input.value = before + text + after;
        input.selectionStart = input.selectionEnd = start + text.length;
        input.focus();
        
        // Trigger input event
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    insertSavedReply(reply) {
        const input = this.findBestTextInput();
        if (!input) {
            alert('Please click on a text input first');
            return;
        }
        this.insertText(reply.content, input);
    }

    extractRecentMessages() {
        // Extract recent messages from the page (this will be customized based on the website)
        const messages = [];
        const messageElements = document.querySelectorAll('[class*="message"], [class*="chat"], [class*="comment"]');
        
        messageElements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 10) {
                messages.push(text);
            }
        });
        
        return messages.slice(-5); // Last 5 messages
    }


    async loadSettings() {
        try {
            console.log('Loading settings from panel...');

            // Fetch from panel API to get the latest settings
            const response = await fetch('http://localhost:3001/api/settings');
            const data = await response.json();

            console.log('Raw data from panel API:', data);
            
            // Use the settings from the panel
            this.savedReplies = data.savedReplies || [];
            this.aiInstructions = data.aiInstructions || '';
            
            console.log('Processed settings:', { savedReplies: this.savedReplies, aiInstructions: this.aiInstructions });
            
            // Update background script with latest settings
            chrome.runtime.sendMessage({
                action: 'updateSettings',
                settings: {
                    savedReplies: this.savedReplies,
                    aiInstructions: this.aiInstructions
                }
            });
            
            console.log('Successfully loaded settings from panel:', { savedReplies: this.savedReplies, aiInstructions: this.aiInstructions });
        } catch (error) {
            console.error('Could not load settings from panel:', error);
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
}

// Initialize when DOM is ready with error handling
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try {
                new FarislyAI();
            } catch (error) {
                console.error('Error initializing Farisly AI:', error);
            }
        });
    } else {
        try {
            new FarislyAI();
        } catch (error) {
            console.error('Error initializing Farisly AI:', error);
        }
    }
} catch (error) {
    console.error('Error setting up Farisly AI:', error);
}