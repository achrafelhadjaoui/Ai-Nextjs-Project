// Simple popup script for Farisly Ai extension
console.log('Farisly Ai popup loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    const openDashboardBtn = document.getElementById('openDashboard');
    const openPanelBtn = document.getElementById('openPanel');
    const openProfileBtn = document.getElementById('openProfile');
    const statusElement = document.getElementById('status');

    if (!openDashboardBtn || !openPanelBtn || !openProfileBtn) {
        console.error('Buttons not found');
        return;
    }

    console.log('All buttons found, setting up event listeners');

    // Dashboard button
    openDashboardBtn.addEventListener('click', function() {
        console.log('Opening dashboard');
        statusElement.textContent = 'Opening Dashboard...';
        chrome.tabs.create({ url: 'http://localhost:3001/dashboard' });
    });

    // Panel button
    openPanelBtn.addEventListener('click', function() {
        console.log('Opening panel');
        statusElement.textContent = 'Opening Panel...';
        chrome.tabs.create({ url: 'http://localhost:3001/panel' });
    });

    // Profile button
    openProfileBtn.addEventListener('click', function() {
        console.log('Opening profile');
        statusElement.textContent = 'Opening Profile...';
        chrome.tabs.create({ url: 'http://localhost:3001/profile' });
    });

    console.log('Event listeners set up successfully');
});