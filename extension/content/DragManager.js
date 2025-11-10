/**
 * Professional Drag Manager
 * Handles all dragging logic with proper event management
 */
class DragManager {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            threshold: 3,
            onDragStart: () => {},
            onDrag: () => {},
            onDragEnd: () => {},
            onClick: () => {},
            ...options
        };

        this.state = {
            isDragging: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            offsetX: 0,
            offsetY: 0,
            hasMoved: false
        };

        this.boundHandlers = {
            down: this.handlePointerDown.bind(this),
            move: this.handlePointerMove.bind(this),
            up: this.handlePointerUp.bind(this),
            cancel: this.handlePointerCancel.bind(this)
        };

        this.init();
    }

    init() {
        this.element.addEventListener('pointerdown', this.boundHandlers.down);
        this.element.style.touchAction = 'none'; // Prevent browser touch handling
    }

    handlePointerDown(e) {
        // Capture the pointer
        this.element.setPointerCapture(e.pointerId);
        this.pointerId = e.pointerId;

        const rect = this.element.getBoundingClientRect();
        this.state = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            currentX: rect.left,
            currentY: rect.top,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            hasMoved: false
        };

        // Attach move listeners only when dragging
        this.element.addEventListener('pointermove', this.boundHandlers.move);
        this.element.addEventListener('pointerup', this.boundHandlers.up);
        this.element.addEventListener('pointercancel', this.boundHandlers.cancel);

        e.preventDefault();
    }

    handlePointerMove(e) {
        if (!this.state.isDragging || e.pointerId !== this.pointerId) return;

        const deltaX = Math.abs(e.clientX - this.state.startX);
        const deltaY = Math.abs(e.clientY - this.state.startY);

        // Check threshold
        if (!this.state.hasMoved && (deltaX > this.options.threshold || deltaY > this.options.threshold)) {
            this.state.hasMoved = true;
            this.options.onDragStart(this.state);
        }

        if (this.state.hasMoved) {
            // Calculate new position
            let newX = e.clientX - this.state.offsetX;
            let newY = e.clientY - this.state.offsetY;

            // Get element dimensions
            const rect = this.element.getBoundingClientRect();
            const elementWidth = rect.width;
            const elementHeight = rect.height;

            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Apply boundary constraints
            const minX = 0;
            const minY = 0;
            const maxX = viewportWidth - elementWidth;
            const maxY = viewportHeight - elementHeight;

            // Clamp position within boundaries
            newX = Math.max(minX, Math.min(newX, maxX));
            newY = Math.max(minY, Math.min(newY, maxY));

            this.state.currentX = newX;
            this.state.currentY = newY;

            // Call drag callback
            this.options.onDrag(this.state);
        }

        e.preventDefault();
    }

    handlePointerUp(e) {
        // CRITICAL FIX: Always cleanup, even if state validation fails
        // This prevents deadlock where pointer remains captured forever
        const shouldProcessEvent = this.state.isDragging && e.pointerId === this.pointerId;

        // ALWAYS release pointer capture (even on mismatch)
        try {
            if (this.element.hasPointerCapture(e.pointerId)) {
                this.element.releasePointerCapture(e.pointerId);
            }
        } catch (err) {
        }

        // ALWAYS cleanup move listeners (even on mismatch)
        this.element.removeEventListener('pointermove', this.boundHandlers.move);
        this.element.removeEventListener('pointerup', this.boundHandlers.up);
        this.element.removeEventListener('pointercancel', this.boundHandlers.cancel);

        // Only process callbacks if state was valid
        if (shouldProcessEvent) {
            const wasDrag = this.state.hasMoved;

            // Call appropriate callback
            if (wasDrag) {
                this.options.onDragEnd(this.state);
            } else {
                this.options.onClick(e);
            }
        }

        // ALWAYS reset state (even on mismatch)
        this.state.isDragging = false;
        this.state.hasMoved = false;
        this.pointerId = null;

        e.preventDefault();
    }

    handlePointerCancel(e) {
        // CRITICAL FIX: Always cleanup on cancel, even if pointer ID doesn't match
        const shouldCallCallback = e.pointerId === this.pointerId;

        // ALWAYS release pointer capture
        try {
            if (this.element.hasPointerCapture(e.pointerId)) {
                this.element.releasePointerCapture(e.pointerId);
            }
        } catch (err) {
        }

        // ALWAYS cleanup listeners
        this.element.removeEventListener('pointermove', this.boundHandlers.move);
        this.element.removeEventListener('pointerup', this.boundHandlers.up);
        this.element.removeEventListener('pointercancel', this.boundHandlers.cancel);

        // Only call onDragEnd if this was our pointer
        if (shouldCallCallback) {
            this.options.onDragEnd(this.state);
        }

        // ALWAYS reset state
        this.state.isDragging = false;
        this.state.hasMoved = false;
        this.pointerId = null;
    }

    destroy() {
        this.element.removeEventListener('pointerdown', this.boundHandlers.down);
        this.element.removeEventListener('pointermove', this.boundHandlers.move);
        this.element.removeEventListener('pointerup', this.boundHandlers.up);
        this.element.removeEventListener('pointercancel', this.boundHandlers.cancel);

        // Safely release pointer capture if active
        if (this.pointerId !== null) {
            try {
                if (this.element.hasPointerCapture(this.pointerId)) {
                    this.element.releasePointerCapture(this.pointerId);
                }
            } catch (err) {
                // Pointer capture may have already been released
            }
        }
    }
}
