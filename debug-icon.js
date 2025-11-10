/**
 * DEBUG SCRIPT FOR FARISLY AI ICON CLICK ISSUE
 *
 * Instructions:
 * 1. Open any webpage
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Read the diagnostic output
 */

const iconContainer = document.getElementById('farisly-ai-icon-container');
const icon = document.getElementById('farisly-ai-icon');
const panel = document.getElementById('farisly-ai-panel');

if (iconContainer) {
} else {
}

if (icon) {
} else {
}

if (panel) {
} else {
}

if (icon) {
    const listeners = getEventListeners ? getEventListeners(icon) : null;

    if (listeners) {

        if (listeners.click && listeners.click.length > 0) {
        } else {
        }

        if (listeners.pointerdown && listeners.pointerdown.length > 0) {
        }
    } else {
    }
} else {
}

if (icon) {
    const rect = icon.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const elementsAtCenter = document.elementsFromPoint(centerX, centerY);

    elementsAtCenter.forEach((el, index) => {
        const styles = window.getComputedStyle(el);
    });

    if (elementsAtCenter[0] !== icon && elementsAtCenter[0] !== iconContainer) {
    } else {
    }
} else {
}

if (icon) {

    let testClickFired = false;
    const testHandler = () => {
        testClickFired = true;
    };

    icon.addEventListener('click', testHandler, { once: true });

    icon.click();

    setTimeout(() => {
        if (testClickFired) {
        } else {
        }
    }, 100);
} else {
}
