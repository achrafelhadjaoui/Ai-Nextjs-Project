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

console.log('🔍 ========== FARISLY AI ICON DEBUG STARTED ==========');
console.log('');

// Step 1: Check if extension loaded
console.log('📋 STEP 1: Extension Loading Check');
console.log('-----------------------------------');
const iconContainer = document.getElementById('farisly-ai-icon-container');
const icon = document.getElementById('farisly-ai-icon');
const panel = document.getElementById('farisly-ai-panel');

if (iconContainer) {
    console.log('✅ Icon container found in DOM');
    console.log('   Position:', iconContainer.style.position);
    console.log('   Display:', window.getComputedStyle(iconContainer).display);
    console.log('   Visibility:', window.getComputedStyle(iconContainer).visibility);
    console.log('   Z-index:', window.getComputedStyle(iconContainer).zIndex);
} else {
    console.log('❌ Icon container NOT found in DOM');
    console.log('   → Extension may not have loaded');
}

if (icon) {
    console.log('✅ Icon element found in DOM');
    console.log('   Display:', window.getComputedStyle(icon).display);
    console.log('   Pointer-events:', window.getComputedStyle(icon).pointerEvents);
    console.log('   Cursor:', window.getComputedStyle(icon).cursor);
} else {
    console.log('❌ Icon element NOT found in DOM');
}

if (panel) {
    console.log('✅ Panel found in DOM');
    console.log('   Display:', window.getComputedStyle(panel).display);
    console.log('   Visibility:', window.getComputedStyle(panel).visibility);
    console.log('   Opacity:', window.getComputedStyle(panel).opacity);
} else {
    console.log('❌ Panel NOT found in DOM');
}

console.log('');

// Step 2: Check event listeners
console.log('📋 STEP 2: Event Listeners Check');
console.log('---------------------------------');

if (icon) {
    // Try to get event listeners (Chrome only)
    const listeners = getEventListeners ? getEventListeners(icon) : null;

    if (listeners) {
        console.log('Event listeners on icon:');
        console.log('   click:', listeners.click?.length || 0, 'listeners');
        console.log('   pointerdown:', listeners.pointerdown?.length || 0, 'listeners');
        console.log('   pointerup:', listeners.pointerup?.length || 0, 'listeners');
        console.log('   pointermove:', listeners.pointermove?.length || 0, 'listeners');

        if (listeners.click && listeners.click.length > 0) {
            console.log('✅ Click listener IS attached');
        } else {
            console.log('❌ No click listener found');
        }

        if (listeners.pointerdown && listeners.pointerdown.length > 0) {
            console.log('⚠️  Pointerdown listeners found (may indicate DragManager still active)');
        }
    } else {
        console.log('⚠️  getEventListeners not available (non-Chrome browser or devtools not open)');
        console.log('   Will test manually by clicking...');
    }
} else {
    console.log('❌ Cannot check listeners - icon element not found');
}

console.log('');

// Step 3: Check for overlapping elements
console.log('📋 STEP 3: Overlapping Elements Check');
console.log('-------------------------------------');

if (icon) {
    const rect = icon.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const elementsAtCenter = document.elementsFromPoint(centerX, centerY);

    console.log('Elements at icon center (top to bottom):');
    elementsAtCenter.forEach((el, index) => {
        const styles = window.getComputedStyle(el);
        console.log(`   ${index + 1}. ${el.tagName}#${el.id || '(no id)'}.${el.className || '(no class)'}`);
        console.log(`      pointer-events: ${styles.pointerEvents}`);
        console.log(`      z-index: ${styles.zIndex}`);
    });

    if (elementsAtCenter[0] !== icon && elementsAtCenter[0] !== iconContainer) {
        console.log('⚠️  WARNING: Icon is NOT the top element!');
        console.log('   Top element is:', elementsAtCenter[0]);
    } else {
        console.log('✅ Icon is topmost element');
    }
} else {
    console.log('❌ Cannot check - icon element not found');
}

console.log('');

// Step 4: Test click programmatically
console.log('📋 STEP 4: Programmatic Click Test');
console.log('-----------------------------------');

if (icon) {
    console.log('Attempting to click icon programmatically...');

    // Add temporary listener to verify events work
    let testClickFired = false;
    const testHandler = () => {
        testClickFired = true;
    };

    icon.addEventListener('click', testHandler, { once: true });

    // Simulate click
    icon.click();

    setTimeout(() => {
        if (testClickFired) {
            console.log('✅ Click event CAN fire on icon element');
        } else {
            console.log('❌ Click event did NOT fire');
            console.log('   → Something is blocking click events');
        }
    }, 100);
} else {
    console.log('❌ Cannot test - icon element not found');
}

console.log('');

// Step 5: Check console for errors
console.log('📋 STEP 5: Recent Console Errors');
console.log('---------------------------------');
console.log('(Check the console manually for any red error messages)');
console.log('Look for:');
console.log('  - Script loading errors');
console.log('  - Uncaught exceptions');
console.log('  - Content Security Policy violations');

console.log('');

// Step 6: Manual click instructions
console.log('📋 STEP 6: Manual Click Test');
console.log('----------------------------');
console.log('Now try clicking the icon manually.');
console.log('Watch the console for these messages:');
console.log('');
console.log('Expected messages (GOOD):');
console.log('  👆 Icon clicked!');
console.log('  🔄 Toggling panel. New state: OPEN');
console.log('  📂 Opening panel...');
console.log('');
console.log('Bad messages (PROBLEM):');
console.log('  🖱️ Pointer down detected (DragManager still active)');
console.log('  ❌ Panel does not exist!');
console.log('  (No messages at all = listener not attached)');
console.log('');

console.log('🔍 ========== DEBUG SCRIPT COMPLETE ==========');
console.log('Please click the icon now and observe the console output.');
