// Simplified Farisly AI content script - Focus on tab switching
console.log('Simplified Farisly AI content script loaded');

class SimpleFarislyAI {
    constructor() {
        console.log('SimpleFarislyAI constructor called');
        this.isVisible = false;
        this.currentTab = 'compose';
        this.init();
    }

    init() {
        console.log('SimpleFarislyAI init called');
        this.createIcon();
        this.createPanel();
        this.setupEventListeners();
        console.log('SimpleFarislyAI initialization completed');
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
            padding: 20px;
        `;

        this.panel.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="color: white; margin: 0; font-size: 16px;">🤖 Farisly AI</h3>
                    <button id="close-btn" style="
                        background: #333;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 4px 8px;
                        cursor: pointer;
                        font-size: 12px;
                    ">✕</button>
                </div>

                <!-- Tabs -->
                <div style="display: flex; gap: 8px;">
                    <button id="tab-compose" class="tab-btn active" style="
                        flex: 1;
                        padding: 8px 12px;
                        background: #6366f1;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                    ">Compose</button>
                    
                    <button id="tab-quick" class="tab-btn" style="
                        flex: 1;
                        padding: 8px 12px;
                        background: #333;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                    ">Quick Replies</button>
                    
                    <button id="tab-ai" class="tab-btn" style="
                        flex: 1;
                        padding: 8px 12px;
                        background: #333;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                    ">AI Reply</button>
                </div>

                <!-- Content -->
                <div id="content-compose" class="tab-content" style="display: block;">
                    <p style="color: white; margin: 0;">Compose content here</p>
                </div>
                
                <div id="content-quick" class="tab-content" style="display: none;">
                    <p style="color: white; margin: 0;">Quick Replies content here</p>
                </div>
                
                <div id="content-ai" class="tab-content" style="display: none;">
                    <p style="color: white; margin: 0;">AI Reply content here</p>
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

        // Close button
        const closeBtn = document.getElementById('close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked!');
                this.hidePanel();
            });
        }

        // Tab buttons
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

        console.log('Event listeners setup completed');
    }

    togglePanel() {
        console.log('togglePanel called, isVisible:', this.isVisible);
        this.isVisible = !this.isVisible;
        this.panel.style.display = this.isVisible ? 'block' : 'none';
        console.log('Panel display set to:', this.panel.style.display);
    }

    hidePanel() {
        console.log('hidePanel called');
        this.isVisible = false;
        this.panel.style.display = 'none';
    }

    switchTab(tabName) {
        console.log('switchTab called with:', tabName);
        
        // Update current tab
        this.currentTab = tabName;
        
        // Update tab buttons
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
        
        // Update content
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
        
        console.log('switchTab completed for:', tabName);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing SimpleFarislyAI');
        new SimpleFarislyAI();
    });
} else {
    console.log('DOM already loaded, initializing SimpleFarislyAI');
    new SimpleFarislyAI();
}
