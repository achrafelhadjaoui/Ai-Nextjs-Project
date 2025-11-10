// Simple popup script for Farisly Ai extension
console.log('Farisly Ai popup loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');

    // Get API URL from config (loaded from config.js)
    const API_URL = window.FARISLY_CONFIG?.API_URL || 'http://localhost:3001';

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
        chrome.tabs.create({ url: `${API_URL}/dashboard` });
    });

    // Panel button
    openPanelBtn.addEventListener('click', function() {
        console.log('Opening panel');
        statusElement.textContent = 'Opening Panel...';
        chrome.tabs.create({ url: `${API_URL}/panel` });
    });

    // Profile button
    openProfileBtn.addEventListener('click', function() {
        console.log('Opening profile');
        statusElement.textContent = 'Opening Profile...';
        chrome.tabs.create({ url: `${API_URL}/profile` });
    });

    console.log('Event listeners set up successfully');
});