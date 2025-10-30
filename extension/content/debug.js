// Debug script to test if content script is loading
console.log('Debug script loaded - content script is working');

// Simple test to create a visible element
const testDiv = document.createElement('div');
testDiv.innerHTML = '🤖 Farisly AI Debug - Extension is working!';
testDiv.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: #6366f1;
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 99999;
    font-family: Arial, sans-serif;
    font-size: 14px;
`;

document.body.appendChild(testDiv);

// Remove after 5 seconds
setTimeout(() => {
    if (testDiv.parentNode) {
        testDiv.parentNode.removeChild(testDiv);
    }
}, 5000);
