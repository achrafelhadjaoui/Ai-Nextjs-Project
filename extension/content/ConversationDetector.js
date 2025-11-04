/**
 * Professional Conversation Detector
 * Intelligently detects and extracts conversation context from any website
 * Supports: Upwork, Gmail, LinkedIn, Facebook, Twitter, Slack, Discord, etc.
 */
class ConversationDetector {
    constructor() {
        this.platformParsers = {
            'upwork.com': this.parseUpwork.bind(this),
            'mail.google.com': this.parseGmail.bind(this),
            'linkedin.com': this.parseLinkedIn.bind(this),
            'facebook.com': this.parseFacebook.bind(this),
            'messenger.com': this.parseFacebookMessenger.bind(this),
            'twitter.com': this.parseTwitter.bind(this),
            'x.com': this.parseTwitter.bind(this),
            'slack.com': this.parseSlack.bind(this),
            'discord.com': this.parseDiscord.bind(this),
            'reddit.com': this.parseReddit.bind(this),
            'web.whatsapp.com': this.parseWhatsApp.bind(this)
        };

        this.currentPlatform = this.detectPlatform();
        console.log('🔍 Conversation Detector initialized for:', this.currentPlatform || 'generic platform');
    }

    /**
     * Detect current platform
     */
    detectPlatform() {
        const hostname = window.location.hostname;

        for (const [domain, parser] of Object.entries(this.platformParsers)) {
            if (hostname.includes(domain)) {
                return domain;
            }
        }

        return null; // Generic/unknown platform
    }

    /**
     * Auto-detect and extract conversation from current page
     */
    detectConversation() {
        console.log('🔍 Starting conversation detection...');

        // Try platform-specific parser first
        if (this.currentPlatform && this.platformParsers[this.currentPlatform]) {
            console.log(`📍 Using ${this.currentPlatform} parser`);
            const result = this.platformParsers[this.currentPlatform]();
            if (result && result.messages && result.messages.length > 0) {
                console.log(`✅ Detected ${result.messages.length} messages on ${this.currentPlatform}`);
                return result;
            }
        }

        // Fallback to generic detection
        console.log('🔄 Using generic conversation detection');
        return this.parseGeneric();
    }

    /**
     * Parse Upwork conversations
     */
    parseUpwork() {
        const messages = [];

        // Upwork uses different selectors depending on the view
        const selectors = [
            '.message-item',
            '[data-test="message-item"]',
            '.thread-message',
            '.air3-message',
            '[class*="message"]'
        ];

        for (const selector of selectors) {
            const messageElements = document.querySelectorAll(selector);

            if (messageElements.length > 0) {
                console.log(`📧 Found ${messageElements.length} Upwork messages using: ${selector}`);

                messageElements.forEach(el => {
                    const sender = this.extractSender(el, [
                        '[data-test="sender-name"]',
                        '.sender-name',
                        '[class*="sender"]',
                        'strong',
                        'b'
                    ]);

                    const text = this.extractMessageText(el, [
                        '[data-test="message-text"]',
                        '.message-text',
                        '.message-body',
                        'p',
                        '.air3-message-body'
                    ]);

                    const timestamp = this.extractTimestamp(el);

                    if (text && text.length > 5) {
                        messages.push({
                            sender: sender || 'User',
                            text: text.trim(),
                            timestamp: timestamp
                        });
                    }
                });

                break; // Stop after finding messages
            }
        }

        return {
            platform: 'Upwork',
            messages,
            context: this.getPageContext(),
            detectedInputField: this.findReplyField([
                'textarea[placeholder*="message" i]',
                'textarea[placeholder*="reply" i]',
                '[contenteditable="true"]',
                'textarea'
            ])
        };
    }

    /**
     * Parse Gmail conversations
     */
    parseGmail() {
        const messages = [];

        // Gmail message selectors
        const messageElements = document.querySelectorAll('.h7, .gs, [role="listitem"]');

        console.log(`📧 Found ${messageElements.length} Gmail messages`);

        messageElements.forEach(el => {
            const sender = this.extractSender(el, [
                '.gD',
                '[email]',
                'span[email]',
                '.go'
            ]);

            const text = this.extractMessageText(el, [
                '.a3s',
                '.ii.gt',
                'div[dir="ltr"]'
            ]);

            const timestamp = this.extractTimestamp(el);

            if (text && text.length > 5) {
                messages.push({
                    sender: sender || 'Unknown',
                    text: text.trim(),
                    timestamp: timestamp
                });
            }
        });

        return {
            platform: 'Gmail',
            messages,
            context: this.getEmailSubject(),
            detectedInputField: this.findReplyField([
                '[role="textbox"]',
                '[contenteditable="true"]',
                'div[aria-label*="Message" i]'
            ])
        };
    }

    /**
     * Parse LinkedIn conversations
     */
    parseLinkedIn() {
        const messages = [];

        const messageElements = document.querySelectorAll('.msg-s-message-list__event, .msg-s-event-listitem');

        console.log(`💼 Found ${messageElements.length} LinkedIn messages`);

        messageElements.forEach(el => {
            const sender = this.extractSender(el, [
                '.msg-s-message-group__profile-link',
                '[data-control-name="view_profile"]',
                'a[href*="/in/"]'
            ]);

            const text = this.extractMessageText(el, [
                '.msg-s-event-listitem__body',
                '.msg-s-message-group__message',
                'p'
            ]);

            const timestamp = this.extractTimestamp(el);

            if (text && text.length > 5) {
                messages.push({
                    sender: sender || 'Connection',
                    text: text.trim(),
                    timestamp: timestamp
                });
            }
        });

        return {
            platform: 'LinkedIn',
            messages,
            context: this.getPageContext(),
            detectedInputField: this.findReplyField([
                '.msg-form__contenteditable',
                '[role="textbox"]',
                '[contenteditable="true"]'
            ])
        };
    }

    /**
     * Parse Facebook conversations
     */
    parseFacebook() {
        const messages = [];

        const messageElements = document.querySelectorAll('[role="article"], .message, [data-scope="messages_table"]');

        console.log(`👥 Found ${messageElements.length} Facebook messages`);

        messageElements.forEach(el => {
            const sender = this.extractSender(el, [
                '[role="link"]',
                'strong',
                'a[href*="/user/"]'
            ]);

            const text = this.extractMessageText(el, [
                '[dir="auto"]',
                'div[data-ad-preview="message"]',
                'span'
            ]);

            if (text && text.length > 5) {
                messages.push({
                    sender: sender || 'User',
                    text: text.trim(),
                    timestamp: null
                });
            }
        });

        return {
            platform: 'Facebook',
            messages,
            context: this.getPageContext(),
            detectedInputField: this.findReplyField([
                '[contenteditable="true"][role="textbox"]',
                '[aria-label*="message" i]'
            ])
        };
    }

    /**
     * Parse Facebook Messenger
     */
    parseFacebookMessenger() {
        const messages = [];

        const messageElements = document.querySelectorAll('[role="row"]');

        console.log(`💬 Found ${messageElements.length} Messenger messages`);

        messageElements.forEach(el => {
            const text = this.extractMessageText(el, [
                '[dir="auto"]',
                'span'
            ]);

            // Determine sender by position (left = them, right = you)
            const isFromMe = el.querySelector('[data-scope="messages_table"] [class*="right"]') !== null;

            if (text && text.length > 5) {
                messages.push({
                    sender: isFromMe ? 'You' : 'Recipient',
                    text: text.trim(),
                    timestamp: null
                });
            }
        });

        return {
            platform: 'Messenger',
            messages,
            context: 'Facebook Messenger',
            detectedInputField: this.findReplyField([
                '[contenteditable="true"][role="textbox"]',
                '[aria-label*="message" i]'
            ])
        };
    }

    /**
     * Parse Twitter/X conversations
     */
    parseTwitter() {
        const messages = [];

        const tweetElements = document.querySelectorAll('[data-testid="tweet"]');

        console.log(`🐦 Found ${tweetElements.length} tweets`);

        tweetElements.forEach(el => {
            const sender = this.extractSender(el, [
                '[data-testid="User-Name"]',
                '[role="link"]'
            ]);

            const text = this.extractMessageText(el, [
                '[data-testid="tweetText"]',
                '[lang]'
            ]);

            if (text && text.length > 5) {
                messages.push({
                    sender: sender || 'User',
                    text: text.trim(),
                    timestamp: null
                });
            }
        });

        return {
            platform: 'Twitter/X',
            messages,
            context: 'Twitter Thread',
            detectedInputField: this.findReplyField([
                '[data-testid="tweetTextarea_0"]',
                '[role="textbox"]',
                '[contenteditable="true"]'
            ])
        };
    }

    /**
     * Parse Slack conversations
     */
    parseSlack() {
        const messages = [];

        const messageElements = document.querySelectorAll('.c-message_kit__message, .c-virtual_list__item');

        console.log(`💼 Found ${messageElements.length} Slack messages`);

        messageElements.forEach(el => {
            const sender = this.extractSender(el, [
                '.c-message__sender_button',
                '.c-message__sender'
            ]);

            const text = this.extractMessageText(el, [
                '.c-message_kit__blocks',
                '.p-rich_text_section'
            ]);

            if (text && text.length > 5) {
                messages.push({
                    sender: sender || 'User',
                    text: text.trim(),
                    timestamp: null
                });
            }
        });

        return {
            platform: 'Slack',
            messages,
            context: 'Slack Channel',
            detectedInputField: this.findReplyField([
                '[role="textbox"]',
                '[contenteditable="true"]',
                '.ql-editor'
            ])
        };
    }

    /**
     * Parse Discord conversations
     */
    parseDiscord() {
        const messages = [];

        const messageElements = document.querySelectorAll('[id^="chat-messages-"] li, [class*="message-"]');

        console.log(`🎮 Found ${messageElements.length} Discord messages`);

        messageElements.forEach(el => {
            const sender = this.extractSender(el, [
                '[class*="username"]',
                'h3'
            ]);

            const text = this.extractMessageText(el, [
                '[class*="messageContent"]',
                '[id^="message-content"]'
            ]);

            if (text && text.length > 5) {
                messages.push({
                    sender: sender || 'User',
                    text: text.trim(),
                    timestamp: null
                });
            }
        });

        return {
            platform: 'Discord',
            messages,
            context: 'Discord Chat',
            detectedInputField: this.findReplyField([
                '[role="textbox"]',
                '[class*="slateTextArea"]'
            ])
        };
    }

    /**
     * Parse Reddit conversations
     */
    parseReddit() {
        const messages = [];

        const commentElements = document.querySelectorAll('[data-testid="comment"], .Comment');

        console.log(`🗨️ Found ${commentElements.length} Reddit comments`);

        commentElements.forEach(el => {
            const sender = this.extractSender(el, [
                '[data-testid="comment_author_link"]',
                'a[href*="/user/"]'
            ]);

            const text = this.extractMessageText(el, [
                '[data-testid="comment"]',
                'p',
                'div[slot="comment"]'
            ]);

            if (text && text.length > 5) {
                messages.push({
                    sender: sender || 'Redditor',
                    text: text.trim(),
                    timestamp: null
                });
            }
        });

        return {
            platform: 'Reddit',
            messages,
            context: 'Reddit Thread',
            detectedInputField: this.findReplyField([
                '[contenteditable="true"]',
                'textarea[name="comment"]'
            ])
        };
    }

    /**
     * Parse WhatsApp Web conversations
     */
    parseWhatsApp() {
        const messages = [];

        const messageElements = document.querySelectorAll('.message-in, .message-out, [class*="message"]');

        console.log(`💚 Found ${messageElements.length} WhatsApp messages`);

        messageElements.forEach(el => {
            const isFromMe = el.classList.contains('message-out');
            const text = this.extractMessageText(el, [
                '.copyable-text span',
                'span[dir="ltr"]'
            ]);

            if (text && text.length > 5) {
                messages.push({
                    sender: isFromMe ? 'You' : 'Contact',
                    text: text.trim(),
                    timestamp: null
                });
            }
        });

        return {
            platform: 'WhatsApp',
            messages,
            context: 'WhatsApp Chat',
            detectedInputField: this.findReplyField([
                '[contenteditable="true"][role="textbox"]',
                'div[data-tab="10"]'
            ])
        };
    }

    /**
     * Generic conversation parser (fallback)
     */
    parseGeneric() {
        const messages = [];

        // Try to find message-like containers
        const selectors = [
            '[class*="message"]',
            '[class*="comment"]',
            '[class*="chat"]',
            '[class*="post"]',
            '[role="article"]'
        ];

        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);

            if (elements.length > 2) { // At least 3 messages for a conversation
                console.log(`📝 Found ${elements.length} potential messages using: ${selector}`);

                elements.forEach(el => {
                    const text = el.innerText || el.textContent;

                    if (text && text.length > 10 && text.length < 2000) {
                        messages.push({
                            sender: 'User',
                            text: text.trim(),
                            timestamp: null
                        });
                    }
                });

                if (messages.length > 0) break;
            }
        }

        return {
            platform: 'Generic',
            messages,
            context: document.title,
            detectedInputField: this.findReplyField([
                'textarea[placeholder*="reply" i]',
                'textarea[placeholder*="message" i]',
                '[contenteditable="true"]',
                'textarea'
            ])
        };
    }

    /**
     * Extract sender name from element
     */
    extractSender(element, selectors) {
        for (const selector of selectors) {
            try {
                const senderEl = element.querySelector(selector);
                if (senderEl) {
                    return senderEl.innerText?.trim() || senderEl.textContent?.trim();
                }
            } catch (e) {
                // Invalid selector, continue
            }
        }
        return null;
    }

    /**
     * Extract message text from element
     */
    extractMessageText(element, selectors) {
        for (const selector of selectors) {
            try {
                const textEl = element.querySelector(selector);
                if (textEl) {
                    return textEl.innerText?.trim() || textEl.textContent?.trim();
                }
            } catch (e) {
                // Invalid selector, continue
            }
        }

        // Fallback: use element's own text
        return element.innerText?.trim() || element.textContent?.trim();
    }

    /**
     * Extract timestamp from element
     */
    extractTimestamp(element) {
        const timeSelectors = [
            'time',
            '[datetime]',
            '[data-time]',
            '[class*="time"]',
            '[class*="date"]',
            'span[title*=":"]'
        ];

        for (const selector of timeSelectors) {
            try {
                const timeEl = element.querySelector(selector);
                if (timeEl) {
                    return timeEl.getAttribute('datetime') ||
                           timeEl.getAttribute('title') ||
                           timeEl.innerText?.trim();
                }
            } catch (e) {
                // Invalid selector, continue
            }
        }

        return null;
    }

    /**
     * Find reply input field on page
     */
    findReplyField(selectors) {
        for (const selector of selectors) {
            try {
                const field = document.querySelector(selector);
                if (field && this.isVisible(field)) {
                    console.log('📝 Detected reply field:', selector);
                    return field;
                }
            } catch (e) {
                // Invalid selector, continue
            }
        }
        return null;
    }

    /**
     * Check if element is visible
     */
    isVisible(element) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    /**
     * Get page context (title, URL, etc.)
     */
    getPageContext() {
        return {
            title: document.title,
            url: window.location.href,
            domain: window.location.hostname
        };
    }

    /**
     * Get email subject (for Gmail)
     */
    getEmailSubject() {
        const subjectEl = document.querySelector('h2.hP, .ha h2');
        return subjectEl ? subjectEl.innerText : document.title;
    }

    /**
     * Format conversation for AI prompt
     */
    formatConversation(conversationData) {
        if (!conversationData || !conversationData.messages || conversationData.messages.length === 0) {
            return null;
        }

        const { platform, messages, context } = conversationData;

        // Build formatted conversation
        let formatted = `Platform: ${platform}\n`;

        if (context) {
            if (typeof context === 'string') {
                formatted += `Context: ${context}\n`;
            } else {
                formatted += `Context: ${context.title || context.domain}\n`;
            }
        }

        formatted += `\nConversation (${messages.length} messages):\n`;
        formatted += '─'.repeat(50) + '\n';

        messages.forEach((msg, idx) => {
            formatted += `\n${idx + 1}. ${msg.sender}`;
            if (msg.timestamp) {
                formatted += ` (${msg.timestamp})`;
            }
            formatted += `:\n${msg.text}\n`;
        });

        formatted += '─'.repeat(50);

        return formatted;
    }

    /**
     * Get conversation summary stats
     */
    getStats(conversationData) {
        if (!conversationData || !conversationData.messages) {
            return null;
        }

        const messages = conversationData.messages;
        const senders = [...new Set(messages.map(m => m.sender))];

        return {
            platform: conversationData.platform,
            messageCount: messages.length,
            senderCount: senders.length,
            senders: senders,
            hasInputField: conversationData.detectedInputField !== null
        };
    }
}
