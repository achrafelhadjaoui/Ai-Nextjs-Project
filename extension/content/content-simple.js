// Simplified Farisly AI content script - Focus on tab switching

class SimpleFarislyAI {
    constructor() {
        this.isVisible = false;
        this.currentTab = 'compose';
        this.init();
    }

    init() {
        this.createIcon();
        this.createPanel();
        this.setupEventListeners();
    }

    createIcon() {
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
    }

    createPanel() {
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
    }

    setupEventListeners() {
        // Icon click
        this.icon.addEventListener('click', () => {
            this.togglePanel();
        });

        // Close button
        const closeBtn = document.getElementById('close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hidePanel();
            });
        }

        // Tab buttons
        const tabCompose = document.getElementById('tab-compose');
        const tabQuick = document.getElementById('tab-quick');
        const tabAi = document.getElementById('tab-ai');

        if (tabCompose) {
            tabCompose.addEventListener('click', () => {
                this.switchTab('compose');
            });
        }

        if (tabQuick) {
            tabQuick.addEventListener('click', () => {
                this.switchTab('quick');
            });
        }

        if (tabAi) {
            tabAi.addEventListener('click', () => {
                this.switchTab('ai');
            });
        }
    }

    togglePanel() {
        this.isVisible = !this.isVisible;
        this.panel.style.display = this.isVisible ? 'block' : 'none';
    }

    hidePanel() {
        this.isVisible = false;
        this.panel.style.display = 'none';
    }

    switchTab(tabName) {
        // Update current tab
        this.currentTab = tabName;

        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');

        tabButtons.forEach(btn => {
            btn.style.background = '#333';
            btn.classList.remove('active');
        });

        const activeBtn = document.getElementById(`tab-${tabName}`);

        if (activeBtn) {
            activeBtn.style.background = '#6366f1';
            activeBtn.classList.add('active');
        }

        // Update content
        const contentSections = document.querySelectorAll('.tab-content');

        contentSections.forEach(section => {
            section.style.display = 'none';
        });

        const activeContent = document.getElementById(`content-${tabName}`);

        if (activeContent) {
            activeContent.style.display = 'block';
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SimpleFarislyAI();
    });
} else {
    new SimpleFarislyAI();
}
