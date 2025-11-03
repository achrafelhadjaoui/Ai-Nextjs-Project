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
            this.state.currentX = e.clientX - this.state.offsetX;
            this.state.currentY = e.clientY - this.state.offsetY;

            // Call drag callback
            this.options.onDrag(this.state);
        }

        e.preventDefault();
    }

    handlePointerUp(e) {
        if (!this.state.isDragging || e.pointerId !== this.pointerId) return;

        // Release pointer capture
        this.element.releasePointerCapture(e.pointerId);

        // Cleanup move listeners
        this.element.removeEventListener('pointermove', this.boundHandlers.move);
        this.element.removeEventListener('pointerup', this.boundHandlers.up);
        this.element.removeEventListener('pointercancel', this.boundHandlers.cancel);

        const wasDrag = this.state.hasMoved;

        // Call appropriate callback
        if (wasDrag) {
            this.options.onDragEnd(this.state);
        } else {
            this.options.onClick(e);
        }

        // Reset state
        this.state.isDragging = false;
        this.state.hasMoved = false;
        this.pointerId = null;

        e.preventDefault();
    }

    handlePointerCancel(e) {
        if (e.pointerId !== this.pointerId) return;

        this.element.releasePointerCapture(e.pointerId);
        this.element.removeEventListener('pointermove', this.boundHandlers.move);
        this.element.removeEventListener('pointerup', this.boundHandlers.up);
        this.element.removeEventListener('pointercancel', this.boundHandlers.cancel);

        this.options.onDragEnd(this.state);

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
                console.debug('[DragManager] Pointer capture already released');
            }
        }
    }
}
