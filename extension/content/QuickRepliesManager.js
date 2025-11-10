/**
 * Professional Quick Replies Manager
 * Handles smart input detection and text insertion
 */
class QuickRepliesManager {
    constructor() {
        this.replies = [];
        this.lastFocusedInput = null;
        this.setupInputTracking();
    }

    /**
     * Setup smart input tracking
     */
    setupInputTracking() {
        // Track last focused input
        document.addEventListener('focusin', (e) => {
            if (this.isValidInput(e.target)) {
                this.lastFocusedInput = e.target;
            }
        });

        // Clear if input is removed
        document.addEventListener('focusout', (e) => {
            setTimeout(() => {
                if (this.lastFocusedInput && !document.contains(this.lastFocusedInput)) {
                    this.lastFocusedInput = null;
                }
            }, 100);
        });
    }

    /**
     * Check if element is a valid input
     */
    isValidInput(element) {
        if (!element) return false;

        // Check for textarea
        if (element.tagName === 'TEXTAREA') return true;

        // Check for text input
        if (element.tagName === 'INPUT') {
            const type = (element.type || '').toLowerCase();
            return ['text', 'email', 'search', 'url', 'tel', ''].includes(type);
        }

        // Check for contentEditable
        if (element.isContentEditable) return true;

        return false;
    }

    /**
     * Find the best input field on the page
     */
    findBestInput() {
        // 1. Use last focused input if available
        if (this.lastFocusedInput && document.contains(this.lastFocusedInput)) {
            return this.lastFocusedInput;
        }

        // 2. Try to find currently focused element
        const activeElement = document.activeElement;
        if (this.isValidInput(activeElement)) {
            this.lastFocusedInput = activeElement;
            return activeElement;
        }

        // 3. Find visible inputs (prioritize by common names/ids)
        const selectors = [
            // Common message/comment inputs
            'textarea[name*="message"]',
            'textarea[name*="comment"]',
            'textarea[name*="body"]',
            'textarea[name*="text"]',
            'textarea[placeholder*="message" i]',
            'textarea[placeholder*="comment" i]',
            'textarea[placeholder*="write" i]',
            'textarea[placeholder*="reply" i]',

            // Generic textareas
            'textarea:not([style*="display: none"]):not([style*="visibility: hidden"])',

            // Text inputs
            'input[type="text"]',
            'input[type="email"]',
            'input[type="search"]',

            // ContentEditable
            '[contenteditable="true"]',
            '.ql-editor', // Quill editor
            '.DraftEditor-root', // Draft.js
            '[role="textbox"]'
        ];

        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (this.isVisible(element) && this.isValidInput(element)) {
                        this.lastFocusedInput = element;
                        return element;
                    }
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
     * Insert text into input field
     */
    insertText(text, target = null) {
        const input = target || this.findBestInput();

        if (!input) {
            return { success: false, error: 'No input field found' };
        }

        try {
            // Focus the input
            input.focus();

            if (input.isContentEditable) {
                // For contentEditable elements
                this.insertIntoContentEditable(input, text);
            } else {
                // For regular inputs/textareas
                this.insertIntoInput(input, text);
            }

            // Trigger input event for React/Vue
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            return { success: true, target: input };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Insert text into regular input/textarea
     */
    insertIntoInput(input, text) {
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const currentValue = input.value || '';

        // Insert at cursor position
        const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
        input.value = newValue;

        // Set cursor position after inserted text
        const newCursorPos = start + text.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
    }

    /**
     * Insert text into contentEditable element
     */
    insertIntoContentEditable(element, text) {
        const selection = window.getSelection();

        if (!selection.rangeCount) {
            // No selection, append at end
            element.textContent += text;
            return;
        }

        const range = selection.getRangeAt(0);
        range.deleteContents();

        // Create text node
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);

        // Move cursor after inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    /**
     * Update replies list
     */
    updateReplies(replies) {
        this.replies = replies || [];
    }

    /**
     * Get replies (with optional filtering)
     */
    getReplies(filter = null) {
        if (!filter) return this.replies;

        return this.replies.filter(reply => {
            const searchText = filter.toLowerCase();
            return reply.title?.toLowerCase().includes(searchText) ||
                   reply.content?.toLowerCase().includes(searchText) ||
                   reply.category?.toLowerCase().includes(searchText);
        });
    }

    /**
     * Get reply by ID
     */
    getReplyById(id) {
        return this.replies.find(r => r._id === id || r.key === id);
    }

    /**
     * Track reply usage
     */
    async trackUsage(replyId) {
        try {
            await chrome.runtime.sendMessage({
                type: 'TRACK_REPLY_USAGE',
                payload: { replyId }
            });
        } catch (error) {
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.lastFocusedInput = null;
        this.replies = [];
    }
}
