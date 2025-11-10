/**
 * Real-time Grammar Checker
 * Features:
 * - Red squiggly underlines for errors
 * - Smart popup with fix suggestions
 * - Works on all text inputs (textarea, contentEditable, input)
 * - Professional UI/UX like Grammarly
 */

class GrammarChecker {
    constructor() {
        this.activeField = null;
        this.errors = [];
        this.checkTimeout = null;
        this.isEnabled = false;
        this.isChecking = false;
        this.apiKey = null;

        // Debounce settings
        this.DEBOUNCE_DELAY = 2000; // Wait 2 seconds after user stops typing

        // Monitored fields - store field-specific data
        this.monitoredFields = new WeakMap();

        // Active popup
        this.activePopup = null;

        console.log('📝 GrammarChecker initialized');
    }

    /**
     * Enable grammar checking
     */
    enable(apiKey) {
        this.isEnabled = true;
        this.apiKey = apiKey;
        this.injectStyles();
        console.log('✅ Grammar checker enabled');
    }

    /**
     * Disable grammar checking
     */
    disable() {
        this.isEnabled = false;
        this.cleanup();
        console.log('⏹️ Grammar checker disabled');
    }

    /**
     * Start monitoring a text field
     */
    monitorField(field) {
        if (!this.isEnabled) {
            console.log('⚠️ Grammar checker NOT enabled, skipping field monitoring');
            return;
        }
        if (!field) {
            console.log('⚠️ No field provided to monitor');
            return;
        }
        if (this.monitoredFields.has(field)) {
            console.log('✅ Field already monitored, skipping');
            return; // Already monitoring
        }

        console.log('👁️ Monitoring field:', field.tagName, field.id || field.className, 'API Key:', this.apiKey ? '✅ Set' : '❌ Missing');

        // Initialize field data with container for error markers
        const container = document.createElement('div');
        container.className = 'farisly-grammar-container';
        container.style.cssText = 'position: relative; display: inline-block; width: 100%;';

        const fieldData = {
            errors: [],
            badge: null,
            container: container,
            markers: [],
            updatePositionBound: null
        };

        this.monitoredFields.set(field, fieldData);

        // Add event listeners
        const handleInput = () => this.onFieldInput(field);
        const handleFocus = () => this.onFieldFocus(field);
        const handleScroll = () => this.updateMarkerPositions(field);

        // ContentEditable fields require multiple event listeners for reliable detection
        const isContentEditable = field.isContentEditable || field.getAttribute('contenteditable') === 'true';

        if (isContentEditable) {
            console.log('📝 ContentEditable field detected - adding multiple event listeners');
            // Primary events
            field.addEventListener('input', handleInput, true);  // Use capture phase
            field.addEventListener('keyup', handleInput);        // Backup for contentEditable
            field.addEventListener('paste', handleInput);        // Paste events
            field.addEventListener('cut', handleInput);          // Cut events
            // Also listen to the mutation events
            field.addEventListener('DOMSubtreeModified', handleInput);
        } else {
            console.log('📝 Standard input field detected - adding input listener');
            field.addEventListener('input', handleInput);
        }

        // Common events for all field types
        field.addEventListener('focus', handleFocus);
        field.addEventListener('blur', () => this.onFieldBlur(field));
        field.addEventListener('scroll', handleScroll);

        // Store cleanup function
        field._grammarCleanup = () => {
            if (isContentEditable) {
                field.removeEventListener('input', handleInput, true);
                field.removeEventListener('keyup', handleInput);
                field.removeEventListener('paste', handleInput);
                field.removeEventListener('cut', handleInput);
                field.removeEventListener('DOMSubtreeModified', handleInput);
            } else {
                field.removeEventListener('input', handleInput);
            }
            field.removeEventListener('focus', handleFocus);
            field.removeEventListener('scroll', handleScroll);
            this.removeBadge(field);
            this.clearMarkers(field);
            this.monitoredFields.delete(field);
        };
    }

    /**
     * Stop monitoring a field
     */
    stopMonitoring(field) {
        if (field._grammarCleanup) {
            field._grammarCleanup();
            delete field._grammarCleanup;
        }
    }

    /**
     * Field focused
     */
    onFieldFocus(field) {
        this.activeField = field;
        console.log('👁️ Field focused:', field.tagName, field.id || field.className);

        // Re-render error markers if they exist
        const fieldData = this.monitoredFields.get(field);
        if (fieldData && fieldData.errors && fieldData.errors.length > 0) {
            this.errors = fieldData.errors;
            console.log('📍 Re-rendering existing errors:', fieldData.errors.length);
            this.renderErrorMarkers(field);
        }

        // Check immediately if field has content
        const text = this.getFieldText(field);
        console.log('📝 Field text length:', text ? text.length : 0, 'Text:', text ? text.substring(0, 50) : 'empty');
        if (text && text.length > 10) {
            console.log('✅ Scheduling grammar check for focused field');
            this.scheduleCheck(field);
        } else {
            console.log('⚠️ Text too short for grammar check (minimum 10 characters)');
        }
    }

    /**
     * Field blurred - update markers if needed
     */
    onFieldBlur(field) {
        console.log('👋 Field blurred:', field.tagName);
        // Keep markers visible even after blur
        // User might want to click on them
    }

    /**
     * Field input changed - schedule grammar check
     */
    onFieldInput(field) {
        const text = this.getFieldText(field);
        console.log('⌨️ Input detected in field:', field.tagName, 'Text length:', text ? text.length : 0);

        // Clear old markers immediately when user types
        if (text && text.length > 0) {
            this.scheduleCheck(field);
        } else {
            // If field is empty, clear everything
            this.clearMarkers(field);
            this.removeBadge(field);
        }
    }

    /**
     * Schedule grammar check with debounce
     */
    scheduleCheck(field) {
        clearTimeout(this.checkTimeout);
        console.log(`⏱️ Grammar check scheduled (${this.DEBOUNCE_DELAY}ms delay)...`);

        this.checkTimeout = setTimeout(() => {
            console.log('⏰ Debounce timer expired, starting grammar check...');
            this.performCheck(field);
        }, this.DEBOUNCE_DELAY);
    }

    /**
     * Perform grammar check
     */
    async performCheck(field) {
        const text = this.getFieldText(field);

        // Don't check if text is too short or already checking
        if (!text || text.length < 10 || this.isChecking) {
            return;
        }

        console.log('🔍 Checking grammar for:', text.substring(0, 50) + '...');
        this.isChecking = true;

        // Show checking indicator
        this.showCheckingIndicator(field);

        try {
            const errors = await this.checkGrammar(text);

            if (errors && errors.length > 0) {
                this.errors = errors;

                // Save errors to field data
                const fieldData = this.monitoredFields.get(field);
                if (fieldData) {
                    fieldData.errors = errors;
                }

                this.renderErrorMarkers(field);
                this.updateBadge(field, errors.length);
                this.showErrorNotification(errors.length);
                console.log(`✅ Found ${errors.length} grammar errors`);
            } else {
                this.errors = [];

                // Clear errors from field data
                const fieldData = this.monitoredFields.get(field);
                if (fieldData) {
                    fieldData.errors = [];
                }

                this.clearMarkers(field);
                this.removeBadge(field);
                console.log('✅ No grammar errors found');
            }
        } catch (error) {
            console.error('❌ Grammar check failed:', error);

            // Show appropriate error message based on error type
            if (error.message.includes('API key')) {
                this.showErrorToast('⚠️ OpenAI API key not configured. Please set it in settings.');
            } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
                this.showErrorToast('⚠️ API quota exceeded. Please check your OpenAI account.');
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                this.showErrorToast('⚠️ Network error. Please check your connection.');
            } else {
                this.showErrorToast('⚠️ Grammar check failed. Please try again.');
            }
        } finally {
            this.isChecking = false;
            this.hideCheckingIndicator(field);
        }
    }

    /**
     * Check grammar using AI
     */
    async checkGrammar(text) {
        if (!this.apiKey) {
            throw new Error('No API key configured');
        }

        // Validate text length
        if (text.length > 5000) {
            console.warn('⚠️ Text too long, truncating to 5000 characters');
            text = text.substring(0, 5000);
        }

        try {
            console.log('📤 Sending grammar check request:', { type: 'CHECK_GRAMMAR', textLength: text.length });

            const response = await chrome.runtime.sendMessage({
                type: 'CHECK_GRAMMAR',
                payload: {
                    text: text,
                    apiKey: this.apiKey
                }
            });

            console.log('📥 Received grammar check response:', response);

            // Handle various error responses
            if (!response) {
                throw new Error('No response from background script');
            }

            if (response.success === false) {
                // API returned an error
                const errorMsg = response.message || 'Unknown error';
                console.error('❌ API error:', errorMsg);

                if (errorMsg.includes('API key') || errorMsg.includes('api_key')) {
                    throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
                } else if (errorMsg.includes('quota') || errorMsg.includes('insufficient')) {
                    throw new Error('API quota exceeded. Please check your OpenAI account billing.');
                } else if (errorMsg.includes('rate_limit')) {
                    throw new Error('Rate limit reached. Please wait a moment and try again.');
                } else {
                    throw new Error(errorMsg);
                }
            }

            if (response.success && response.errors) {
                console.log(`✅ Grammar API returned ${response.errors.length} errors:`, response.errors);

                // Validate error format
                let validErrors = response.errors.filter(err => {
                    return err.start !== undefined && err.end !== undefined && err.suggestion;
                });

                if (validErrors.length < response.errors.length) {
                    console.warn(`⚠️ Filtered out ${response.errors.length - validErrors.length} invalid errors`);
                }

                // CRITICAL: Deduplicate and remove overlapping errors
                validErrors = this.deduplicateErrors(validErrors, text);

                console.log(`✅ After deduplication: ${validErrors.length} unique errors`);

                return validErrors;
            }

            console.log('⚠️ No errors in response or unsuccessful response');
            return [];
        } catch (error) {
            console.error('❌ Grammar check API error:', error);
            throw error;
        }
    }

    /**
     * Deduplicate and remove overlapping errors
     * This prevents catastrophic duplication when AI returns multiple fixes for same region
     * PROFESSIONAL approach: Sort by position, detect overlaps, keep most specific fix
     */
    deduplicateErrors(errors, text) {
        if (!errors || errors.length === 0) return [];

        console.log('🔍 Deduplicating errors...');

        // Step 1: Sort errors by start position, then by length (shorter = more specific)
        const sorted = [...errors].sort((a, b) => {
            if (a.start !== b.start) {
                return a.start - b.start;
            }
            // If same start, prefer shorter error (more specific)
            return (a.end - a.start) - (b.end - b.start);
        });

        // Step 2: Remove exact duplicates and overlaps
        const deduplicated = [];
        const seen = new Set();

        for (const error of sorted) {
            // Create unique key for this error region
            const key = `${error.start}-${error.end}`;

            // Skip exact duplicates
            if (seen.has(key)) {
                console.log(`  ⚠️ Skipping duplicate error at ${error.start}-${error.end}: "${error.original}"`);
                continue;
            }

            // Check for overlaps with already accepted errors
            const overlaps = deduplicated.some(existing => {
                // Check if this error overlaps with an existing one
                const hasOverlap = (
                    (error.start >= existing.start && error.start < existing.end) ||
                    (error.end > existing.start && error.end <= existing.end) ||
                    (error.start <= existing.start && error.end >= existing.end)
                );

                if (hasOverlap) {
                    console.log(`  ⚠️ Skipping overlapping error at ${error.start}-${error.end}: "${error.original}" (overlaps with ${existing.start}-${existing.end}: "${existing.original}")`);
                }

                return hasOverlap;
            });

            if (!overlaps) {
                // Verify the error positions match the actual text
                const actualText = text.substring(error.start, error.end);
                const originalNormalized = error.original.trim().toLowerCase();
                const actualNormalized = actualText.trim().toLowerCase();

                if (actualNormalized === originalNormalized || actualText === error.original) {
                    // Position is correct
                    deduplicated.push(error);
                    seen.add(key);
                    console.log(`  ✅ Keeping error at ${error.start}-${error.end}: "${error.original}" → "${error.suggestion}"`);
                } else {
                    // Position mismatch - AI gave wrong position
                    console.warn(`  ⚠️ Position mismatch at ${error.start}-${error.end}: expected "${error.original}" but found "${actualText}"`);

                    // Try to find the correct position
                    const correctedError = this.findCorrectPosition(text, error);
                    if (correctedError) {
                        // Check if corrected position overlaps
                        const correctedKey = `${correctedError.start}-${correctedError.end}`;
                        if (!seen.has(correctedKey)) {
                            const correctedOverlaps = deduplicated.some(existing => {
                                return (
                                    (correctedError.start >= existing.start && correctedError.start < existing.end) ||
                                    (correctedError.end > existing.start && correctedError.end <= existing.end) ||
                                    (correctedError.start <= existing.start && correctedError.end >= existing.end)
                                );
                            });

                            if (!correctedOverlaps) {
                                deduplicated.push(correctedError);
                                seen.add(correctedKey);
                                console.log(`  ✅ Corrected position to ${correctedError.start}-${correctedError.end}`);
                            }
                        }
                    }
                }
            }
        }

        console.log(`✅ Deduplication complete: ${errors.length} → ${deduplicated.length} errors`);
        return deduplicated;
    }

    /**
     * Find correct position for error when AI gives wrong position
     */
    findCorrectPosition(text, error) {
        const searchText = error.original.trim();
        const lowerText = text.toLowerCase();
        const lowerSearch = searchText.toLowerCase();

        // Try case-insensitive search
        let index = lowerText.indexOf(lowerSearch);

        if (index !== -1) {
            return {
                ...error,
                start: index,
                end: index + searchText.length
            };
        }

        // Not found - skip this error
        console.warn(`  ❌ Cannot find "${searchText}" in text, skipping error`);
        return null;
    }

    /**
     * Get text from field (handles different input types)
     */
    getFieldText(field) {
        if (!field) return '';

        // Check for standard input/textarea first
        if (field.value !== undefined) {
            return field.value;
        }

        // ContentEditable elements - prefer innerText for better formatting
        if (field.isContentEditable || field.getAttribute('contenteditable') === 'true') {
            return field.innerText || field.textContent || '';
        }

        return '';
    }

    /**
     * Render error markers using absolute positioning
     */
    renderErrorMarkers(field) {
        // Clear existing markers
        this.clearMarkers(field);

        if (!this.errors || this.errors.length === 0) {
            console.log('⚠️ No errors to render');
            return;
        }

        const fieldData = this.monitoredFields.get(field);
        if (!fieldData) {
            console.error('❌ Field not monitored, cannot render markers');
            return;
        }

        console.log(`📍 Rendering ${this.errors.length} error markers for field:`, field);

        // For each error, create a marker
        this.errors.forEach((error, index) => {
            console.log(`  Creating marker ${index + 1}/${this.errors.length}:`, error);
            const marker = this.createErrorMarker(error, field, index);
            if (marker) {
                fieldData.markers.push(marker);
                console.log(`  ✅ Marker ${index + 1} created and added to DOM`);
            } else {
                console.error(`  ❌ Failed to create marker ${index + 1}`);
            }
        });

        console.log(`📍 Total markers created: ${fieldData.markers.length}`);

        // Update positions
        console.log('📐 Updating marker positions...');
        this.updateMarkerPositions(field);

        // Setup position update on scroll/resize
        if (!fieldData.updatePositionBound) {
            fieldData.updatePositionBound = () => this.updateMarkerPositions(field);
            window.addEventListener('scroll', fieldData.updatePositionBound, true);
            window.addEventListener('resize', fieldData.updatePositionBound);
            console.log('✅ Position update listeners added');
        }
    }

    /**
     * Create error marker element
     */
    createErrorMarker(error, field, index) {
        const text = this.getFieldText(field);
        const errorText = text.substring(error.start, error.end);

        // Create marker element
        const marker = document.createElement('div');
        marker.className = 'farisly-grammar-error-marker';
        marker.dataset.errorIndex = index;
        marker.dataset.errorStart = error.start;
        marker.dataset.errorEnd = error.end;

        // Style marker (will be positioned later)
        marker.style.cssText = `
            position: absolute;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 3' enable-background='new 0 0 6 3' height='3' width='6'%3E%3Cg fill='%23ef4444'%3E%3Cpolygon points='5.5,0 2.5,3 1.1,3 4.1,0'/%3E%3Cpolygon points='4,0 6,2 6,0.6 5.4,0'/%3E%3Cpolygon points='0,2 1,3 2.4,3 0,0.6'/%3E%3C/g%3E%3C/svg%3E");
            background-repeat: repeat-x;
            background-position: bottom;
            background-size: 6px 3px;
            height: 3px;
            pointer-events: auto;
            cursor: pointer;
            z-index: 2147483645;
            transition: opacity 0.2s ease;
        `;

        // Hover effect
        marker.addEventListener('mouseenter', () => {
            marker.style.opacity = '0.7';
        });
        marker.addEventListener('mouseleave', () => {
            marker.style.opacity = '1';
        });

        // Click to show popup
        marker.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.showPopup(error, marker, field);
        });

        // Add to document
        document.body.appendChild(marker);

        return marker;
    }

    /**
     * Update marker positions to match text
     */
    updateMarkerPositions(field) {
        const fieldData = this.monitoredFields.get(field);
        if (!fieldData || !fieldData.markers || fieldData.markers.length === 0) {
            console.log('⚠️ No markers to update positions for');
            return;
        }

        const text = this.getFieldText(field);
        const rect = field.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // Get computed style
        const style = window.getComputedStyle(field);
        const fontSize = parseFloat(style.fontSize);
        const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingTop = parseFloat(style.paddingTop) || 0;

        console.log(`📐 Updating positions for ${fieldData.markers.length} markers:`, {
            fontSize, lineHeight, paddingLeft, paddingTop, rectWidth: rect.width, rectHeight: rect.height
        });

        fieldData.markers.forEach((marker, idx) => {
            const start = parseInt(marker.dataset.errorStart);
            const end = parseInt(marker.dataset.errorEnd);

            // Calculate position
            const position = this.calculateTextPosition(field, text, start, end, {
                rect,
                scrollTop,
                scrollLeft,
                fontSize,
                lineHeight,
                paddingLeft,
                paddingTop
            });

            if (position) {
                marker.style.left = position.left + 'px';
                marker.style.top = position.top + 'px';
                marker.style.width = position.width + 'px';
                marker.style.display = 'block';
                console.log(`  Marker ${idx + 1} positioned at:`, { left: position.left, top: position.top, width: position.width });
            } else {
                marker.style.display = 'none';
                console.log(`  Marker ${idx + 1} hidden (out of bounds)`);
            }
        });
    }

    /**
     * Calculate text position for error marker
     * Uses Range API for accurate positioning when possible
     */
    calculateTextPosition(field, text, start, end, metrics) {
        const { rect, scrollTop, scrollLeft, fontSize, lineHeight, paddingLeft, paddingTop } = metrics;

        // Try using Range API for contentEditable fields (most accurate)
        if (field.isContentEditable || field.getAttribute('contenteditable') === 'true') {
            try {
                return this.calculatePositionWithRange(field, start, end, scrollTop, scrollLeft);
            } catch (error) {
                console.warn('⚠️ Range API failed, falling back to estimation:', error.message);
                // Fall through to estimation method
            }
        }

        // Fallback: Estimation method for input/textarea or if Range API fails
        const textBefore = text.substring(0, start);
        const lines = textBefore.split('\n');
        const lineNumber = lines.length - 1;
        const columnNumber = lines[lines.length - 1].length;

        // Character width estimation (works reasonably for monospace and regular fonts)
        const charWidth = fontSize * 0.6;

        // Calculate position
        const top = rect.top + scrollTop + paddingTop + (lineNumber * lineHeight) + lineHeight - 1;
        const left = rect.left + scrollLeft + paddingLeft + (columnNumber * charWidth);
        const width = Math.max((end - start) * charWidth, charWidth);

        // Validate position is within field bounds
        if (top < rect.top + scrollTop || top > rect.top + scrollTop + rect.height) {
            return null;
        }

        return { top, left, width };
    }

    /**
     * Calculate position using Range API (for contentEditable elements)
     * This provides pixel-perfect positioning
     */
    calculatePositionWithRange(field, start, end, scrollTop, scrollLeft) {
        // Find the text node and offset
        const textNodes = this.getTextNodesIn(field);
        let currentPos = 0;
        let startNode = null;
        let startOffset = 0;
        let endNode = null;
        let endOffset = 0;

        for (const textNode of textNodes) {
            const nodeLength = textNode.textContent.length;

            if (startNode === null && currentPos + nodeLength >= start) {
                startNode = textNode;
                startOffset = start - currentPos;
            }

            if (endNode === null && currentPos + nodeLength >= end) {
                endNode = textNode;
                endOffset = end - currentPos;
                break;
            }

            currentPos += nodeLength;
        }

        if (!startNode || !endNode) {
            throw new Error('Could not find text nodes for error range');
        }

        // Create range for the error text
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);

        // Get bounding rectangle
        const rangeRect = range.getBoundingClientRect();

        return {
            top: rangeRect.bottom + scrollTop - 1,  // Position underline at bottom of text
            left: rangeRect.left + scrollLeft,
            width: rangeRect.width
        };
    }

    /**
     * Get all text nodes within an element (helper for Range API)
     */
    getTextNodesIn(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim()) {  // Skip empty text nodes
                textNodes.push(node);
            }
        }

        return textNodes;
    }

    /**
     * Clear all markers for a field
     */
    clearMarkers(field) {
        const fieldData = this.monitoredFields.get(field);
        if (!fieldData) return;

        // Remove position update listener
        if (fieldData.updatePositionBound) {
            window.removeEventListener('scroll', fieldData.updatePositionBound, true);
            window.removeEventListener('resize', fieldData.updatePositionBound);
            fieldData.updatePositionBound = null;
        }

        // Remove markers from DOM
        if (fieldData.markers) {
            fieldData.markers.forEach(marker => {
                if (marker && marker.parentNode) {
                    marker.remove();
                }
            });
            fieldData.markers = [];
        }
    }

    /**
     * Show checking indicator on field
     */
    showCheckingIndicator(field) {
        field._originalBorderColor = field.style.borderColor;
        field.style.borderColor = '#667eea';
        field.style.transition = 'border-color 0.3s ease';
    }

    /**
     * Hide checking indicator
     */
    hideCheckingIndicator(field) {
        if (field._originalBorderColor !== undefined) {
            field.style.borderColor = field._originalBorderColor;
            delete field._originalBorderColor;
        }
    }

    /**
     * Update badge showing error count
     */
    updateBadge(field, count) {
        if (count === 0) {
            this.removeBadge(field);
            return;
        }

        const fieldData = this.monitoredFields.get(field);
        if (!fieldData) return;

        // Remove existing badge
        if (fieldData.badge) {
            fieldData.badge.remove();
        }

        // Create new badge
        const badge = document.createElement('div');
        badge.className = 'farisly-grammar-badge';
        badge.textContent = count.toString();
        badge.title = `${count} grammar ${count === 1 ? 'error' : 'errors'} found`;

        // Position badge relative to field
        const rect = field.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        badge.style.cssText = `
            position: absolute;
            top: ${rect.top + scrollTop - 10}px;
            right: ${window.innerWidth - rect.right - scrollLeft + 5}px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            font-size: 11px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 12px;
            z-index: 2147483646;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
            animation: farisly-badge-pulse 2s ease-in-out infinite;
            pointer-events: auto;
        `;

        // Click badge to focus field
        badge.addEventListener('click', () => {
            field.focus();
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        document.body.appendChild(badge);
        fieldData.badge = badge;

        // Update badge position on scroll/resize
        const updatePosition = () => {
            const rect = field.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            badge.style.top = `${rect.top + scrollTop - 10}px`;
            badge.style.right = `${window.innerWidth - rect.right - scrollLeft + 5}px`;
        };

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        badge._cleanup = () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }

    /**
     * Remove badge from field
     */
    removeBadge(field) {
        const fieldData = this.monitoredFields.get(field);
        if (fieldData && fieldData.badge) {
            if (fieldData.badge._cleanup) {
                fieldData.badge._cleanup();
            }
            fieldData.badge.remove();
            fieldData.badge = null;
        }
    }

    /**
     * Show error notification toast
     */
    showErrorNotification(count) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'farisly-grammar-toast';
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 24px;">⚠️</div>
                <div>
                    <div style="font-weight: 600; margin-bottom: 4px;">
                        ${count} Grammar ${count === 1 ? 'Error' : 'Errors'} Found
                    </div>
                    <div style="font-size: 12px; color: #999;">
                        Click the red underlines to see suggestions
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Show error toast
     */
    showErrorToast(message) {
        const toast = document.createElement('div');
        toast.className = 'farisly-grammar-toast farisly-grammar-toast-error';
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 24px;">❌</div>
                <div>
                    <div style="font-weight: 600; margin-bottom: 4px;">
                        Grammar Check Failed
                    </div>
                    <div style="font-size: 12px; color: #999;">
                        ${this.escapeHtml(message)}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    /**
     * Show popup with error details and fix button
     */
    showPopup(error, markerElement, field) {
        // Hide existing popup
        this.hidePopup();

        // Create popup
        const popup = document.createElement('div');
        popup.className = 'farisly-grammar-popup';
        popup.innerHTML = `
            <div class="farisly-grammar-popup-header">
                <span class="farisly-grammar-popup-icon">⚠️</span>
                <span class="farisly-grammar-popup-type">${this.escapeHtml(error.type || 'Grammar Error')}</span>
            </div>
            <div class="farisly-grammar-popup-message">
                ${this.escapeHtml(error.message)}
            </div>
            <div class="farisly-grammar-popup-original">
                <strong>Original:</strong> "${this.escapeHtml(error.original)}"
            </div>
            <div class="farisly-grammar-popup-suggestion">
                <strong>Suggestion:</strong> "${this.escapeHtml(error.suggestion)}"
            </div>
            <div class="farisly-grammar-popup-actions">
                <button class="farisly-grammar-fix-btn">✓ Fix</button>
                <button class="farisly-grammar-ignore-btn">Ignore</button>
            </div>
        `;

        document.body.appendChild(popup);

        // Position popup near the marker
        this.positionPopup(popup, markerElement);

        // Add event listeners
        const fixBtn = popup.querySelector('.farisly-grammar-fix-btn');
        const ignoreBtn = popup.querySelector('.farisly-grammar-ignore-btn');

        fixBtn.addEventListener('click', () => {
            this.applyFix(error, field);
            this.hidePopup();
        });

        ignoreBtn.addEventListener('click', () => {
            this.hidePopup();
        });

        // Add fade-in animation
        setTimeout(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translateY(0) scale(1)';
        }, 10);

        // Store active popup
        this.activePopup = popup;

        // Close popup when clicking outside
        const closeOnClickOutside = (e) => {
            if (!popup.contains(e.target) && !markerElement.contains(e.target)) {
                this.hidePopup();
                document.removeEventListener('click', closeOnClickOutside);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closeOnClickOutside);
        }, 100);
    }

    /**
     * Position popup near marker element
     */
    positionPopup(popup, markerElement) {
        if (!popup || !markerElement) return;

        const rect = markerElement.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // Position below the marker
        let top = rect.bottom + scrollTop + 8;
        let left = rect.left + scrollLeft;

        // Check if popup goes off-screen (right)
        if (left + popupRect.width > window.innerWidth) {
            left = window.innerWidth - popupRect.width - 20;
        }

        // Check if popup goes off-screen (bottom)
        if (top + popupRect.height > window.innerHeight + scrollTop) {
            // Position above instead
            top = rect.top + scrollTop - popupRect.height - 8;
        }

        // Make sure popup doesn't go off-screen (top)
        if (top < scrollTop) {
            top = scrollTop + 10;
        }

        // Make sure popup doesn't go off-screen (left)
        if (left < scrollLeft) {
            left = scrollLeft + 10;
        }

        popup.style.top = top + 'px';
        popup.style.left = left + 'px';
    }

    /**
     * Hide popup
     */
    hidePopup() {
        if (this.activePopup) {
            this.activePopup.style.opacity = '0';
            this.activePopup.style.transform = 'translateY(-10px) scale(0.95)';
            setTimeout(() => {
                if (this.activePopup) {
                    this.activePopup.remove();
                    this.activePopup = null;
                }
            }, 200);
        }
    }

    /**
     * Apply fix to the text field
     */
    applyFix(error, field) {
        const text = this.getFieldText(field);
        const { start, end, suggestion } = error;

        // VALIDATE: Check if error position is still valid in current text
        if (start < 0 || end > text.length || start >= end) {
            console.error(`❌ Invalid error position: ${start}-${end} in text of length ${text.length}`);
            this.showToast('⚠️ Error position is no longer valid', 'error');
            return;
        }

        const original = text.substring(start, end);

        // VALIDATE: Check if the text at this position matches the error
        const expectedOriginal = error.original.trim().toLowerCase();
        const actualOriginal = original.trim().toLowerCase();

        if (expectedOriginal !== actualOriginal) {
            console.error(`❌ Position mismatch: expected "${error.original}" but found "${original}" at ${start}-${end}`);
            console.error(`   Full text: "${text}"`);
            this.showToast(`⚠️ Text has changed. Expected "${error.original}" but found "${original}"`, 'error');

            // Remove this invalid error from the list
            this.errors = this.errors.filter(e => e !== error);
            this.renderErrorMarkers(field);
            return;
        }

        // Save cursor position for restoration
        const cursorPos = this.getCursorPosition(field);

        // CONTEXT-AWARE REPLACEMENT
        const replacement = this.buildContextAwareReplacement(text, start, end, suggestion, original);

        // Apply the replacement
        const newText = text.substring(0, start) + replacement + text.substring(end);

        // Set new text preserving formatting
        this.setFieldText(field, newText);

        // Restore cursor position (adjusted for length change)
        const lengthDiff = replacement.length - (end - start);
        if (cursorPos !== null && cursorPos >= start) {
            const newCursorPos = cursorPos <= end
                ? start + replacement.length  // Cursor was in replaced text
                : cursorPos + lengthDiff;      // Cursor was after replaced text
            this.setCursorPosition(field, newCursorPos);
        }

        // Trigger input event
        field.dispatchEvent(new Event('input', { bubbles: true }));

        // Update remaining errors' positions
        // CRITICAL FIX: Properly adjust positions after text modification
        this.errors = this.errors.filter(e => {
            if (e === error) return false; // Remove fixed error

            // Check if this error overlaps with the fixed region
            const overlaps = (
                (e.start >= start && e.start < end) ||  // Starts inside fixed region
                (e.end > start && e.end <= end) ||       // Ends inside fixed region
                (e.start <= start && e.end >= end)       // Completely contains fixed region
            );

            if (overlaps) {
                // Error overlaps with fixed region - mark as invalid and remove
                console.warn(`⚠️ Removing overlapping error at ${e.start}-${e.end}: "${e.original}"`);
                return false;
            }

            // Adjust positions of errors that come after the fixed region
            if (e.start >= end) {
                e.start += lengthDiff;
                e.end += lengthDiff;
                console.log(`✓ Adjusted error position: ${e.start - lengthDiff}-${e.end - lengthDiff} → ${e.start}-${e.end}`);
            }

            return true;
        });

        // Update field data with new error list
        const fieldData = this.monitoredFields.get(field);
        if (fieldData) {
            fieldData.errors = [...this.errors];
        }

        // Re-render markers
        this.renderErrorMarkers(field);

        // Update badge with new error count
        this.updateBadge(field, this.errors.length);

        // Show success toast notification
        this.showToast(`✓ Fixed: "${original}" → "${replacement}"`, 'success');

        console.log('✅ Applied context-aware fix:', {
            original,
            suggestion,
            replacement,
            context: {
                before: text.substring(Math.max(0, start - 10), start),
                after: text.substring(end, Math.min(text.length, end + 10))
            }
        });
    }

    /**
     * Build context-aware replacement preserving spaces, punctuation, and capitalization
     * This is the PROFESSIONAL approach that considers:
     * 1. Surrounding spaces
     * 2. Punctuation
     * 3. Capitalization context (sentence start, proper nouns)
     * 4. Word boundaries
     */
    buildContextAwareReplacement(text, start, end, suggestion, original) {
        // Get context around the error
        const beforeChar = start > 0 ? text[start - 1] : '';
        const afterChar = end < text.length ? text[end] : '';
        const nextChar = end + 1 < text.length ? text[end + 1] : '';

        // Check if this is start of sentence (for capitalization)
        const isStartOfSentence = this.isStartOfSentence(text, start);

        // Analyze spacing context
        const hasSpaceBefore = /\s/.test(beforeChar);
        const hasSpaceAfter = /\s/.test(afterChar);
        const needsSpaceBefore = !hasSpaceBefore && start > 0 && !/[(\[\{'"«]/.test(beforeChar);
        const needsSpaceAfter = !hasSpaceAfter && end < text.length && !/[.,;:!?)}\]'"»]/.test(afterChar);

        // Check if suggestion already has spacing
        const suggestionStartsWithSpace = /^\s/.test(suggestion);
        const suggestionEndsWithSpace = /\s$/.test(suggestion);

        // Preserve/match capitalization context
        let finalSuggestion = suggestion.trim();

        // Smart capitalization handling
        if (isStartOfSentence && finalSuggestion.length > 0) {
            // Capitalize first letter if at sentence start
            finalSuggestion = finalSuggestion.charAt(0).toUpperCase() + finalSuggestion.slice(1);
        } else if (original.length > 0 && this.isAllCaps(original)) {
            // Preserve ALL CAPS if original was all caps
            finalSuggestion = finalSuggestion.toUpperCase();
        } else if (original.length > 0 && this.isCapitalized(original) && !isStartOfSentence) {
            // Preserve capitalization if original was capitalized (proper noun)
            finalSuggestion = finalSuggestion.charAt(0).toUpperCase() + finalSuggestion.slice(1);
        }

        // Build replacement with proper spacing
        let replacement = '';

        // Add leading space if needed (and not already in suggestion)
        if (needsSpaceBefore && !suggestionStartsWithSpace) {
            replacement += ' ';
        }

        // Add the suggestion
        replacement += finalSuggestion;

        // Add trailing space if needed (and not already in suggestion)
        if (needsSpaceAfter && !suggestionEndsWithSpace) {
            replacement += ' ';
        }

        // Handle punctuation absorption (remove double spaces before punctuation)
        if (replacement.endsWith(' ') && /[.,;:!?)]/.test(afterChar)) {
            replacement = replacement.trimEnd();
        }

        return replacement;
    }

    /**
     * Check if position is at start of sentence
     */
    isStartOfSentence(text, position) {
        if (position === 0) return true;

        // Look backwards for sentence terminators
        for (let i = position - 1; i >= 0; i--) {
            const char = text[i];

            // Found sentence terminator
            if (/[.!?]/.test(char)) {
                // Check if followed by space or newline (real sentence end)
                const nextNonSpace = text.substring(i + 1, position).trim();
                return nextNonSpace === '';
            }

            // Found non-whitespace that's not terminator - not sentence start
            if (!/\s/.test(char)) {
                return false;
            }
        }

        return true; // Reached start of text
    }

    /**
     * Check if text is all uppercase
     */
    isAllCaps(text) {
        return text === text.toUpperCase() && text !== text.toLowerCase();
    }

    /**
     * Check if text starts with capital letter
     */
    isCapitalized(text) {
        return text.length > 0 && text[0] === text[0].toUpperCase();
    }

    /**
     * Get cursor position in field
     */
    getCursorPosition(field) {
        try {
            if (field.isContentEditable) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const preCaretRange = range.cloneRange();
                    preCaretRange.selectNodeContents(field);
                    preCaretRange.setEnd(range.endContainer, range.endOffset);
                    return preCaretRange.toString().length;
                }
            } else {
                return field.selectionStart;
            }
        } catch (e) {
            console.warn('Could not get cursor position:', e);
        }
        return null;
    }

    /**
     * Set cursor position in field
     */
    setCursorPosition(field, position) {
        try {
            if (field.isContentEditable) {
                const range = document.createRange();
                const sel = window.getSelection();
                let currentPos = 0;
                let found = false;

                const findPosition = (node) => {
                    if (found) return;

                    if (node.nodeType === Node.TEXT_NODE) {
                        const nextPos = currentPos + node.length;
                        if (position <= nextPos) {
                            range.setStart(node, position - currentPos);
                            range.setEnd(node, position - currentPos);
                            found = true;
                            return;
                        }
                        currentPos = nextPos;
                    } else {
                        for (let child of node.childNodes) {
                            findPosition(child);
                            if (found) return;
                        }
                    }
                };

                findPosition(field);

                if (found) {
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            } else {
                field.selectionStart = field.selectionEnd = position;
            }
        } catch (e) {
            console.warn('Could not set cursor position:', e);
        }
    }

    /**
     * Set field text (helper method)
     */
    setFieldText(field, text) {
        if (field.isContentEditable) {
            // Preserve cursor position better for contentEditable
            const selection = window.getSelection();
            const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

            field.textContent = text;

            // Try to restore selection if possible
            if (range) {
                try {
                    selection.removeAllRanges();
                    selection.addRange(range);
                } catch (e) {
                    // Selection restoration failed, that's ok
                }
            }
        } else {
            field.value = text;
        }
    }

    /**
     * Clear all errors
     */
    clearErrors() {
        this.errors = [];
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
     * Cleanup
     */
    cleanup() {
        this.hidePopup();

        // Clear all field data
        this.monitoredFields = new WeakMap();

        this.errors = [];
        this.activeField = null;

        if (this.checkTimeout) {
            clearTimeout(this.checkTimeout);
            this.checkTimeout = null;
        }
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('farisly-grammar-styles')) return;

        const style = document.createElement('style');
        style.id = 'farisly-grammar-styles';
        style.textContent = `
            @keyframes farisly-badge-pulse {
                0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
                }
                50% {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
                }
            }

            .farisly-grammar-badge {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .farisly-grammar-toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 16px;
                min-width: 300px;
                max-width: 400px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #fff;
                opacity: 0;
                transform: translateX(100%);
                transition: opacity 0.3s ease, transform 0.3s ease;
            }

            .farisly-grammar-toast-error {
                border-color: #ef4444;
            }

            .farisly-grammar-error-marker {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .farisly-grammar-popup {
                position: absolute;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 16px;
                min-width: 280px;
                max-width: 400px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
                z-index: 2147483647;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                opacity: 0;
                transform: translateY(-10px) scale(0.95);
                transition: opacity 0.2s ease, transform 0.2s ease;
            }

            .farisly-grammar-popup-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
            }

            .farisly-grammar-popup-icon {
                font-size: 20px;
            }

            .farisly-grammar-popup-type {
                color: #ef4444;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .farisly-grammar-popup-message {
                color: #e5e5e5;
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 12px;
            }

            .farisly-grammar-popup-original,
            .farisly-grammar-popup-suggestion {
                color: #999;
                font-size: 13px;
                line-height: 1.4;
                margin-bottom: 8px;
                padding: 8px;
                background: #0a0a0a;
                border-radius: 6px;
            }

            .farisly-grammar-popup-original strong,
            .farisly-grammar-popup-suggestion strong {
                color: #ccc;
                display: block;
                margin-bottom: 4px;
            }

            .farisly-grammar-popup-suggestion {
                border-left: 3px solid #10b981;
                background: rgba(16, 185, 129, 0.1);
            }

            .farisly-grammar-popup-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }

            .farisly-grammar-fix-btn,
            .farisly-grammar-ignore-btn {
                flex: 1;
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .farisly-grammar-fix-btn {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }

            .farisly-grammar-fix-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
            }

            .farisly-grammar-ignore-btn {
                background: #2a2a2a;
                color: #999;
            }

            .farisly-grammar-ignore-btn:hover {
                background: #333;
                color: #ccc;
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
